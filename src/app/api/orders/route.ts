import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { requestZarinpalPayment } from '@/lib/payment/zarinpal'

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
    const { planId } = body

    if (!planId) {
      return NextResponse.json(
        { success: false, message: 'شناسه پلن الزامی است.' },
        { status: 400 }
      )
    }

    // Find plan and product
    const plan = await prisma.plan.findUnique({
      where: { id: planId, active: true },
      include: { product: true },
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'پلن انتخابی نامعتبر یا غیرفعال است.' },
        { status: 404 }
      )
    }

    // Check inventory of available activation links
    const availableLinksCount = await prisma.activationLink.count({
      where: {
        planId: plan.id,
        status: 'AVAILABLE',
      },
    })

    if (availableLinksCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'موجودی لینک‌های فعال‌سازی این پلن موقتاً به پایان رسیده است. لطفاً بعداً مراجعه نمایید.',
        },
        { status: 400 }
      )
    }

    // Create Order in PENDING_PAYMENT status
    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        planId: plan.id,
        amount: plan.price,
        status: 'PENDING_PAYMENT',
      },
    })

    // Request payment from Zarinpal
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = process.env.NEXT_PUBLIC_ZARINPAL_CALLBACK_URL || `${appUrl}/api/payment/callback`

    const paymentResult = await requestZarinpalPayment({
      amount: plan.price,
      description: `خرید اشتراک ${plan.product.name} (${plan.name})`,
      callbackUrl,
      mobile: session.phone,
    })

    if (!paymentResult.success || !paymentResult.authority) {
      // Mark order as failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      })

      return NextResponse.json(
        { success: false, message: paymentResult.error || 'خطا در اتصال به درگاه پرداخت.' },
        { status: 500 }
      )
    }

    // Create Payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: plan.price,
        authority: paymentResult.authority,
        status: 'PENDING',
        gatewayName: 'zarinpal',
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentUrl: paymentResult.paymentUrl,
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

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      include: {
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
