import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { FulfillmentType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    const where: any = {}
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
      plans.map(async (plan) => {
        const stock = await FulfillmentService.getPlanStock(plan.id)
        return {
          ...plan,
          stock,
        }
      })
    )

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

    const plan = await prisma.plan.create({
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

    return NextResponse.json({
      success: true,
      plan,
      message: 'پلن جدید با موفقیت ایجاد شد.',
    })
  } catch (error: unknown) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد پلن.' },
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

    const updateData: any = {}

    if (name !== undefined) updateData.name = name.trim()
    if (duration !== undefined) updateData.duration = parseInt(String(duration), 10) || 1
    if (price !== undefined) updateData.price = parseInt(String(price), 10) || 0
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(String(sortOrder), 10) || 0
    if (active !== undefined) updateData.active = Boolean(active)
    if (checkoutFields !== undefined) updateData.checkoutFields = checkoutFields
    if (fulfillmentType !== undefined && Object.values(FulfillmentType).includes(fulfillmentType)) {
      updateData.fulfillmentType = fulfillmentType
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData,
      include: { product: true },
    })

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'پلن با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی پلن.' },
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
