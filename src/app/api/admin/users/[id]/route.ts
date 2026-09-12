import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            plan: {
              include: { product: true },
            },
            payment: true,
            activationLink: true,
          },
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    const totalSpent = user.orders
      .filter((o) => o.status === 'PAID' || o.status === 'COMPLETED')
      .reduce((acc, o) => acc + o.amount, 0)

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        totalSpent,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching admin user details:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت جزئیات کاربر.' },
      { status: 500 }
    )
  }
}
