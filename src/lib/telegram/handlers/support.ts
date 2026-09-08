import { Context } from 'grammy'
import { MESSAGES } from '../messages'
import { supportKeyboard } from '../keyboards'

export async function handleSupport(ctx: Context) {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery().catch(() => {})
  }

  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '021-91000000'
  const telegramUrl = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || 'https://t.me/google_ai_pro_support'

  await ctx.reply(MESSAGES.support(phone, telegramUrl), {
    parse_mode: 'Markdown',
    reply_markup: supportKeyboard(phone, telegramUrl),
  })
}
