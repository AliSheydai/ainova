import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { PaymentService } from '@/lib/payment'
import { CouponService } from '@/lib/discounts/coupon-service'
import { type CheckoutFieldDefinition } from '@/lib/fulfillment/types'
import { decryptCredential } from '@/lib/security/crypto'
import { type FulfillmentType } from '@prisma/client'

export interface BotProductSummary {
  id: string
  title: string
  name: string
  slug: string
  price: number
  stock: number
  plansCount: number
}

export interface BotPlanSummary {
  id: string
  productId: string
  name: string
  duration: number
  price: number
  fulfillmentType: string
  stock: number
  availableInventoryCount?: number | null
  checkoutFields: CheckoutFieldDefinition[]
}

export class BotStoreService {
  /**
   * Retrieves active products for bot catalogs.
   */
  static async getActiveProducts(): Promise<BotProductSummary[]> {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        archivedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        plans: {
          where: { active: true },
          orderBy: { price: 'asc' },
        },
      },
    })

    const metricsMap = await FulfillmentService.batchGetProductsStockAndPurchases(products)

    return products.map((p) => {
      const metrics = metricsMap.get(p.id)
      return {
        id: p.id,
        title: p.title,
        name: p.title,
        slug: p.slug,
        price: p.plans[0]?.price ?? p.price,
        stock: metrics?.stock ?? 0,
        plansCount: p.plans.length,
      }
    })
  }

  /**
   * Retrieves a product with its active plans and calculated stock.
   */
  static async getProductPlans(productId: string): Promise<{
    product: any
    plans: BotPlanSummary[]
  } | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        plans: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
        },
      },
    })

    if (!product || product.status !== 'ACTIVE') return null

    const metricsMap = await FulfillmentService.batchGetProductsStockAndPurchases([product])
    const productMetrics = metricsMap.get(product.id)

    const plans = await Promise.all(
      product.plans.map(async (plan) => {
        const stock = productMetrics?.planStocks[plan.id] ?? 0
        let availableCount: number | null = null

        if (plan.fulfillmentType === 'PRE_CREATED_ACCOUNT') {
          availableCount = await prisma.inventoryItem.count({
            where: {
              type: 'PRE_CREATED_ACCOUNT',
              status: 'AVAILABLE',
              OR: [
                { planId: plan.id },
                { productId: product.id, planId: null },
              ],
            },
          })
        }

        const fields = (Array.isArray(plan.checkoutFields)
          ? plan.checkoutFields
          : []) as unknown as CheckoutFieldDefinition[]

        return {
          id: plan.id,
          productId: plan.productId,
          name: plan.name,
          duration: plan.duration,
          price: plan.price,
          fulfillmentType: plan.fulfillmentType,
          stock,
          availableInventoryCount: availableCount,
          checkoutFields: fields,
        }
      })
    )

    return { product, plans }
  }

  /**
   * Creates an order from a chatbot (Telegram, Bale, Rubika, Soroush) and generates a payment URL.
   * Employs atomic reservation (FOR UPDATE SKIP LOCKED) to prevent double-selling.
   */
  static async createBotOrder(options: {
    userId: string
    planId: string
    checkoutData?: Record<string, any>
    couponCode?: string
    source: 'telegram' | 'bale' | 'rubika' | 'soroush'
    chatId?: string
    mobile?: string | null
  }) {
    const { userId, planId, checkoutData = {}, couponCode, source, chatId, mobile } = options

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true },
    })

    if (!plan || !plan.active) {
      throw new Error('پلن انتخاب‌شده یافت نشد یا در حال حاضر غیرفعال است.')
    }

    if (!plan.product || plan.product.status !== 'ACTIVE') {
      throw new Error('محصول مرتبط با این پلن در حال حاضر غیرفعال است.')
    }

    const fulfillmentType: FulfillmentType = plan.fulfillmentType || 'ACTIVATION_LINK'

    // Check if customer provided their own account for PRE_CREATED_ACCOUNT
    const hasCustomerProvidedAccount =
      fulfillmentType === 'PRE_CREATED_ACCOUNT' &&
      (
        checkoutData?.delivery_preference === 'own_account' ||
        Boolean(
          (typeof checkoutData?.customer_email === 'string' && checkoutData.customer_email.trim()) ||
          (typeof checkoutData?.customer_gmail === 'string' && checkoutData.customer_gmail.trim())
        )
      )

    // Validation for PRE_CREATED_ACCOUNT with customer's own Gmail
    if (fulfillmentType === 'PRE_CREATED_ACCOUNT' && hasCustomerProvidedAccount) {
      const email =
        (typeof checkoutData?.customer_email === 'string' && checkoutData.customer_email.trim()) ||
        (typeof checkoutData?.customer_gmail === 'string' && checkoutData.customer_gmail.trim()) ||
        ''
      const password =
        (typeof checkoutData?.customer_password === 'string' && checkoutData.customer_password.trim()) || ''

      if (!email) {
        throw new Error('لطفاً آدرس جیمیل خود را جهت فعال‌سازی وارد فرمایید.')
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('فرمت آدرس جیمیل وارد شده نامعتبر است.')
      }

      if (!password) {
        throw new Error('وارد کردن رمز عبور جیمیل برای فعال‌سازی روی اکانت شما الزامی است.')
      }
    }

    // Validate custom plan checkout fields
    const fieldDefs = (Array.isArray(plan.checkoutFields)
      ? plan.checkoutFields
      : []) as unknown as CheckoutFieldDefinition[]

    for (const field of fieldDefs) {
      const val = checkoutData[field.key]
      if (field.required && (!val || String(val).trim() === '')) {
        throw new Error(`تکمیل فیلد «${field.label}» الزامی است.`)
      }
      if (val && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(val).trim())) {
          throw new Error(`فرمت ایمیل وارد شده برای «${field.label}» صحیح نیست.`)
        }
      }
    }

    // Determine base amount and validate coupon
    const baseAmount = plan.price
    let appliedCouponId: string | null = null
    let appliedDiscountAmount = 0
    let payableAmount = baseAmount

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const couponValidation = await CouponService.validateAndCalculate(
        couponCode,
        baseAmount,
        plan.productId
      )

      if (!couponValidation.valid) {
        throw new Error(couponValidation.error || 'کد تخفیف وارد شده معتبر نیست.')
      }

      appliedCouponId = couponValidation.coupon?.id || null
      appliedDiscountAmount = couponValidation.discountAmount || 0
      payableAmount = Math.max(1000, baseAmount - appliedDiscountAmount)
    }

    // Atomic Stock Reservation & Order Creation with FOR UPDATE SKIP LOCKED
    let order
    try {
      order = await prisma.$transaction(async (tx) => {
        const targetPlanId = plan.id
        const targetProductId = plan.productId
        let reservedInventoryItemId: string | null = null

        // Only reserve inventory item if it's ACTIVATION_LINK or PRE_CREATED_ACCOUNT with ready warehouse account
        if (
          fulfillmentType === 'ACTIVATION_LINK' ||
          (fulfillmentType === 'PRE_CREATED_ACCOUNT' && !hasCustomerProvidedAccount)
        ) {
          const invType = fulfillmentType === 'ACTIVATION_LINK' ? 'ACTIVATION_LINK' : 'PRE_CREATED_ACCOUNT'
          const invRows = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM inventory_items
            WHERE type = ${invType}::"InventoryType"
              AND (
                ("planId" = ${targetPlanId} AND "planId" IS NOT NULL) OR
                ("productId" = ${targetProductId} AND ("planId" IS NULL OR "planId" = ${targetPlanId}))
              )
              AND status = 'AVAILABLE'::"LinkStatus"
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          `

          if (invRows && invRows.length > 0) {
            reservedInventoryItemId = invRows[0].id
          } else {
            throw new Error(
              fulfillmentType === 'PRE_CREATED_ACCOUNT'
                ? 'READY_ACCOUNT_STOCK_EXHAUSTED'
                : 'STOCK_EXHAUSTED'
            )
          }
        }

        // Create Order snapshot
        const newOrder = await tx.order.create({
          data: {
            userId,
            productId: plan.productId,
            planId: plan.id,
            couponId: appliedCouponId,
            amount: payableAmount,
            discountAmount: appliedDiscountAmount,
            checkoutData,
            status: 'PENDING_PAYMENT',
            fulfillmentStatus: 'PENDING',
            source,
            telegramChatId: chatId,
          },
        })

        if (reservedInventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: reservedInventoryItemId },
            data: {
              status: 'RESERVED',
              orderId: newOrder.id,
              assignedAt: new Date(),
            },
          })
        }

        return newOrder
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'READY_ACCOUNT_STOCK_EXHAUSTED') {
          throw new Error('موجودی اکانت‌های آماده انبار موقتاً به پایان رسیده است. شما می‌توانید با انتخاب گزینه «فعال‌سازی روی جیمیل شخصی»، اشتراک را روی اکانت خود دریافت فرمایید.')
        }
        if (err.message === 'STOCK_EXHAUSTED') {
          throw new Error('موجودی این پلن در حال حاضر به اتمام رسیده است.')
        }
      }
      throw err
    }

    // Request payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/payment/callback?source=${source}&orderId=${order.id}`
    const productTitle = plan.product.title

    const paymentResult = await PaymentService.createPayment({
      orderId: order.id,
      amount: payableAmount,
      description: `خرید (${source}): ${productTitle} (${plan.name})`,
      callbackUrl,
      mobile: mobile || undefined,
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      // Rollback reservation and mark order failed
      await prisma.$transaction([
        prisma.inventoryItem.updateMany({
          where: { orderId: order.id, status: 'RESERVED' },
          data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        }),
      ]).catch((cleanupErr) => console.error('Error rolling back reservation in bot order:', cleanupErr))

      throw new Error(paymentResult.error || 'خطا در اتصال به درگاه پرداخت.')
    }

    const fullPaymentUrl = paymentResult.paymentUrl.startsWith('http')
      ? paymentResult.paymentUrl
      : `${appUrl}${paymentResult.paymentUrl}`

    return {
      order,
      paymentUrl: fullPaymentUrl,
      productTitle,
      planName: plan.name,
      amount: payableAmount,
      originalAmount: baseAmount,
      discountAmount: appliedDiscountAmount,
    }
  }

  /**
   * Formats delivery info into markdown text for display in chat bots.
   */
  static formatDeliveryMessage(order: any): string {
    const delivery = order.delivery
    const deliveryType = delivery?.type || (order.activationLink ? 'ACTIVATION_LINK' : 'MANUAL')
    const deliveryData = (delivery?.data as Record<string, any>) || {}
    const checkoutData = (order.checkoutData as Record<string, any>) || {}
    const linkUrl = deliveryData.url || order.activationLink?.url

    const isOwnAccount =
      checkoutData.delivery_preference === 'own_account' ||
      Boolean(checkoutData.customer_gmail || checkoutData.customer_email)

    if (order.status === 'COMPLETED') {
      if (deliveryType === 'ACTIVATION_LINK' && linkUrl) {
        return `🔗 **لینک فعال‌سازی اشتراک شما:**\n\`${linkUrl}\`\n\n📌 *روی لینک کلیک کرده و پیشنهاد فعال‌سازی در اکانت گوگل خود را تأیید کنید.*`
      }

      if (deliveryType === 'PRE_CREATED_ACCOUNT') {
        if (isOwnAccount) {
          const email = deliveryData.email || checkoutData.customer_gmail || checkoutData.customer_email || 'اکانت شما'
          return (
            `✅ **وضعیت فعال‌سازی:** تکمیل گردید\n` +
            `📧 اشتراک با موفقیت روی اکانت شخصی شما (\`${email}\`) فعال شد.`
          )
        }

        const pass = deliveryData.password ? decryptCredential(deliveryData.password) : '••••••'
        return (
          `👤 **اطلاعات اکانت اختصاصی:**\n` +
          `📧 **نام کاربری / ایمیل:** \`${deliveryData.email || deliveryData.username}\`\n` +
          `🔑 **رمز عبور:** \`${pass}\`\n\n` +
          `⚠️ ${deliveryData.note || 'لطفاً بلافاصله پس از ورود، رمز عبور را تغییر دهید.'}`
        )
      }

      if (deliveryType === 'CUSTOMER_PROVISIONING') {
        return (
          `✅ **وضعیت فعال‌سازی:** تکمیل گردید\n` +
          `📧 اشتراک با موفقیت روی اکانت شما فعال شد.`
        )
      }

      if (deliveryType === 'MANUAL') {
        return (
          `✅ **اطلاعات تحویل پشتیبانی:**\n` +
          `${deliveryData.manualNote || 'سفارش با موفقیت تحویل داده شد.'}`
        )
      }

      return `✅ سفارش شما با موفقیت تکمیل شده است.`
    }

    if (order.status === 'PAID') {
      if (isOwnAccount || deliveryType === 'CUSTOMER_PROVISIONING') {
        const email = checkoutData.customer_gmail || checkoutData.customer_email || ''
        return (
          `⏳ **وضعیت:** پرداخت تایید شده — سفارش در صف فعال‌سازی روی اکانت شما${email ? ` (\`${email}\`)` : ''} توسط کارشناسان است.`
        )
      }
      return `⏳ **وضعیت:** پرداخت تایید شده — در حال آماده‌سازی و تحویل توسط سیستم.`
    }

    if (order.status === 'PENDING_PAYMENT') {
      return `🟡 **وضعیت:** در انتظار پرداخت بانکی.`
    }

    if (order.status === 'CANCELLED') {
      return `🚫 **وضعیت:** سفارش لغو شده.`
    }

    if (order.status === 'FAILED') {
      return `❌ **وضعیت:** پرداخت ناموفق.`
    }

    return `📊 **وضعیت سفارش:** ${order.status}`
  }
}
