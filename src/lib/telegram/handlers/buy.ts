import { type Context, InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'
import { BotStoreService } from '@/lib/bot/bot-store-service'
import { CouponService } from '@/lib/discounts/coupon-service'
import { MESSAGES } from '../messages'
import {
  deliveryPreferenceKeyboard,
  orderSummaryKeyboard,
  orderPaymentKeyboard,
  orderCreatedKeyboard,
} from '../keyboards'
import {
  setBotLoginSession,
  getBotLoginSession,
  clearBotLoginSession,
  type BotLoginSession,
} from '../account-linking'
import { formatPrice } from '@/lib/persian-utils'
import { escapeHtml } from '../formatting'

export function getFulfillmentLabel(type?: string): string {
  switch (type) {
    case 'ACTIVATION_LINK':
      return 'لینک فعال‌سازی آنی'
    case 'PRE_CREATED_ACCOUNT':
      return 'اکانت اختصاصی'
    case 'CUSTOMER_PROVISIONING':
      return 'فعال‌سازی روی اکانت شما'
    case 'MANUAL':
      return 'تحویل دستی پشتیبانی'
    default:
      return 'تحویل دیجیتال'
  }
}

export async function handleShowProducts(ctx: Context) {
  try {
    const products = await BotStoreService.getActiveProducts()

    if (!products || products.length === 0) {
      await ctx.reply('در حال حاضر محصول فعالی در فروشگاه موجود نیست. لطفاً بعداً مراجعه فرمایید.')
      return
    }

    const text =
      `🛍 <b>فروشگاه اشتراک‌های رسمی آریوچت</b>\n\n` +
      `مجموعه کامل سرویس‌ها و ابزارهای پریمیوم هوش مصنوعی:\n\n` +
      `• تحویل فوری و خودکار بلافاصله پس از پرداخت\n` +
      `• ضمانت سلامت و پایداری در طول دوره اشتراک\n` +
      `• پشتیبانی فنی و راهنمای مرحله‌به‌مرحله فعال‌سازی\n\n` +
      `جهت مشاهده مشخصات و پلن‌ها، محصول مورد نظر را انتخاب فرمایید:`

    const keyboard = new InlineKeyboard()
    for (const p of products) {
      const stockBadge = p.stock > 0 ? `⚡ تحویل آنی` : '🕒 ارسال طی ۱ روز کاری'
      keyboard
        .text(`📦 ${p.title} — از ${p.price.toLocaleString('fa-IR')} ت (${stockBadge})`, `product:select:${p.id}`)
        .row()
    }

    keyboard.text('🔙 منوی اصلی', 'nav:main')

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
    }
  } catch (error) {
    console.error('Error in handleShowProducts:', error)
    await ctx.reply('متأسفانه در دریافت لیست محصولات خطایی رخ داد. لطفاً دوباره تلاش کنید.')
  }
}

