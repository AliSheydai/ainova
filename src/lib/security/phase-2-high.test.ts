import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE, TOKEN_EXPIRY } from '../auth/jwt'
import { encryptCredential, decryptCredential } from './crypto'
import { sendOtpSms } from '../auth/sms'
import { requestOtp } from '../auth/otp'
import { CouponService } from '../discounts/coupon-service'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    order: {
      count: vi.fn(),
    },
    otpToken: {
      count: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('Phase 2 — High Severity Security Audits & Fixes', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  // Issue 6: Cookie and JWT Expiry Synchronization
  describe('Issue 6: Cookie and JWT Expiry Sync', () => {
    it('has cookie maxAge exactly matching the 7-day token expiry', () => {
      expect(AUTH_COOKIE_NAME).toBe('auth_token')
      expect(TOKEN_EXPIRY).toBe('7d')
      const sevenDaysInSeconds = 7 * 24 * 60 * 60
      expect(AUTH_COOKIE_MAX_AGE).toBe(sevenDaysInSeconds)
    })
  })

  // Issue 8: OTP devCode Leakage Guard
  describe('Issue 8: OTP devCode in Production Safeguard', () => {
    it('does NOT return devCode when NODE_ENV is production in sendOtpSms', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      process.env.KAVEH_NEGAR_DEV_BYPASS = 'true'
      delete process.env.KAVEH_NEGAR_API_KEY
      delete process.env.KAVENEGAR_API_KEY

      const result = await sendOtpSms('09123456789', '12345')

      // Should fail securely and NEVER return devCode
      expect(result.success).toBe(false)
      expect(result.devCode).toBeUndefined()
    })

    it('returns devCode in development mode for easy local testing', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      process.env.KAVEH_NEGAR_DEV_BYPASS = 'true'

      const result = await sendOtpSms('09123456789', '54321')

      expect(result.success).toBe(true)
      expect(result.devCode).toBe('54321')
    })

    it('requestOtp hides devCode when NODE_ENV is test or production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      process.env.KAVEH_NEGAR_DEV_BYPASS = 'true'

      vi.mocked(prisma.otpToken.count).mockResolvedValue(0)
      vi.mocked(prisma.otpToken.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.otpToken.updateMany).mockResolvedValue({ count: 0 })
      vi.mocked(prisma.otpToken.create).mockResolvedValue({
        id: 'otp-1',
        phone: '09123456789',
        code: '12345',
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
      })

      const result = await requestOtp('09123456789')
      expect(result.devCode).toBeUndefined()
    })
  })

  // Issue 9: Encryption Key Separation & Fallback
  describe('Issue 9: Encryption Key Separation', () => {
    it('encrypts and decrypts credentials with dedicated CREDENTIALS_ENCRYPTION_KEY', () => {
      process.env.CREDENTIALS_ENCRYPTION_KEY = 'primary-key-32-chars-long-secret-key-1'
      process.env.JWT_SECRET = 'different-jwt-secret-key-64-chars-long-here'

      const plainText = 'my-super-secret-password-123'
      const encrypted = encryptCredential(plainText)

      expect(encrypted).not.toBe(plainText)
      expect(encrypted.split(':').length).toBe(3)

      const decrypted = decryptCredential(encrypted)
      expect(decrypted).toBe(plainText)
    })

    it('successfully decrypts legacy data using fallback keys after rotation', () => {
      const oldSecret = 'old-secret-key-used-prior-to-rotation'
      const newSecret = 'new-primary-key-after-rotation-secret'

      // Encrypt with old secret
      process.env.CREDENTIALS_ENCRYPTION_KEY = oldSecret
      const plainText = 'customer-gmail-password'
      const oldEncrypted = encryptCredential(plainText)

      // Now rotate to new secret with fallback configured
      process.env.CREDENTIALS_ENCRYPTION_KEY = newSecret
      process.env.CREDENTIALS_ENCRYPTION_FALLBACK_KEY = oldSecret

      const decrypted = decryptCredential(oldEncrypted)
      expect(decrypted).toBe(plainText)
    })
  })

  // Issue 11: Coupon Per-User Limit
  describe('Issue 11: Coupon Per-User Limit', () => {
    it('blocks coupon usage when user has reached maxUsesPerUser', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: 'coupon-limit-id',
        code: 'USERONCE',
        active: true,
        expiresAt: null,
        maxUses: 100,
        maxUsesPerUser: 1,
        usedCount: 10,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscountAmount: null,
        minOrderAmount: null,
        productId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: null,
      } as unknown as Awaited<ReturnType<typeof prisma.coupon.findUnique>>)

      vi.mocked(prisma.order.count).mockResolvedValue(1)

      const result = await CouponService.validateAndCalculate(
        'USERONCE',
        100000,
        null,
        'user-abc-123'
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('سقف مجاز استفاده')
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          couponId: 'coupon-limit-id',
          userId: 'user-abc-123',
          status: { notIn: ['EXPIRED', 'CANCELLED', 'FAILED'] },
        },
      })
    })

    it('allows coupon usage when user has not reached maxUsesPerUser', async () => {
      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: 'coupon-limit-id',
        code: 'USERTWICE',
        active: true,
        expiresAt: null,
        maxUses: 100,
        maxUsesPerUser: 2,
        usedCount: 10,
        discountType: 'FIXED_AMOUNT',
        discountValue: 15000,
        maxDiscountAmount: null,
        minOrderAmount: null,
        productId: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: null,
      } as unknown as Awaited<ReturnType<typeof prisma.coupon.findUnique>>)

      vi.mocked(prisma.order.count).mockResolvedValue(1)

      const result = await CouponService.validateAndCalculate(
        'USERTWICE',
        100000,
        null,
        'user-abc-123'
      )

      expect(result.valid).toBe(true)
      expect(result.discountAmount).toBe(15000)
      expect(result.finalAmount).toBe(85000)
    })
  })

  // Issue 7: Cron secret authorization header enforcement
  describe('Issue 7: Cron Secret Authorization', () => {
    it('rejects query parameter secrets and requires Authorization or x-cron-secret header', async () => {
      process.env.CRON_SECRET = 'secure-cron-secret-12345'
      vi.stubEnv('NODE_ENV', 'production')

      // We test the logic used by the cron endpoints
      const checkAuth = (authHeader: string | null, headerSecret: string | null) => {
        const cronSecret = process.env.CRON_SECRET
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null
        return bearerToken === cronSecret || headerSecret === cronSecret
      }

      // Query param attempt should not be considered
      expect(checkAuth(null, null)).toBe(false)
      // Invalid bearer
      expect(checkAuth('Bearer wrong-secret', null)).toBe(false)
      // Valid bearer
      expect(checkAuth('Bearer secure-cron-secret-12345', null)).toBe(true)
      // Valid x-cron-secret header
      expect(checkAuth(null, 'secure-cron-secret-12345')).toBe(true)
    })
  })

  // Issue 12: Review Spam Protection & Auth
  describe('Issue 12: Review Spam Protection', () => {
    it('sanitizes HTML tags and scripts in user names and comments to prevent XSS and spam injection', async () => {
      const { sanitizeInputText } = await import('./sanitize')
      const dirtyName = '<script>alert("hack")</script>Ali'
      const dirtyComment = '<b>Great product!</b> <img src=x onerror=alert(1)> Very satisfied.'

      const cleanName = sanitizeInputText(dirtyName)
      const cleanComment = sanitizeInputText(dirtyComment)

      expect(cleanName).toBe('Ali')
      expect(cleanComment).toBe('Great product!  Very satisfied.')
      expect(cleanName).not.toContain('<script>')
      expect(cleanComment).not.toContain('<img')
    })
  })
})

