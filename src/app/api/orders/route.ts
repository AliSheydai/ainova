import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { PaymentService } from '@/lib/payment'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'

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
    const { productId, slug, planId, source } = body

    // 1. Resolve product
    let product = null
    let plan = null

    if (productId) {
      product = await prisma.product.findUnique({
        where: { id: productId },
      })
    } else if (slug) {
      product = await prisma.product.findUnique({
        where: { slug },
      })
    } else if (planId) {
      plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: { product: true },
      })
      if (plan) {
        product = plan.product
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

    // 3. Check inventory
    const availableStock = await FulfillmentService.getProductStock(product.id)
    if (availableStock <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'موجودی این محصول موقتاً به پایان رسیده است. لطفاً بعداً مراجعه نمایید.',
        },
        { status: 400 }
      )
    }

    // 4. Determine final snapshot amount (Server-side controlled)
    const orderAmount = product.price > 0 ? product.price : (plan?.price || 0)

    if (orderAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'قیمت محصول نامعتبر است.' },
        { status: 400 }
      )
    }

    // 5. Create Order with snapshot amount and productId reference
    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        productId: product.id,
        planId: plan?.id || null,
        amount: orderAmount, // SNAPSHOT: Will never change even if product.price is modified later
        status: 'PENDING_PAYMENT',
        source: source || 'web',
      },
    })

    // 6. Request payment via PaymentService
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/payment/callback?orderId=${order.id}`
    const productTitle = product.title || product.name

    const paymentResult = await PaymentService.createPayment({
      orderId: order.id,
      amount: orderAmount,
      description: `خرید: ${productTitle}`,
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
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, orders })
  } catch (error: unknown) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بارگذاری سفارش‌ها.' },
      { status: 500 }
    )
  }
}