export async function handleSelectProduct(ctx: Context, productId: string) {
  try {
    const data = await BotStoreService.getProductPlans(productId)

    if (!data) {
      await ctx.answerCallbackQuery({ text: 'محصول یافت نشد یا غیرفعال است.', show_alert: true }).catch(() => {})
      return
    }

    const { product, plans } = data
    const title = product.title

    let detailsText = `✨ <b>${escapeHtml(title)}</b>\n\n`
    if (product.shortDescription) {
      detailsText += `${escapeHtml(product.shortDescription)}\n\n`
    }

    // Highlight key features if available
    if (Array.isArray(product.features) && product.features.length > 0) {
      detailsText += `🌟 <b>امکانات و مزایای شاخص:</b>\n`
      const displayFeatures = product.features.slice(0, 4)
      for (const feat of displayFeatures) {
        const featText = typeof feat === 'string' ? feat : (feat as any)?.text || (feat as any)?.title || ''
        if (featText) {
          detailsText += `• ${escapeHtml(featText)}\n`
        }
      }
      detailsText += `\n`
    } else if (product.description) {
      detailsText += `📋 <b>توضیحات محصول:</b>\n${escapeHtml(product.description.slice(0, 250))}...\n\n`
    }

    detailsText += `📦 <b>پلن‌های فعال و قابل سفارش:</b>\n\n`

    const keyboard = new InlineKeyboard()

    for (const plan of plans) {
      const isPreCreated = plan.fulfillmentType === 'PRE_CREATED_ACCOUNT'
      const warehouseStock = plan.availableInventoryCount ?? 0
      const isAvailable = true
      const fulfillmentBadge = getFulfillmentLabel(plan.fulfillmentType)

      detailsText += `🔹 <b>پلن ${escapeHtml(plan.name)}</b>\n`
      detailsText += `• 💵 <b>قیمت:</b> <b>${formatPrice(plan.price)}</b>\n`
      detailsText += `• 🚀 <b>شیوه تحویل:</b> <code>${escapeHtml(fulfillmentBadge)}</code>\n`

      if (isPreCreated) {
        if (warehouseStock > 0) {
          detailsText += `• 📦 <b>وضعیت:</b> ⚡ موجود در انبار (${warehouseStock.toLocaleString('fa-IR')} اکانت آماده تحویل فوری) یا فعال‌سازی روی جیمیل شما\n\n`
        } else {
          detailsText += `• 📦 <b>وضعیت:</b> 🕒 ارسال طی یک روز کاری (اکانت اختصاصی نو یا فعال‌سازی روی جیمیل شما)\n\n`
        }
      } else {
        detailsText += `• 📦 <b>وضعیت:</b> ${plan.stock > 0 ? `⚡ آماده تحویل آنی (${plan.stock.toLocaleString('fa-IR')} عدد)` : '🕒 ارسال طی یک روز کاری'}\n\n`
      }

      keyboard
        .text(`🛒 سفارش پلن ${plan.name} — ${formatPrice(plan.price)}`, `plan:buy:${plan.id}`)
        .row()
    }

    detailsText += `👇 جهت سفارش، پلن مورد نظر خود را از دکمه‌های زیر انتخاب فرمایید:`

    keyboard.text('🔙 بازگشت به لیست محصولات', 'nav:products').row()
    keyboard.text('🏠 منوی اصلی', 'nav:main')

    if (ctx.callbackQuery) {
      await ctx.editMessageText(detailsText, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }).catch(async () => {
        await ctx.reply(detailsText, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        })
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(detailsText, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })
    }
  } catch (error) {
    console.error('Error in handleSelectProduct:', error)
    await ctx.reply('خطا در دریافت اطلاعات محصول. لطفاً مجدداً تلاش کنید.')
  }
}

