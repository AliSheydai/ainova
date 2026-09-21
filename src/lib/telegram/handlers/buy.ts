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
  productsPaginationKeyboard,
} from '../keyboards'
import {
  setBotLoginSession,
  getBotLoginSession,
  clearBotLoginSession,
  type BotLoginSession,
} from '../account-linking'
import { formatPrice } from '@/lib/persian-utils'
import { escapeHtml, mdToTgHtml, formatProductDescriptionPreview } from '../formatting'

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

const PRODUCTS_PAGE_SIZE = 4

export async function handleShowProducts(ctx: Context, page: number = 1) {
  try {
    const allProducts = await BotStoreService.getActiveProducts()

    if (!allProducts || allProducts.length === 0) {
      await ctx.reply('در حال حاضر محصول فعالی در فروشگاه موجود نیست. لطفاً بعداً مراجعه فرمایید.')
      return
    }

    const totalProducts = allProducts.length
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PAGE_SIZE) || 1
    const validPage = Math.max(1, Math.min(page, totalPages))
    const skip = (validPage - 1) * PRODUCTS_PAGE_SIZE
    const pageProducts = allProducts.slice(skip, skip + PRODUCTS_PAGE_SIZE)

    const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

    let text =
      `🛍 <b>فروشگاه اشتراک‌های رسمی آریوچت</b> (${totalProducts.toLocaleString('fa-IR')} محصول)\n\n` +
      `مجموعه ابزارها و اشتراک‌های تخصصی هوش مصنوعی:\n` +
      `• تحویل فوری و خودکار بلافاصله پس از پرداخت\n` +
      `• ضمانت سلامت و پایداری در طول دوره اشتراک\n\n` +
      `────────────────────\n`

    pageProducts.forEach((p, idx) => {
      const numBadge = NUMBER_EMOJIS[idx] || `${(idx + 1).toLocaleString('fa-IR')}️⃣`
      const stockBadge = p.stock > 0 ? '⚡ تحویل آنی' : '🕒 ارسال طی ۱ روز کاری'
      text += `${numBadge} <b>${escapeHtml(p.title)}</b>\n`
      text += `💵 <b>شروع قیمت از:</b> ${formatPrice(p.price)}\n`
      text += `📦 <b>وضعیت تحویل:</b> <code>${stockBadge}</code>\n\n`
    })

    text += `────────────────────\n`

    if (totalPages > 1) {
      text += `📄 صفحه ${validPage.toLocaleString('fa-IR')} از ${totalPages.toLocaleString('fa-IR')}\n\n`
    }

    text += `👇 <i>جهت مشاهده مشخصات و خرید، دکمه محصول مورد نظر را انتخاب فرمایید:</i>`

    const keyboard = productsPaginationKeyboard(pageProducts, validPage, totalPages)

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard }).catch(async (err: any) => {
        if (!err?.message?.includes('message is not modified')) {
          await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard })
        }
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

