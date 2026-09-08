import { Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { MESSAGES } from '../messages'
import {
  accountLinkKeyboard,
  accountLinkInlineKeyboard,
  mainMenuKeyboard,
} from '../keyboards'
import { linkUserByVerifiedPhone } from '../account-linking'

export async function handleLinkPrompt(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  const user = await prisma.user.findUnique({
    where: { telegramId },
  })

  if (user?.phone) {
    await ctx.reply(
      `✅ حساب تلگرام شما هم‌اکنون به شماره **${user.phone}** در وب‌سایت متصل است.\nسفارش‌های شما بین دو پلتفرم یکپارچه هستند.`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard(true),
      }
    )
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  await ctx.reply(MESSAGES.linkPrompt, {
    parse_mode: 'Markdown',
    reply_markup: accountLinkKeyboard(appUrl),
  })

  await ctx.reply('همچنین می‌توانید با باز کردن لینک زیر در مرورگر به داشبورد متصل شوید:', {
    reply_markup: accountLinkInlineKeyboard(`${appUrl}/dashboard`),
  })
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

  const rawPhone = contact.phone_number
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || ctx.from.first_name

  const result = await linkUserByVerifiedPhone(
    rawPhone,
    telegramId,
    ctx.from.username || null
  )

  if (result.success && result.user) {
    const phone = result.user.phone || rawPhone
    await ctx.reply(MESSAGES.linkSuccess(name, phone), {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard(true),
    })
  } else {
    await ctx.reply(
      `❌ ${result.message || 'خطا در ثبت شماره تلفن.'}`,
      {
        reply_markup: mainMenuKeyboard(false),
      }
    )
  }
}
