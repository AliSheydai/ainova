import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { normalizePhone, isValidIranianPhone } from '@/lib/auth/otp'

const LINK_TOKEN_PREFIX = 'tglink_'
const PHONE_HASH_PREFIX = 'tg_hash_'
const LINK_TOKEN_EXPIRY_MINUTES = 15

export interface BotLoginSession {
  step: 'AWAITING_PHONE' | 'AWAITING_OTP'
  phone?: string
  lastSentAt?: number
}

// In-memory cache for quick response in long-running processes
const memorySessionStore = new Map<string, { session: BotLoginSession; expiresAt: number }>()

export async function setBotLoginSession(telegramId: string, session: BotLoginSession): Promise<void> {
  const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes
  memorySessionStore.set(telegramId, { session, expiresAt })

  // Also persist to DB via otpToken for cross-instance / serverless resilience
  try {
    const sessionKey = `tg_sess_${telegramId}`
    await prisma.otpToken.updateMany({
      where: { phone: sessionKey, used: false },
      data: { used: true },
    })

    await prisma.otpToken.create({
      data: {
        phone: sessionKey,
        code: JSON.stringify(session),
        expiresAt: new Date(expiresAt),
        used: false,
      },
    })
  } catch (err) {
    console.error('Error saving bot session in DB:', err)
  }
}

