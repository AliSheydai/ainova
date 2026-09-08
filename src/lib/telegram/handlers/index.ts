import { Bot } from 'grammy'
import { BUTTONS, mainMenuKeyboard } from '../keyboards'
import { MESSAGES } from '../messages'
import { handleStart } from './start'
import { handleShowProducts, handleBuyCallback } from './buy'
import { handleOrders } from './orders'
import { handleGuide } from './guide'
import { handleSupport } from './support'

export function registerHandlers(bot: Bot) {
  // Command /start
  bot.command('start', handleStart)

  // Reply Keyboard Buttons
  bot.hears(BUTTONS.BUY, handleShowProducts)
  bot.hears(BUTTONS.ORDERS, (ctx) => handleOrders(ctx, 1))
  bot.hears(BUTTONS.GUIDE, handleGuide)
  bot.hears(BUTTONS.SUPPORT, handleSupport)

  // Callback query for guide
  bot.callbackQuery('guide', handleGuide)

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
    await ctx.reply(MESSAGES.mainMenuPrompt, {
      reply_markup: mainMenuKeyboard(),
    })
  })

  // Callback Queries: No-op
  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {})
  })

  // Fallback for unrecognized text
  bot.on('message:text', async (ctx) => {
    await ctx.reply(MESSAGES.mainMenuPrompt, {
      reply_markup: mainMenuKeyboard(),
    })
  })
}
