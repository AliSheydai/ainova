import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { normalizePhone, isValidIranianPhone } from '@/lib/auth/otp'

const LINK_TOKEN_PREFIX = 'tglink_'
const LINK_TOKEN_EXPIRY_MINUTES = 15

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
