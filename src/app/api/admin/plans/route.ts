import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { FulfillmentType, type Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    const where: Prisma.PlanWhereInput = {}
    if (productId) {
      where.productId = productId
    }

    const plans = await prisma.plan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      include: {
        product: true,
        _count: {
          select: {
            orders: true,
            activationLinks: true,
            inventoryItems: true,
          },
        },
      },
    })

    // Enrich plans with real-time stock
    const enrichedPlans = await Promise.all(
      plans.map(async (plan: any) => {
        const stock = await FulfillmentService.getPlanStock(plan.id)
        return {
          ...plan,
          stock,
        }
      })
    )

    // Ensure planType is populated if Prisma Client in memory missed it
    try {
      const missingTypeIds = enrichedPlans.filter((p: any) => p.planType === undefined).map((p: any) => p.id)
      if (missingTypeIds.length > 0) {
        const rawRows = await prisma.$queryRawUnsafe<{ id: string; planType: string | null }[]>(
          `SELECT "id", "planType" FROM "plans" WHERE "id" = ANY($1::text[])`,
          missingTypeIds
        )
        const typeMap = new Map(rawRows.map((r) => [r.id, r.planType]))
        for (const p of enrichedPlans as any[]) {
          if (p.planType === undefined) {
            p.planType = typeMap.get(p.id) || null
          }
        }
      }
    } catch {
      // Ignore fallback error if column doesn't exist
    }

    return NextResponse.json({
      success: true,
      plans: enrichedPlans,
    })
  } catch (error: unknown) {
    console.error('Error fetching admin plans:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری پلن‌ها.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const {
      productId,
      name,
      duration,
      planType,
      price,
      fulfillmentType,
      checkoutFields,
      sortOrder,
      active,
    } = body

    if (!productId || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'انتخاب محصول و نام پلن الزامی است.' },
        { status: 400 }
      )
    }

    const priceNum = parseInt(String(price || 0), 10)
    const durationNum = parseInt(String(duration || 1), 10)
    const sortOrderNum = parseInt(String(sortOrder || 0), 10)

    const validFulfillmentType = Object.values(FulfillmentType).includes(fulfillmentType)
      ? (fulfillmentType as FulfillmentType)
      : 'ACTIVATION_LINK'

    const trimmedPlanType = planType ? String(planType).trim() : null

    let plan: any
    try {
      plan = await prisma.plan.create({
        data: {
          productId,
          name: name.trim(),
          duration: isNaN(durationNum) ? 1 : durationNum,
          planType: trimmedPlanType,
          price: isNaN(priceNum) ? 0 : priceNum,
          fulfillmentType: validFulfillmentType,
          checkoutFields: checkoutFields || [],
          sortOrder: isNaN(sortOrderNum) ? 0 : sortOrderNum,
          active: active !== undefined ? Boolean(active) : true,
        },
        include: {
          product: true,
        },
      })
    } catch (createError: any) {
      // If Prisma client memory instance has not reloaded schema (Unknown argument planType)
      if (
        createError?.message?.includes('planType') ||
        createError?.name === 'PrismaClientValidationError'
      ) {
        plan = await prisma.plan.create({
          data: {
            productId,
            name: name.trim(),
            duration: isNaN(durationNum) ? 1 : durationNum,
            price: isNaN(priceNum) ? 0 : priceNum,
            fulfillmentType: validFulfillmentType,
            checkoutFields: checkoutFields || [],
            sortOrder: isNaN(sortOrderNum) ? 0 : sortOrderNum,
            active: active !== undefined ? Boolean(active) : true,
          },
          include: {
            product: true,
          },
        })

        if (trimmedPlanType) {
          try {
            await prisma.$executeRawUnsafe(
              `UPDATE "plans" SET "planType" = $1 WHERE "id" = $2`,
              trimmedPlanType,
              plan.id
            )
            plan.planType = trimmedPlanType
          } catch (sqlErr) {
            console.warn('Fallback update for planType failed:', sqlErr)
          }
        }
      } else {
        throw createError
      }
    }

    return NextResponse.json({
      success: true,
      plan,
      message: 'پلن جدید با موفقیت ایجاد شد.',
    })
  } catch (error: unknown) {
    console.error('Error creating plan:', error)
    const errorMsg = error instanceof Error ? error.message : 'خطا در ایجاد پلن.'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const {
      id,
      name,
      duration,
      planType,
      price,
      fulfillmentType,
      checkoutFields,
      sortOrder,
      active,
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه پلن الزامی است.' },
        { status: 400 }
      )
    }

    const updateData: Prisma.PlanUpdateInput = {}

    if (name !== undefined) updateData.name = name.trim()
    if (duration !== undefined) updateData.duration = parseInt(String(duration), 10) || 1
    if (price !== undefined) updateData.price = parseInt(String(price), 10) || 0
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(String(sortOrder), 10) || 0
    if (active !== undefined) updateData.active = Boolean(active)
    if (checkoutFields !== undefined) updateData.checkoutFields = checkoutFields
    if (fulfillmentType !== undefined && Object.values(FulfillmentType).includes(fulfillmentType)) {
      updateData.fulfillmentType = fulfillmentType
    }

    const trimmedPlanType =
      planType !== undefined ? (planType ? String(planType).trim() : null) : undefined

    let updatedPlan: any
    try {
      if (trimmedPlanType !== undefined) {
        ;(updateData as any).planType = trimmedPlanType
      }
      updatedPlan = await prisma.plan.update({
        where: { id },
        data: updateData,
        include: { product: true },
      })
    } catch (patchError: any) {
      // If Prisma client memory instance has not reloaded schema (Unknown argument planType)
      if (
        patchError?.message?.includes('planType') ||
        patchError?.name === 'PrismaClientValidationError'
      ) {
        delete (updateData as any).planType
        updatedPlan = await prisma.plan.update({
          where: { id },
          data: updateData,
          include: { product: true },
        })

        if (trimmedPlanType !== undefined) {
          try {
            await prisma.$executeRawUnsafe(
              `UPDATE "plans" SET "planType" = $1 WHERE "id" = $2`,
              trimmedPlanType,
              id
            )
            updatedPlan.planType = trimmedPlanType
          } catch (sqlErr) {
            console.warn('Fallback update for planType failed:', sqlErr)
          }
        }
      } else {
        throw patchError
      }
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'پلن با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error updating plan:', error)
    const errorMsg = error instanceof Error ? error.message : 'خطا در به‌روزرسانی پلن.'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه پلن الزامی است.' },
        { status: 400 }
      )
    }

    // Check if plan has orders
    const ordersCount = await prisma.order.count({
      where: { planId: id },
    })

    if (ordersCount > 0) {
      // Soft-deactivate to protect order records
      await prisma.plan.update({
        where: { id },
        data: { active: false },
      })

      return NextResponse.json({
        success: true,
        message: `این پلن دارای ${ordersCount.toLocaleString('fa-IR')} سفارش ثبت‌شده است؛ بنابراین جهت حفظ یکپارچگی داده‌ها غیرفعال شد.`,
        action: 'deactivated',
      })
    }

    // Safely delete unused links/items and plan
    await prisma.activationLink.deleteMany({ where: { planId: id } })
    await prisma.inventoryItem.deleteMany({ where: { planId: id } })
    await prisma.plan.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'پلن با موفقیت حذف شد.',
      action: 'deleted',
    })
  } catch (error: unknown) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف پلن.' },
      { status: 500 }
    )
  }
}
