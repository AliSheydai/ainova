import { type Bot } from 'grammy'
import { BUTTONS, mainMenuKeyboard } from '../keyboards'
import { MESSAGES } from '../messages'
import { handleStart } from './start'
import { handleShowProducts, handleSelectProduct, handleBuyProduct, handleBuyCallback } from './buy'
import { handleOrders } from './orders'
import {
  handleNotifications,
  handleNotificationRead,
  handleNotificationReadAll,
} from './notifications'
import { handleGuide } from './guide'
import { handleSupport } from './support'
import { handleLinkPrompt } from './link'
import {
  startLoginFlow,
  processPhoneInput,
  processOtpInput,
  handleAuthResend,
  handleAuthChangePhone,
} from './auth'
import {
  getBotLoginSession,
  clearBotLoginSession,
  logoutTelegramAccount,
} from '../account-linking'
import { normalizePhone, isValidIranianPhone } from '@/lib/auth/otp'
import { prisma } from '@/lib/prisma'
import { UserNotificationService } from '@/lib/notifications/user-notification-service'

async function getUpdatedMainMenuKeyboard(telegramId: string | null) {
  if (!telegramId) return mainMenuKeyboard(false, 0)
  try {
    const u = await prisma.user.findUnique({ where: { telegramId } })
    if (!u?.phone) return mainMenuKeyboard(false, 0)
    const unread = await UserNotificationService.getUnreadCount(u.id).catch(() => 0)
    return mainMenuKeyboard(true, unread)
  } catch {
    return mainMenuKeyboard(false, 0)
  }
}

