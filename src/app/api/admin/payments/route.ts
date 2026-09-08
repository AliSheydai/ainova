import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { PaymentStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const statusFilter = searchParams.get('status') as PaymentStatus | null

    const where: any = {}

    if (statusFilter && Object.values(PaymentStatus).includes(statusFilter)) {
      where.status = statusFilter
    }

    if (search) {
      where.OR = [
        { authority: { contains: search, mode: 'insensitive' } },
        { refId: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        { order: { user: { phone: { contains: search, mode: 'insensitive' } } } },
        { order: { user: { name: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            user: {
              select: { id: true, phone: true, name: true },
            },
            plan: {
              include: { product: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      payments,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/payments:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری لیست پرداخت‌ها.' },
      { status: 500 }
    )
  }
}