export async function handleBuyPlan(ctx: Context, planId: string) {
  const from = ctx.from
  if (!from || !ctx.chat) return

  const telegramId = String(from.id)

  await ctx.answerCallbackQuery({ text: 'در حال آماده‌سازی سفارش...' }).catch(() => {})

  try {
    // 1. User Auth check
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user || !user.phone) {
      const { startLoginFlow } = await import('./auth')
      await startLoginFlow(
        ctx,
        `⚠️ <b>ورود به حساب کاربری</b>\n\nبرای خرید اشتراک و تحویل آنی، لطفاً با شماره موبایل خود وارد شوید:`
      )
      return
    }

    // 2. Fetch plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true },
    })

    if (!plan || !plan.active) {
      await ctx.reply('پلن انتخاب‌شده یافت نشد یا غیرفعال است.')
      return
    }

    // 3. For PRE_CREATED_ACCOUNT: prompt user for delivery preference (Warehouse Ready Account vs Personal Gmail)
    if (plan.fulfillmentType === 'PRE_CREATED_ACCOUNT') {
      const warehouseCount = await prisma.inventoryItem.count({
        where: {
          type: 'PRE_CREATED_ACCOUNT',
          status: 'AVAILABLE',
          OR: [
            { planId: plan.id },
            { productId: plan.productId, planId: null },
          ],
        },
      })

      // Initialize session for this order
      await setBotLoginSession(telegramId, {
        step: 'AWAITING_CHECKOUT_FIELD',
        planId: plan.id,
        productId: plan.productId,
        checkoutData: {},
      })

      const message = MESSAGES.preCreatedDeliveryChoice(plan.name, warehouseCount)
      const kb = deliveryPreferenceKeyboard(plan.id, plan.productId, warehouseCount)

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'HTML',
          reply_markup: kb,
        }).catch(async () => {
          await ctx.reply(message, { parse_mode: 'HTML', reply_markup: kb })
        })
      } else {
        await ctx.reply(message, { parse_mode: 'HTML', reply_markup: kb })
      }
      return
    }

    // 4. Check if plan requires dynamic checkout fields from user
    const fields = (Array.isArray(plan.checkoutFields) ? plan.checkoutFields : []) as any[]
    const requiredFields = fields.filter((f) => f.required)

    if (requiredFields.length > 0) {
      const firstField = requiredFields[0]
      await setBotLoginSession(telegramId, {
        step: 'AWAITING_CHECKOUT_FIELD',
        planId: plan.id,
        productId: plan.productId,
        currentFieldKey: firstField.key,
        currentFieldLabel: firstField.label,
        checkoutData: {},
      })

      await ctx.reply(
        `📝 <b>تکمیل اطلاعات سفارش برای پلن «${escapeHtml(plan.name)}»:</b>\n\n` +
        `لطفاً <b>${escapeHtml(firstField.label)}</b> خود را در چت ارسال فرمایید:`,
        { parse_mode: 'HTML' }
      )
      return
    }

    // 5. No extra fields required -> proceed directly to Order Creation
    await proceedToOrderCreation(ctx, plan.id)
  } catch (error: unknown) {
    console.error('Error in handleBuyPlan:', error)
    await ctx.reply(`متأسفانه در پردازش سفارش خطایی رخ داد: ${error instanceof Error ? error.message : 'لطفاً دوباره تلاش کنید.'}`)
  }
}

export async function handleSelectDeliveryPreference(
  ctx: Context,
  planId: string,
  mode: 'ready' | 'own' | 'exhausted'
) {
  const from = ctx.from
  if (!from) return
  const telegramId = String(from.id)

  if (mode === 'exhausted') {
    mode = 'ready'
  }

  await ctx.answerCallbackQuery().catch(() => {})

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { product: true },
  })
  if (!plan) return

  const session = (await getBotLoginSession(telegramId)) || {
    step: 'AWAITING_CHECKOUT_FIELD',
    planId: plan.id,
    productId: plan.productId,
    checkoutData: {},
  }

  if (mode === 'ready') {
    const checkoutData = {
      ...(session.checkoutData || {}),
      delivery_preference: 'ready_account',
    }

    await setBotLoginSession(telegramId, {
      ...session,
      deliveryPreference: 'ready_account',
      checkoutData,
      step: 'AWAITING_CHECKOUT_FIELD',
    })

    // Advance directly to Order Creation (fulfilled instantly if stock exists, or within 1 business day if warehouse is empty)
    await proceedToOrderCreation(ctx, plan.id)
    return
  }

  if (mode === 'own') {
    // Prompt for customer Gmail
    const checkoutData = {
      ...(session.checkoutData || {}),
      delivery_preference: 'own_account',
    }

    await setBotLoginSession(telegramId, {
      ...session,
      deliveryPreference: 'own_account',
      checkoutData,
      step: 'AWAITING_GMAIL',
    })

    await ctx.reply(MESSAGES.gmailPrompt(plan.name), { parse_mode: 'HTML' })
  }
}

