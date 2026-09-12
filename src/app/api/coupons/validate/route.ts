import { type NextRequest, NextResponse } from 'next/server'
import { CouponService } from '@/lib/discounts/coupon-service'

export async function POST(req: NextRequest) {
  try {
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
