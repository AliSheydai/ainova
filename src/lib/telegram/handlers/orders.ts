import { type Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { MESSAGES } from '../messages'
import { ordersPaginationKeyboard } from '../keyboards'
import { encryptCredential } from '@/lib/security/crypto'
import { type Prisma } from '@prisma/client'

const PAGE_SIZE = 3

function getStatusBadge(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return '✅ فعال و تکمیل شده'
    case 'PAID':
      return '⏳ پرداخت شده (در صف آماده‌سازی / فعال‌سازی)'
    case 'PENDING_PAYMENT':
      return '🟡 در انتظار پرداخت بانکی'
    case 'FAILED':
      return '❌ پرداخت ناموفق'
    case 'CANCELLED':
      return '🚫 لغو شده'
    default:
      return status
  }
}

export const handleMyOrders = (ctx: Context) => handleOrders(ctx, 1)

export async function handleOrders(ctx: Context, page: number = 1) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user || !user.phone) {
      const { startLoginFlow } = await import('./auth')
      await startLoginFlow(ctx, '⚠️ برای مشاهده سفارش‌های خود، لطفاً ابتدا وارد حساب کاربری شوید:')
      return
    }

    const totalOrders = await prisma.order.count({
      where: { userId: user.id },
    })

    if (totalOrders === 0) {
      await ctx.reply(MESSAGES.noOrders, { parse_mode: 'Markdown' })
      return
    }

    const totalPages = Math.ceil(totalOrders / PAGE_SIZE)
    const validPage = Math.max(1, Math.min(page, totalPages))
    const skip = (validPage - 1) * PAGE_SIZE

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        plan: {
          include: { product: true },
        },
        payment: true,
        activationLink: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    })

    const { BotStoreService } = await import('@/lib/bot/bot-store-service')

    let messageText = `📦 **سفارش‌های شما** (${totalOrders.toLocaleString('fa-IR')} سفارش)\n\n`

    const actionOrders: Array<{ id: string; code: string }> = []

    for (const order of orders) {
      const orderCode = order.id.slice(-6).toUpperCase()
      const dateStr = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(order.createdAt))

      const productTitle =
        order.product?.title ||
        (order.plan ? `${order.plan.product.title} (${order.plan.name})` : 'محصول')

      if (order.customerActionRequired && order.status === 'PAID') {
        actionOrders.push({ id: order.id, code: orderCode })
      }

      messageText += `**سفارش #${orderCode}** — ${productTitle}\n`
      messageText += `${dateStr} · ${order.amount.toLocaleString('fa-IR')} تومان\n`
      messageText += `وضعیت: ${getStatusBadge(order.status)}\n\n`

      const deliveryMessage = BotStoreService.formatDeliveryMessage(order)
      if (deliveryMessage) {
        messageText += `${deliveryMessage}\n\n`
      }
    }

    const keyboard = ordersPaginationKeyboard(validPage, totalPages, actionOrders)

    if (ctx.callbackQuery) {
      await ctx.editMessageText(messageText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }).catch(async () => {
        await ctx.reply(messageText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        })
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(messageText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })
    }
  } catch (error) {
    console.error('Error in handleOrders:', error)
    await ctx.reply('خطا در دریافت لیست سفارش‌ها. لطفاً دوباره تلاش کنید.')
  }
}

