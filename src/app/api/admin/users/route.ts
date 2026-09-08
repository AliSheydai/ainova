import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const roleFilter = searchParams.get('role') as Role | null

    const where: any = {}

    if (roleFilter && (roleFilter === 'ADMIN' || roleFilter === 'USER')) {
      where.role = roleFilter
    }

    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { telegramUsername: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true },
        },
        orders: {
          where: { status: { in: ['PAID', 'COMPLETED'] } },
          select: { amount: true },
        },
      },
    })

    const formattedUsers = users.map((u) => {
      const totalSpent = u.orders.reduce((acc, o) => acc + o.amount, 0)
      return {
        id: u.id,
        phone: u.phone,
        name: u.name,
        role: u.role,
        telegramId: u.telegramId,
        telegramUsername: u.telegramUsername,
        createdAt: u.createdAt,
        totalOrders: u._count.orders,
        totalSpent,
      }
    })

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست کاربران.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse, user: adminUser } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { userId, role } = body

    if (!userId || !role || !['ADMIN', 'USER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای درخواست نامعتبر هستند.' },
        { status: 400 }
      )
    }

    // Protect against admin removing own admin role
    if (userId === adminUser.id && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'امکان حذف نقش مدیر برای حساب جاری وجود ندارد.' },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
      select: { id: true, phone: true, name: true, role: true },
    })

    return NextResponse.json({
      success: true,
      user: updated,
      message: 'نقش کاربر با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error in PATCH /api/admin/users:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی نقش کاربر.' },
      { status: 500 }
    )
  }
}
