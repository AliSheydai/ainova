import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { OrderStatus, type FulfillmentType, DeliveryStatus, type Prisma } from '@prisma/client'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { decryptCredential } from '@/lib/security/crypto'
import { AdminNotificationService } from '@/lib/notifications/admin-notification'
import { OrderExpirationService } from '@/lib/orders/order-expiration'
import { sendTelegramNotification } from '@/lib/telegram/bot'

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

    const where: Prisma.OrderWhereInput = {}

    // Status Filter
    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'NEEDS_ACTION') {
        where.status = OrderStatus.PAID
        where.OR = [
          { delivery: null },
          { delivery: { status: { not: 'DELIVERED' } } },
        ]
      } else if (Object.values(OrderStatus).includes(statusFilter as OrderStatus)) {
        where.status = statusFilter as OrderStatus
      }
    }

    // Delivery Status Filter
    if (deliveryStatusFilter && deliveryStatusFilter !== 'ALL') {
      if (deliveryStatusFilter === 'NO_DELIVERY') {
        where.delivery = null
      } else if (Object.values(DeliveryStatus).includes(deliveryStatusFilter as DeliveryStatus)) {
        where.delivery = { status: deliveryStatusFilter as DeliveryStatus }
      }
    }

    // Fulfillment Type Filter
    if (fulfillmentTypeFilter && fulfillmentTypeFilter !== 'ALL') {
      const fulfillmentCondition: Prisma.OrderWhereInput[] = [
        { delivery: { type: fulfillmentTypeFilter as FulfillmentType } },
        { plan: { fulfillmentType: fulfillmentTypeFilter as FulfillmentType } },
      ]
      if (where.OR) {
        const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []
        where.AND = [...existingAnd, { OR: fulfillmentCondition }]
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
      const existingOr = Array.isArray(where.OR) ? where.OR : where.OR ? [where.OR] : []
      where.OR = [
        ...existingOr,
        { productId: productIdFilter },
        { plan: { productId: productIdFilter } },
      ]
    }

    // Date Range Filter
    if (dateRange && dateRange !== 'ALL') {
      const now = new Date()
      const existingCreatedAt = typeof where.createdAt === 'object' && where.createdAt !== null ? where.createdAt : {}
      if (dateRange === 'TODAY') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        where.createdAt = { ...existingCreatedAt, gte: startOfToday }
      } else if (dateRange === 'YESTERDAY') {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        where.createdAt = {
          ...existingCreatedAt,
          gte: startOfYesterday,
          lt: endOfYesterday,
        }
      } else if (dateRange === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        where.createdAt = { ...existingCreatedAt, gte: sevenDaysAgo }
      } else if (dateRange === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        where.createdAt = { ...existingCreatedAt, gte: thirtyDaysAgo }
      } else if (dateRange === 'THIS_MONTH') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        where.createdAt = { ...existingCreatedAt, gte: startOfMonth }
      }
    }

    // Search Query across multiple fields
    if (search) {
      const searchCondition: Prisma.OrderWhereInput[] = [
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
        const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []
        where.AND = [...existingAnd, { OR: where.OR }, { OR: searchCondition }]
        delete where.OR
      } else {
        where.OR = searchCondition
      }
    }

    // Sorting
    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: 'desc' }
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
          coupon: {
            select: { id: true, code: true, discountType: true, discountValue: true },
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
        prisma.order.count({ where: { status: OrderStatus.REFUNDED } }),
        prisma.order.count({ where: { status: OrderStatus.EXPIRED } }),
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
        refunded: counts[6],
        expired: counts[7],
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

    // Special Action: Expire Stale Pending Orders (Section 4.2)
    if (action === 'EXPIRE_STALE') {
      const olderThan = parseInt(String(body.olderThanMinutes), 10) || 30
      const expireResult = await OrderExpirationService.expirePendingOrders(olderThan)
      return NextResponse.json({
        success: true,
        result: expireResult,
        message: `${expireResult.expiredOrdersCount} سفارش معوق منقضی و ${expireResult.releasedInventoryCount} کالای رزرو شده آزاد گردید.`,
      })
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'شناسه سفارش الزامی است.' },
        { status: 400 }
      )
    }

    // Special Action: Refund Order (Section 4.1)
    if (action === 'REFUND') {
      const targetOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          plan: { include: { product: true } },
          product: true,
          payment: true,
        },
      })

      if (!targetOrder) {
        return NextResponse.json(
          { success: false, error: 'سفارش مورد نظر یافت نشد.' },
          { status: 404 }
        )
      }

      if (targetOrder.status === OrderStatus.REFUNDED) {
        return NextResponse.json(
          { success: false, error: 'این سفارش قبلاً استرداد شده است.' },
          { status: 400 }
        )
      }

      const parsedRefundAmount = parseInt(String(body.refundAmount), 10)
      const refundAmount = !isNaN(parsedRefundAmount) && parsedRefundAmount > 0 ? parsedRefundAmount : targetOrder.amount
      const refundReason = body.refundReason?.trim() || null
      const refundRefId = body.refundRefId?.trim() || null
      const now = new Date()

      const refundedOrder = await prisma.$transaction(async (tx) => {
        // 1. Release any reserved or assigned inventory items back to AVAILABLE
        await tx.inventoryItem.updateMany({
          where: { orderId: targetOrder.id, status: 'RESERVED' },
          data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
        })

        // 2. Mark payment as REFUNDED if existing
        if (targetOrder.payment) {
          await tx.payment.update({
            where: { id: targetOrder.payment.id },
            data: { status: 'REFUNDED' },
          })
        }

        // 3. Mark order as REFUNDED with audit metadata
        return await tx.order.update({
          where: { id: targetOrder.id },
          data: {
            status: OrderStatus.REFUNDED,
            refundAmount,
            refundReason,
            refundRefId,
            refundedAt: now,
          },
          include: {
            user: true,
            plan: { include: { product: true } },
            product: true,
            delivery: true,
            payment: true,
            coupon: true,
          },
        })
      })

      // Send telegram alert to Admin
      AdminNotificationService.notifyOrderRefunded(refundedOrder.id, {
        refundAmount,
        refundReason: refundReason || undefined,
        refundRefId: refundRefId || undefined,
        adminUserName: user.name || user.phone || 'مدیر سیستم',
      }).catch((err) => console.error('Failed to send admin refund notification:', err))

      // Send telegram notification to customer if available
      const customerTelegram = refundedOrder.telegramChatId || refundedOrder.user?.telegramId
      if (customerTelegram) {
        const productTitle =
          refundedOrder.product?.title || refundedOrder.plan?.product?.title || 'اشتراک'
        const refundFormatted = new Intl.NumberFormat('fa-IR').format(refundAmount)

        const customerMsg =
          `💸 **مشتری گرامی، مبلغ سفارش #${refundedOrder.id.slice(-6).toUpperCase()} استرداد شد.**\n\n` +
          `📦 **محصول:** ${productTitle}\n` +
          `💰 **مبلغ استرداد یافته:** ${refundFormatted} تومان\n` +
          (refundRefId ? `🧾 **کد رهگیری شبا / بانکی:** \`${refundRefId}\`\n` : '') +
          (refundReason ? `📝 **علت:** ${refundReason}\n` : '') +
          `\nباتشکر از شکیبایی و همراهی شما.`

        sendTelegramNotification(customerTelegram, customerMsg).catch(() => {})
      }

      return NextResponse.json({
        success: true,
        order: refundedOrder,
        message: 'استرداد وجه با موفقیت ثبت و وضعیت سفارش بروزرسانی شد.',
      })
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