export async function handleFixCredentialsPrompt(ctx: Context, orderId: string) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)

  try {
    await ctx.answerCallbackQuery().catch(() => {})

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        plan: { include: { product: true } },
        user: true,
      },
    })

    if (!order) {
      await ctx.reply('❌ سفارش مورد نظر یافت نشد.')
      return
    }

    // Authorization check
    const isOwner =
      order.telegramChatId === telegramId ||
      order.user?.telegramId === telegramId

    if (!isOwner) {
      const currentUser = await prisma.user.findUnique({ where: { telegramId } })
      if (!currentUser || currentUser.id !== order.userId) {
        await ctx.reply('⚠️ شما دسترسی به اصلاح اطلاعات این سفارش را ندارید.')
        return
      }
    }

    if (order.status !== 'PAID') {
      await ctx.reply('⚠️ این سفارش در حال حاضر در وضعیتی نیست که نیازمند اصلاح اطلاعات باشد.')
      return
    }

    if (!order.customerActionRequired) {
      await ctx.reply('✅ این سفارش در انتظار اصلاح اطلاعات نیست یا قبلاً اصلاح شده است.')
      return
    }

    const checkoutData = (order.checkoutData as Record<string, any>) || {}
    const existingEmail = checkoutData.customer_gmail || checkoutData.customer_email || ''
    const existingPassword = checkoutData.customer_password || ''

    const { setBotLoginSession, getBotLoginSession } = await import('../account-linking')
    const currentSession = await getBotLoginSession(telegramId)

    await setBotLoginSession(telegramId, {
      ...(currentSession || {}),
      step: 'FIX_CRED_GMAIL',
      orderId: order.id,
      fixData: {
        email: existingEmail,
        password: existingPassword,
        note: '',
      },
    })

    const orderCode = order.id.slice(-6).toUpperCase()
    const productTitle =
      order.product?.title ||
      (order.plan ? `${order.plan.product.title} (${order.plan.name})` : 'اکانت اختصاصی')

    const adminMsg = order.adminNote || 'اطلاعات ورود نیازمند بررسی و اصلاح است.'

    let promptText = `🛠 **ویرایش اطلاعات اکانت #${orderCode}**\n\n`
    promptText += `محصول: ${productTitle}\n`
    promptText += `پیام مدیر: _${adminMsg}_\n\n`
    promptText += `**مرحله ۱ از ۳: آدرس جیمیل**\n\n`
    if (existingEmail) {
      promptText += `ایمیل فعلی: \`${existingEmail}\`\n\n`
    }
    promptText += `لطفاً آدرس جیمیل صحیح خود را ارسال کنید:\n`
    if (existingEmail) {
      promptText += `(در صورتی که جیمیل صحیح است، دکمه «تأیید همین جیمیل» را لمس کنید)`
    }

    const { fixCredentialsEmailKeyboard } = await import('../keyboards')
    await ctx.reply(promptText, {
      parse_mode: 'Markdown',
      reply_markup: fixCredentialsEmailKeyboard(order.id, existingEmail),
    })
  } catch (error) {
    console.error('Error in handleFixCredentialsPrompt:', error)
    await ctx.reply('خطا در بارگذاری اطلاعات سفارش. لطفاً مجدداً تلاش فرمایید.')
  }
}

export async function promptStepPassword(ctx: Context, telegramId: string, session: any) {
  const { setBotLoginSession } = await import('../account-linking')
  session.step = 'FIX_CRED_PASSWORD'
  await setBotLoginSession(telegramId, session)

  const { fixCredentialsPasswordKeyboard } = await import('../keyboards')
  const hasPass = Boolean(session.fixData?.password)

  let msg = `جیمیل ثبت شد: \`${session.fixData?.email}\`\n\n`
  msg += `**مرحله ۲ از ۳: رمز عبور اکانت**\n\n`
  msg += `لطفاً رمز عبور اکانت خود را ارسال فرمایید:\n`
  if (hasPass) {
    msg += `(در صورت عدم تغییر، دکمه «رمز قبلی تغییر نکند» را لمس کنید)\n\n`
  }
  msg += `نکته: در صورتی که تایید ۲ مرحله‌ای (2FA) فعال است، لطفاً آن را موقتاً خاموش نمایید.`

  await ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: fixCredentialsPasswordKeyboard(session.orderId, hasPass),
  })
}

export async function promptStepNote(ctx: Context, telegramId: string, session: any) {
  const { setBotLoginSession } = await import('../account-linking')
  session.step = 'FIX_CRED_NOTE'
  await setBotLoginSession(telegramId, session)

  const { fixCredentialsNoteKeyboard } = await import('../keyboards')

  let msg = `رمز عبور ثبت شد.\n\n`
  msg += `**مرحله ۳ از ۳: یادداشت برای پشتیبانی (اختیاری)**\n\n`
  msg += `اگر توضیحی برای مدیر دارید ارسال کنید (یا دکمه «بدون یادداشت» را لمس نمایید):`

  await ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: fixCredentialsNoteKeyboard(session.orderId),
  })
}