export async function getBotLoginSession(telegramId: string): Promise<BotLoginSession | null> {
  // Check memory cache first
  const cached = memorySessionStore.get(telegramId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.session
  }

  // Fallback to DB
  try {
    const sessionKey = `tg_sess_${telegramId}`
    const record = await prisma.otpToken.findFirst({
      where: {
        phone: sessionKey,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (record) {
      const parsed = JSON.parse(record.code) as BotLoginSession
      memorySessionStore.set(telegramId, {
        session: parsed,
        expiresAt: record.expiresAt.getTime(),
      })
      return parsed
    }
  } catch (err) {
    console.error('Error retrieving bot session from DB:', err)
  }

  return null
}

export async function clearBotLoginSession(telegramId: string): Promise<void> {
  memorySessionStore.delete(telegramId)
  try {
    const sessionKey = `tg_sess_${telegramId}`
    await prisma.otpToken.updateMany({
      where: { phone: sessionKey, used: false },
      data: { used: true },
    })
  } catch (err) {
    console.error('Error clearing bot session in DB:', err)
  }
}

/**
 * Generate a secure hashed phone deeplink token.
 * Format: ph_<phone>_<timestampHex>_<hmacSignature>
 * Total length ~48 characters (Telegram start param max is 64 chars)
 */
export async function generatePhoneHashDeeplinkToken(rawPhone: string): Promise<string> {
  const phone = normalizePhone(rawPhone)
  if (!isValidIranianPhone(phone)) {
    throw new Error('Invalid Iranian phone number for deeplink generation')
  }

  const secret =
    process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'tg_phone_hash_secret_key'
  const timestampHex = Math.floor(Date.now() / 1000).toString(16)
  const dataToSign = `${phone}:${timestampHex}`
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex')
    .slice(0, 24)

  const token = `ph_${phone}_${timestampHex}_${hmac}`
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Invalidate previous phone hash tokens for this phone
  await prisma.otpToken.updateMany({
    where: {
      phone: `${PHONE_HASH_PREFIX}${phone}`,
      used: false,
    },
    data: {
      used: true,
    },
  })

  // Persist to DB for replay protection and verification
  await prisma.otpToken.create({
    data: {
      phone: `${PHONE_HASH_PREFIX}${phone}`,
      code: token,
      expiresAt,
      used: false,
    },
  })

  return token
}

/**
 * Verify and consume a phone hash deeplink token.
 * Returns the verified phone number or null.
 */
export async function verifyAndConsumePhoneHashToken(payload: string): Promise<string | null> {
  if (!payload || typeof payload !== 'string') return null
  const trimmed = payload.trim()

  // Case 1: ph_<phone>_<timestampHex>_<hmac>
  if (trimmed.startsWith('ph_')) {
    const parts = trimmed.split('_')
    if (parts.length !== 4) return null
    const [, phone, timestampHex, hmac] = parts

    if (!isValidIranianPhone(phone)) return null

    // 1. Try finding and consuming in DB (single-use protection)
    const dbRecord = await prisma.otpToken.findFirst({
      where: {
        code: trimmed,
        phone: `${PHONE_HASH_PREFIX}${phone}`,
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (dbRecord) {
      if (new Date() > dbRecord.expiresAt) return null
      await prisma.otpToken.update({
        where: { id: dbRecord.id },
        data: { used: true },
      })
      return phone
    }

    // 2. Cryptographic signature verification fallback (e.g. within 24 hours)
    const secret =
      process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'tg_phone_hash_secret_key'
    const timestamp = parseInt(timestampHex, 16)
    if (isNaN(timestamp)) return null

    const nowSec = Math.floor(Date.now() / 1000)
    // Valid for up to 24 hours
    if (nowSec - timestamp > 86400 || timestamp - nowSec > 300) {
      return null
    }

    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(`${phone}:${timestampHex}`)
      .digest('hex')
      .slice(0, 24)

    if (hmac.length === expectedHmac.length && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return phone
    }

    return null
  }

  // Case 2: Legacy link_<token> fallback
  if (trimmed.startsWith('link_')) {
    const legacyToken = trimmed.slice(5)
    const userId = await verifyAndConsumeAccountLinkingToken(legacyToken)
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.phone) return user.phone
    }
  }

  return null
}

export async function createAccountLinkingToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(16).toString('hex') // 32 chars
  const expiresAt = new Date(Date.now() + LINK_TOKEN_EXPIRY_MINUTES * 60 * 1000)

  // Invalidate any previous link tokens for this user
  await prisma.otpToken.updateMany({
    where: {
      phone: `${LINK_TOKEN_PREFIX}${userId}`,
      used: false,
    },
    data: {
      used: true,
    },
  })

  // Create new token
  await prisma.otpToken.create({
    data: {
      phone: `${LINK_TOKEN_PREFIX}${userId}`,
      code: token,
      expiresAt,
      used: false,
    },
  })

  return token
}

export async function verifyAndConsumeAccountLinkingToken(token: string): Promise<string | null> {
  if (!token || token.trim().length === 0) return null

  const record = await prisma.otpToken.findFirst({
    where: {
      code: token.trim(),
      phone: { startsWith: LINK_TOKEN_PREFIX },
      used: false,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) return null

  if (new Date() > record.expiresAt) {
    return null
  }

  // Mark as used
  await prisma.otpToken.update({
    where: { id: record.id },
    data: { used: true },
  })

  const userId = record.phone.replace(LINK_TOKEN_PREFIX, '')
  return userId
}

export interface LinkAccountResult {
  success: boolean
  message: string
  user?: {
    id: string
    phone: string | null
    name: string | null
    telegramId: string | null
    telegramUsername: string | null
  }
}

export async function linkTelegramAccountToUser(
  userId: string,
  telegramId: string,
  telegramUsername?: string | null
): Promise<LinkAccountResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Find target user
      const targetUser = await tx.user.findUnique({
        where: { id: userId },
      })

      if (!targetUser) {
        return { success: false, message: 'کاربر مورد نظر یافت نشد.' }
      }

      // 2. Check if this telegramId is already linked to ANOTHER user
      const existingTgUser = await tx.user.findUnique({
        where: { telegramId },
      })

      if (existingTgUser && existingTgUser.id !== targetUser.id) {
        // Merge orders from old telegram guest user to the target user
        await tx.order.updateMany({
          where: { userId: existingTgUser.id },
          data: { userId: targetUser.id },
        })

        // If the old temporary user had no phone, safely remove or detach it
        if (!existingTgUser.phone) {
          await tx.user.delete({
            where: { id: existingTgUser.id },
          })
        } else {
          // If it had a phone, just remove its telegramId
          await tx.user.update({
            where: { id: existingTgUser.id },
            data: { telegramId: null, telegramUsername: null },
          })
        }
      }

      // 3. Update target user with telegram details
      const updatedUser = await tx.user.update({
        where: { id: targetUser.id },
        data: {
          telegramId,
          telegramUsername: telegramUsername || targetUser.telegramUsername,
        },
      })

      return {
        success: true,
        message: 'اتصال حساب تلگرام با موفقیت انجام شد.',
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          telegramId: updatedUser.telegramId,
          telegramUsername: updatedUser.telegramUsername,
        },
      }
    })
  } catch (error) {
    console.error('Error in linkTelegramAccountToUser:', error)
    return {
      success: false,
      message: 'خطا در اتصال حساب کاربری تلگرام.',
    }
  }
}

