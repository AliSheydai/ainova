import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { OrderStatus, type FulfillmentType, DeliveryStatus, type Prisma } from '@prisma/client'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { decryptCredential } from '@/lib/security/crypto'
import { AdminNotificationService } from '@/lib/notifications/admin-notification'
import { UserNotificationService } from '@/lib/notifications/user-notification-service'
import { NotificationType } from '@prisma/client'
import { OrderExpirationService } from '@/lib/orders/order-expiration'
import { sendTelegramNotification } from '@/lib/telegram/bot'
import { CouponService } from '@/lib/discounts/coupon-service'

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
      } else if (statusFilter === 'ACTION_REQUIRED') {
        where.customerActionRequired = true
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
        prisma.order.count({ where: { status: { in: [OrderStatus.FAILED, OrderStatus.CANCELLED] } } }),
        prisma.order.count({ where: { status: OrderStatus.REFUNDED } }),
        prisma.order.count({ where: { status: OrderStatus.EXPIRED } }),
        prisma.order.count({ where: { customerActionRequired: true } }),
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
        actionRequired: counts[8],
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

        // 3. Decrement coupon usage upon refund (Bug 2.5)
        if (targetOrder.couponId) {
          await CouponService.decrementCouponUsage(targetOrder.couponId, tx)
        }

        // 4. Mark order as REFUNDED with audit metadata
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

      if (fulfillResult.success && fulfillResult.order?.userId) {
        UserNotificationService.createNotification({
          userId: fulfillResult.order.userId,
          title: 'سفارش شما تحویل داده شد!',
          message: `سفارش #${fulfillResult.order.id.slice(-6).toUpperCase()} با موفقیت آماده و تحویل گردید. جزئیات در بخش سفارش‌های من قابل مشاهده است.`,
          type: NotificationType.ORDER_READY,
          metadata: { orderId: fulfillResult.order.id },
        }).catch(() => {})
      }

      return NextResponse.json({
        success: fulfillResult.success,
        order: fulfillResult.order,
        delivery: fulfillResult.delivery,
        message: fulfillResult.message,
      })
    }

    // Special Action: Confirm Customer Provisioning (admin confirms activation on customer's account)
    if (action === 'CONFIRM_CUSTOMER_PROVISIONING') {
      const targetOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          plan: { include: { product: true } },
          product: true,
          delivery: true,
          payment: true,
        },
      })

      if (!targetOrder) {
        return NextResponse.json(
          { success: false, error: 'سفارش مورد نظر یافت نشد.' },
          { status: 404 }
        )
      }

      const checkoutData = (targetOrder.checkoutData as Record<string, unknown>) || {}
      const customerEmail =
        (typeof checkoutData.customer_email === 'string' && checkoutData.customer_email) ||
        (typeof checkoutData.customer_gmail === 'string' && checkoutData.customer_gmail) ||
        ''

      if (!customerEmail) {
        return NextResponse.json(
          { success: false, error: 'این سفارش دارای اطلاعات اکانت مشتری نیست.' },
          { status: 400 }
        )
      }

      const serviceName =
        targetOrder.product?.title || targetOrder.plan?.product?.title || 'سرویس'
      const now = new Date()
      const adminNote = body.adminNote?.trim() || ''

      const deliveryData = {
        email: customerEmail,
        serviceName,
        provisionDetails: `اشتراک ${serviceName} توسط مدیر سیستم روی حساب «${customerEmail}» فعال‌سازی شد.${adminNote ? '\nیادداشت مدیر: ' + adminNote : ''}`,
        accountInfo: `ایمیل فعال‌شده: ${customerEmail}`,
        status: 'COMPLETED' as const,
        confirmedByAdminId: user.id,
        confirmedAt: now.toISOString(),
        adminNote,
      }

      await prisma.$transaction(async (tx) => {
        await tx.delivery.upsert({
          where: { orderId },
          create: {
            orderId,
            type: 'CUSTOMER_PROVISIONING',
            status: 'DELIVERED',
            data: deliveryData,
            deliveredAt: now,
          },
          update: {
            type: 'CUSTOMER_PROVISIONING',
            status: 'DELIVERED',
            data: deliveryData,
            deliveredAt: now,
          },
        })

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            fulfillmentStatus: 'COMPLETED',
            adminNote: adminNote || null,
            customerActionRequired: false,
          },
        })
      })

      // Notify customer via Telegram if available
      const customerTelegram = targetOrder.telegramChatId || targetOrder.user?.telegramId
      if (customerTelegram) {
        const msg =
          `✅ **اشتراک شما فعال شد!**\n\n` +
          `📦 **محصول:** ${serviceName}\n` +
          `📧 **اکانت فعال‌شده:** ${customerEmail}\n` +
          (adminNote ? `📝 **یادداشت مدیر:** ${adminNote}\n` : '') +
          `\nبا تشکر از خرید شما!`

        sendTelegramNotification(customerTelegram, msg).catch(() => {})
      }

      if (targetOrder.userId) {
        const notifMsg = `اشتراک ${serviceName} روی حساب «${customerEmail}» با موفقیت فعال شد.${adminNote ? `\n📝 یادداشت مدیر: ${adminNote}` : ''}`
        UserNotificationService.createNotification({
          userId: targetOrder.userId,
          title: 'اشتراک شما فعال شد!',
          message: notifMsg,
          type: NotificationType.ORDER_READY,
          metadata: { orderId: targetOrder.id },
        }).catch(() => {})
      }

      return NextResponse.json({
        success: true,
        message: `اشتراک با موفقیت روی اکانت «${customerEmail}» فعال‌سازی و سفارش تکمیل شد.`,
      })
    }

    // Special Action: Request Customer Action (e.g. wrong password, 2FA required)
    if (action === 'REQUEST_CUSTOMER_ACTION') {
      const targetOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          plan: { include: { product: true } },
          product: true,
        },
      })

      if (!targetOrder) {
        return NextResponse.json(
          { success: false, error: 'سفارش مورد نظر یافت نشد.' },
          { status: 404 }
        )
      }

      const reason = body.reason?.trim() || 'WRONG_PASSWORD'
      const adminNote = body.adminNote?.trim() || 'اطلاعات ورود به اکانت نامعتبر است. لطفاً رمز عبور را بررسی و اصلاح فرمایید.'
      const serviceName = targetOrder.product?.title || targetOrder.plan?.product?.title || 'اشتراک'

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          customerActionRequired: true,
          actionRequiredReason: reason,
          adminNote,
          fulfillmentStatus: 'PROCESSING',
        },
        include: {
          user: true,
          plan: true,
          product: true,
          delivery: true,
        },
      })

      // Send in-app notification to customer
      if (targetOrder.userId) {
        UserNotificationService.createNotification({
          userId: targetOrder.userId,
          title: '⚠️ نیاز به اصلاح اطلاعات سفارش',
          message: `در سفارش ${serviceName}: ${adminNote}`,
          type: NotificationType.ORDER_ACTION_REQUIRED,
          link: '/?tab=orders',
          metadata: { orderId: targetOrder.id, actionRequired: true, reason },
        }).catch(() => {})
      }

      // Send Telegram notification if available
      const customerTelegram = targetOrder.telegramChatId || targetOrder.user?.telegramId
      if (customerTelegram) {
        const msg =
          `⚠️ **نیاز به بررسی و اصلاح اطلاعات سفارش #${targetOrder.id.slice(-6).toUpperCase()}**\n\n` +
          `📦 **محصول:** ${serviceName}\n` +
          `📝 **پیام مدیر:** ${adminNote}\n\n` +
          `👇 لطفاً با کلیک روی دکمه زیر، اطلاعات اکانت (جیمیل، رمز عبور یا یادداشت) خود را ویرایش و ارسال فرمایید:`

        const inlineKeyboard = {
          inline_keyboard: [
            [
              {
                text: '✏️ ویرایش اطلاعات اکانت',
                callback_data: `fix_cred:${targetOrder.id}`,
              },
            ],
          ],
        }

        sendTelegramNotification(customerTelegram, msg, inlineKeyboard).catch(() => {})
      }

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: 'درخواست اصلاح اطلاعات با موفقیت برای خریدار ارسال و ثبت گردید.',
      })
    }

    // Standard Status Update
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای درخواست نامعتبر هستند.' },
        { status: 400 }
      )
    }

    const adminNote = body.adminNote?.trim() || null

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(adminNote !== null ? { adminNote } : {}),
        customerActionRequired: false,
      },
      include: {
        user: true,
        plan: true,
        delivery: true,
      },
    })

    // If status is CANCELLED or FAILED, notify the customer with explanation
    if (updatedOrder.userId && (status === OrderStatus.CANCELLED || status === OrderStatus.FAILED)) {
      const isCancelled = status === OrderStatus.CANCELLED
      const title = isCancelled ? 'سفارش شما لغو شد' : 'سفارش با خطا مواجه شد'
      const defaultMsg = isCancelled
        ? `سفارش #${updatedOrder.id.slice(-6).toUpperCase()} لغو گردید.`
        : `سفارش #${updatedOrder.id.slice(-6).toUpperCase()} با خطا مواجه شد.`
      const message = adminNote ? `${defaultMsg}\nعلت: ${adminNote}` : defaultMsg

      UserNotificationService.createNotification({
        userId: updatedOrder.userId,
        title,
        message,
        type: NotificationType.ORDER_FAILED,
        metadata: { orderId: updatedOrder.id },
      }).catch(() => {})

      const customerTelegram = updatedOrder.telegramChatId || updatedOrder.user?.telegramId
      if (customerTelegram) {
        const msg =
          `❌ **${title}**\n\n` +
          `سفارش: #${updatedOrder.id.slice(-6).toUpperCase()}\n` +
          (adminNote ? `📝 **توضیحات مدیر:** ${adminNote}\n` : '')
        sendTelegramNotification(customerTelegram, msg).catch(() => {})
      }
    }

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
