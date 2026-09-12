import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { memoryCache } from '@/lib/cache/memory-cache'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (!forceRefresh) {
      const cached = memoryCache.get<object>('admin:overview')
      if (cached) {
        return NextResponse.json(cached)
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      productGroup,
      ordersGroup,
      inventoryGroup,
      totalUsers,
      newUsers,
      recentOrders,
      recentUsers,
      topProducts,
    ] = await Promise.all([
      // 1. Products grouped by status (replaces 2 separate queries)
      prisma.product.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      // 2. Orders grouped by status with amount sum (replaces 4 separate queries)
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { amount: true },
      }),
      // 3. Inventory items grouped by status (replaces 4 separate queries)
      prisma.inventoryItem.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      // 4. Total users
      prisma.user.count(),
      // 5. New users last 7 days
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      // 6. Recent orders with user and product
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
      // 7. Recent users
      prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
      // 8. Top products
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        take: 5,
        orderBy: [{ purchaseCount: 'desc' }, { createdAt: 'desc' }],
      }),
    ])

    // In-memory product metric calculations
    let totalProducts = 0
    let activeProducts = 0
    for (const p of productGroup) {
      if (p.status !== 'ARCHIVED') totalProducts += p._count._all
      if (p.status === 'ACTIVE') activeProducts += p._count._all
    }

    // In-memory order and revenue calculations
    let totalOrders = 0
    let successfulOrders = 0
    let pendingOrders = 0
    let totalRevenue = 0
    for (const o of ordersGroup) {
      totalOrders += o._count._all
      if (o.status === 'PAID' || o.status === 'COMPLETED') {
        successfulOrders += o._count._all
        totalRevenue += o._sum.amount || 0
      } else if (o.status === 'PENDING_PAYMENT') {
        pendingOrders += o._count._all
      }
    }

    // In-memory inventory metric calculations
    let availableLinks = 0
    let reservedLinks = 0
    let usedLinks = 0
    let invalidLinks = 0
    for (const item of inventoryGroup) {
      if (item.status === 'AVAILABLE') availableLinks = item._count._all
      else if (item.status === 'RESERVED') reservedLinks = item._count._all
      else if (item.status === 'USED') usedLinks = item._count._all
      else if (item.status === 'INVALID') invalidLinks = item._count._all
    }

    const payload = {
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
    }

    // Cache overview response for 30 seconds
    memoryCache.set('admin:overview', payload, 30)

    return NextResponse.json(payload)
  } catch (error: unknown) {
    console.error('Error fetching admin overview:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری اطلاعات داشبورد.' },
      { status: 500 }
    )
  }
}
