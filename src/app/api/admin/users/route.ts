import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

    // Filters
    const search = searchParams.get('search')?.trim() || ''
    const roleFilter = searchParams.get('role')?.trim() || 'ALL'
    const orderFilter = searchParams.get('orderFilter')?.trim() || 'ALL' // 'HAS_ORDERS' | 'NO_ORDERS'
    const sortBy = searchParams.get('sortBy')?.trim() || 'NEWEST'

    const where: any = {}

    // Role filter
    if (roleFilter === 'ADMIN' || roleFilter === 'USER') {
      where.role = roleFilter as Role
    }

    // Order activity filter
    if (orderFilter === 'HAS_ORDERS') {
      where.orders = { some: {} }
    } else if (orderFilter === 'NO_ORDERS') {
      where.orders = { none: {} }
    }

    // Search filter
    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { telegramUsername: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'OLDEST') {
      orderBy = { createdAt: 'asc' }
    } else if (sortBy === 'MOST_ORDERS') {
      orderBy = { orders: { _count: 'desc' } }
    }

    // Parallel fetch: total filtered, paginated users, KPI counts
    const [totalFiltered, users, counts] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { orders: true },
          },
          orders: {
            where: { status: { in: ['PAID', 'COMPLETED'] } },
            select: { amount: true },
          },
        },
      }),
      Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { orders: { some: {} } } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { orders: { none: {} } } }),
      ]),
    ])

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

    const totalPages = Math.ceil(totalFiltered / limit) || 1

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      counts: {
        all: counts[0],
        buyers: counts[1],
        admins: counts[2],
        noOrders: counts[3],
      },
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
