import { Bot } from 'grammy'
import { BUTTONS, mainMenuKeyboard } from '../keyboards'
import { MESSAGES } from '../messages'
import { handleStart } from './start'
import { handleShowProducts, handleBuyCallback } from './buy'
import { handleOrders } from './orders'
import { handleGuide } from './guide'
import { handleSupport } from './support'
import { handleLinkPrompt, handleContactShare } from './link'
import { prisma } from '@/lib/prisma'

export function registerHandlers(bot: Bot) {
  // Command /start
  bot.command('start', handleStart)

  // Reply Keyboard Buttons
  bot.hears(BUTTONS.BUY, handleShowProducts)
  bot.hears(BUTTONS.ORDERS, (ctx) => handleOrders(ctx, 1))
  bot.hears(BUTTONS.GUIDE, handleGuide)
  bot.hears(BUTTONS.SUPPORT, handleSupport)
  bot.hears(BUTTONS.LINK_ACCOUNT, handleLinkPrompt)

  // Back to main menu text handler
  bot.hears('🔙 بازگشت به منوی اصلی', async (ctx) => {
    let isLinked = false
    if (ctx.from?.id) {
      const u = await prisma.user.findUnique({
        where: { telegramId: String(ctx.from.id) },
      })
      isLinked = Boolean(u?.phone)
    }
    await ctx.reply(MESSAGES.mainMenuPrompt, {
      reply_markup: mainMenuKeyboard(isLinked),
    })
  })

  // Contact message handler (for verified phone linking)
  bot.on('message:contact', handleContactShare)

  // Callback query for guide
  bot.callbackQuery('guide', handleGuide)

  // Callback query for support phone
  bot.callbackQuery('support:phone', async (ctx) => {
    const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '021-91000000'
    await ctx.answerCallbackQuery({
      text: `📞 شماره تماس پشتیبانی:\n${phone}\n(ساعات پاسخگویی: ۹ صبح الی ۲۳)`,
      show_alert: true,
    }).catch(() => {})
  })

  // Callback Queries: Buy action
  bot.callbackQuery(/^buy:(.+)$/, async (ctx) => {
    const planId = ctx.match[1]
    await handleBuyCallback(ctx, planId)
  })

  // Callback Queries: Orders pagination
  bot.callbackQuery(/^orders:page:(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1
    await handleOrders(ctx, page)
  })

  // Callback Queries: Navigation - Back to main menu
  bot.callbackQuery('nav:main', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {})
    let isLinked = false
    if (ctx.from?.id) {
      const u = await prisma.user.findUnique({
        where: { telegramId: String(ctx.from.id) },
      })
      isLinked = Boolean(u?.phone)
    }
    await ctx.reply(MESSAGES.mainMenuPrompt, {
      reply_markup: mainMenuKeyboard(isLinked),
    })
  })

  // Callback Queries: No-op
  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {})
  })

  // Fallback for unrecognized text
  bot.on('message:text', async (ctx) => {
    let isLinked = false
    if (ctx.from?.id) {
      const u = await prisma.user.findUnique({
        where: { telegramId: String(ctx.from.id) },
      })
      isLinked = Boolean(u?.phone)
    }
    await ctx.reply(MESSAGES.mainMenuPrompt, {
      reply_markup: mainMenuKeyboard(isLinked),
    })
  })
}
