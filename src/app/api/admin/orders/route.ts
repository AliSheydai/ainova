import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { OrderStatus, FulfillmentType, DeliveryStatus } from '@prisma/client'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { decryptCredential } from '@/lib/security/crypto'

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
    const statusFilter = searchParams.get('status')?.trim() || 'ALL'
    const deliveryStatusFilter = searchParams.get('deliveryStatus')?.trim() || 'ALL'
    const fulfillmentTypeFilter = searchParams.get('fulfillmentType')?.trim() || 'ALL'
    const sourceFilter = searchParams.get('source')?.trim() || 'ALL'
    const productIdFilter = searchParams.get('productId')?.trim() || 'ALL'
    const dateRange = searchParams.get('dateRange')?.trim() || 'ALL'
    const sortBy = searchParams.get('sortBy')?.trim() || 'NEWEST'

    const where: any = {}

    // Status Filter
    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'NEEDS_ACTION') {
        where.status = OrderStatus.PAID
        where.OR = [
          { delivery: null },
          { delivery: { status: { not: 'DELIVERED' } } },
        ]
      } else if (Object.values(OrderStatus).includes(statusFilter as OrderStatus)) {
        where.status = statusFilter
      }
    }

    // Delivery Status Filter
    if (deliveryStatusFilter && deliveryStatusFilter !== 'ALL') {
      if (deliveryStatusFilter === 'NO_DELIVERY') {
        where.delivery = null
      } else if (Object.values(DeliveryStatus).includes(deliveryStatusFilter as DeliveryStatus)) {
        where.delivery = { status: deliveryStatusFilter }
      }
    }

    // Fulfillment Type Filter
    if (fulfillmentTypeFilter && fulfillmentTypeFilter !== 'ALL') {
      const fulfillmentCondition = [
        { delivery: { type: fulfillmentTypeFilter } },
        { plan: { fulfillmentType: fulfillmentTypeFilter as FulfillmentType } },
      ]
      if (where.OR) {
        where.AND = [...(where.AND || []), { OR: fulfillmentCondition }]
      } else {
        where.OR = fulfillmentCondition
      }
    }

    // Source Filter
    if (sourceFilter && sourceFilter !== 'ALL') {
      where.source = sourceFilter
    }

    // Product Filter
    if (productIdFilter && productIdFilter !== 'ALL') {
      where.OR = [
        ...(where.OR || []),
        { productId: productIdFilter },
        { plan: { productId: productIdFilter } },
      ]
    }

    // Date Range Filter
    if (dateRange && dateRange !== 'ALL') {
      const now = new Date()
      if (dateRange === 'TODAY') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        where.createdAt = { ...(where.createdAt || {}), gte: startOfToday }
      } else if (dateRange === 'YESTERDAY') {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        where.createdAt = {
          ...(where.createdAt || {}),
          gte: startOfYesterday,
          lt: endOfYesterday,
        }
      } else if (dateRange === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        where.createdAt = { ...(where.createdAt || {}), gte: sevenDaysAgo }
      } else if (dateRange === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        where.createdAt = { ...(where.createdAt || {}), gte: thirtyDaysAgo }
      } else if (dateRange === 'THIS_MONTH') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        where.createdAt = { ...(where.createdAt || {}), gte: startOfMonth }
      }
    }

    // Search Query across multiple fields
    if (search) {
      const searchCondition = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { telegramUsername: { contains: search, mode: 'insensitive' } } },
        { payment: { authority: { contains: search, mode: 'insensitive' } } },
        { payment: { refId: { contains: search, mode: 'insensitive' } } },
        { product: { title: { contains: search, mode: 'insensitive' } } },
        { plan: { name: { contains: search, mode: 'insensitive' } } },
      ]

      if (where.OR) {
        where.AND = [...(where.AND || []), { OR: where.OR }, { OR: searchCondition }]
        delete where.OR
      } else {
        where.OR = searchCondition
      }
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'OLDEST') {
      orderBy = { createdAt: 'asc' }
    } else if (sortBy === 'HIGHEST_AMOUNT') {
      orderBy = { amount: 'desc' }
    } else if (sortBy === 'LOWEST_AMOUNT') {
      orderBy = { amount: 'asc' }
    }

    // Execute queries in parallel
    const [totalFiltered, orders, counts, products] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, phone: true, name: true, telegramUsername: true },
          },
          product: true,
          plan: {
            include: { product: true },
          },
          payment: true,
          activationLink: {
            select: { id: true, url: true, status: true, assignedAt: true, usedAt: true },
          },
          delivery: true,
        },
      }),
      Promise.all([
        prisma.order.count(),
        prisma.order.count({
          where: {
            status: OrderStatus.PAID,
            OR: [
              { delivery: null },
              { delivery: { status: { not: 'DELIVERED' } } },
            ],
          },
        }),
        prisma.order.count({ where: { status: OrderStatus.PAID } }),
        prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
        prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
        prisma.order.count({
          where: { status: { in: [OrderStatus.FAILED, OrderStatus.CANCELLED] } },
        }),
      ]),
      prisma.product.findMany({
        select: { id: true, title: true, slug: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    // Decrypt credentials for delivery
    const safeOrders = orders.map((ord) => {
      if (ord.delivery && ord.delivery.data) {
        const rawData = ord.delivery.data as Record<string, any>
        if (rawData.password) {
          return {
            ...ord,
            delivery: {
              ...ord.delivery,
              data: {
                ...rawData,
                password: decryptCredential(rawData.password),
              },
            },
          }
        }
      }
      return ord
    })

    const totalPages = Math.ceil(totalFiltered / limit) || 1

    return NextResponse.json({
      success: true,
      orders: safeOrders,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      counts: {
        all: counts[0],
        needsAction: counts[1],
        paid: counts[2],
        completed: counts[3],
        pendingPayment: counts[4],
        failedOrCancelled: counts[5],
      },
      filterOptions: {
        products,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست سفارش‌ها.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { orderId, status, action, manualNote, deliveredInfo } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'شناسه سفارش الزامی است.' },
        { status: 400 }
      )
    }

    // Special Action: Fulfill Manual Delivery
    if (action === 'FULFILL_MANUAL') {
      if (!manualNote?.trim()) {
        return NextResponse.json(
          { success: false, error: 'توضیحات و یادداشت تحویل الزامی است.' },
          { status: 400 }
        )
      }

      const fulfillResult = await FulfillmentService.fulfillManualOrder(
        orderId,
        {
          manualNote: manualNote.trim(),
          deliveredInfo: deliveredInfo?.trim() || '',
        },
        user.id
      )

      return NextResponse.json({
        success: fulfillResult.success,
        order: fulfillResult.order,
        delivery: fulfillResult.delivery,
        message: fulfillResult.message,
      })
    }

    // Standard Status Update
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای درخواست نامعتبر هستند.' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: true,
        plan: true,
        delivery: true,
      },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'وضعیت سفارش با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی وضعیت سفارش.' },
      { status: 500 }
    )
  }
}
