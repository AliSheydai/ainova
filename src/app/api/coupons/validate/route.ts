import { type NextRequest, NextResponse } from 'next/server'
import { CouponService } from '@/lib/discounts/coupon-service'
import { getCurrentUser } from '@/lib/auth/jwt'
import { InMemoryRateLimiter, getClientIp } from '@/lib/security/rate-limit'

const couponRateLimiter = new InMemoryRateLimiter(60 * 1000, 10) // 10 attempts per minute per IP

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      )
    }

    const ip = getClientIp(req.headers)
    const rateCheck = couponRateLimiter.check(ip)
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'تعداد تلاش‌ها بیش از حد مجاز است. لطفاً یک دقیقه دیگر تلاش فرمایید.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { code, amount, productId } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'لطفاً کد تخفیف را وارد نمایید.' },
        { status: 400 }
      )
    }

    const orderAmount = parseInt(String(amount), 10)
    if (isNaN(orderAmount) || orderAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'مبلغ سفارش نامعتبر است.' },
        { status: 400 }
      )
    }

    const result = await CouponService.validateAndCalculate(
      code,
      orderAmount,
      productId || null
    )

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error || 'کد تخفیف معتبر نیست.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      coupon: result.coupon,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      message: 'کد تخفیف با موفقیت اعمال گردید.',
    })
  } catch (error: unknown) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سیستمی در اعتبارسنجی کد تخفیف.' },
      { status: 500 }
    )
  }
}
