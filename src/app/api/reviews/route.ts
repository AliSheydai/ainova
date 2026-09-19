import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { ReviewStatus } from '@prisma/client'
import { InMemoryRateLimiter, getClientIp } from '@/lib/security/rate-limit'
import { sanitizeInputText } from '@/lib/security/sanitize'

// Rate limits: 3 reviews per hour per user, 5 per hour per IP
const userReviewRateLimiter = new InMemoryRateLimiter(60 * 60 * 1000, 3)
const ipReviewRateLimiter = new InMemoryRateLimiter(60 * 60 * 1000, 5)

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
    // 1. Mandatory authentication to prevent anonymous review spam
    const session = await getCurrentUser()
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'برای ثبت نظر، ابتدا باید وارد حساب کاربری خود شوید.' },
        { status: 401 }
      )
    }

    // 2. Rate limiting check (per user and per IP)
    const ip = getClientIp(req.headers)
    const ipCheck = ipReviewRateLimiter.check(`ip:${ip}`)
    const userCheck = userReviewRateLimiter.check(`user:${session.userId}`)

    if (!ipCheck.success || !userCheck.success) {
      const resetAt = !userCheck.success ? userCheck.resetAt : ipCheck.resetAt
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))

      const rateLimitResponse = NextResponse.json(
        {
          success: false,
          error: 'تعداد نظرات ارسالی شما بیش از حد مجاز است. لطفاً ساعاتی دیگر تلاش فرمایید.',
        },
        { status: 429 }
      )
      rateLimitResponse.headers.set('Retry-After', retryAfterSeconds.toString())
      return rateLimitResponse
    }

    const body = await req.json()
    const { productId, userName, rating, comment } = body

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است.' },
        { status: 400 }
      )
    }

    // 3. Sanitize inputs (strip HTML and script tags)
    const trimmedName = sanitizeInputText(typeof userName === 'string' ? userName : '')
    const trimmedComment = sanitizeInputText(typeof comment === 'string' ? comment : '')
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

    // 4. Check if product exists
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

    // 5. Check if user already has a pending review for this product
    const existingPending = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.userId,
        status: ReviewStatus.PENDING,
      },
    })

    if (existingPending) {
      return NextResponse.json(
        { success: false, error: 'شما قبلاً برای این محصول نظری ثبت کرده‌اید که در انتظار بررسی مدیریت است.' },
        { status: 400 }
      )
    }

    // 6. Create review with PENDING status attached to authenticated user
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.userId,
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
