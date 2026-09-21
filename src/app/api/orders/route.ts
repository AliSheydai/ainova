import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { PaymentService } from '@/lib/payment'
import { type CheckoutFieldDefinition, type FulfillmentType } from '@/lib/fulfillment/types'
import { CouponService } from '@/lib/discounts/coupon-service'
import { OrderExpirationService } from '@/lib/orders/order-expiration'
import { encryptCredential, decryptCredential } from '@/lib/security/crypto'
import { InMemoryRateLimiter, getClientIp } from '@/lib/security/rate-limit'

const ALLOWED_SOURCES = ['web', 'telegram', 'bale', 'rubika', 'soroush'] as const
type AllowedSource = (typeof ALLOWED_SOURCES)[number]

const orderRateLimiter = new InMemoryRateLimiter(60 * 1000, 5) // 5 orders per minute per IP

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const rateCheck = orderRateLimiter.check(ip)
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.' },
        { status: 429 }
      )
    }

    // Trigger non-blocking lazy cleanup for stale orders
    OrderExpirationService.triggerBackgroundCleanup()

    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      )
    }

    // Check for excessive active pending orders (Bug 3.2)
    const pendingOrders = await prisma.order.count({
      where: {
        userId: session.userId,
        status: 'PENDING_PAYMENT',
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    })
    if (pendingOrders >= 3) {
      return NextResponse.json(
        {
          success: false,
          message: 'شما سفارش‌های پرداخت‌نشده فعالی دارید. لطفاً ابتدا آنها را تکمیل کنید.',
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { productId, slug, planId, variantId, checkoutData, source, couponCode } = body

    const validSource: AllowedSource =
      typeof source === 'string' && (ALLOWED_SOURCES as readonly string[]).includes(source)
        ? (source as AllowedSource)
        : 'web'

    // 1. Resolve product, plan, and variant
    let product = null
    let plan = null
    let variant = null

    // 1.1 If variantId is provided, resolve and validate it
    if (variantId && typeof variantId === 'string' && variantId.trim()) {
      variant = await prisma.productVariant.findUnique({
        where: { id: variantId.trim() },
        include: { product: true },
      })

      if (!variant) {
        return NextResponse.json(
          { success: false, message: 'نوع محصول انتخاب‌شده یافت نشد.' },
          { status: 404 }
        )
      }

      if (!variant.active) {
        return NextResponse.json(
          { success: false, message: 'نوع محصول انتخاب‌شده در حال حاضر غیرفعال است.' },
          { status: 400 }
        )
      }

      product = variant.product
    }

    if (planId) {
      plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: { product: true, variant: true },
      })
      if (plan) {
        if (!product) {
          product = plan.product
        } else if (plan.productId !== product.id) {
          return NextResponse.json(
            { success: false, message: 'پلن انتخاب‌شده به این محصول تعلق ندارد.' },
            { status: 400 }
          )
        }

        // If no variant was explicitly sent, but the plan belongs to a variant:
        if (!variant && plan.variant) {
          if (plan.variant.active) {
            variant = plan.variant
          }
        }
      }
    } else if (productId) {
      const fetchedProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: { plans: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] } },
      })
      if (fetchedProduct) {
        product = fetchedProduct
        if (fetchedProduct.plans.length > 0) {
          plan = fetchedProduct.plans[0]
        }
      }
    } else if (slug) {
      const fetchedProduct = await prisma.product.findUnique({
        where: { slug },
        include: { plans: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] } },
      })
      if (fetchedProduct) {
        product = fetchedProduct
        if (fetchedProduct.plans.length > 0) {
          plan = fetchedProduct.plans[0]
        }
      }
    } else if (variant && product) {
      plan = await prisma.plan.findFirst({
        where: { productId: product.id, active: true },
        orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      })
    }

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'محصول مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    if (variant && variant.productId !== product.id) {
      return NextResponse.json(
        { success: false, message: 'نوع محصول انتخاب‌شده به این محصول تعلق ندارد.' },
        { status: 400 }
      )
    }

    // 2. Security Check: is product active?
    if (product.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'این محصول در حال حاضر غیرفعال و غیرقابل خرید است.' },
        { status: 400 }
      )
    }

    // Every purchase must have an active plan (Section 2.6)
    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'این محصول در حال حاضر پلن فعال و قابل خریدی ندارد.' },
        { status: 400 }
      )
    }

    if (!plan.active) {
      return NextResponse.json(
        { success: false, message: 'پلن انتخاب‌شده در حال حاضر غیرفعال است.' },
        { status: 400 }
      )
    }

    // 3. Validate Dynamic Checkout Fields if configured on Plan
    const submittedData = (checkoutData && typeof checkoutData === 'object') ? checkoutData : {}

    // Defense-in-depth: limit maximum length of any submitted checkout field to 500 characters
    for (const [key, val] of Object.entries(submittedData)) {
      if (val !== undefined && val !== null && String(val).length > 500) {
        return NextResponse.json(
          { success: false, message: `طول مقدار فیلد «${key}» بیش از حد مجاز است (حداکثر ۵۰۰ کاراکتر).` },
          { status: 400 }
        )
      }
    }

    if (Array.isArray(plan.checkoutFields)) {
      const fieldDefs = plan.checkoutFields as unknown as CheckoutFieldDefinition[]
      for (const field of fieldDefs) {
        const val = submittedData[field.key]
        if (field.required) {
          if (val === undefined || val === null || String(val).trim() === '') {
            return NextResponse.json(
              { success: false, message: `تکمیل فیلد «${field.label}» برای این پلن الزامی است.` },
              { status: 400 }
            )
          }
        }

        if (val !== undefined && val !== null && String(val).length > 500) {
          return NextResponse.json(
            { success: false, message: `طول مقدار وارد شده برای «${field.label}» بیش از حد مجاز است (حداکثر ۵۰۰ کاراکتر).` },
            { status: 400 }
          )
        }

        if (val && field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(String(val).trim())) {
            return NextResponse.json(
              { success: false, message: `فرمت وارد شده برای «${field.label}» صحیح نمی‌باشد.` },
              { status: 400 }
            )
          }
        }
      }
    }

    // 3.1 Validate PRE_CREATED_ACCOUNT if customer requested their own account
    if (plan.fulfillmentType === 'PRE_CREATED_ACCOUNT') {
      const isOwnAccount =
        submittedData?.delivery_preference === 'own_account' ||
        Boolean(typeof submittedData?.customer_email === 'string' && submittedData.customer_email.trim()) ||
        Boolean(typeof submittedData?.customer_gmail === 'string' && submittedData.customer_gmail.trim())

      if (isOwnAccount) {
        const email =
          (typeof submittedData?.customer_email === 'string' && submittedData.customer_email.trim()) ||
          (typeof submittedData?.customer_gmail === 'string' && submittedData.customer_gmail.trim()) ||
          ''
        const password =
          (typeof submittedData?.customer_password === 'string' && submittedData.customer_password.trim()) ||
          ''

        if (!email) {
          return NextResponse.json(
            { success: false, message: 'لطفاً آدرس جیمیل خود را جهت فعال‌سازی وارد نمایید.' },
            { status: 400 }
          )
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { success: false, message: 'فرمت آدرس جیمیل وارد شده نامعتبر است.' },
            { status: 400 }
          )
        }

        if (!password) {
          return NextResponse.json(
            { success: false, message: 'وارد کردن رمز عبور جیمیل برای فعال‌سازی روی اکانت شما الزامی است.' },
            { status: 400 }
          )
        }
      }
    }

    // 4. Determine base price: if variant is selected, take price from variant (with discount if applicable)
    let baseAmount: number
    if (variant) {
      const hasDiscount =
        variant.discountedPrice !== null &&
        variant.discountedPrice !== undefined &&
        variant.discountedPrice > 0 &&
        variant.discountedPrice < variant.price

      baseAmount = hasDiscount ? variant.discountedPrice! : variant.price
    } else {
      baseAmount = plan?.price ?? product.price ?? 0
    }

    if (baseAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'قیمت محصول یا پلن نامعتبر است.' },
        { status: 400 }
      )
    }

    // 4.1 Validate and apply coupon if provided (Section 4.3)
    let appliedCouponId: string | null = null
    let appliedDiscountAmount = 0
    let payableAmount = baseAmount

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const couponValidation = await CouponService.validateAndCalculate(
        couponCode,
        baseAmount,
        product.id,
        session.userId
      )

      if (!couponValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            message: couponValidation.error || 'کد تخفیف وارد شده معتبر نیست.',
          },
          { status: 400 }
        )
      }

      appliedCouponId = couponValidation.coupon?.id || null
      appliedDiscountAmount = couponValidation.discountAmount || 0
      payableAmount = baseAmount - appliedDiscountAmount
    }

    if (payableAmount < 1000) {
      return NextResponse.json(
        {
          success: false,
          message: 'مبلغ نهایی کمتر از حداقل مجاز درگاه (۱۰۰۰ تومان) است.',
        },
        { status: 400 }
      )
    }

    // 5. Determine fulfillment type from Plan (Section 2.4)
    const fulfillmentType: FulfillmentType = plan.fulfillmentType || 'ACTIVATION_LINK'

    // 6. Atomic stock reservation & Order creation with FOR UPDATE SKIP LOCKED
    let order
    try {
      order = await prisma.$transaction(async (tx) => {
        const targetPlanId = plan.id
        const targetProductId = product.id
        const effectiveVariantId = variant?.id || plan.variantId || null
        let reservedInventoryItemId: string | null = null

        // Check if customer provided their own account for PRE_CREATED_ACCOUNT
        const hasCustomerProvidedAccount =
          fulfillmentType === 'PRE_CREATED_ACCOUNT' &&
          (
            submittedData?.delivery_preference === 'own_account' ||
            Boolean(
              (typeof submittedData?.customer_email === 'string' && submittedData.customer_email.trim()) ||
              (typeof submittedData?.customer_gmail === 'string' && submittedData.customer_gmail.trim())
            )
          )

        // Only reserve inventory if it's ACTIVATION_LINK, or PRE_CREATED_ACCOUNT without customer own account
        if (
          fulfillmentType === 'ACTIVATION_LINK' ||
          (fulfillmentType === 'PRE_CREATED_ACCOUNT' && !hasCustomerProvidedAccount)
        ) {
          const invType = fulfillmentType === 'ACTIVATION_LINK' ? 'ACTIVATION_LINK' : 'PRE_CREATED_ACCOUNT'
          const invRows = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM inventory_items
            WHERE type = ${invType}::"InventoryType"
              AND status = 'AVAILABLE'::"LinkStatus"
              AND (
                (${effectiveVariantId}::text IS NOT NULL AND "variantId" = ${effectiveVariantId})
                OR
                (${effectiveVariantId}::text IS NULL AND "variantId" IS NULL)
                OR
                ("variantId" IS NULL AND "productId" = ${targetProductId})
              )
              AND (
                "planId" = ${targetPlanId} OR "planId" IS NULL
              )
              AND (
                "productId" = ${targetProductId}
              )
            ORDER BY
              (CASE
                WHEN "variantId" = ${effectiveVariantId} AND "planId" = ${targetPlanId} THEN 100
                WHEN "variantId" = ${effectiveVariantId} AND "planId" IS NULL THEN 80
                WHEN "variantId" = ${effectiveVariantId} THEN 70
                WHEN "variantId" IS NULL AND "planId" = ${targetPlanId} THEN 50
                WHEN "variantId" IS NULL AND "planId" IS NULL THEN 30
                ELSE 10
              END) DESC,
              "createdAt" ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          `

          if (invRows && invRows.length > 0) {
            reservedInventoryItemId = invRows[0].id
          } else {
            // Warehouse stock exhausted: do NOT block order.
            // Order is recorded for 1-working-day fulfillment by admin.
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

        // Encrypt sensitive customer credentials before storing in DB (Bug 1.1)
        const secureCheckoutData = { ...submittedData }
        if (
          typeof secureCheckoutData.customer_password === 'string' &&
          secureCheckoutData.customer_password.trim()
        ) {
          secureCheckoutData.customer_password = encryptCredential(
            secureCheckoutData.customer_password.trim()
          )
        }

        // Create Order record with coupon discount and variant
        const newOrder = await tx.order.create({
          data: {
            userId: session.userId,
            productId: product.id,
            planId: plan.id,
            variantId: effectiveVariantId,
            couponId: appliedCouponId,
            amount: payableAmount,
            discountAmount: appliedDiscountAmount,
            checkoutData: secureCheckoutData,
            status: 'PENDING_PAYMENT',
            fulfillmentStatus: 'PENDING',
            source: validSource,
          },
        })

        // Reserve inventory item atomically
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
    } catch (txError: unknown) {
      if (txError instanceof Error && txError.message === 'COUPON_EXHAUSTED') {
        return NextResponse.json(
          {
            success: false,
            message: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است.',
          },
          { status: 400 }
        )
      }
      if (txError instanceof Error && txError.message === 'COUPON_NOT_FOUND') {
        return NextResponse.json(
          {
            success: false,
            message: 'کد تخفیف معتبر نمی‌باشد.',
          },
          { status: 400 }
        )
      }
      if (txError instanceof Error && txError.message === 'READY_ACCOUNT_STOCK_EXHAUSTED') {
        return NextResponse.json(
          {
            success: false,
            message:
              'موجودی اکانت‌های آماده انبار موقتاً به پایان رسیده است. شما می‌توانید با وارد کردن آدرس جیمیل خود، سفارش را جهت فعال‌سازی روی اکانت شخصی ثبت فرمایید.',
          },
          { status: 400 }
        )
      }
      if (txError instanceof Error && txError.message === 'STOCK_EXHAUSTED') {
        return NextResponse.json(
          {
            success: false,
            message: 'موجودی این پلن موقتاً به پایان رسیده است. لطفاً بعداً مراجعه فرمایید.',
          },
          { status: 400 }
        )
      }
      throw txError
    }

    // 7. Request payment via PaymentService
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/payment/callback?orderId=${order.id}${source ? `&source=${source}` : ''}`
    const productTitle = product.title
    const fullTitle = variant
      ? `${productTitle} - ${variant.name} (${plan.name})`
      : `${productTitle} (${plan.name})`

    const paymentResult = await PaymentService.createPayment({
      orderId: order.id,
      amount: payableAmount,
      description: `خرید: ${fullTitle}`,
      callbackUrl,
      mobile: session.phone,
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      // Release reservation and mark order FAILED
      await prisma.$transaction([
        prisma.inventoryItem.updateMany({
          where: { orderId: order.id, status: 'RESERVED' },
          data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        }),
      ]).catch((cleanupErr) => console.error('Error rolling back reservation:', cleanupErr))

      return NextResponse.json(
        {
          success: false,
          message: paymentResult.error || 'خطا در اتصال به درگاه پرداخت.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentUrl: paymentResult.paymentUrl,
    })
  } catch (error: unknown) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, message: 'خطای سیستمی در ثبت سفارش.' },
      { status: 500 }
    )
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'عدم احراز هویت.' },
        { status: 401 }
      )
    }

    // Security: Only return orders belonging to current user
    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      include: {
        product: true,
        variant: true,
        plan: {
          include: { product: true, variant: true },
        },
        payment: true,
        inventoryItem: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Decrypt delivery credentials for the authenticated order owner
    const safeOrders = orders.map((ord) => {
      if (ord.delivery && ord.delivery.data) {
        const rawData = ord.delivery.data as Record<string, unknown>
        if (typeof rawData.password === 'string') {
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

    return NextResponse.json({ success: true, orders: safeOrders })
  } catch (error: unknown) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بارگذاری سفارش‌ها.' },
      { status: 500 }
    )
  }
}
