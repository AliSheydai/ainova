import { Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { getOrCreateUserWithRole } from '@/lib/auth/user-role'
import { MESSAGES } from '../messages'
import { mainMenuKeyboard } from '../keyboards'
import { handleOrders } from './orders'
import {
  verifyAndConsumePhoneHashToken,
  linkUserByVerifiedPhone,
  clearBotLoginSession,
} from '../account-linking'
import { startLoginFlow } from './auth'

export async function handleStart(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'کاربر گرامی'
  const telegramUsername = from.username || null

  // Extract start payload (Grammy ctx.match or /start <payload>)
  const text = ctx.msg?.text || ''
  const payload = (typeof ctx.match === 'string' && ctx.match.trim()) || text.split(/\s+/)[1] || ''

  // Case 1: Phone Hash Deeplink or Account Linking Deeplink (e.g. /start ph_... or /start link_...)
  if (payload.startsWith('ph_') || payload.startsWith('link_')) {
    const verifiedPhone = await verifyAndConsumePhoneHashToken(payload)

    if (verifiedPhone) {
      const linkResult = await linkUserByVerifiedPhone(verifiedPhone, telegramId, telegramUsername)
      if (linkResult.success && linkResult.user) {
        await clearBotLoginSession(telegramId)
        await ctx.reply(MESSAGES.deeplinkLoginSuccess(verifiedPhone), {
          parse_mode: 'Markdown',
          reply_markup: mainMenuKeyboard(true),
        })
        return
      }
    }

    // Token invalid or expired
    await ctx.reply(MESSAGES.linkExpired, {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard(false),
    })
    return
  }

  // Case 2: Guest Deeplink (User clicked Telegram button on website while NOT logged in)
  const isGuestDeeplink = ['guest', 'web_header', 'guest_login', 'login', 'auth'].includes(payload)
  if (isGuestDeeplink) {
    await clearBotLoginSession(telegramId)
    await startLoginFlow(
      ctx,
      '👋 **به ربات رسمی Google AI Pro خوش آمدید!**\n\n' +
        'برای دسترسی به امکانات، پیگیری و خرید اشتراک، لطفاً با شماره موبایل خود وارد شوید:'
    )
    return
  }

  // Case 3: Check if user is already linked/logged in in Telegram
  let existingUser = null
  try {
    existingUser = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          telegramUsername,
          name: existingUser.name || name,
        },
      })
    } else {
      existingUser = await getOrCreateUserWithRole({
        telegramId,
        telegramUsername,
        name,
      })
    }
  } catch (error) {
    console.error('Error in handleStart user upsert:', error)
  }

  // If user already has a verified phone number in Telegram:
  if (existingUser?.phone) {
    // If navigation directly to orders
    if (payload === 'orders') {
      await handleOrders(ctx, 1)
      return
    }

    await ctx.reply(MESSAGES.welcome(name), {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard(true),
    })
    return
  }

  // Case 4: User started the bot from inside Telegram without deeplink login -> initiate OTP login flow
  await startLoginFlow(ctx)
}
