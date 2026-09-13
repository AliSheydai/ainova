import { describe, expect, it, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { CouponService } from './coupon-service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

describe('CouponService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateAndCalculate', () => {
    it('returns error when coupon code is empty or whitespace', async () => {
      const result = await CouponService.validateAndCalculate('', 100000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('کد تخفیف وارد نشده است')
    })

    it('returns error when coupon is not found', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)

      const result = await CouponService.validateAndCalculate('INVALID', 100000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('معتبر نمی‌باشد')
    })

    it('returns error when coupon is inactive', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: 'c1',
        code: 'INACTIVE',
        active: false,
        expiresAt: null,
        maxUses: 10,
        usedCount: 0,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscountAmount: null,
        minOrderAmount: null,
        productId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await CouponService.validateAndCalculate('INACTIVE', 100000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('غیرفعال')
    })

    it('returns error when coupon has expired', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: 'c2',
        code: 'EXPIRED',
        active: true,
        expiresAt: new Date(Date.now() - 10000),
        maxUses: 10,
        usedCount: 0,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscountAmount: null,
        minOrderAmount: null,
        productId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await CouponService.validateAndCalculate('EXPIRED', 100000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('مهلت استفاده')
    })

    it('returns error when max usage capacity is exhausted', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: 'c3',
        code: 'EXHAUSTED',
        active: true,
        expiresAt: null,
        maxUses: 1,
        usedCount: 1,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscountAmount: null,
        minOrderAmount: null,
        productId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await CouponService.validateAndCalculate('EXHAUSTED', 100000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('ظرفیت استفاده')
    })

    it('returns error when order amount is less than minOrderAmount', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: 'c4',
        code: 'MIN_LIMIT',
        active: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscountAmount: null,
        minOrderAmount: 200000,
        productId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await CouponService.validateAndCalculate('MIN_LIMIT', 100000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('حداقل مبلغ سفارش')
    })

    it('correctly calculates percentage discount with max cap', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: 'c5',
        code: 'PERC20',
        active: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        discountType: 'PERCENTAGE',
        discountValue: 50,
        maxDiscountAmount: 30000,
        minOrderAmount: null,
        productId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await CouponService.validateAndCalculate('PERC20', 100000)
      expect(result.valid).toBe(true)
      expect(result.discountAmount).toBe(30000) // capped from 50000 to 30000
      expect(result.finalAmount).toBe(70000)
    })

    it('correctly calculates fixed amount discount', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: 'c6',
        code: 'FIXED50K',
        active: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        discountType: 'FIXED_AMOUNT',
        discountValue: 50000,
        maxDiscountAmount: null,
        minOrderAmount: null,
        productId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await CouponService.validateAndCalculate('FIXED50K', 150000)
      expect(result.valid).toBe(true)
      expect(result.discountAmount).toBe(50000)
      expect(result.finalAmount).toBe(100000)
    })
  })

  describe('incrementCouponUsage', () => {
    it('increments coupon usedCount via prisma client', async () => {
      vi.mocked(prisma.coupon.update).mockResolvedValue({} as any)

      await CouponService.incrementCouponUsage('c1')

      expect(prisma.coupon.update).toHaveBeenCalledTimes(1)
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { usedCount: { increment: 1 } },
      })
    })

    it('supports custom transaction client for atomic execution', async () => {
      const mockTx = {
        coupon: {
          update: vi.fn().mockResolvedValue({}),
        },
      }

      await CouponService.incrementCouponUsage('c2', mockTx as any)

      expect(mockTx.coupon.update).toHaveBeenCalledWith({
        where: { id: 'c2' },
        data: { usedCount: { increment: 1 } },
      })
      expect(prisma.coupon.update).not.toHaveBeenCalled()
    })
  })

  describe('decrementCouponUsage', () => {
    it('decrements coupon usedCount with usedCount > 0 guard', async () => {
      vi.mocked(prisma.coupon.updateMany).mockResolvedValue({ count: 1 })

      await CouponService.decrementCouponUsage('c1')

      expect(prisma.coupon.updateMany).toHaveBeenCalledTimes(1)
      expect(prisma.coupon.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'c1',
          usedCount: { gt: 0 },
        },
        data: {
          usedCount: { decrement: 1 },
        },
      })
    })

    it('supports custom transaction client on refund or cancellation', async () => {
      const mockTx = {
        coupon: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      }

      await CouponService.decrementCouponUsage('c2', mockTx as any)

      expect(mockTx.coupon.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'c2',
          usedCount: { gt: 0 },
        },
        data: {
          usedCount: { decrement: 1 },
        },
      })
      expect(prisma.coupon.updateMany).not.toHaveBeenCalled()
    })
  })
})
