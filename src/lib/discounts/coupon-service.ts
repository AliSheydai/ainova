import { prisma } from '@/lib/prisma'
import { type Prisma } from '@prisma/client'

export interface ValidateCouponResult {
  valid: boolean
  coupon?: {
    id: string
    code: string
    description: string | null
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
    discountValue: number
    maxDiscountAmount: number | null
  }
  discountAmount?: number
  finalAmount?: number
  error?: string
}

export class CouponService {
  /**
   * Validates a coupon code against an order amount and product,
   * calculating the exact discount amount and final payable price.
   */
  static async validateAndCalculate(
    rawCode: string,
    orderAmount: number,
    productId?: string | null
  ): Promise<ValidateCouponResult> {
    if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      return { valid: false, error: 'کد تخفیف وارد نشده است.' }
    }

    const code = rawCode.trim().toUpperCase()

    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: { product: true },
    })

    if (!coupon) {
      return { valid: false, error: 'کد تخفیف وارد شده معتبر نمی‌باشد.' }
    }

    if (!coupon.active) {
      return { valid: false, error: 'این کد تخفیف در حال حاضر غیرفعال شده است.' }
    }

    // Check expiration date
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return { valid: false, error: 'مهلت استفاده از این کد تخفیف به پایان رسیده است.' }
    }

    // Check max usage count
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است.' }
    }

    // Check product limitation
    if (coupon.productId && productId && coupon.productId !== productId) {
      return {
        valid: false,
        error: `این کد تخفیف صرفاً برای محصول «${coupon.product?.title || 'مشخص شده'}» قابل استفاده است.`,
      }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
      const minFormatted = new Intl.NumberFormat('fa-IR').format(coupon.minOrderAmount)
      return {
        valid: false,
        error: `حداقل مبلغ سفارش برای اعمال این کد تخفیف ${minFormatted} تومان می‌باشد.`,
      }
    }

    // Calculate discount amount
    let rawDiscount = 0
    if (coupon.discountType === 'PERCENTAGE') {
      rawDiscount = Math.floor((orderAmount * coupon.discountValue) / 100)
      if (coupon.maxDiscountAmount !== null && rawDiscount > coupon.maxDiscountAmount) {
        rawDiscount = coupon.maxDiscountAmount
      }
    } else {
      rawDiscount = coupon.discountValue
    }

    // Discount cannot exceed order amount
    const discountAmount = Math.max(0, Math.min(rawDiscount, orderAmount))
    const finalAmount = Math.max(0, orderAmount - discountAmount)

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
      },
      discountAmount,
      finalAmount,
    }
  }

  /**
   * Safely increments the usage count of a coupon within an existing Prisma transaction or standalone.
   */
  static async incrementCouponUsage(
    couponId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || prisma
    try {
      await client.coupon.update({
        where: { id: couponId },
        data: {
          usedCount: { increment: 1 },
        },
      })
    } catch (err) {
      console.error(`Failed to increment usage for coupon ${couponId}:`, err)
    }
  }
}
