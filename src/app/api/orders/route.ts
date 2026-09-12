import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { PaymentService } from '@/lib/payment'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { CheckoutFieldDefinition } from '@/lib/fulfillment/types'
import { decryptCredential } from '@/lib/security/crypto'

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { productId, slug, planId, checkoutData, source } = body

    // 1. Resolve product and plan
    let product = null
    let plan = null

    if (planId) {
      plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: { product: true },
      })
      if (plan) {
        product = plan.product
      }
    } else if (productId) {
      product = await prisma.product.findUnique({
        where: { id: productId },
        include: { plans: { where: { active: true }, orderBy: { price: 'asc' } } },
      })
      if (product && product.plans.length > 0) {
        plan = product.plans[0]
      }
    } else if (slug) {
      product = await prisma.product.findUnique({
        where: { slug },
        include: { plans: { where: { active: true }, orderBy: { price: 'asc' } } },
      })
      if (product && product.plans.length > 0) {
        plan = product.plans[0]
      }
    }

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'محصول مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    // 2. Security Check: is product active?
    if (product.status !== 'ACTIVE' || !product.active) {
      return NextResponse.json(
        { success: false, message: 'این محصول در حال حاضر غیرفعال و غیرقابل خرید است.' },
        { status: 400 }
      )
    }

    // Check if plan is active
    if (plan && !plan.active) {
      return NextResponse.json(
        { success: false, message: 'پلن انتخاب‌شده در حال حاضر غیرفعال است.' },
        { status: 400 }
      )
    }

    // 3. Validate Dynamic Checkout Fields if configured on Plan
    const submittedData = (checkoutData && typeof checkoutData === 'object') ? checkoutData : {}
    if (plan && Array.isArray(plan.checkoutFields)) {
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

    // 4. Check inventory
    const availableStock = plan
      ? await FulfillmentService.getPlanStock(plan.id)
      : await FulfillmentService.getProductStock(product.id)

    if (availableStock <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'موجودی این پلن موقتاً به پایان رسیده است. لطفاً بعداً مراجعه فرمایید.',
        },
        { status: 400 }
      )
    }

    // 5. Determine final snapshot amount
    const orderAmount = plan?.price || product.price || 0

    if (orderAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'قیمت محصول یا پلن نامعتبر است.' },
        { status: 400 }
      )
    }

    // 6. Create Order with snapshot amount and snapshot checkoutData
    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        productId: product.id,
        planId: plan?.id || null,
        amount: orderAmount, // SNAPSHOT
        checkoutData: submittedData, // SNAPSHOT of customer data at purchase
        status: 'PENDING_PAYMENT',
        fulfillmentStatus: 'PENDING',
        source: source || 'web',
      },
    })

    // 7. Request payment via PaymentService
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/payment/callback?orderId=${order.id}${source ? `&source=${source}` : ''}`
    const productTitle = product.title || product.name
    const fullTitle = plan ? `${productTitle} (${plan.name})` : productTitle

    const paymentResult = await PaymentService.createPayment({
      orderId: order.id,
      amount: orderAmount,
      description: `خرید: ${fullTitle}`,
      callbackUrl,
      mobile: session.phone,
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      return NextResponse.json(
        { success: false, message: paymentResult.error || 'خطا در اتصال به درگاه پرداخت.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
    })
  } catch (error: unknown) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, message: 'خطای سرور در ثبت سفارش.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
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
        plan: {
          include: { product: true },
        },
        payment: true,
        activationLink: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Decrypt credentials for delivery if needed
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

    return NextResponse.json({ success: true, orders: safeOrders })
  } catch (error: unknown) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بارگذاری سفارش‌ها.' },
      { status: 500 }
    )
  }
}
