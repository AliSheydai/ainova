import { describe, expect, it, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { OtpCleanupService } from './otp-cleanup'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    otpToken: {
      deleteMany: vi.fn(),
    },
  },
}))

describe('OtpCleanupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cleans up tokens older than default 7 days and used tokens older than 24 hours', async () => {
    vi.mocked(prisma.otpToken.deleteMany).mockResolvedValue({ count: 42 })

    const result = await OtpCleanupService.cleanupTokens()

    expect(result.deletedCount).toBe(42)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(prisma.otpToken.deleteMany).toHaveBeenCalledTimes(1)

    const callArgs = vi.mocked(prisma.otpToken.deleteMany).mock.calls[0][0]
    expect(callArgs).toBeDefined()
    expect(callArgs?.where?.OR).toBeDefined()
    expect(Array.isArray(callArgs?.where?.OR)).toBe(true)

    // Verify condition count (createdAt, expiresAt, and used tokens)
    const orConditions = callArgs?.where?.OR as Array<Record<string, unknown>>
    expect(orConditions.length).toBe(3)
    expect(orConditions[0]).toHaveProperty('createdAt')
    expect(orConditions[1]).toHaveProperty('expiresAt')
    expect(orConditions[2]).toHaveProperty('used', true)
  })

  it('respects custom olderThanDays and usedOlderThanHours options', async () => {
    vi.mocked(prisma.otpToken.deleteMany).mockResolvedValue({ count: 10 })

    const result = await OtpCleanupService.cleanupTokens({
      olderThanDays: 14,
      usedOlderThanHours: 0, // Disable separate used token clause
    })

    expect(result.deletedCount).toBe(10)
    const callArgs = vi.mocked(prisma.otpToken.deleteMany).mock.calls[0][0]
    const orConditions = callArgs?.where?.OR as Array<Record<string, unknown>>
    expect(orConditions.length).toBe(2)
    expect(result.usedCutoffDate).toBeUndefined()
  })
})
