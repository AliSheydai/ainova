import { type Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { MESSAGES } from '../messages'
import { mainMenuKeyboard } from '../keyboards'
import { startLoginFlow, processPhoneInput } from './auth'

export async function handleLinkPrompt(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  const user = await prisma.user.findUnique({
    where: { telegramId },
  })

  if (user?.phone) {
    const { UserNotificationService } = await import('@/lib/notifications/user-notification-service')
    const unreadCount = await UserNotificationService.getUnreadCount(user.id).catch(() => 0)
    await ctx.reply(
      `✅ حساب تلگرام شما هم‌اکنون به شماره **${user.phone}** متصل است.\nبرای ورود با شماره دیگر می‌توانید شماره جدید را ارسال فرمایید.`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard(true, unreadCount),
      }
    )
    return
  }

  await startLoginFlow(ctx)
}

export async function handleContactShare(ctx: Context) {
  const message = ctx.message
  if (!message || !message.contact || !ctx.from) return

  const contact = message.contact
  const telegramId = String(ctx.from.id)

  // Security validation: verify the shared contact actually belongs to the user
  if (contact.user_id && String(contact.user_id) !== telegramId) {
    await ctx.reply(
      '❌ لطفاً تنها شماره تماس متعلق به همین اکانت تلگرام را با کلیک روی دکمه ارسال شماره به اشتراک بگذارید.',
      {
        reply_markup: mainMenuKeyboard(false),
      }
    )
    return
  }

  // Always process phone through OTP verification (never bypass OTP)
  await processPhoneInput(ctx, contact.phone_number)
}