export async function linkUserByVerifiedPhone(
  rawPhone: string,
  telegramId: string,
  telegramUsername?: string | null
): Promise<LinkAccountResult> {
  const phone = normalizePhone(rawPhone)

  if (!isValidIranianPhone(phone)) {
    return {
      success: false,
      message: 'شماره تلفن دریافت شده معتبر نیست.',
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Find user by phone
      let phoneUser = await tx.user.findUnique({
        where: { phone },
      })

      // Find user by telegramId
      const tgUser = await tx.user.findUnique({
        where: { telegramId },
      })

      if (phoneUser && tgUser && phoneUser.id !== tgUser.id) {
        // Both exist separately -> merge tgUser's orders into phoneUser
        await tx.order.updateMany({
          where: { userId: tgUser.id },
          data: { userId: phoneUser.id },
        })

        if (!tgUser.phone) {
          await tx.user.delete({
            where: { id: tgUser.id },
          })
        } else {
          await tx.user.update({
            where: { id: tgUser.id },
            data: { telegramId: null, telegramUsername: null },
          })
        }

        const updated = await tx.user.update({
          where: { id: phoneUser.id },
          data: {
            telegramId,
            telegramUsername: telegramUsername || phoneUser.telegramUsername,
          },
        })

        return {
          success: true,
          message: 'حساب تلگرام شما با موفقیت به حساب وب‌سایت متصل شد.',
          user: updated,
        }
      }

      if (phoneUser) {
        // Update phoneUser's telegramId
        const updated = await tx.user.update({
          where: { id: phoneUser.id },
          data: {
            telegramId,
            telegramUsername: telegramUsername || phoneUser.telegramUsername,
          },
        })

        return {
          success: true,
          message: 'حساب تلگرام شما با موفقیت به حساب وب‌سایت متصل شد.',
          user: updated,
        }
      }

      if (tgUser) {
        // Assign phone to tgUser
        const updated = await tx.user.update({
          where: { id: tgUser.id },
          data: {
            phone,
            telegramUsername: telegramUsername || tgUser.telegramUsername,
          },
        })

        return {
          success: true,
          message: 'شماره موبایل شما ثبت شد و به حساب متصل گردید.',
          user: updated,
        }
      }

      // Neither existed -> create unified user
      const created = await tx.user.create({
        data: {
          phone,
          telegramId,
          telegramUsername: telegramUsername || null,
        },
      })

      return {
        success: true,
        message: 'حساب کاربری جدید ایجاد و متصل شد.',
        user: created,
      }
    })
  } catch (error) {
    console.error('Error in linkUserByVerifiedPhone:', error)
    return {
      success: false,
      message: 'خطا در ثبت شماره تلفن و اتصال حساب.',
    }
  }
}

export async function logoutTelegramAccount(telegramId: string): Promise<boolean> {
  await clearBotLoginSession(telegramId)
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramId: null,
          telegramUsername: null,
        },
      })
      return true
    }
  } catch (error) {
    console.error('Error in logoutTelegramAccount:', error)
  }
  return false
}