export async function handleSelectProduct(ctx: Context, productId: string, fromPage: number = 1) {
  try {
    const data = await BotStoreService.getProductPlans(productId)

    if (!data) {
      await ctx.answerCallbackQuery({ text: 'محصول یافت نشد یا غیرفعال است.', show_alert: true }).catch(() => {})
      return
    }

    const { product, variants, plans } = data
    const title = product.title
    const backToProductsData = fromPage > 1 ? `products:page:${fromPage}` : 'nav:products'

    // If product has active variants, show variant cards first
    if (variants && variants.length > 0) {
      let detailsText = `✨ <b>${escapeHtml(title)}</b>\n\n`
      if (product.shortDescription) {
        detailsText += `${mdToTgHtml(product.shortDescription)}\n\n`
      }

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
        const preview = formatProductDescriptionPreview(product.description, 250)
        if (preview) {
          detailsText += `📋 <b>توضیحات محصول:</b>\n${preview}\n\n`
        }
      }

      detailsText += `🏷 <b>انواع موجود برای این محصول:</b>\n\n`

      const keyboard = new InlineKeyboard()

      for (const variant of variants) {
        const hasDiscount =
          variant.discountedPrice !== null &&
          variant.discountedPrice !== undefined &&
          variant.discountedPrice > 0 &&
          variant.discountedPrice < variant.price

        const effectivePrice = hasDiscount ? variant.discountedPrice! : variant.price
        const badgeText = variant.badge ? ` [${escapeHtml(variant.badge)}]` : ''
        const discountLabel = variant.discountLabel ? ` (${escapeHtml(variant.discountLabel)})` : ''

        detailsText += `🔸 <b>${escapeHtml(variant.name)}</b>${badgeText}\n`
        if (hasDiscount) {
          detailsText += `💵 <b>قیمت:</b> <s>${formatPrice(variant.price)}</s> <b>${formatPrice(effectivePrice)}</b>${discountLabel}\n`
        } else {
          detailsText += `💵 <b>قیمت:</b> <b>${formatPrice(effectivePrice)}</b>\n`
        }

        if (variant.duration && variant.duration > 0) {
          detailsText += `⏱ <b>مدت زمان:</b> ${variant.duration.toLocaleString('fa-IR')} ماهه\n`
        }

        if (variant.description) {
          detailsText += `📝 ${mdToTgHtml(variant.description)}\n`
        }

        if (variant.features && variant.features.length > 0) {
          for (const feat of variant.features.slice(0, 3)) {
            detailsText += `  • ${escapeHtml(feat)}\n`
          }
        }
        detailsText += `\n`

        const btnBadge = variant.badge ? ` (${variant.badge})` : ''
        keyboard
          .text(
            `🔹 ${variant.name} — ${formatPrice(effectivePrice)}${btnBadge}`,
            `variant:select:${variant.id}:${fromPage}`
          )
          .row()
      }

      detailsText += `👇 جهت مشاهده جزئیات و ثبت سفارش، نوع مورد نظر خود را انتخاب فرمایید:`

      keyboard.text('🔙 بازگشت به لیست محصولات', backToProductsData).row()
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
      return
    }

    let detailsText = `✨ <b>${escapeHtml(title)}</b>\n\n`
    if (product.shortDescription) {
      detailsText += `${mdToTgHtml(product.shortDescription)}\n\n`
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
      const preview = formatProductDescriptionPreview(product.description, 250)
      if (preview) {
        detailsText += `📋 <b>توضیحات محصول:</b>\n${preview}\n\n`
      }
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
        .text(`🛒 ${plan.name} — ${formatPrice(plan.price)}`, `plan:buy:${plan.id}`)
        .row()
    }

    detailsText += `👇 جهت سفارش، پلن مورد نظر خود را از دکمه‌های زیر انتخاب فرمایید:`

    keyboard.text('🔙 بازگشت به لیست محصولات', backToProductsData).row()
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

export async function handleSelectVariant(ctx: Context, variantId: string, fromPage: number = 1) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
      },
    })

    if (!variant || !variant.active) {
      await ctx.answerCallbackQuery({ text: 'نوع محصول یافت نشد یا غیرفعال است.', show_alert: true }).catch(() => {})
      return
    }

    // Save selected variantId into user's session
    const from = ctx.from
    if (from) {
      const telegramId = String(from.id)
      const session = await getBotLoginSession(telegramId)
      await setBotLoginSession(telegramId, {
        ...(session || { step: 'AWAITING_CHECKOUT_FIELD' }),
        step: 'AWAITING_CHECKOUT_FIELD',
        productId: variant.productId,
        variantId: variant.id,
      })
    }

    const data = await BotStoreService.getProductPlans(variant.productId, variant.id)
    if (!data) {
      await ctx.answerCallbackQuery({ text: 'اطلاعات پلن یافت نشد.', show_alert: true }).catch(() => {})
      return
    }

    const { product, plans } = data
    const hasDiscount =
      variant.discountedPrice !== null &&
      variant.discountedPrice !== undefined &&
      variant.discountedPrice > 0 &&
      variant.discountedPrice < variant.price

    const effectivePrice = hasDiscount ? variant.discountedPrice! : variant.price
    const badgeText = variant.badge ? ` [${escapeHtml(variant.badge)}]` : ''
    const discountLabel = variant.discountLabel ? ` (${escapeHtml(variant.discountLabel)})` : ''

    let detailsText = `✨ <b>${escapeHtml(product.title)} — نوع «${escapeHtml(variant.name)}»</b>${badgeText}\n\n`

    if (variant.description) {
      detailsText += `${mdToTgHtml(variant.description)}\n\n`
    }

    if (hasDiscount) {
      detailsText += `• 💵 <b>قیمت:</b> <s>${formatPrice(variant.price)}</s> <b>${formatPrice(effectivePrice)}</b>${discountLabel}\n`
    } else {
      detailsText += `• 💵 <b>قیمت:</b> <b>${formatPrice(effectivePrice)}</b>\n`
    }

    if (variant.duration && variant.duration > 0) {
      detailsText += `• ⏱ <b>مدت اعتبار:</b> ${variant.duration.toLocaleString('fa-IR')} ماهه\n`
    }

    let feats: string[] = []
    if (Array.isArray(variant.features)) {
      feats = variant.features
        .map((f) => (typeof f === 'string' ? f : String((f as any)?.text || (f as any)?.title || '')))
        .filter(Boolean)
    }

    if (feats.length > 0) {
      detailsText += `\n🌟 <b>امکانات و مزایای این نوع:</b>\n`
      for (const feat of feats.slice(0, 4)) {
        detailsText += `• ${escapeHtml(feat)}\n`
      }
    }
    detailsText += `\n`

    detailsText += `📦 <b>پلن‌ها و شیوه تحویل:</b>\n\n`

    const keyboard = new InlineKeyboard()

    for (const plan of plans) {
      const isPreCreated = plan.fulfillmentType === 'PRE_CREATED_ACCOUNT'
      const warehouseStock = plan.availableInventoryCount ?? 0
      const fulfillmentBadge = getFulfillmentLabel(plan.fulfillmentType)

      detailsText += `🔹 <b>پلن ${escapeHtml(plan.name)}</b>\n`
      detailsText += `• 💵 <b>مبلغ قابل پرداخت:</b> <b>${formatPrice(effectivePrice)}</b>\n`
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
        .text(`🛒 ${plan.name} — ${formatPrice(effectivePrice)}`, `plan:buy:${plan.id}`)
        .row()
    }

    detailsText += `👇 جهت سفارش، پلن مورد نظر خود را از دکمه‌های زیر انتخاب فرمایید:`

    const backToProductsData = fromPage > 1 ? `products:page:${fromPage}` : 'nav:products'
    keyboard.text('🔙 تغییر نوع محصول', `product:select:${variant.productId}:${fromPage}`).row()
    keyboard.text('🔙 بازگشت به لیست محصولات', backToProductsData).row()
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
    console.error('Error in handleSelectVariant:', error)
    await ctx.reply('خطا در دریافت اطلاعات نوع محصول. لطفاً مجدداً تلاش فرمایید.')
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
      include: { product: true, variant: true },
    })

    if (!plan || !plan.active) {
      await ctx.reply('پلن انتخاب‌شده یافت نشد یا غیرفعال است.')
      return
    }

    const session = await getBotLoginSession(telegramId)
    const effectiveVariantId = session?.variantId || plan.variantId || null

    // 3. For PRE_CREATED_ACCOUNT: prompt user for delivery preference (Warehouse Ready Account vs Personal Gmail)
    if (plan.fulfillmentType === 'PRE_CREATED_ACCOUNT') {
      const warehouseCount = await prisma.inventoryItem.count({
        where: {
          type: 'PRE_CREATED_ACCOUNT',
          status: 'AVAILABLE',
          ...(effectiveVariantId
            ? {
                OR: [
                  { variantId: effectiveVariantId, planId: plan.id },
                  { variantId: effectiveVariantId, planId: null, productId: plan.productId },
                  { variantId: null, planId: plan.id },
                  { variantId: null, productId: plan.productId, planId: null },
                ],
              }
            : {
                OR: [
                  { planId: plan.id },
                  { productId: plan.productId, planId: null },
                ],
              }),
        },
      })

      // Initialize session for this order
      await setBotLoginSession(telegramId, {
        ...(session || {}),
        step: 'AWAITING_CHECKOUT_FIELD',
        planId: plan.id,
        productId: plan.productId,
        variantId: effectiveVariantId || undefined,
        checkoutData: session?.checkoutData || {},
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
        ...(session || {}),
        step: 'AWAITING_CHECKOUT_FIELD',
        planId: plan.id,
        productId: plan.productId,
        variantId: effectiveVariantId || undefined,
        currentFieldKey: firstField.key,
        currentFieldLabel: firstField.label,
        checkoutData: session?.checkoutData || {},
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

  const existingSession = await getBotLoginSession(telegramId)
  const session = {
    step: 'AWAITING_CHECKOUT_FIELD' as const,
    planId: plan.id,
    productId: plan.productId,
    variantId: existingSession?.variantId || plan.variantId || undefined,
    checkoutData: {},
    ...(existingSession || {}),
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
    session.couponCode,
    session.variantId
  )
}

export async function executeBotOrderCreation(
  ctx: Context,
  user: { id: string; name?: string | null; phone?: string | null },
  planId: string,
  checkoutData: Record<string, unknown>,
  chatId: string,
  couponCode?: string,
  variantId?: string
) {
  try {
    const result = await BotStoreService.createBotOrder({
      userId: user.id,
      planId,
      variantId,
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
        variantId: result.order.variantId || variantId || undefined,
        couponCode: couponCode || undefined,
        couponDiscount: result.order.discountAmount || undefined,
        checkoutData,
      })
    }

    const variantSuffix = result.variantName ? ` [${result.variantName}]` : ''
    const messageText = MESSAGES.orderCreated(
      result.order.id,
      `${result.productTitle}${variantSuffix} (${result.planName})`,
      result.amount,
      {
        originalAmount: result.amount + (result.order.discountAmount || 0),
        discountAmount: result.order.discountAmount || 0,
        couponCode,
        variantName: result.variantName || undefined,
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
