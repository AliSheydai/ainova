import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { ReviewStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const featured = searchParams.get('featured') === 'true'
    const productId = searchParams.get('productId')

    if (featured) {
      const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
      const featuredReviews = await prisma.review.findMany({
        where: {
          status: ReviewStatus.APPROVED,
          isFeatured: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          userName: true,
          rating: true,
          comment: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              image: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        reviews: featuredReviews,
      })
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است.' },
        { status: 400 }
      )
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        userName: true,
        rating: true,
        comment: true,
        isFeatured: true,
        createdAt: true,
        userId: true,
      },
    })

    // Calculate rating statistics
    const totalReviews = reviews.length
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let ratingSum = 0

    for (const r of reviews) {
      const star = Math.max(1, Math.min(5, r.rating))
      ratingDistribution[star] = (ratingDistribution[star] || 0) + 1
      ratingSum += star
    }

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 5

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        averageRating,
        totalReviews,
        ratingDistribution,
      },
    })
  } catch (error) {
    console.error('Error fetching approved reviews:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری نظرات.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, userName, rating, comment } = body

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است.' },
        { status: 400 }
      )
    }

    const trimmedName = typeof userName === 'string' ? userName.trim() : ''
    const trimmedComment = typeof comment === 'string' ? comment.trim() : ''
    const numericRating = Number(rating)

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json(
        { success: false, error: 'لطفاً نام خود را وارد کنید (بین ۲ تا ۵۰ کاراکتر).' },
        { status: 400 }
      )
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { success: false, error: 'امتیاز باید بین ۱ تا ۵ ستاره باشد.' },
        { status: 400 }
      )
    }

    if (!trimmedComment || trimmedComment.length < 5 || trimmedComment.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'متن نظر باید حداقل ۵ و حداکثر ۱۰۰۰ کاراکتر باشد.' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    // Optional user session
    const session = await getCurrentUser()

    // Create review with PENDING status
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session?.userId || null,
        userName: trimmedName,
        rating: Math.round(numericRating),
        comment: trimmedComment,
        status: ReviewStatus.PENDING,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'نظر شما با موفقیت ثبت شد و پس از بررسی و تایید توسط مدیریت منتشر خواهد شد.',
      reviewId: review.id,
    })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت نظر. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
