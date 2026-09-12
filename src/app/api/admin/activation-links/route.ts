import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { LinkStatus, InventoryType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    // Filters
    const search = searchParams.get('search')?.trim() || ''
    const statusFilter = searchParams.get('status') as LinkStatus | null
    const productIdFilter = searchParams.get('productId')
    const planIdFilter = searchParams.get('planId')
    const sortBy = searchParams.get('sortBy')?.trim() || 'NEWEST'

    const where: any = {
      type: InventoryType.ACTIVATION_LINK,
    }

    if (statusFilter && Object.values(LinkStatus).includes(statusFilter)) {
      where.status = statusFilter
    }

    if (productIdFilter && productIdFilter !== 'ALL') {
      where.productId = productIdFilter
    }

    if (planIdFilter && planIdFilter !== 'ALL') {
      where.planId = planIdFilter
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        { order: { user: { phone: { contains: search, mode: 'insensitive' } } } },
        { order: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { product: { title: { contains: search, mode: 'insensitive' } } },
        { plan: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'OLDEST') {
      orderBy = { createdAt: 'asc' }
    }

    const [totalFiltered, items, total, available, reserved, used, invalid, products] = await Promise.all([
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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
      prisma.inventoryItem.count({ where: { type: InventoryType.ACTIVATION_LINK } }),
      prisma.inventoryItem.count({ where: { type: InventoryType.ACTIVATION_LINK, status: 'AVAILABLE' } }),
      prisma.inventoryItem.count({ where: { type: InventoryType.ACTIVATION_LINK, status: 'RESERVED' } }),
      prisma.inventoryItem.count({ where: { type: InventoryType.ACTIVATION_LINK, status: 'USED' } }),
      prisma.inventoryItem.count({ where: { type: InventoryType.ACTIVATION_LINK, status: 'INVALID' } }),
      prisma.product.findMany({
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { sortOrder: 'asc' },
        include: { plans: true },
      }),
    ])

    // Format items
    const formattedLinks = items.map((item) => {
      const dataObj =
        typeof item.data === 'string'
          ? JSON.parse(item.data)
          : item.data
      return {
        id: item.id,
        productId: item.productId,
        planId: item.planId,
        url: dataObj?.url || dataObj?.link || '',
        status: item.status,
        orderId: item.orderId,
        createdAt: item.createdAt,
        assignedAt: item.assignedAt,
        usedAt: item.usedAt,
        product: item.product,
        plan: item.plan,
        order: item.order,
      }
    })

    const totalPages = Math.ceil(totalFiltered / limit) || 1

    return NextResponse.json({
      success: true,
      links: formattedLinks,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
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

    // Create records in unified inventory_items table
    const created = await prisma.inventoryItem.createMany({
      data: cleanUrls.map((url: string) => ({
        productId: targetProductId,
        planId: targetPlanId || null,
        type: InventoryType.ACTIVATION_LINK,
        data: { url },
        status: LinkStatus.AVAILABLE,
      })),
    })

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `${created.count.toLocaleString('fa-IR')} لینک فعال‌سازی جدید برای «${product.title}» با موفقیت اضافه شد.`,
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

    const item = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ success: false, error: 'لینک یافت نشد.' }, { status: 404 })
    }

    if (item.status === 'USED' || item.orderId) {
      return NextResponse.json(
        { success: false, error: 'لینک‌های تحویل‌داده‌شده به مشتری قابل حذف نیستند.' },
        { status: 400 }
      )
    }

    await prisma.inventoryItem.delete({ where: { id } })

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
