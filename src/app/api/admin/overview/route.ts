import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'

export async function GET() {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsers,
      totalOrders,
      successfulOrders,
      pendingOrders,
      revenueResult,
      availableLinks,
      reservedLinks,
      usedLinks,
      invalidLinks,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      // New users last 7 days
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      // Total orders
      prisma.order.count(),
      // Successful orders (PAID or COMPLETED)
      prisma.order.count({ where: { status: { in: ['PAID', 'COMPLETED'] } } }),
      // Pending orders
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      // Total revenue from completed/paid orders
      prisma.order.aggregate({
        where: { status: { in: ['PAID', 'COMPLETED'] } },
        _sum: { amount: true },
      }),
      // Link inventory counts
      prisma.activationLink.count({ where: { status: 'AVAILABLE' } }),
      prisma.activationLink.count({ where: { status: 'RESERVED' } }),
      prisma.activationLink.count({ where: { status: 'USED' } }),
      prisma.activationLink.count({ where: { status: 'INVALID' } }),
      // Recent orders
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, phone: true, name: true },
          },
          plan: {
            include: { product: true },
          },
          payment: {
            select: { status: true, refId: true },
          },
        },
      }),
      // Recent users
      prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
    ])

    const totalRevenue = revenueResult._sum.amount || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        newUsers,
        totalOrders,
        successfulOrders,
        pendingOrders,
        totalRevenue,
        availableLinks,
        reservedLinks,
        assignedLinks: usedLinks + reservedLinks,
        usedLinks,
        invalidLinks,
      },
      recentOrders,
      recentUsers,
    })
  } catch (error: unknown) {
    console.error('Error fetching admin overview:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری اطلاعات داشبورد.' },
      { status: 500 }
    )
  }
}
