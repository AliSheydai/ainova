import { type Context, InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'
import { BotStoreService } from '@/lib/bot/bot-store-service'
import { CouponService } from '@/lib/discounts/coupon-service'
import { MESSAGES } from '../messages'
import {
  deliveryPreferenceKeyboard,
  orderSummaryKeyboard,
  orderPaymentKeyboard,
} from '../keyboards'
import {
  setBotLoginSession,
  getBotLoginSession,
  clearBotLoginSession,
  type BotLoginSession,
} from '../account-linking'
import { formatPrice } from '@/lib/persian-utils'

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
      `🛍 **فروشگاه اشتراک‌های رسمی هوش مصنوعی و دیجیتال**\n\n` +
      `لطفاً محصول مورد نظر خود را جهت مشاهده مشخصات، پلن‌ها و خرید انتخاب فرمایید:`

    const keyboard = new InlineKeyboard()
    for (const p of products) {
      const stockBadge = p.stock > 0 ? `✅ موجود` : '❌ ناموجود'
      keyboard
        .text(`📦 ${p.title} — از ${p.price.toLocaleString('fa-IR')} ت (${stockBadge})`, `product:select:${p.id}`)
        .row()
    }

    keyboard.text('🔙 منوی اصلی', 'nav:main')

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard })
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard })
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

    let detailsText = `✨ **${title}** ✨\n\n`
    if (product.shortDescription) {
      detailsText += `📝 ${product.shortDescription}\n\n`
    }

    // Highlight key features if available
    if (Array.isArray(product.features) && product.features.length > 0) {
      detailsText += `🌟 **ویژگی‌های برجسته:**\n`
      const displayFeatures = product.features.slice(0, 4)
      for (const feat of displayFeatures) {
        const featText = typeof feat === 'string' ? feat : (feat as any)?.text || (feat as any)?.title || ''
        if (featText) {
          detailsText += ` • ${featText}\n`
        }
      }
      detailsText += `\n`
    } else if (product.description) {
      detailsText += `📋 **توضیحات:**\n${product.description.slice(0, 250)}...\n\n`
    }

    detailsText += `━━━━━━━━━━━━━━━━━━━━\n`
    detailsText += `📦 **پلن‌های قابل سفارش این محصول:**\n\n`

    const keyboard = new InlineKeyboard()

    for (const plan of plans) {
      const isPreCreated = plan.fulfillmentType === 'PRE_CREATED_ACCOUNT'
      const warehouseStock = plan.availableInventoryCount ?? 0
      const isAvailable = isPreCreated ? true : plan.stock > 0
      const fulfillmentBadge = getFulfillmentLabel(plan.fulfillmentType)

      detailsText += `🔹 **پلن ${plan.name}**\n`
      detailsText += `   💵 قیمت: **${formatPrice(plan.price)}**\n`
      detailsText += `   🚀 روش تحویل: **${fulfillmentBadge}**\n`

      if (isPreCreated) {
        if (warehouseStock > 0) {
          detailsText += `   📦 وضعیت: ✅ موجود در انبار (${warehouseStock.toLocaleString('fa-IR')} اکانت آماده) یا فعال‌سازی روی جیمیل شما\n\n`
        } else {
          detailsText += `   📦 وضعیت: ✅ فعال‌سازی روی جیمیل شخصی شما (انبار آماده موقتاً اتمام)\n\n`
        }
      } else {
        detailsText += `   📦 وضعیت: ${isAvailable ? `✅ آماده تحویل (${plan.stock.toLocaleString('fa-IR')} عدد)` : '❌ موقتاً ناموجود'}\n\n`
      }

      if (isAvailable) {
        keyboard
          .text(`🛒 سفارش پلن ${plan.name} — ${formatPrice(plan.price)}`, `plan:buy:${plan.id}`)
          .row()
      }
    }

    keyboard.text('🔙 بازگشت به لیست محصولات', 'nav:products').row()
    keyboard.text('🏠 منوی اصلی', 'nav:main')

    if (ctx.callbackQuery) {
      await ctx.editMessageText(detailsText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }).catch(async () => {
        await ctx.reply(detailsText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        })
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(detailsText, {
        parse_mode: 'Markdown',
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
      await startLoginFlow(ctx, '⚠️ برای خرید اشتراک و دریافت آنی، ابتدا باید با شماره موبایل خود وارد شوید:')
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
          parse_mode: 'Markdown',
          reply_markup: kb,
        }).catch(async () => {
          await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: kb })
        })
      } else {
        await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: kb })
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
        `📝 **تکمیل اطلاعات سفارش برای پلن «${plan.name}»:**\n\n` +
        `لطفاً **${firstField.label}** خود را در چت ارسال فرمایید:`
      )
      return
    }

    // 5. No extra fields required -> render Order Summary Card
    await renderOrderSummary(ctx, plan.id)
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
    await ctx.answerCallbackQuery({
      text: 'موجودی اکانت‌های آماده انبار موقتاً تمام شده است. لطفاً گزینه «فعال‌سازی روی جیمیل شخصی» را انتخاب فرمایید.',
      show_alert: true,
    }).catch(() => {})
    return
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
    // Check warehouse availability
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

    if (warehouseCount <= 0) {
      await ctx.reply(
        '⚠️ موجودی اکانت‌های آماده انبار به اتمام رسیده است. لطفاً سفارش خود را با گزینه «فعال‌سازی روی جیمیل شخصی» تکمیل نمایید.'
      )
      return
    }

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

    // Advance directly to Order Summary Card
    await renderOrderSummary(ctx, plan.id)
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

    await ctx.reply(MESSAGES.gmailPrompt(plan.name), { parse_mode: 'Markdown' })
  }
}

