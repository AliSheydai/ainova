import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { PaymentStatus, type Prisma } from '@prisma/client'

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
    const statusFilter = searchParams.get('status')?.trim() || 'ALL'
    const gatewayFilter = searchParams.get('gateway')?.trim() || 'ALL'
    const dateRange = searchParams.get('dateRange')?.trim() || 'ALL'
    const sortBy = searchParams.get('sortBy')?.trim() || 'NEWEST'

    const where: Prisma.PaymentWhereInput = {}

    // Status Filter
    if (statusFilter && statusFilter !== 'ALL') {
      if (Object.values(PaymentStatus).includes(statusFilter as PaymentStatus)) {
        where.status = statusFilter as PaymentStatus
      }
    }

    // Gateway Filter
    if (gatewayFilter && gatewayFilter !== 'ALL') {
      where.gatewayName = gatewayFilter
    }

    // Date Range Filter
    if (dateRange && dateRange !== 'ALL') {
      const now = new Date()
      const existingCreatedAt = typeof where.createdAt === 'object' && where.createdAt !== null ? where.createdAt : {}
      if (dateRange === 'TODAY') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        where.createdAt = { ...existingCreatedAt, gte: startOfToday }
      } else if (dateRange === 'YESTERDAY') {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        where.createdAt = {
          ...existingCreatedAt,
          gte: startOfYesterday,
          lt: endOfYesterday,
        }
      } else if (dateRange === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        where.createdAt = { ...existingCreatedAt, gte: sevenDaysAgo }
      } else if (dateRange === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        where.createdAt = { ...existingCreatedAt, gte: thirtyDaysAgo }
      } else if (dateRange === 'THIS_MONTH') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        where.createdAt = { ...existingCreatedAt, gte: startOfMonth }
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { authority: { contains: search, mode: 'insensitive' } },
        { refId: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        { order: { user: { phone: { contains: search, mode: 'insensitive' } } } },
        { order: { user: { name: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    // Sorting
    let orderBy: Prisma.PaymentOrderByWithRelationInput = { createdAt: 'desc' }
    if (sortBy === 'OLDEST') {
      orderBy = { createdAt: 'asc' }
    } else if (sortBy === 'HIGHEST_AMOUNT') {
      orderBy = { amount: 'desc' }
    } else if (sortBy === 'LOWEST_AMOUNT') {
      orderBy = { amount: 'asc' }
    }

    const [totalFiltered, payments, counts, revenueAgg, distinctGateways] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            include: {
              user: {
                select: { id: true, phone: true, name: true, telegramUsername: true },
              },
              product: true,
              plan: {
                include: { product: true },
              },
            },
          },
        },
      }),
      Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'SUCCESS' } }),
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
      ]),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' },
      }),
      prisma.payment.findMany({
        select: { gatewayName: true },
        distinct: ['gatewayName'],
      }),
    ])

    const totalPages = Math.ceil(totalFiltered / limit) || 1

    return NextResponse.json({
      success: true,
      payments,
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
        success: counts[1],
        pending: counts[2],
        failed: counts[3],
        totalRevenue: revenueAgg._sum.amount || 0,
      },
      gateways: distinctGateways.map((g) => g.gatewayName),
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/payments:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری لیست پرداخت‌ها.' },
      { status: 500 }
    )
  }
}
