import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { AdminNotificationService } from '@/lib/notifications/admin-notification'
import { encryptCredential } from '@/lib/security/crypto'
import { type Prisma } from '@prisma/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      )
    }

    const { id: orderId } = await params
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش الزامی است.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { password, email, customerNote } = body

    if (!password || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json(
        { success: false, message: 'وارد کردن رمز عبور اکانت الزامی است.' },
        { status: 400 }
      )
    }

    const targetOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        plan: { include: { product: true } },
        user: true,
      },
    })

    if (!targetOrder || targetOrder.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'سفارش مورد نظر یافت نشد یا شما دسترسی به آن را ندارید.' },
        { status: 404 }
      )
    }

    if (targetOrder.status !== 'PAID') {
      return NextResponse.json(
        { success: false, message: 'این سفارش در وضعیتی نیست که نیازمند به‌روزرسانی رمز باشد.' },
        { status: 400 }
      )
    }

    const existingCheckout = (targetOrder.checkoutData as Record<string, unknown>) || {}
    const updatedCheckout: Record<string, unknown> = {
      ...existingCheckout,
      customer_password: encryptCredential(password.trim()),
      ...(email && typeof email === 'string' && email.trim() ? { customer_email: email.trim(), customer_gmail: email.trim() } : {}),
      ...(customerNote && typeof customerNote === 'string' && customerNote.trim() ? { customer_correction_note: customerNote.trim() } : {}),
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        checkoutData: updatedCheckout as Prisma.InputJsonValue,
        customerActionRequired: false,
        actionRequiredReason: null,
        credentialsUpdatedAt: new Date(),
        adminNote: null, // Clear the previous error note now that customer has responded
      },
    })

    // Send Telegram alert to Admin
    const serviceName =
      targetOrder.product?.title || targetOrder.plan?.product?.title || 'اشتراک'
    const customerInfo = targetOrder.user?.name || targetOrder.user?.phone || 'مشتری گرامی'

    AdminNotificationService.notifyCustomerUpdatedCredentials(
      targetOrder.id,
      customerInfo,
      serviceName
    ).catch((err) => console.error('Failed to notify admin of credentials update:', err))

    return NextResponse.json({
      success: true,
      message: 'اطلاعات با موفقیت ثبت گردید و جهت بررسی و فعال‌سازی مجدد به مدیریت ارجاع داده شد.',
      order: updatedOrder,
    })
  } catch (error: unknown) {
    console.error('Error updating order credentials:', error)
    return NextResponse.json(
      { success: false, message: 'خطای سیستمی در به‌روزرسانی اطلاعات سفارش.' },
      { status: 500 }
    )
  }
}
