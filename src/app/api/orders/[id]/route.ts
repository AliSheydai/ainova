import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { decryptCredential, isEncryptedCredential, decryptEmbeddedCredentials } from '@/lib/security/crypto'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'عدم احراز هویت. لطفاً ابتدا وارد شوید.' },
        { status: 401 }
      )
    }

    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش نامعتبر است.' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        variant: true,
        plan: {
          include: { product: true, variant: true },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            gatewayName: true,
            authority: true,
            refId: true,
            paidAt: true,
            createdAt: true,
          },
        },
        activationLink: {
          select: {
            id: true,
            url: true,
            status: true,
            assignedAt: true,
          },
        },
        delivery: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'سفارش مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    // Security check: only order owner or admin can view this order
    const isOwner = order.userId === session.userId
    const isAdmin = session.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'شما دسترسی به مشاهده این سفارش را ندارید.' },
        { status: 403 }
      )
    }

    // Decrypt sensitive credentials in delivery data and checkoutData if present
    let safeDelivery = order.delivery
    if (order.delivery && order.delivery.data) {
      const rawData = order.delivery.data as Record<string, unknown>
      const decryptedData = { ...rawData }
      if (typeof decryptedData.password === 'string') {
        decryptedData.password = decryptCredential(decryptedData.password)
      }
      if (typeof decryptedData.customer_password === 'string') {
        decryptedData.customer_password = decryptCredential(decryptedData.customer_password)
      }
      if (typeof decryptedData.accountInfo === 'string') {
        decryptedData.accountInfo = decryptEmbeddedCredentials(decryptedData.accountInfo)
      }
      safeDelivery = {
        ...order.delivery,
        data: decryptedData as any,
      }
    }

    let safeCheckoutData = order.checkoutData as Record<string, any> | null
    if (safeCheckoutData && typeof safeCheckoutData === 'object') {
      const decryptedCheckout: Record<string, any> = { ...safeCheckoutData }
      for (const [key, value] of Object.entries(decryptedCheckout)) {
        if (typeof value === 'string') {
          if (isEncryptedCredential(value) || key.toLowerCase().includes('pass')) {
            decryptedCheckout[key] = decryptCredential(value)
          } else {
            decryptedCheckout[key] = decryptEmbeddedCredentials(value)
          }
        }
      }
      safeCheckoutData = decryptedCheckout
    }

    const response = NextResponse.json({
      success: true,
      order: {
        ...order,
        delivery: safeDelivery,
        checkoutData: safeCheckoutData,
      },
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error: unknown) {
    console.error('Error fetching order by id:', error)
    return NextResponse.json(
      { success: false, message: 'خطای سرور در دریافت اطلاعات سفارش.' },
      { status: 500 }
    )
  }
}