export function registerHandlers(bot: Bot) {
  // Command /start
  bot.command('start', handleStart)

  // Command /login
  bot.command('login', (ctx) => startLoginFlow(ctx))

  // Command /notifications
  bot.command(['notifications', 'notif', 'alerts'], (ctx) => handleNotifications(ctx, 1, 'all'))

  // Command /logout
  bot.command('logout', async (ctx) => {
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    if (telegramId) {
      await logoutTelegramAccount(telegramId)
    }
    await ctx.reply(MESSAGES.logoutSuccess, {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard(false),
    })
  })

  // Reply Keyboard Buttons
  bot.hears([BUTTONS.BUY, '🛒 خرید اشتراک', '🛒 خرید', 'خرید', 'خرید اشتراک جمینای', 'خرید محصول'], handleShowProducts)
  bot.hears(BUTTONS.ORDERS, (ctx) => handleOrders(ctx, 1))
  bot.hears(
    [
      BUTTONS.NOTIFICATIONS,
      /^🔔\s*اعلان/,
      'اعلان‌ها',
      'اعلانات',
      'پیام‌ها',
      'اعلان',
      'صندوق اعلان‌ها',
    ],
    (ctx) => handleNotifications(ctx, 1, 'all')
  )
  bot.hears(BUTTONS.GUIDE, handleGuide)
  bot.hears(BUTTONS.SUPPORT, handleSupport)
  bot.hears(BUTTONS.LINK_ACCOUNT, handleLinkPrompt)

  // Logout Button
  bot.hears([BUTTONS.LOGOUT, 'خروج از حساب کاربری', 'خروج از حساب'], async (ctx) => {
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    if (telegramId) {
      await logoutTelegramAccount(telegramId)
    }
    await ctx.reply(MESSAGES.logoutSuccess, {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard(false),
    })
  })

  // Back to main menu or cancel handler
  bot.hears(['🔙 بازگشت به منوی اصلی', '🔙 انصراف', 'انصراف', 'بازگشت'], async (ctx) => {
    let isLinked = false
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null

    if (telegramId) {
      await clearBotLoginSession(telegramId)
      const u = await prisma.user.findUnique({
        where: { telegramId },
      })
      isLinked = Boolean(u?.phone)
    }

    if (isLinked) {
      const kb = await getUpdatedMainMenuKeyboard(telegramId)
      await ctx.reply(MESSAGES.mainMenuPrompt, {
        reply_markup: kb,
      })
    } else {
      await startLoginFlow(ctx)
    }
  })

  // Contact message handler (for verified phone login via contact button)
  bot.on('message:contact', async (ctx) => {
    const contact = ctx.message?.contact
    if (!contact) return
    await processPhoneInput(ctx, contact.phone_number)
  })

  // Auth callback queries
  bot.callbackQuery('auth:resend', handleAuthResend)
  bot.callbackQuery('auth:change_phone', handleAuthChangePhone)

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

  // Callback Queries: Select product from catalog
  bot.callbackQuery(/^product:select:(.+)$/, async (ctx) => {
    const productId = ctx.match[1]
    await handleSelectProduct(ctx, productId)
  })

  // Callback Queries: Buy specific plan
  bot.callbackQuery(/^plan:buy:(.+)$/, async (ctx) => {
    const { handleBuyPlan } = await import('./buy')
    const planId = ctx.match[1]
    await handleBuyPlan(ctx, planId)
  })

  // Callback Queries: Buy specific product (legacy fallback)
  bot.callbackQuery(/^buy:product:(.+)$/, async (ctx) => {
    const productId = ctx.match[1]
    await handleSelectProduct(ctx, productId)
  })

  // Callback Queries: Navigation - Back to products list
  bot.callbackQuery('nav:products', async (ctx) => {
    await handleShowProducts(ctx)
  })

  // Callback Queries: Legacy Buy action
  bot.callbackQuery(/^buy:(.+)$/, async (ctx) => {
    const planOrProductId = ctx.match[1]
    await handleBuyCallback(ctx, planOrProductId)
  })

  // Callback Queries: Orders pagination
  bot.callbackQuery(/^orders:page:(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1
    await handleOrders(ctx, page)
  })

  // Callback Queries: Notifications pagination
  bot.callbackQuery(/^notif:page:(\d+):(all|unread)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1
    const filter = ctx.match[2] as 'all' | 'unread'
    await handleNotifications(ctx, page, filter)
  })

  // Callback Queries: Notifications filter toggle
  bot.callbackQuery(/^notif:filter:(all|unread):(\d+)$/, async (ctx) => {
    const filter = ctx.match[1] as 'all' | 'unread'
    const page = parseInt(ctx.match[2], 10) || 1
    await handleNotifications(ctx, page, filter)
  })

  // Callback Queries: Notifications refresh
  bot.callbackQuery(/^notif:refresh:(\d+):(all|unread)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1
    const filter = ctx.match[2] as 'all' | 'unread'
    await handleNotifications(ctx, page, filter)
  })

  // Callback Queries: Notification single mark as read
  bot.callbackQuery(/^notif:read:(.+)$/, async (ctx) => {
    const notificationId = ctx.match[1]
    await handleNotificationRead(ctx, notificationId)
  })

  // Callback Queries: Notification mark all as read
  bot.callbackQuery('notif:read_all', async (ctx) => {
    await handleNotificationReadAll(ctx)
  })

  // Callback Queries: Notification list entry shortcut
  bot.callbackQuery(/^notif:list:(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10) || 1
    await handleNotifications(ctx, page, 'all')
  })

  // Callback Queries: Navigation - Back to main menu
  bot.callbackQuery('nav:main', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {})
    let isLinked = false
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null

    if (telegramId) {
      await clearBotLoginSession(telegramId)
      const u = await prisma.user.findUnique({
        where: { telegramId },
      })
      isLinked = Boolean(u?.phone)
    }

    if (isLinked) {
      const kb = await getUpdatedMainMenuKeyboard(telegramId)
      await ctx.reply(MESSAGES.mainMenuPrompt, {
        reply_markup: kb,
      })
    } else {
      await startLoginFlow(ctx)
    }
  })

  // Callback Queries: No-op
  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {})
  })

  // Text message handler for Auth, Checkout fields, and Fallback
  bot.on('message:text', async (ctx) => {
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    const text = ctx.msg?.text?.trim() || ''

    if (telegramId) {
      const session = await getBotLoginSession(telegramId)

      // 1. If currently waiting for dynamic checkout field
      if (session?.step === 'AWAITING_CHECKOUT_FIELD' && session.planId && session.currentFieldKey) {
        const checkoutData = session.checkoutData || {}
        checkoutData[session.currentFieldKey] = text

        // Check if there are other required fields for this plan
        const plan = await prisma.plan.findUnique({ where: { id: session.planId } })
        const fields = (Array.isArray(plan?.checkoutFields) ? plan.checkoutFields : []) as any[]
        const remaining = fields.filter((f) => f.required && !checkoutData[f.key])

        if (remaining.length > 0) {
          const nextField = remaining[0]
          const { setBotLoginSession } = await import('../account-linking')
          await setBotLoginSession(telegramId, {
            ...session,
            currentFieldKey: nextField.key,
            currentFieldLabel: nextField.label,
            checkoutData,
          })
          await ctx.reply(`لطفاً **${nextField.label}** خود را وارد فرمایید:`)
          return
        }

        // All fields collected!
        await clearBotLoginSession(telegramId)
        const u = await prisma.user.findUnique({ where: { telegramId } })
        if (u && ctx.chat) {
          const { executeBotOrderCreation } = await import('./buy')
          await executeBotOrderCreation(ctx, u, session.planId, checkoutData, String(ctx.chat.id))
          return
        }
      }

      // 2. If currently waiting for OTP code
      if (session?.step === 'AWAITING_OTP') {
        const handled = await processOtpInput(ctx, text)
        if (handled) return
      }

      // 3. If waiting for phone OR message looks like an Iranian phone number
      const normalized = normalizePhone(text)
      if (session?.step === 'AWAITING_PHONE' || isValidIranianPhone(normalized)) {
        await processPhoneInput(ctx, text)
        return
      }

      // 3. If user is not yet logged in with phone, guide to login
      const u = await prisma.user.findUnique({
        where: { telegramId },
      })

      if (!u?.phone) {
        await startLoginFlow(ctx)
        return
      }
    }

    const kb = await getUpdatedMainMenuKeyboard(telegramId)
    await ctx.reply(MESSAGES.mainMenuPrompt, {
      reply_markup: kb,
    })
  })
}