export async function promptStepConfirm(ctx: Context, telegramId: string, session: any) {
  const { setBotLoginSession } = await import('../account-linking')
  session.step = 'FIX_CRED_CONFIRM'
  await setBotLoginSession(telegramId, session)

  const order = await prisma.order.findUnique({
    where: { id: session.orderId },
    include: { product: true, plan: { include: { product: true } } },
  })

  const orderCode = session.orderId.slice(-6).toUpperCase()
  const productTitle =
    order?.product?.title ||
    (order?.plan ? `${order.plan.product.title} (${order.plan.name})` : 'اکانت')

  const { fixCredentialsConfirmKeyboard } = await import('../keyboards')

  let msg = `📋 **پیش‌نمایش اطلاعات سفارش #${orderCode}**\n\n`
  msg += `محصول: ${productTitle}\n`
  msg += `جیمیل: \`${session.fixData?.email || 'ثبت نشده'}\`\n`
  msg += `رمز عبور: ••••••••\n`
  msg += `یادداشت: ${session.fixData?.note ? `_${session.fixData.note}_` : '—'}\n\n`
  msg += `جهت ارسال اطلاعات به مدیر، دکمه زیر را لمس فرمایید:`

  await ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: fixCredentialsConfirmKeyboard(session.orderId),
  })
}

export async function handleKeepEmail(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  await ctx.answerCallbackQuery().catch(() => {})

  const { getBotLoginSession } = await import('../account-linking')
  const session = await getBotLoginSession(telegramId)
  if (!session || session.step !== 'FIX_CRED_GMAIL' || !session.orderId) return

  await promptStepPassword(ctx, telegramId, session)
}

export async function handleKeepPassword(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  await ctx.answerCallbackQuery().catch(() => {})

  const { getBotLoginSession } = await import('../account-linking')
  const session = await getBotLoginSession(telegramId)
  if (!session || session.step !== 'FIX_CRED_PASSWORD' || !session.orderId) return

  await promptStepNote(ctx, telegramId, session)
}

export async function handleSkipNote(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  await ctx.answerCallbackQuery().catch(() => {})

  const { getBotLoginSession } = await import('../account-linking')
  const session = await getBotLoginSession(telegramId)
  if (!session || session.step !== 'FIX_CRED_NOTE' || !session.orderId) return

  if (!session.fixData) session.fixData = {}
  session.fixData.note = ''

  await promptStepConfirm(ctx, telegramId, session)
}

export async function handleSubmitCredentials(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  await ctx.answerCallbackQuery({ text: 'در حال ثبت اطلاعات و ارجاع به مدیر...' }).catch(() => {})

  const { getBotLoginSession, clearBotLoginSession } = await import('../account-linking')
  const session = await getBotLoginSession(telegramId)
  if (!session || !session.orderId) {
    await ctx.reply('⚠️ نشست شما منقضی شده است. لطفاً مجدداً تلاش فرمایید.')
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: session.orderId },
    include: {
      product: true,
      plan: { include: { product: true } },
      user: true,
    },
  })

  if (!order) {
    await clearBotLoginSession(telegramId)
    await ctx.reply('❌ سفارش مورد نظر یافت نشد.')
    return
  }

  const fixData = session.fixData || {}
  const existingCheckout = (order.checkoutData as Record<string, unknown>) || {}
  const updatedCheckout: Record<string, unknown> = {
    ...existingCheckout,
    ...(fixData.email ? { customer_email: fixData.email, customer_gmail: fixData.email } : {}),
    ...(fixData.password ? { customer_password: encryptCredential(fixData.password.trim()) } : {}),
    ...(fixData.note ? { customer_correction_note: fixData.note } : {}),
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      checkoutData: updatedCheckout as Prisma.InputJsonValue,
      customerActionRequired: false,
      actionRequiredReason: null,
      credentialsUpdatedAt: new Date(),
      adminNote: null,
    },
  })

  await clearBotLoginSession(telegramId)

  const orderCode = order.id.slice(-6).toUpperCase()
  const serviceName =
    order.product?.title ||
    (order.plan ? `${order.plan.product.title} (${order.plan.name})` : 'اکانت')

  let confirmMsg = `🎉 **اطلاعات اکانت با موفقیت ثبت شد و برای مدیر ارسال گردید!**\n\n`
  confirmMsg += `🔢 **سفارش:** #${orderCode}\n`
  confirmMsg += `📦 **محصول:** ${serviceName}\n`
  if (fixData.email) {
    confirmMsg += `📧 **جیمیل:** \`${fixData.email}\`\n`
  }
  confirmMsg += `🔑 **رمز عبور:** با موفقیت ثبت گردید\n`
  if (fixData.note) {
    confirmMsg += `📝 **یادداشت برای پشتیبانی:** ${fixData.note}\n`
  }
  confirmMsg += `\nسفارش شما در صف بررسی و فعال‌سازی مجدد قرار گرفت. به محض تکمیل به شما اطلاع داده خواهد شد.`

  await ctx.reply(confirmMsg, { parse_mode: 'Markdown' })

  // Send notification to Admin
  const { AdminNotificationService } = await import('@/lib/notifications/admin-notification')
  const customerInfo =
    order.user?.name ||
    order.user?.phone ||
    (ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || 'کاربر ربات')

  AdminNotificationService.notifyCustomerUpdatedCredentials(
    order.id,
    customerInfo,
    serviceName
  ).catch((err) => console.error('Failed to notify admin of credentials update from bot:', err))
}

