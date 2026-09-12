import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { OrderStatus } from '@prisma/client'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { decryptCredential } from '@/lib/security/crypto'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const statusFilter = searchParams.get('status') as OrderStatus | null

    const where: any = {}

    if (statusFilter && Object.values(OrderStatus).includes(statusFilter)) {
      where.status = statusFilter
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { payment: { authority: { contains: search, mode: 'insensitive' } } },
        { payment: { refId: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, phone: true, name: true, telegramUsername: true },
        },
        product: true,
        plan: {
          include: { product: true },
        },
        payment: true,
        activationLink: {
          select: { id: true, url: true, status: true, assignedAt: true, usedAt: true },
        },
        delivery: true,
      },
    })

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

    return NextResponse.json({
      success: true,
      orders: safeOrders,
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

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'شناسه سفارش الزامی است.' },
        { status: 400 }
      )
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

      return NextResponse.json({
        success: fulfillResult.success,
        order: fulfillResult.order,
        delivery: fulfillResult.delivery,
        message: fulfillResult.message,
      })
    }

    // Standard Status Update
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای درخواست نامعتبر هستند.' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: true,
        plan: true,
        delivery: true,
      },
    })

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
