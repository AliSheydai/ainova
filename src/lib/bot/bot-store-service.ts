import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { PaymentService } from '@/lib/payment'
import { CheckoutFieldDefinition } from '@/lib/fulfillment/types'
import { decryptCredential } from '@/lib/security/crypto'

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
  checkoutFields: CheckoutFieldDefinition[]
}

export class BotStoreService {
  /**
   * Retrieves active products for bot catalogs.
   */
  static async getActiveProducts(): Promise<BotProductSummary[]> {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        plans: { where: { active: true } },
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

    const plans = product.plans.map((plan) => {
      const stock = productMetrics?.planStocks[plan.id] ?? 0
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
        checkoutFields: fields,
      }
    })

    return { product, plans }
  }

  /**
   * Creates an order from a chatbot (Telegram, Bale, Rubika, Soroush) and generates a payment URL.
   */
  static async createBotOrder(options: {
    userId: string
    planId: string
    checkoutData?: Record<string, any>
    source: 'telegram' | 'bale' | 'rubika' | 'soroush'
    chatId?: string
    mobile?: string | null
  }) {
    const { userId, planId, checkoutData = {}, source, chatId, mobile } = options

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true },
    })

    if (!plan || !plan.active) {
      throw new Error('پلن انتخاب‌شده یافت نشد یا غیرفعال است.')
    }

    if (!plan.product || plan.product.status !== 'ACTIVE') {
      throw new Error('محصول مرتبط با این پلن غیرفعال است.')
    }

    // Validate plan fields
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

    // Check stock
    const stock = await FulfillmentService.getPlanStock(plan.id)
    if (stock <= 0) {
      throw new Error('موجودی این پلن در حال حاضر به پایان رسیده است.')
    }

    // Create Order snapshot
    const order = await prisma.order.create({
      data: {
        userId,
        productId: plan.productId,
        planId: plan.id,
        amount: plan.price, // SNAPSHOT
        checkoutData, // SNAPSHOT
        status: 'PENDING_PAYMENT',
        fulfillmentStatus: 'PENDING',
        source,
        telegramChatId: chatId,
      },
    })

    // Request payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/payment/callback?source=${source}&orderId=${order.id}`
    const productTitle = plan.product.title

    const paymentResult = await PaymentService.createPayment({
      orderId: order.id,
      amount: plan.price,
      description: `خرید (${source}): ${productTitle} (${plan.name})`,
      callbackUrl,
      mobile: mobile || undefined,
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
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
      amount: plan.price,
    }
  }

  /**
   * Formats delivery info into markdown text for display in chat bots.
   */
  static formatDeliveryMessage(order: any): string {
    const delivery = order.delivery
    const deliveryType = delivery?.type || (order.activationLink ? 'ACTIVATION_LINK' : 'MANUAL')
    const deliveryData = (delivery?.data as Record<string, any>) || {}
    const linkUrl = deliveryData.url || order.activationLink?.url

    if (order.status === 'COMPLETED') {
      if (deliveryType === 'ACTIVATION_LINK' && linkUrl) {
        return `🔗 **لینک فعال‌سازی اشتراک شما:**\n\`${linkUrl}\`\n\n📌 *روی لینک کلیک کرده و پیشنهاد فعال‌سازی در اکانت گوگل خود را تأیید کنید.*`
      }

      if (deliveryType === 'PRE_CREATED_ACCOUNT') {
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

      return `✅ سفارش شما تکمیل شده است.`
    }

    if (order.status === 'PAID') {
      return `⏳ **وضعیت:** پرداخت تایید شده — در حال آماده‌سازی و تحویل توسط سیستم یا پشتیبانی.`
    }

    if (order.status === 'PENDING_PAYMENT') {
      return `🟡 **وضعیت:** در انتظار پرداخت بانکی.`
    }

    return `❌ **وضعیت سفارش:** ${order.status}`
  }
}
