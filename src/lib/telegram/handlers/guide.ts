import { type Context } from 'grammy'
import { MESSAGES } from '../messages'
import { guideMenuKeyboard, guideSubSectionKeyboard } from '../keyboards'

async function renderGuideScreen(
  ctx: Context,
  text: string,
  keyboard: ReturnType<typeof guideMenuKeyboard | typeof guideSubSectionKeyboard>
) {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery().catch(() => {})
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        link_preview_options: { is_disabled: true },
      })
      return
    } catch {
      // If editing fails (e.g. unchanged or expired message), send a fresh reply
    }
  }

  try {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    })
  } catch (err) {
    console.error('Failed to send guide screen with Markdown:', err)
    await ctx.reply(text, {
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    }).catch((e) => console.error('Failed to send fallback guide screen:', e))
  }
}

export async function handleGuide(ctx: Context) {
  await renderGuideScreen(ctx, MESSAGES.activationGuideOverview, guideMenuKeyboard())
}

export async function handleGuideLink(ctx: Context) {
  await renderGuideScreen(ctx, MESSAGES.activationGuidePlanLink, guideSubSectionKeyboard('link'))
}

export async function handleGuideEmail(ctx: Context) {
  await renderGuideScreen(ctx, MESSAGES.activationGuidePlanEmail, guideSubSectionKeyboard('email'))
}

export async function handleGuideTips(ctx: Context) {
  await renderGuideScreen(ctx, MESSAGES.activationGuideGoldenTips, guideSubSectionKeyboard('tips'))
}

export async function handleGuideFaq(ctx: Context) {
  await renderGuideScreen(ctx, MESSAGES.activationGuideFaq, guideSubSectionKeyboard('faq'))
}
