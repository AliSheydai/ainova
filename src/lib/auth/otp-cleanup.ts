import { prisma } from '@/lib/prisma'

export interface OtpCleanupOptions {
  /**
   * Delete any tokens created or expired older than this number of days (default: 7).
   */
  olderThanDays?: number
  /**
   * Also delete used tokens older than this number of hours (default: 24).
   * Set to 0 to skip separate used tokens cleanup.
   */
  usedOlderThanHours?: number
}

export interface OtpCleanupResult {
  deletedCount: number
  cutoffDate: Date
  usedCutoffDate?: Date
  durationMs: number
}

export class OtpCleanupService {
  /**
   * Cleans up expired and old used OTP tokens from the database.
   * Based on Section 8.2 of review.md: prevents database bloat by removing old OTP tokens.
   */
  static async cleanupTokens(
    options: OtpCleanupOptions = {}
  ): Promise<OtpCleanupResult> {
    const startTime = Date.now()
    const olderThanDays = Math.max(1, options.olderThanDays ?? 7)
    const usedOlderThanHours = options.usedOlderThanHours ?? 24

    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    )
    const usedCutoffDate =
      usedOlderThanHours > 0
        ? new Date(Date.now() - usedOlderThanHours * 60 * 60 * 1000)
        : undefined

    const orConditions: Array<{
      createdAt?: { lt: Date }
      expiresAt?: { lt: Date }
      used?: boolean
    }> = [{ createdAt: { lt: cutoffDate } }, { expiresAt: { lt: cutoffDate } }]

    if (usedCutoffDate) {
      orConditions.push({
        used: true,
        createdAt: { lt: usedCutoffDate },
      })
    }

    const deleteResult = await prisma.otpToken.deleteMany({
      where: {
        OR: orConditions,
      },
    })

    return {
      deletedCount: deleteResult.count,
      cutoffDate,
      usedCutoffDate,
      durationMs: Date.now() - startTime,
    }
  }
}