export async function renderOrderSummary(ctx: Context, planId: string) {
  const from = ctx.from
  if (!from) return
  const telegramId = String(from.id)

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { product: true },
  })

  if (!plan || !plan.active) {
    await ctx.reply('پلن انتخابی یافت نشد یا غیرفعال است.')
    return
  }

  const session = (await getBotLoginSession(telegramId)) || {
    step: 'AWAITING_CHECKOUT_FIELD',
    planId: plan.id,
    productId: plan.productId,
    checkoutData: {},
  }

  const checkoutData = session.checkoutData || {}
  const isOwnAccount =
    session.deliveryPreference === 'own_account' ||
    checkoutData.delivery_preference === 'own_account'

  let deliveryLabel = getFulfillmentLabel(plan.fulfillmentType)
  if (plan.fulfillmentType === 'PRE_CREATED_ACCOUNT') {
    deliveryLabel = isOwnAccount
      ? 'فعال‌سازی روی جیمیل شخصی شما (۱ الی ۲۴ ساعت)'
      : 'اکانت آماده از انبار (تحویل فوری ۰ ثانیه)'
  }

  const baseAmount = plan.price
  let finalAmount = baseAmount
  let discountAmount = 0

  if (session.couponCode) {
    const couponValidation = await CouponService.validateAndCalculate(
      session.couponCode,
      baseAmount,
      plan.productId
    )
    if (couponValidation.valid && couponValidation.discountAmount !== undefined) {
      discountAmount = couponValidation.discountAmount
      finalAmount = couponValidation.finalAmount ?? (baseAmount - discountAmount)
    } else {
      // Coupon became invalid
      session.couponCode = undefined
      session.couponDiscount = undefined
      await setBotLoginSession(telegramId, session)
    }
  }

  const summaryText = MESSAGES.orderSummaryCard({
    productTitle: plan.product.title,
    planName: plan.name,
    deliveryLabel,
    amount: finalAmount,
    originalAmount: baseAmount,
    discountAmount,
    couponCode: session.couponCode,
    customerGmail: checkoutData.customer_gmail || checkoutData.customer_email,
  })

  const kb = orderSummaryKeyboard(plan.id, Boolean(session.couponCode))

  if (ctx.callbackQuery) {
    await ctx.editMessageText(summaryText, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    }).catch(async () => {
      await ctx.reply(summaryText, { parse_mode: 'Markdown', reply_markup: kb })
    })
  } else {
    await ctx.reply(summaryText, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    })
  }
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

    let messageText = MESSAGES.orderCreated(
      result.order.id,
      `${result.productTitle} (${result.planName})`,
      result.amount
    )

    const isLocalhost =
      result.paymentUrl.includes('localhost') || result.paymentUrl.includes('127.0.0.1')

    if (isLocalhost) {
      messageText += `\n\n💳 **لینک مستقیم درگاه پرداخت (توسعه):**\n\`${result.paymentUrl}\``
    }

    const keyboard = orderPaymentKeyboard(result.paymentUrl)

    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  } catch (error: unknown) {
    console.error('Error in executeBotOrderCreation:', error)
    await ctx.reply(`❌ خطا در ثبت سفارش: ${error instanceof Error ? error.message : 'لطفاً مجدداً تلاش نمایید.'}`)
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
