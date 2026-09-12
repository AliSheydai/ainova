import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'

export async function GET() {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalProducts,
      activeProducts,
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
      topProducts,
    ] = await Promise.all([
      // Total products
      prisma.product.count({ where: { status: { not: 'ARCHIVED' } } }),
      // Active products
      prisma.product.count({ where: { status: 'ACTIVE' } }),
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
      // Inventory items counts
      prisma.inventoryItem.count({ where: { status: 'AVAILABLE' } }),
      prisma.inventoryItem.count({ where: { status: 'RESERVED' } }),
      prisma.inventoryItem.count({ where: { status: 'USED' } }),
      prisma.inventoryItem.count({ where: { status: 'INVALID' } }),
      // Recent orders with product and user
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, phone: true, name: true },
          },
          product: true,
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
      // Top products
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        take: 5,
        orderBy: [{ purchaseCount: 'desc' }, { createdAt: 'desc' }],
      }),
    ])

    const totalRevenue = revenueResult._sum.amount || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
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
      topProducts,
    })
  } catch (error: unknown) {
    console.error('Error fetching admin overview:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری اطلاعات داشبورد.' },
      { status: 500 }
    )
  }
}
