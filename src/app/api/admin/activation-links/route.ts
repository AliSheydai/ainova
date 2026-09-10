import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { LinkStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') as LinkStatus | null
    const productIdFilter = searchParams.get('productId')
    const planIdFilter = searchParams.get('planId')

    const where: any = {}
    if (statusFilter && Object.values(LinkStatus).includes(statusFilter)) {
      where.status = statusFilter
    }
    if (productIdFilter) {
      where.productId = productIdFilter
    } else if (planIdFilter) {
      where.planId = planIdFilter
    }

    const [links, total, available, reserved, used, invalid, products] = await Promise.all([
      prisma.activationLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          plan: {
            include: { product: true },
          },
          order: {
            select: {
              id: true,
              user: {
                select: { id: true, phone: true, name: true },
              },
            },
          },
        },
      }),
      prisma.activationLink.count(),
      prisma.activationLink.count({ where: { status: 'AVAILABLE' } }),
      prisma.activationLink.count({ where: { status: 'RESERVED' } }),
      prisma.activationLink.count({ where: { status: 'USED' } }),
      prisma.activationLink.count({ where: { status: 'INVALID' } }),
      prisma.product.findMany({
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { sortOrder: 'asc' },
        include: { plans: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      links,
      stats: {
        total,
        available,
        reserved,
        used,
        invalid,
      },
      products,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/activation-links:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست لینک‌های فعال‌سازی.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { productId, planId, links } = body

    if ((!productId && !planId) || !Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { success: false, error: 'انتخاب محصول و حداقل یک لینک فعال‌سازی الزامی است.' },
        { status: 400 }
      )
    }

    // Clean links: trim, remove empty lines
    const cleanUrls = links
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 5)

    if (cleanUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'هیچ لینک معتبری برای افزودن یافت نشد.' },
        { status: 400 }
      )
    }

    // Resolve product
    let targetProductId = productId
    let targetPlanId = planId

    if (!targetProductId && targetPlanId) {
      const plan = await prisma.plan.findUnique({ where: { id: targetPlanId } })
      if (!plan) {
        return NextResponse.json({ success: false, error: 'پلن نامعتبر است.' }, { status: 404 })
      }
      targetProductId = plan.productId
    }

    const product = await prisma.product.findUnique({
      where: { id: targetProductId },
      include: { plans: true },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'محصول نامعتبر است.' }, { status: 404 })
    }

    if (!targetPlanId && product.plans.length > 0) {
      targetPlanId = product.plans[0].id
    }

    // Create records
    const created = await prisma.activationLink.createMany({
      data: cleanUrls.map((url: string) => ({
        productId: targetProductId,
        planId: targetPlanId || null,
        url,
        status: LinkStatus.AVAILABLE,
      })),
    })

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `${created.count.toLocaleString('fa-IR')} لینک فعال‌سازی جدید برای «${product.title || product.name}» با موفقیت اضافه شد.`,
    })
  } catch (error: unknown) {
    console.error('Error adding activation links:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در افزودن لینک‌های فعال‌سازی.' },
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
        { success: false, error: 'شناسه لینک الزامی است.' },
        { status: 400 }
      )
    }

    const link = await prisma.activationLink.findUnique({ where: { id } })
    if (!link) {
      return NextResponse.json({ success: false, error: 'لینک یافت نشد.' }, { status: 404 })
    }

    if (link.status === 'USED' || link.orderId) {
      return NextResponse.json(
        { success: false, error: 'لینک‌های تحویل‌داده‌شده به مشتری قابل حذف نیستند.' },
        { status: 400 }
      )
    }

    await prisma.activationLink.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'لینک با موفقیت حذف شد.',
    })
  } catch (error: unknown) {
    console.error('Error deleting activation link:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف لینک فعال‌سازی.' },
      { status: 500 }
    )
  }
}
