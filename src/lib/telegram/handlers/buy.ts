import { Context, InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'
import { BotStoreService } from '@/lib/bot/bot-store-service'
import { MESSAGES } from '../messages'
import {
  setBotLoginSession,
  getBotLoginSession,
  clearBotLoginSession,
} from '../account-linking'

function getFulfillmentLabel(type?: string) {
  switch (type) {
    case 'ACTIVATION_LINK':
      return 'لینک فعال‌سازی آنی'
    case 'PRE_CREATED_ACCOUNT':
      return 'اکانت از پیش آماده'
    case 'CUSTOMER_PROVISIONING':
      return 'ساخت روی ایمیل شخصی'
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

    let text = `🛍 **فروشگاه اشتراک‌های دیجیتال و هوش مصنوعی**\n\nلطفاً محصول مورد نظر خود را جهت مشاهده پلن‌ها و خرید انتخاب فرمایید:`

    const keyboard = new InlineKeyboard()
    for (const p of products) {
      const stockBadge = p.stock > 0 ? `✅ موجود (${p.stock.toLocaleString('fa-IR')})` : '❌ ناموجود'
      keyboard
        .text(`📦 ${p.title} — ${p.price.toLocaleString('fa-IR')} ت (${stockBadge})`, `product:select:${p.id}`)
        .row()
    }

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
    if (product.description) {
      detailsText += `📋 **توضیحات:**\n${product.description.slice(0, 300)}...\n\n`
    }

    detailsText += `━━━━━━━━━━━━━━━━━━━━\n`
    detailsText += `📦 **پلن‌های قابل سفارش این محصول:**\n\n`

    const keyboard = new InlineKeyboard()

    for (const plan of plans) {
      const isAvailable = plan.stock > 0
      const fulfillmentBadge = getFulfillmentLabel(plan.fulfillmentType)

      detailsText += `🔹 **پلن ${plan.name}**\n`
      detailsText += `   💵 قیمت: **${plan.price.toLocaleString('fa-IR')} تومان**\n`
      detailsText += `   🚀 روش تحویل: ${fulfillmentBadge}\n`
      detailsText += `   📦 وضعیت: ${isAvailable ? `موجود (${plan.stock.toLocaleString('fa-IR')} عدد)` : '❌ موقتاً ناموجود'}\n\n`

      if (isAvailable) {
        keyboard
          .text(`🛒 خرید ${plan.name} (${plan.price.toLocaleString('fa-IR')} ت)`, `plan:buy:${plan.id}`)
          .row()
      }
    }

    keyboard.text('🔙 بازگشت به لیست محصولات', 'nav:products')

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
  } catch (error) {
    console.error('Error in handleSelectProduct:', error)
    await ctx.reply('خطا در دریافت اطلاعات محصول. لطفاً مجدداً تلاش کنید.')
  }
}

export async function handleBuyPlan(ctx: Context, planId: string) {
  const from = ctx.from
  if (!from || !ctx.chat) return

  const telegramId = String(from.id)
  const chatId = String(ctx.chat.id)

  await ctx.answerCallbackQuery({ text: 'در حال بررسی سفارش...' }).catch(() => {})

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

    // 3. Check if plan requires checkout fields from user
    const fields = (Array.isArray(plan.checkoutFields)
      ? plan.checkoutFields
      : []) as any[]

    const requiredFields = fields.filter((f) => f.required)

    if (requiredFields.length > 0) {
      // Prompt user for the first field
      const firstField = requiredFields[0]
      await setBotLoginSession(telegramId, {
        step: 'AWAITING_CHECKOUT_FIELD',
        planId: plan.id,
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

    // 4. No extra fields required; proceed directly to order creation
    await executeBotOrderCreation(ctx, user, plan.id, {}, chatId)
  } catch (error: any) {
    console.error('Error in handleBuyPlan:', error)
    await ctx.reply(`متأسفانه در پردازش سفارش خطایی رخ داد: ${error.message || 'لطفاً دوباره تلاش کنید.'}`)
  }
}

export async function executeBotOrderCreation(
  ctx: Context,
  user: any,
  planId: string,
  checkoutData: Record<string, any>,
  chatId: string
) {
  const result = await BotStoreService.createBotOrder({
    userId: user.id,
    planId,
    checkoutData,
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

  const keyboard = new InlineKeyboard()
    .url('💳 پرداخت آنلاین شاپرک', result.paymentUrl)
    .row()
    .text('🔙 بازگشت به لیست محصولات', 'nav:products')

  await ctx.reply(messageText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  })
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