export async function renderOrderSummary(ctx: Context, planId: string) {
  return proceedToOrderCreation(ctx, planId)
}

export async function proceedToOrderCreation(ctx: Context, planId: string) {
  const from = ctx.from
  if (!from || !ctx.chat) return

  const telegramId = String(from.id)

  const user = await prisma.user.findUnique({
    where: { telegramId },
  })

  if (!user || !user.phone) {
    const { startLoginFlow } = await import('./auth')
    await startLoginFlow(ctx)
    return
  }

  const session = (await getBotLoginSession(telegramId)) || {
    step: 'AWAITING_CHECKOUT_FIELD',
    planId,
    checkoutData: {},
  }

  // Clean up any previous pending telegram order of this user to free reserved inventory and avoid pending count limit
  try {
    const existingPendingOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        source: 'telegram',
        status: 'PENDING_PAYMENT',
      },
    })
    for (const prevOrder of existingPendingOrders) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: prevOrder.id },
          data: { status: 'CANCELLED' },
        })
        await tx.inventoryItem.updateMany({
          where: { orderId: prevOrder.id, status: 'RESERVED' },
          data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
        })
        if (prevOrder.couponId) {
          await CouponService.decrementCouponUsage(prevOrder.couponId, tx)
        }
      })
    }
  } catch (err) {
    console.warn('Could not clean up previous pending orders:', err)
  }

  await executeBotOrderCreation(
    ctx,
    user,
    planId,
    session.checkoutData || {},
    String(ctx.chat.id),
    session.couponCode
  )
}

export async function executeBotOrderCreation(
  ctx: Context,
  user: { id: string; name?: string | null; phone?: string | null },
  planId: string,
  checkoutData: Record<string, unknown>,
  chatId: string,
  couponCode?: string
) {
  try {
    const result = await BotStoreService.createBotOrder({
      userId: user.id,
      planId,
      checkoutData,
      couponCode,
      source: 'telegram',
      chatId,
      mobile: user.phone,
    })

    const from = ctx.from
    if (from) {
      const telegramId = String(from.id)
      const session = await getBotLoginSession(telegramId)
      await setBotLoginSession(telegramId, {
        ...(session || { step: 'AWAITING_CHECKOUT_FIELD' }),
        step: 'AWAITING_CHECKOUT_FIELD',
        orderId: result.order.id,
        planId,
        productId: result.order.productId,
        couponCode: couponCode || undefined,
        couponDiscount: result.order.discountAmount || undefined,
        checkoutData,
      })
    }

    const messageText = MESSAGES.orderCreated(
      result.order.id,
      `${result.productTitle} (${result.planName})`,
      result.amount,
      {
        originalAmount: result.amount + (result.order.discountAmount || 0),
        discountAmount: result.order.discountAmount || 0,
        couponCode,
      }
    )

    const keyboard = orderCreatedKeyboard(
      result.order.id,
      result.paymentUrl,
      Boolean(result.order.couponId || couponCode)
    )

    if (ctx.callbackQuery) {
      await ctx.editMessageText(messageText, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }).catch(async () => {
        await ctx.reply(messageText, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        })
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(messageText, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })
    }
  } catch (error: unknown) {
    console.error('Error in executeBotOrderCreation:', error)
    const errText = `❌ خطا در ثبت سفارش: ${error instanceof Error ? error.message : 'لطفاً مجدداً تلاش نمایید.'}`
    if (ctx.callbackQuery) {
      await ctx.editMessageText(errText).catch(async () => {
        await ctx.reply(errText)
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(errText)
    }
  }
}

export async function handleBuyProduct(ctx: Context, productId: string) {
  return handleSelectProduct(ctx, productId)
}

export async function handleBuyCallback(ctx: Context, planOrProductId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planOrProductId },
  })
  if (plan) {
    return handleBuyPlan(ctx, planOrProductId)
  }
  return handleSelectProduct(ctx, planOrProductId)
}
