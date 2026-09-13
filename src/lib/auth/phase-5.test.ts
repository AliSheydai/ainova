import { describe, expect, it } from 'vitest'
import { signToken, verifyToken, TOKEN_EXPIRY } from './jwt'
import { sendOrderConfirmationSms } from './sms'
import { InMemoryRateLimiter } from '../security/rate-limit'

describe('Phase 5 — Testing & Hardening', () => {
  describe('Bug 5.1: JWT Token Rotation & tokenVersion', () => {
    it('uses 7d token expiry', () => {
      expect(TOKEN_EXPIRY).toBe('7d')
    })

    it('encodes and decodes tokenVersion in JWT payload', async () => {
      const token = await signToken({
        userId: 'user-123',
        phone: '09120000000',
        role: 'USER',
        tokenVersion: 2,
      })

      const payload = await verifyToken(token)
      expect(payload).not.toBeNull()
      expect(payload?.userId).toBe('user-123')
      expect(payload?.phone).toBe('09120000000')
      expect(payload?.tokenVersion).toBe(2)
    })

    it('supports checking tokenVersion to detect revoked tokens', async () => {
      const initialToken = await signToken({
        userId: 'user-456',
        phone: '09121111111',
        tokenVersion: 1,
      })

      const decoded = await verifyToken(initialToken)
      expect(decoded?.tokenVersion).toBe(1)

      // Simulating user logout / password reset: tokenVersion incremented to 2 in DB
      const currentDbVersion = 2
      const isRevoked = decoded?.tokenVersion !== currentDbVersion
      expect(isRevoked).toBe(true)
    })
  })

  describe('Bug 5.3: Order Confirmation SMS', () => {
    it('successfully sends order confirmation SMS via dev bypass', async () => {
      const result = await sendOrderConfirmationSms(
        '09123456789',
        'ABCDEF',
        'http://localhost:3000/orders?orderId=order-123'
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('توسعه')
    })
  })

  describe('Bug 5.4: Coupon Validation Rate Limiter', () => {
    it('allows 10 consecutive requests and blocks the 11th request with 429 logic', () => {
      const limiter = new InMemoryRateLimiter(60 * 1000, 10)
      const testKey = 'test-ip:127.0.0.1'

      // Requests 1 through 10 should succeed
      for (let i = 1; i <= 10; i++) {
        const check = limiter.check(testKey)
        expect(check.success).toBe(true)
        expect(check.remaining).toBe(10 - i)
      }

      // The 11th request should be blocked (rate limit exceeded)
      const eleventhCheck = limiter.check(testKey)
      expect(eleventhCheck.success).toBe(false)
      expect(eleventhCheck.remaining).toBe(0)
      expect(eleventhCheck.resetAt).toBeGreaterThan(Date.now())
    })
  })
})
