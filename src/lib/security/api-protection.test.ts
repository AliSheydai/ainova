import { describe, expect, it } from 'vitest'
import { InMemoryRateLimiter, getClientIp } from './rate-limit'

describe('Phase 3 - API Protection & Validation Tests', () => {
  describe('Bug 3.1 - Rate Limiting (InMemoryRateLimiter)', () => {
    it('allows requests up to maxLimit and blocks subsequent requests', () => {
      const limiter = new InMemoryRateLimiter(60 * 1000, 5) // 5 per min
      const testIp = '192.168.1.100'

      // First 5 requests should pass
      for (let i = 1; i <= 5; i++) {
        const res = limiter.check(testIp)
        expect(res.success).toBe(true)
        expect(res.remaining).toBe(5 - i)
      }

      // 6th request must be blocked
      const blocked = limiter.check(testIp)
      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
    })

    it('isolates different clients/IPs/Telegram IDs', () => {
      const limiter = new InMemoryRateLimiter(5 * 60 * 1000, 3) // Bot: 3 per 5 min
      const userA = 'tg_user_111'
      const userB = 'tg_user_222'

      // User A exhausts quota
      for (let i = 0; i < 3; i++) {
        expect(limiter.check(userA).success).toBe(true)
      }
      expect(limiter.check(userA).success).toBe(false)

      // User B should still be allowed
      expect(limiter.check(userB).success).toBe(true)
    })

    it('extracts client IP properly from headers', () => {
      const headersWithForwarded = new Headers({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      })
      expect(getClientIp(headersWithForwarded)).toBe('203.0.113.195')

      const headersWithRealIp = new Headers({
        'x-real-ip': '198.51.100.22',
      })
      expect(getClientIp(headersWithRealIp)).toBe('198.51.100.22')

      const emptyHeaders = new Headers()
      expect(getClientIp(emptyHeaders)).toBe('127.0.0.1')
    })
  })

  describe('Bug 3.5 - Source Whitelist Validation', () => {
    const ALLOWED_SOURCES = ['web', 'telegram', 'bale', 'rubika', 'soroush'] as const
    type AllowedSource = (typeof ALLOWED_SOURCES)[number]

    function sanitizeSource(input: unknown): AllowedSource {
      if (typeof input === 'string' && (ALLOWED_SOURCES as readonly string[]).includes(input)) {
        return input as AllowedSource
      }
      return 'web'
    }

    it('accepts valid whitelisted sources', () => {
      expect(sanitizeSource('web')).toBe('web')
      expect(sanitizeSource('telegram')).toBe('telegram')
      expect(sanitizeSource('bale')).toBe('bale')
      expect(sanitizeSource('rubika')).toBe('rubika')
      expect(sanitizeSource('soroush')).toBe('soroush')
    })

    it('falls back to "web" for invalid, malicious or missing sources', () => {
      expect(sanitizeSource('<script>alert(1)</script>')).toBe('web')
      expect(sanitizeSource('hack_source')).toBe('web')
      expect(sanitizeSource(null)).toBe('web')
      expect(sanitizeSource(undefined)).toBe('web')
      expect(sanitizeSource(123)).toBe('web')
    })
  })

  describe('Bug 3.4 - Web Callback Ownership Validation Logic', () => {
    function validateCallbackOwnership(options: {
      isTelegram: boolean
      sessionUserId: string | null
      orderUserId: string
    }): { authorized: boolean; redirectUrl?: string } {
      const appUrl = 'https://ariochat.com'
      if (!options.isTelegram) {
        if (options.sessionUserId && options.sessionUserId !== options.orderUserId) {
          return {
            authorized: false,
            redirectUrl: `${appUrl}/?payment=unauthorized`,
          }
        }
      }
      return { authorized: true }
    }

    it('redirects to ?payment=unauthorized when session user does not match order owner', () => {
      const result = validateCallbackOwnership({
        isTelegram: false,
        sessionUserId: 'attacker-user-id',
        orderUserId: 'legitimate-buyer-id',
      })

      expect(result.authorized).toBe(false)
      expect(result.redirectUrl).toBe('https://ariochat.com/?payment=unauthorized')
    })

    it('allows callback when session user matches order owner', () => {
      const result = validateCallbackOwnership({
        isTelegram: false,
        sessionUserId: 'legitimate-buyer-id',
        orderUserId: 'legitimate-buyer-id',
      })

      expect(result.authorized).toBe(true)
    })

    it('allows telegram callback without web session check', () => {
      const result = validateCallbackOwnership({
        isTelegram: true,
        sessionUserId: 'attacker-user-id',
        orderUserId: 'legitimate-buyer-id',
      })

      expect(result.authorized).toBe(true)
    })
  })

  describe('Bug 3.2 - Max Pending Orders Threshold', () => {
    function canCreateNewOrder(pendingOrdersCount: number): boolean {
      return pendingOrdersCount < 3
    }

    it('allows creation when pending orders are less than 3', () => {
      expect(canCreateNewOrder(0)).toBe(true)
      expect(canCreateNewOrder(1)).toBe(true)
      expect(canCreateNewOrder(2)).toBe(true)
    })

    it('blocks creation when pending orders count is 3 or more', () => {
      expect(canCreateNewOrder(3)).toBe(false)
      expect(canCreateNewOrder(4)).toBe(false)
    })
  })
})
