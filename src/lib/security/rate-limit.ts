/**
 * In-memory sliding-window rate limiter for IP and key-based throttling.
 */
interface RateLimitEntry {
  count: number
  resetAt: number
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()

  constructor(
    private windowMs: number,
    private maxLimit: number
  ) {
    // Periodic cleanup of stale entries
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of this.store.entries()) {
          if (now > entry.resetAt) {
            this.store.delete(key)
          }
        }
      }, 5 * 60 * 1000)
      if (timer && typeof timer === 'object' && 'unref' in timer) {
        (timer as any).unref()
      }
    }
  }

  check(key: string): { success: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.windowMs
      this.store.set(key, { count: 1, resetAt })
      return { success: true, remaining: this.maxLimit - 1, resetAt }
    }

    if (entry.count >= this.maxLimit) {
      return { success: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return {
      success: true,
      remaining: this.maxLimit - entry.count,
      resetAt: entry.resetAt,
    }
  }
}

// 10 OTP send requests per 15 minutes per IP
export const otpSendRateLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 10)

// 25 OTP verify attempts per 15 minutes per IP
export const otpVerifyRateLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 25)

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return headers.get('x-real-ip') || '127.0.0.1'
}
