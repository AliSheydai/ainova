import { type Context } from 'grammy'
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
          parse_mode: 'HTML',
          reply_markup: mainMenuKeyboard(true),
        })
        return
      }
    }

    // Token invalid or expired
    await ctx.reply(MESSAGES.linkExpired, {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(false),
    })
    return
  }

  // Case 2: Guest Deeplink (User clicked Telegram button on website while NOT logged in)
  const isGuestDeeplink = ['guest', 'web_header', 'guest_login'].includes(payload)
  if (isGuestDeeplink) {
    await clearBotLoginSession(telegramId)
    // Check if user is already linked
    const existing = await prisma.user.findUnique({ where: { telegramId } })
    if (existing?.phone) {
      await ctx.reply(MESSAGES.welcome(name), {
        parse_mode: 'HTML',
        reply_markup: mainMenuKeyboard(true),
      })
      return
    }

    // Unauthenticated guest: provide welcome & store menu without blocking
    await ctx.reply(
      `👋 <b>به فروشگاه رسمی آریوچت خوش آمدید</b>\n\n` +
        `برای مشاهده لیست محصولات و اشتراک‌های هوش مصنوعی، گزینه «🛒 خرید اشتراک» را انتخاب نمایید.\n` +
        `احراز هویت تنها در مرحله نهایی ثبت سفارش انجام خواهد شد.`,
      {
        parse_mode: 'HTML',
        reply_markup: mainMenuKeyboard(false, 0),
      }
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
    // If navigation directly to orders or notifications
    if (payload === 'orders') {
      await handleOrders(ctx, 1)
      return
    }

    if (payload === 'notifications' || payload === 'notif') {
      const { handleNotifications } = await import('./notifications')
      await handleNotifications(ctx, 1, 'all')
      return
    }

    const { UserNotificationService } = await import('@/lib/notifications/user-notification-service')
    const unreadCount = await UserNotificationService.getUnreadCount(existingUser.id).catch(() => 0)

    await ctx.reply(MESSAGES.welcome(name), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(true, unreadCount),
    })
    return
  }

  // Case 4: User started the bot without prior phone link -> show welcome message with guest menu
  await ctx.reply(MESSAGES.welcome(name), {
    parse_mode: 'HTML',
    reply_markup: mainMenuKeyboard(false, 0),
  })
}
