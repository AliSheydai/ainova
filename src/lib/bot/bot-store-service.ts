import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { PaymentService } from '@/lib/payment'
import { CouponService } from '@/lib/discounts/coupon-service'
import { type CheckoutFieldDefinition } from '@/lib/fulfillment/types'
import { encryptCredential } from '@/lib/security/crypto'
import { InMemoryRateLimiter } from '@/lib/security/rate-limit'
import { type FulfillmentType, type Prisma } from '@prisma/client'

const botOrderRateLimiter = new InMemoryRateLimiter(5 * 60 * 1000, 3) // 3 orders per 5 minutes
const ALLOWED_BOT_SOURCES = ['telegram', 'bale', 'rubika', 'soroush'] as const

export interface BotProductSummary {
  id: string
  title: string
  name: string
  slug: string
  price: number
  stock: number
  plansCount: number
  variantsCount?: number
}

export interface BotVariantSummary {
  id: string
  productId: string
  name: string
  slug?: string | null
  description?: string | null
  price: number
  discountedPrice?: number | null
  discountLabel?: string | null
  duration: number
  badge?: string | null
  features: string[]
  sortOrder: number
  active: boolean
  plansCount: number
}

export interface BotPlanSummary {
  id: string
  productId: string
  variantId?: string | null
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
        variants: {
          where: { active: true },
          orderBy: { price: 'asc' },
        },
        plans: {
          where: { active: true },
          orderBy: { price: 'asc' },
        },
      },
    })

    const metricsMap = await FulfillmentService.batchGetProductsStockAndPurchases(products)

    return products.map((p) => {
      const metrics = metricsMap.get(p.id)
      const lowestVariantPrice = p.variants[0]
        ? (p.variants[0].discountedPrice && p.variants[0].discountedPrice > 0
            ? p.variants[0].discountedPrice
            : p.variants[0].price)
        : null
      const lowestPlanPrice = p.plans[0]?.price ?? null
      const displayPrice = lowestVariantPrice ?? lowestPlanPrice ?? p.price

      return {
        id: p.id,
        title: p.title,
        name: p.title,
        slug: p.slug,
        price: displayPrice,
        stock: metrics?.stock ?? 0,
        plansCount: p.plans.length,
        variantsCount: p.variants.length,
      }
    })
  }

  /**
   * Retrieves active variants for a product with plans count.
   */
  static async getProductVariants(productId: string): Promise<BotVariantSummary[]> {
    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
        active: true,
      },
      include: {
        plans: {
          where: { active: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return variants.map((v) => {
      let feats: string[] = []
      if (Array.isArray(v.features)) {
        feats = v.features
          .map((f) => (typeof f === 'string' ? f : String((f as any)?.text || (f as any)?.title || '')))
          .filter(Boolean)
      }
      return {
        id: v.id,
        productId: v.productId,
        name: v.name,
        slug: v.slug,
        description: v.description,
        price: v.price,
        discountedPrice: v.discountedPrice,
        discountLabel: v.discountLabel,
        duration: v.duration,
        badge: v.badge,
        features: feats,
        sortOrder: v.sortOrder,
        active: v.active,
        plansCount: v.plans.length,
      }
    })
  }

  /**
   * Retrieves a product with its active variants, plans, and calculated stock.
   */
  static async getProductPlans(productId: string, variantId?: string): Promise<{
    product: any
    variants: BotVariantSummary[]
    plans: BotPlanSummary[]
  } | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { active: true },
          include: {
            plans: { where: { active: true } },
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        plans: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
        },
      },
    })

    if (!product || product.status !== 'ACTIVE') return null

    const metricsMap = await FulfillmentService.batchGetProductsStockAndPurchases([product])
    const productMetrics = metricsMap.get(product.id)

    const rawPlans = product.plans
    // If variantId is given, prefer plans for that variant; if none match, fallback to unassigned or all plans
    const filteredPlans = variantId
      ? (rawPlans.some((p) => p.variantId === variantId)
          ? rawPlans.filter((p) => p.variantId === variantId)
          : rawPlans.filter((p) => !p.variantId).length > 0
            ? rawPlans.filter((p) => !p.variantId)
            : rawPlans)
      : rawPlans

    const plans = await Promise.all(
      filteredPlans.map(async (plan) => {
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
          variantId: plan.variantId,
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

    const variants: BotVariantSummary[] = (product.variants || []).map((v) => {
      let feats: string[] = []
      if (Array.isArray(v.features)) {
        feats = v.features
          .map((f) => (typeof f === 'string' ? f : String((f as any)?.text || (f as any)?.title || '')))
          .filter(Boolean)
      }
      return {
        id: v.id,
        productId: v.productId,
        name: v.name,
        slug: v.slug,
        description: v.description,
        price: v.price,
        discountedPrice: v.discountedPrice,
        discountLabel: v.discountLabel,
        duration: v.duration,
        badge: v.badge,
        features: feats,
        sortOrder: v.sortOrder,
        active: v.active,
        plansCount: v.plans.length,
      }
    })

    return { product, variants, plans }
  }

  /**
   * Creates an order from a chatbot (Telegram, Bale, Rubika, Soroush) and generates a payment URL.
   * Employs atomic reservation (FOR UPDATE SKIP LOCKED) to prevent double-selling.
   */
  static async createBotOrder(options: {
    userId: string
    planId: string
    variantId?: string
    checkoutData?: Record<string, any>
    couponCode?: string
    source: 'telegram' | 'bale' | 'rubika' | 'soroush'
    chatId?: string
    mobile?: string | null
  }) {
    const { userId, planId, variantId, checkoutData = {}, couponCode, source, chatId, mobile } = options

    const rateKey = chatId || userId
    const rateCheck = botOrderRateLimiter.check(rateKey)
    if (!rateCheck.success) {
      throw new Error('تعداد درخواست‌های ثبت سفارش بیش از حد مجاز است. لطفاً ۵ دقیقه دیگر مجدداً تلاش فرمایید.')
    }

    // Check for excessive active pending orders (Bug 3.2)
    const pendingOrders = await prisma.order.count({
      where: {
        userId,
        status: 'PENDING_PAYMENT',
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    })
    if (pendingOrders >= 3) {
      throw new Error('شما سفارش‌های پرداخت‌نشده فعالی دارید. لطفاً ابتدا آنها را تکمیل یا منتظر انقضای آنها بمانید.')
    }

    const validSource = (ALLOWED_BOT_SOURCES as readonly string[]).includes(source) ? source : 'telegram'

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true, variant: true },
    })

    if (!plan || !plan.active) {
      throw new Error('پلن انتخاب‌شده یافت نشد یا در حال حاضر غیرفعال است.')
    }

    if (!plan.product || plan.product.status !== 'ACTIVE') {
      throw new Error('محصول مرتبط با این پلن در حال حاضر غیرفعال است.')
    }

    // Resolve variant: from options.variantId or plan.variantId or plan.variant
    const effectiveVariantId = variantId || plan.variantId || null
    let targetVariant: any = null

    if (effectiveVariantId) {
      targetVariant = await prisma.productVariant.findUnique({
        where: { id: effectiveVariantId },
      })
      if (targetVariant && !targetVariant.active) {
        throw new Error('نوع محصول انتخاب‌شده در حال حاضر غیرفعال است.')
      }
      if (targetVariant && targetVariant.productId !== plan.productId) {
        throw new Error('نوع محصول انتخاب‌شده با این محصول همخوانی ندارد.')
      }
    } else if (plan.variant && plan.variant.active) {
      targetVariant = plan.variant
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
    let baseAmount: number
    if (targetVariant) {
      const hasDiscount =
        targetVariant.discountedPrice !== null &&
        targetVariant.discountedPrice !== undefined &&
        targetVariant.discountedPrice > 0 &&
        targetVariant.discountedPrice < targetVariant.price

      baseAmount = hasDiscount ? targetVariant.discountedPrice! : targetVariant.price
    } else {
      baseAmount = plan.price
    }

    if (baseAmount <= 0) {
      throw new Error('قیمت محصول یا پلن نامعتبر است.')
    }

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
      payableAmount = baseAmount - appliedDiscountAmount
    }

    if (payableAmount < 1000) {
      throw new Error('مبلغ نهایی کمتر از حداقل مجاز درگاه (۱۰۰۰ تومان) است.')
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
            // When inventory is 0, allow purchasing for 1-working-day fulfillment
            reservedInventoryItemId = null
          }
        }

        // Atomic Coupon Capacity Check & Increment with FOR UPDATE (Bug 2.2 & 2.5)
        if (appliedCouponId) {
          const couponCheck = await tx.$queryRaw<
            Array<{ id: string; usedCount: number; maxUses: number | null }>
          >`
            SELECT id, "usedCount", "maxUses" FROM coupons
            WHERE id = ${appliedCouponId}
            FOR UPDATE
          `
          if (!couponCheck || couponCheck.length === 0) {
            throw new Error('COUPON_NOT_FOUND')
          }
          if (
            couponCheck[0].maxUses !== null &&
            couponCheck[0].usedCount >= couponCheck[0].maxUses
          ) {
            throw new Error('COUPON_EXHAUSTED')
          }
          await tx.coupon.update({
            where: { id: appliedCouponId },
            data: { usedCount: { increment: 1 } },
          })
        }

        // Encrypt customer_password in checkoutData before saving (Bug 1.1)
        const secureCheckoutData: Record<string, unknown> = {
          ...(checkoutData as Record<string, unknown>),
        }
        if (
          typeof secureCheckoutData.customer_password === 'string' &&
          secureCheckoutData.customer_password.trim()
        ) {
          secureCheckoutData.customer_password = encryptCredential(
            secureCheckoutData.customer_password.trim()
          )
        }

        // Create Order snapshot
        const newOrder = await tx.order.create({
          data: {
            userId,
            productId: plan.productId,
            planId: plan.id,
            variantId: targetVariant?.id || plan.variantId || null,
            couponId: appliedCouponId,
            amount: payableAmount,
            discountAmount: appliedDiscountAmount,
            checkoutData: secureCheckoutData as Prisma.InputJsonValue,
            status: 'PENDING_PAYMENT',
            fulfillmentStatus: 'PENDING',
            source: validSource,
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
        if (err.message === 'COUPON_EXHAUSTED') {
          throw new Error('ظرفیت استفاده از این کد تخفیف تکمیل شده است.')
        }
        if (err.message === 'COUPON_NOT_FOUND') {
          throw new Error('کد تخفیف معتبر نمی‌باشد.')
        }
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

    const variantDesc = targetVariant?.name ? ` - ${targetVariant.name}` : ''
    const paymentResult = await PaymentService.createPayment({
      orderId: order.id,
      amount: payableAmount,
      description: `خرید (${source}): ${productTitle}${variantDesc} (${plan.name})`,
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
      variantName: targetVariant?.name || null,
      amount: payableAmount,
      originalAmount: baseAmount,
      discountAmount: appliedDiscountAmount,
    }
  }

  /**
   * Formats delivery info into HTML text for display in chat bots.
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
        return `🔗 <b>لینک فعال‌سازی اختصاصی:</b>\n<code>${linkUrl}</code>`
      }

      if (deliveryType === 'PRE_CREATED_ACCOUNT') {
        if (isOwnAccount) {
          const email = deliveryData.email || checkoutData.customer_gmail || checkoutData.customer_email || 'اکانت شما'
          return `✅ <b>اشتراک با موفقیت روی اکانت شخصی شما فعال شد:</b>\n<code>${email}</code>`
        }

        const email = deliveryData.email || deliveryData.username || ''
        return (
          `📦 <b>اطلاعات ورود به اکانت اختصاصی:</b>\n` +
          `• 📧 <b>ایمیل:</b> <code>${email}</code>\n` +
          `• 🔑 <b>رمز عبور:</b> در پنل کاربری سایت قابل مشاهده است.`
        )
      }

      if (deliveryType === 'CUSTOMER_PROVISIONING') {
        return `✅ <b>اشتراک با موفقیت روی اکانت شما فعال شد.</b>`
      }

      if (deliveryType === 'MANUAL') {
        return deliveryData.manualNote
          ? `📝 <b>توضیحات تحویل سفارش:</b>\n${deliveryData.manualNote}`
          : '✅ سفارش با موفقیت تحویل داده شد.'
      }

      return ''
    }

    if (order.status === 'PAID') {
      if (order.customerActionRequired) {
        return (
          `⚠️ <b>نیازمند اصلاح اطلاعات ورود:</b>\n` +
          `پیام مدیر: ${order.adminNote || 'اطلاعات ورود نیازمند اصلاح است.'}`
        )
      }

      if (order.credentialsUpdatedAt && !order.customerActionRequired) {
        return `⏳ <b>اطلاعات جدید شما ثبت شد و در صف بررسی کارشناس قرار دارد.</b>`
      }

      if (isOwnAccount || deliveryType === 'CUSTOMER_PROVISIONING') {
        const email = checkoutData.customer_gmail || checkoutData.customer_email || ''
        return `⏳ <b>در صف فعال‌سازی روی اکانت شما:</b>${email ? `\n<code>${email}</code>` : ''}`
      }
      return `⏳ <b>در حال آماده‌سازی و تحویل توسط سیستم...</b>`
    }

    return ''
  }
}
