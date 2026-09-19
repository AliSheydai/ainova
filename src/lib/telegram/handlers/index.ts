import { type Bot } from 'grammy'
import { BUTTONS, mainMenuKeyboard, orderCreatedKeyboard } from '../keyboards'
import { MESSAGES } from '../messages'
import { escapeHtml } from '../formatting'
import { handleStart } from './start'
import { handleShowProducts, handleSelectProduct, handleSelectVariant, handleBuyProduct, handleBuyCallback } from './buy'
import {
  handleOrders,
  handleFixCredentialsPrompt,
  handleCancelFixCredentials,
  handleProcessCredentialsFix,
  handleKeepEmail,
  handleKeepPassword,
  handleSkipNote,
  handleSubmitCredentials,
} from './orders'
import {
  handleNotifications,
  handleNotificationRead,
  handleNotificationReadAll,
} from './notifications'
import {
  handleGuide,
  handleGuideLink,
  handleGuideEmail,
  handleGuideTips,
  handleGuideFaq,
} from './guide'
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

  // Command /guide
  bot.command(['guide', 'help_activation', 'help', 'rahnama'], handleGuide)

  // Command /logout
  bot.command('logout', async (ctx) => {
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    if (telegramId) {
      await logoutTelegramAccount(telegramId)
    }
    await ctx.reply(MESSAGES.logoutSuccess, {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(false),
    })
  })

  // Reply Keyboard Buttons
  bot.hears(
    [
      BUTTONS.BUY,
      '🛒 خرید اشتراک',
      '🛒 خرید Google AI Pro',
      'خرید Google AI Pro',
      '🛒 خرید',
      'خرید',
      'خرید اشتراک جمینای',
      'خرید محصول',
      'محصولات',
      'فروشگاه',
    ],
    handleShowProducts
  )
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
  bot.hears(
    [
      BUTTONS.GUIDE,
      /^(?:📖\s*)?راهنما(?:ی)?(?:\s|[\u200c])*(?:فعال(?:\s|[\u200c])*ساز(?:ی)?)?$/,
      /^(?:📖\s*)?آموزش(?:\s|[\u200c])*(?:فعال(?:\s|[\u200c])*ساز(?:ی)?)?$/,
      'راهنما',
      'راهنمای فعال‌سازی',
      'راهنمای فعال سازی',
      'راهنمای فعالسازی',
      'آموزش فعال‌سازی',
      'آموزش فعال سازی',
      'آموزش فعالسازی',
      'آموزش',
      'راهنمایی',
    ],
    handleGuide
  )
  bot.hears(BUTTONS.SUPPORT, handleSupport)
  bot.hears(BUTTONS.LINK_ACCOUNT, handleLinkPrompt)

  // Logout Button
  bot.hears([BUTTONS.LOGOUT, 'خروج از حساب کاربری', 'خروج از حساب'], async (ctx) => {
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    if (telegramId) {
      await logoutTelegramAccount(telegramId)
    }
    await ctx.reply(MESSAGES.logoutSuccess, {
      parse_mode: 'HTML',
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
        parse_mode: 'HTML',
        reply_markup: kb,
      })
    } else {
      await ctx.reply(MESSAGES.mainMenuPrompt, {
        parse_mode: 'HTML',
        reply_markup: mainMenuKeyboard(false, 0),
      })
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

  // Callback queries for activation guide
  bot.callbackQuery(['guide', 'guide:menu'], handleGuide)
  bot.callbackQuery('guide:link', handleGuideLink)
  bot.callbackQuery('guide:email', handleGuideEmail)
  bot.callbackQuery('guide:tips', handleGuideTips)
  bot.callbackQuery('guide:faq', handleGuideFaq)

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

  // Callback Queries: Select product variant
  bot.callbackQuery(/^variant:select:(.+)$/, async (ctx) => {
    const variantId = ctx.match[1]
    await handleSelectVariant(ctx, variantId)
  })

  // Callback Queries: Buy specific plan
  bot.callbackQuery(/^plan:buy:(.+)$/, async (ctx) => {
    const { handleBuyPlan } = await import('./buy')
    const planId = ctx.match[1]
    await handleBuyPlan(ctx, planId)
  })

  // Callback Queries: Select delivery mode (Ready Account vs Own Gmail)
  bot.callbackQuery(/^delivery:mode:(.+):(ready|own|exhausted)$/, async (ctx) => {
    const { handleSelectDeliveryPreference } = await import('./buy')
    const planId = ctx.match[1]
    const mode = ctx.match[2] as 'ready' | 'own' | 'exhausted'
    await handleSelectDeliveryPreference(ctx, planId, mode)
  })

  // Callback Queries: Confirm and pay order
  bot.callbackQuery(/^order:pay:(.+)$/, async (ctx) => {
    const planId = ctx.match[1]
    const from = ctx.from
    if (!from || !ctx.chat) return

    const telegramId = String(from.id)
    await ctx.answerCallbackQuery({ text: 'در حال ثبت سفارش و اتصال به درگاه پرداخت...' }).catch(() => {})

    const u = await prisma.user.findUnique({ where: { telegramId } })
    if (!u || !u.phone) {
      const { startLoginFlow } = await import('./auth')
      await startLoginFlow(ctx)
      return
    }

    const session = await getBotLoginSession(telegramId)
    const { executeBotOrderCreation } = await import('./buy')
    await executeBotOrderCreation(
      ctx,
      u,
      planId,
      session?.checkoutData || {},
      String(ctx.chat.id),
      session?.couponCode,
      session?.variantId
    )
  })

  // Callback Queries: Prompt for coupon code
  bot.callbackQuery(/^order:coupon:prompt:(.+)$/, async (ctx) => {
    const targetId = ctx.match[1]
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    if (!telegramId) return

    await ctx.answerCallbackQuery().catch(() => {})

    // Check if targetId is an orderId
    const order = await prisma.order.findUnique({
      where: { id: targetId },
      include: { plan: { include: { product: true } } },
    })

    if (order && order.status === 'PENDING_PAYMENT') {
      const session = (await getBotLoginSession(telegramId)) || {
        step: 'AWAITING_COUPON',
        planId: order.planId,
        productId: order.productId,
        orderId: order.id,
      }

      const { setBotLoginSession } = await import('../account-linking')
      await setBotLoginSession(telegramId, {
        ...session,
        planId: order.planId,
        productId: order.productId,
        orderId: order.id,
        step: 'AWAITING_COUPON',
      })

      await ctx.reply(MESSAGES.couponPrompt(order.amount), { parse_mode: 'HTML' })
      return
    }

    // Fallback if targetId is planId
    const plan = await prisma.plan.findUnique({ where: { id: targetId } })
    if (!plan) return

    const session = (await getBotLoginSession(telegramId)) || {
      step: 'AWAITING_CHECKOUT_FIELD',
      planId: plan.id,
      productId: plan.productId,
      checkoutData: {},
    }

    const { setBotLoginSession } = await import('../account-linking')
    await setBotLoginSession(telegramId, {
      ...session,
      planId: plan.id,
      step: 'AWAITING_COUPON',
    })

    await ctx.reply(MESSAGES.couponPrompt(plan.price), { parse_mode: 'HTML' })
  })

  // Callback Queries: Remove coupon code
  bot.callbackQuery(/^order:coupon:remove:(.+)$/, async (ctx) => {
    const targetId = ctx.match[1]
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    if (!telegramId) return

    const order = await prisma.order.findUnique({
      where: { id: targetId },
      include: { plan: { include: { product: true } }, variant: true },
    })

    if (order && order.status === 'PENDING_PAYMENT') {
      const hasVariantDiscount =
        order.variant?.discountedPrice !== null &&
        order.variant?.discountedPrice !== undefined &&
        order.variant.discountedPrice > 0 &&
        order.variant.discountedPrice < order.variant.price

      const basePrice = order.variant
        ? (hasVariantDiscount ? order.variant.discountedPrice! : order.variant.price)
        : order.plan.price

      if (order.couponId) {
        await prisma.$transaction(async (tx) => {
          await tx.coupon.updateMany({
            where: { id: order.couponId!, usedCount: { gt: 0 } },
            data: { usedCount: { decrement: 1 } },
          })
          await tx.order.update({
            where: { id: order.id },
            data: {
              amount: basePrice,
              discountAmount: 0,
              couponId: null,
            },
          })
        })
      }

      const session = await getBotLoginSession(telegramId)
      if (session) {
        session.couponCode = undefined
        session.couponDiscount = undefined
        const { setBotLoginSession } = await import('../account-linking')
        await setBotLoginSession(telegramId, session)
      }

      // Re-initialize payment with base amount
      const { PaymentService } = await import('@/lib/payment')
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const callbackUrl = `${appUrl}/api/payment/callback?source=telegram&orderId=${order.id}`
      const productTitle = order.plan.product.title
      const variantSuffix = order.variant?.name ? ` [${order.variant.name}]` : ''
      const u = await prisma.user.findUnique({ where: { telegramId } })

      const payResult = await PaymentService.createPayment({
        orderId: order.id,
        amount: basePrice,
        description: `خرید (telegram): ${productTitle}${variantSuffix} (${order.plan.name})`,
        callbackUrl,
        mobile: u?.phone || undefined,
      })

      await ctx.answerCallbackQuery({ text: 'کد تخفیف حذف گردید.' }).catch(() => {})

      const updatedText = MESSAGES.orderCreated(
        order.id,
        `${productTitle}${variantSuffix} (${order.plan.name})`,
        basePrice,
        {
          variantName: order.variant?.name,
        }
      )
      const kb = orderCreatedKeyboard(order.id, payResult.paymentUrl || '', false)

      await ctx.editMessageText(updatedText, {
        parse_mode: 'HTML',
        reply_markup: kb,
      }).catch(async () => {
        await ctx.reply(updatedText, { parse_mode: 'HTML', reply_markup: kb })
      })
      return
    }

    // Fallback for planId
    const session = await getBotLoginSession(telegramId)
    if (session) {
      session.couponCode = undefined
      session.couponDiscount = undefined
      const { setBotLoginSession } = await import('../account-linking')
      await setBotLoginSession(telegramId, session)
    }

    await ctx.answerCallbackQuery({ text: 'کد تخفیف حذف گردید.' }).catch(() => {})
    const { proceedToOrderCreation } = await import('./buy')
    await proceedToOrderCreation(ctx, targetId)
  })

  // Callback Queries: Cancel order checkout
  bot.callbackQuery(/^order:cancel:(.+)$/, async (ctx) => {
    const targetId = ctx.match[1]
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    if (telegramId) {
      await clearBotLoginSession(telegramId)
    }

    // Check if targetId is an orderId
    const order = await prisma.order.findUnique({
      where: { id: targetId },
      include: { plan: true },
    })

    if (order && order.status === 'PENDING_PAYMENT') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        })
        await tx.inventoryItem.updateMany({
          where: { orderId: order.id, status: 'RESERVED' },
          data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
        })
        if (order.couponId) {
          await tx.coupon.updateMany({
            where: { id: order.couponId, usedCount: { gt: 0 } },
            data: { usedCount: { decrement: 1 } },
          })
        }
      })
      await ctx.answerCallbackQuery({ text: 'سفارش لغو شد.' }).catch(() => {})
      const { toPersianDigits } = await import('@/lib/persian-utils')
      await ctx.reply(`❌ سفارش #${toPersianDigits(order.id.slice(-6).toUpperCase())} با موفقیت لغو شد.`)
      const { handleShowProducts } = await import('./buy')
      await handleShowProducts(ctx)
      return
    }

    await ctx.answerCallbackQuery({ text: 'سفارش لغو شد.' }).catch(() => {})

    const plan = await prisma.plan.findUnique({ where: { id: targetId } })
    if (plan) {
      const { handleSelectProduct } = await import('./buy')
      await handleSelectProduct(ctx, plan.productId)
    } else {
      const { handleShowProducts } = await import('./buy')
      await handleShowProducts(ctx)
    }
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
        parse_mode: 'HTML',
        reply_markup: kb,
      })
    } else {
      await startLoginFlow(ctx)
    }
  })

  // Callback Queries: Fix credentials wizard callbacks
  bot.callbackQuery('fix_cred:keep_email', handleKeepEmail)
  bot.callbackQuery('fix_cred:keep_pass', handleKeepPassword)
  bot.callbackQuery('fix_cred:skip_note', handleSkipNote)
  bot.callbackQuery('fix_cred:submit', handleSubmitCredentials)

  // Callback Queries: Fix credentials for order
  bot.callbackQuery(/^fix_cred:(.+)$/, async (ctx) => {
    const orderId = ctx.match[1]
    await handleFixCredentialsPrompt(ctx, orderId)
  })

  // Callback Queries: Cancel fix credentials
  bot.callbackQuery(/^order:fix_cancel:(.+)$/, async (ctx) => {
    const orderId = ctx.match[1]
    await handleCancelFixCredentials(ctx, orderId)
  })

  // Callback Queries: No-op
  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {})
  })

  // Text message handler for Auth, Checkout fields, Gmail, Password, Coupon, and Fallback
  bot.on('message:text', async (ctx) => {
    const telegramId = ctx.from?.id ? String(ctx.from.id) : null
    const text = ctx.msg?.text?.trim() || ''

    if (telegramId) {
      const session = await getBotLoginSession(telegramId)

      // 0. If user is fixing credentials / password / note for an order
      if (
        session &&
        (session.step?.startsWith('FIX_CRED_') || session.step === 'AWAITING_CREDENTIALS_FIX') &&
        session.orderId
      ) {
        const handled = await handleProcessCredentialsFix(ctx, telegramId, session, text)
        if (handled) return
      }

      // 1. If user is entering personal Gmail address for activation
      if (session?.step === 'AWAITING_GMAIL' && session.planId) {
        const email = text.trim()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          await ctx.reply(
            '❌ فرمت آدرس جیمیل وارد شده معتبر نمی‌باشد.\n' +
            'لطفاً آدرس صحیح جیمیل خود را وارد فرمایید (مثال: example@gmail.com):'
          )
          return
        }

        const checkoutData = {
          ...(session.checkoutData || {}),
          customer_gmail: email,
          customer_email: email,
          delivery_preference: 'own_account',
        }

        const { setBotLoginSession } = await import('../account-linking')
        await setBotLoginSession(telegramId, {
          ...session,
          step: 'AWAITING_GMAIL_PASSWORD',
          checkoutData,
        })

        await ctx.reply(MESSAGES.passwordPrompt(email), { parse_mode: 'HTML' })
        return
      }

      // 2. If user is entering password for personal Gmail activation
      if (session?.step === 'AWAITING_GMAIL_PASSWORD' && session.planId) {
        const password = text.trim()
        if (password.length < 4) {
          await ctx.reply('❌ رمز عبور وارد شده بسیار کوتاه است. لطفاً رمز عبور صحیح اکانت گوگل خود را ارسال فرمایید:')
          return
        }

        const checkoutData = {
          ...(session.checkoutData || {}),
          customer_password: password,
        }

        const { setBotLoginSession } = await import('../account-linking')
        await setBotLoginSession(telegramId, {
          ...session,
          step: 'AWAITING_CHECKOUT_FIELD',
          checkoutData,
        })

        // Check if there are other custom required fields on the plan
        const plan = await prisma.plan.findUnique({ where: { id: session.planId } })
        const fields = (Array.isArray(plan?.checkoutFields) ? plan.checkoutFields : []) as any[]
        const remaining = fields.filter((f) => f.required && !checkoutData[f.key])

        if (remaining.length > 0) {
          const nextField = remaining[0]
          await setBotLoginSession(telegramId, {
            ...session,
            step: 'AWAITING_CHECKOUT_FIELD',
            currentFieldKey: nextField.key,
            currentFieldLabel: nextField.label,
            checkoutData,
          })
          await ctx.reply(`لطفاً <b>${escapeHtml(nextField.label)}</b> خود را ارسال فرمایید:`, {
            parse_mode: 'HTML',
          })
          return
        }

        // All fields collected -> Proceed directly to Order Creation
        const { proceedToOrderCreation } = await import('./buy')
        await proceedToOrderCreation(ctx, session.planId)
        return
      }

      // 3. If user is entering coupon code
      if (session?.step === 'AWAITING_COUPON') {
        const lower = text.toLowerCase()
        const orderId = session.orderId

        if (['انصراف', 'لغو', 'cancel', 'بازگشت'].includes(lower)) {
          const { setBotLoginSession } = await import('../account-linking')
          await setBotLoginSession(telegramId, {
            ...session,
            step: 'AWAITING_CHECKOUT_FIELD',
          })

          if (orderId) {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
              include: { plan: { include: { product: true } }, variant: true },
            })
            if (order) {
              const payment = await prisma.payment.findUnique({
                where: { orderId: order.id },
              })
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              const callbackUrl = `${appUrl}/api/payment/callback?source=telegram&orderId=${order.id}`
              const paymentUrl =
                payment?.gatewayResponse &&
                typeof payment.gatewayResponse === 'object' &&
                'paymentUrl' in payment.gatewayResponse
                  ? String((payment.gatewayResponse as any).paymentUrl)
                  : `${appUrl}/checkout/mock-bank?authority=${encodeURIComponent(
                      payment?.authority || ''
                    )}&amount=${order.amount}&callbackUrl=${encodeURIComponent(callbackUrl)}`

              const hasVariantDiscount =
                order.variant?.discountedPrice !== null &&
                order.variant?.discountedPrice !== undefined &&
                order.variant.discountedPrice > 0 &&
                order.variant.discountedPrice < order.variant.price

              const basePrice = order.variant
                ? (hasVariantDiscount ? order.variant.discountedPrice! : order.variant.price)
                : order.plan.price

              const variantSuffix = order.variant?.name ? ` [${order.variant.name}]` : ''
              const messageText = MESSAGES.orderCreated(
                order.id,
                `${order.plan.product.title}${variantSuffix} (${order.plan.name})`,
                order.amount,
                {
                  originalAmount: basePrice,
                  discountAmount: order.discountAmount,
                  couponCode: session.couponCode,
                  variantName: order.variant?.name,
                }
              )
              const kb = orderCreatedKeyboard(order.id, paymentUrl, Boolean(order.couponId))
              await ctx.reply(messageText, { parse_mode: 'HTML', reply_markup: kb })
              return
            }
          }

          if (session.planId) {
            const { proceedToOrderCreation } = await import('./buy')
            await proceedToOrderCreation(ctx, session.planId)
          }
          return
        }

        // If order already created
        if (orderId) {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { plan: { include: { product: true } }, variant: true },
          })

          if (!order || order.status !== 'PENDING_PAYMENT') {
            await ctx.reply('⚠️ سفارش یافت نشد یا در وضعیت انتظار پرداخت نیست.')
            await clearBotLoginSession(telegramId)
            return
          }

          const hasVariantDiscount =
            order.variant?.discountedPrice !== null &&
            order.variant?.discountedPrice !== undefined &&
            order.variant.discountedPrice > 0 &&
            order.variant.discountedPrice < order.variant.price

          const basePrice = order.variant
            ? (hasVariantDiscount ? order.variant.discountedPrice! : order.variant.price)
            : order.plan.price

          const { CouponService } = await import('@/lib/discounts/coupon-service')
          const couponValidation = await CouponService.validateAndCalculate(
            text,
            basePrice,
            order.productId,
            order.userId
          )

          if (!couponValidation.valid || !couponValidation.coupon) {
            await ctx.reply(
              `❌ <b>کد تخفیف نامعتبر است</b>\n\n` +
              `${escapeHtml(couponValidation.error || 'کد وارد شده یافت نشد یا منقضی شده است.')}\n\n` +
              `لطفاً کد دیگری ارسال فرمایید یا در صورت انصراف، کلمه «انصراف» را ارسال کنید.`,
              { parse_mode: 'HTML' }
            )
            return
          }

          const discountAmount = couponValidation.discountAmount || 0
          const newAmount = Math.max(0, basePrice - discountAmount)

          if (newAmount < 1000) {
            await ctx.reply('❌ مبلغ سفارش پس از تخفیف کمتر از حداقل مجاز درگاه (۱,۰۰۰ تومان) است.')
            return
          }

          try {
            await prisma.$transaction(async (tx) => {
              // Release previous coupon if different
              if (order.couponId && order.couponId !== couponValidation.coupon!.id) {
                await tx.coupon.updateMany({
                  where: { id: order.couponId, usedCount: { gt: 0 } },
                  data: { usedCount: { decrement: 1 } },
                })
              }

              // Atomically reserve new coupon
              if (order.couponId !== couponValidation.coupon!.id) {
                const couponCheck = await tx.$queryRaw<
                  Array<{ id: string; usedCount: number; maxUses: number | null }>
                >`
                  SELECT id, "usedCount", "maxUses" FROM coupons
                  WHERE id = ${couponValidation.coupon!.id}
                  FOR UPDATE
                `
                if (!couponCheck || couponCheck.length === 0) {
                  throw new Error('کد تخفیف یافت نشد.')
                }
                if (
                  couponCheck[0].maxUses !== null &&
                  couponCheck[0].usedCount >= couponCheck[0].maxUses
                ) {
                  throw new Error('ظرفیت استفاده از این کد تخفیف تکمیل شده است.')
                }
                await tx.coupon.update({
                  where: { id: couponValidation.coupon!.id },
                  data: { usedCount: { increment: 1 } },
                })
              }

              // Update order
              await tx.order.update({
                where: { id: order.id },
                data: {
                  amount: newAmount,
                  discountAmount,
                  couponId: couponValidation.coupon!.id,
                },
              })
            })
          } catch (err: unknown) {
            await ctx.reply(`❌ خطا در اعمال کد تخفیف: ${err instanceof Error ? err.message : 'لطفاً دوباره تلاش کنید.'}`)
            return
          }

          // Re-initialize payment with new amount
          const { PaymentService } = await import('@/lib/payment')
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const callbackUrl = `${appUrl}/api/payment/callback?source=telegram&orderId=${order.id}`
          const productTitle = order.plan.product.title
          const variantSuffix = order.variant?.name ? ` [${order.variant.name}]` : ''

          const u = await prisma.user.findUnique({ where: { telegramId } })
          const payResult = await PaymentService.createPayment({
            orderId: order.id,
            amount: newAmount,
            description: `خرید (telegram): ${productTitle}${variantSuffix} (${order.plan.name})`,
            callbackUrl,
            mobile: u?.phone || undefined,
          })

          const { setBotLoginSession } = await import('../account-linking')
          await setBotLoginSession(telegramId, {
            ...session,
            step: 'AWAITING_CHECKOUT_FIELD',
            couponCode: couponValidation.coupon.code,
            couponDiscount: discountAmount,
          })

          await ctx.reply(
            `🎉 کد تخفیف <code>${escapeHtml(couponValidation.coupon.code)}</code> با موفقیت اعمال گردید!`,
            { parse_mode: 'HTML' }
          )

          const updatedText = MESSAGES.orderCreated(
            order.id,
            `${productTitle}${variantSuffix} (${order.plan.name})`,
            newAmount,
            {
              originalAmount: basePrice,
              discountAmount,
              couponCode: couponValidation.coupon.code,
              variantName: order.variant?.name,
            }
          )

          const kb = orderCreatedKeyboard(order.id, payResult.paymentUrl || '', true)
          await ctx.reply(updatedText, {
            parse_mode: 'HTML',
            reply_markup: kb,
          })
          return
        }

        // Fallback for plan before order creation
        if (session.planId) {
          const plan = await prisma.plan.findUnique({ where: { id: session.planId } })
          if (!plan) return

          let botUserId: string | null = null
          if (session.phone) {
            const botUser = await prisma.user.findUnique({ where: { phone: session.phone }, select: { id: true } })
            botUserId = botUser?.id || null
          }

          const { CouponService } = await import('@/lib/discounts/coupon-service')
          const couponValidation = await CouponService.validateAndCalculate(
            text,
            plan.price,
            plan.productId,
            botUserId
          )

          if (couponValidation.valid && couponValidation.coupon) {
            const { setBotLoginSession } = await import('../account-linking')
            await setBotLoginSession(telegramId, {
              ...session,
              step: 'AWAITING_CHECKOUT_FIELD',
              couponCode: couponValidation.coupon.code,
              couponDiscount: couponValidation.discountAmount,
            })

            await ctx.reply(
              `🎉 کد تخفیف <code>${escapeHtml(couponValidation.coupon.code)}</code> با موفقیت اعمال گردید!`,
              { parse_mode: 'HTML' }
            )
            const { proceedToOrderCreation } = await import('./buy')
            await proceedToOrderCreation(ctx, session.planId)
            return
          }

          await ctx.reply(
            `❌ <b>کد تخفیف نامعتبر است</b>\n\n` +
            `${escapeHtml(couponValidation.error || 'کد وارد شده یافت نشد یا منقضی شده است.')}\n\n` +
            `لطفاً کد دیگری ارسال فرمایید یا در صورت انصراف، کلمه «انصراف» را ارسال کنید.`,
            { parse_mode: 'HTML' }
          )
          return
        }
      }

      // 4. If currently waiting for dynamic checkout field
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
          await ctx.reply(`لطفاً <b>${escapeHtml(nextField.label)}</b> خود را ارسال فرمایید:`, {
            parse_mode: 'HTML',
          })
          return
        }

        // All fields collected -> Proceed directly to Order Creation
        const { setBotLoginSession } = await import('../account-linking')
        await setBotLoginSession(telegramId, {
          ...session,
          currentFieldKey: undefined,
          currentFieldLabel: undefined,
          checkoutData,
        })

        const { proceedToOrderCreation } = await import('./buy')
        await proceedToOrderCreation(ctx, session.planId)
        return
      }

      // 5. If currently waiting for OTP code
      if (session?.step === 'AWAITING_OTP') {
        const handled = await processOtpInput(ctx, text)
        if (handled) return
      }

      // 6. If waiting for phone OR message looks like an Iranian phone number
      const normalized = normalizePhone(text)
      if (session?.step === 'AWAITING_PHONE' || isValidIranianPhone(normalized)) {
        await processPhoneInput(ctx, text)
        return
      }

      // 7. If user is not yet logged in with phone, guide to login
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
      parse_mode: 'HTML',
      reply_markup: kb,
    })
  })
}
