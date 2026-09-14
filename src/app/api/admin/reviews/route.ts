import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { ReviewStatus, type Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')
    const search = searchParams.get('search')?.trim() || ''
    const productId = searchParams.get('productId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const where: Prisma.ReviewWhereInput = {}

    if (statusFilter && statusFilter !== 'ALL' && Object.values(ReviewStatus).includes(statusFilter as ReviewStatus)) {
      where.status = statusFilter as ReviewStatus
    }

    if (productId) {
      where.productId = productId
    }

    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { product: { title: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [reviews, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              image: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              telegramUsername: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.review.count({ where: { status: ReviewStatus.APPROVED } }),
      prisma.review.count({ where: { status: ReviewStatus.REJECTED } }),
    ])

    const totalAll = pendingCount + approvedCount + rejectedCount

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalAll,
      },
    })
  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری نظرات.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { reviewId, status, adminNote } = body

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'شناسه نظر الزامی است.' },
        { status: 400 }
      )
    }

    if (!status || !Object.values(ReviewStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'وضعیت انتخاب‌شده معتبر نیست.' },
        { status: 400 }
      )
    }

    const updateData: Prisma.ReviewUpdateInput = {
      status: status as ReviewStatus,
    }

    if (adminNote !== undefined) {
      updateData.adminNote = typeof adminNote === 'string' ? adminNote.trim() : null
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        product: { select: { id: true, title: true, slug: true } },
      },
    })

    const statusMessage =
      status === ReviewStatus.APPROVED
        ? 'نظر تایید شد و در سایت نمایش داده می‌شود.'
        : status === ReviewStatus.REJECTED
          ? 'نظر رد شد و در سایت نمایش داده نخواهد شد.'
          : 'وضعیت نظر به حالت در انتظار تغییر یافت.'

    return NextResponse.json({
      success: true,
      review: updated,
      message: statusMessage,
    })
  } catch (error) {
    console.error('Error updating review status:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی نظر.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه نظر الزامی است.' },
        { status: 400 }
      )
    }

    await prisma.review.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'نظر با موفقیت حذف شد.',
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف نظر.' },
      { status: 500 }
    )
  }
}
