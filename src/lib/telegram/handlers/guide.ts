import { Context } from 'grammy'
import { MESSAGES } from '../messages'
import { guideKeyboard } from '../keyboards'

export async function handleGuide(ctx: Context) {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery().catch(() => {})
  }

  await ctx.reply(MESSAGES.activationGuide, {
    parse_mode: 'Markdown',
    reply_markup: guideKeyboard(),
  })
}