export async function handleCancelFixCredentials(ctx: Context, orderId: string) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  try {
    await ctx.answerCallbackQuery({ text: 'عملیات ویرایش اطلاعات لغو شد.' }).catch(() => {})
    const { clearBotLoginSession } = await import('../account-linking')
    await clearBotLoginSession(telegramId)

    await ctx.reply('❌ عملیات ویرایش اطلاعات اکانت لغو شد.')
    await handleOrders(ctx, 1)
  } catch (err) {
    console.error('Error in handleCancelFixCredentials:', err)
  }
}

export async function handleProcessCredentialsFix(
  ctx: Context,
  telegramId: string,
  session: any,
  text: string
): Promise<boolean> {
  const lower = text.trim().toLowerCase()
  if (['انصراف', 'لغو', 'cancel', 'بازگشت'].includes(lower)) {
    const { clearBotLoginSession } = await import('../account-linking')
    await clearBotLoginSession(telegramId)
    await ctx.reply('❌ عملیات ویرایش اطلاعات اکانت لغو شد.')
    await handleOrders(ctx, 1)
    return true
  }

  if (!session.fixData) {
    session.fixData = {}
  }

  // 1. Step: FIX_CRED_GMAIL
  if (session.step === 'FIX_CRED_GMAIL') {
    const email = text.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      await ctx.reply(
        '❌ فرمت آدرس جیمیل وارد شده معتبر نمی‌باشد.\n' +
        'لطفاً یک آدرس جیمیل صحیح وارد فرمایید (مثال: example@gmail.com):'
      )
      return true
    }

    session.fixData.email = email
    await promptStepPassword(ctx, telegramId, session)
    return true
  }

  // 2. Step: FIX_CRED_PASSWORD
  if (session.step === 'FIX_CRED_PASSWORD') {
    const password = text.trim()
    if (password.length < 4) {
      await ctx.reply(
        '❌ رمز عبور وارد شده بسیار کوتاه است.\n' +
        'لطفاً رمز عبور اکانت خود را با حداقل ۴ کاراکتر ارسال فرمایید:'
      )
      return true
    }

    session.fixData.password = password
    await promptStepNote(ctx, telegramId, session)
    return true
  }

  // 3. Step: FIX_CRED_NOTE
  if (session.step === 'FIX_CRED_NOTE') {
    session.fixData.note = text.trim()
    await promptStepConfirm(ctx, telegramId, session)
    return true
  }

  // Fallback for legacy step AWAITING_CREDENTIALS_FIX
  if (session.step === 'AWAITING_CREDENTIALS_FIX') {
    session.step = 'FIX_CRED_GMAIL'
    if (text.includes('@')) {
      session.fixData.email = text.trim()
      await promptStepPassword(ctx, telegramId, session)
    } else {
      session.fixData.password = text.trim()
      await promptStepNote(ctx, telegramId, session)
    }
    return true
  }

  return false
}
