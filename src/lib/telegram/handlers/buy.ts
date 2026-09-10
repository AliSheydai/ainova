import { Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { PaymentService } from '@/lib/payment'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { MESSAGES } from '../messages'
import {
  productsListInlineKeyboard,
  productDetailsKeyboard,
  orderPaymentKeyboard,
} from '../keyboards'

export async function handleShowProducts(ctx: Context) {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    if (!products || products.length === 0) {
      await ctx.reply('در حال حاضر محصول فعالی در فروشگاه موجود نیست. لطفاً بعداً مراجعه فرمایید.')
      return
    }

    const enriched = await Promise.all(
      products.map(async (p) => {
        const stock = await FulfillmentService.getProductStock(p.id)
        return {
          id: p.id,
          title: p.title || p.name,
          price: p.price,
          stock,
        }
      })
    )

    const text =
      `🛍 **فروشگاه اشتراک‌های دیجیتال و هوش مصنوعی**\n\n` +
      `لطفاً محصول مورد نظر خود را جهت مشاهده جزئیات و خرید انتخاب فرمایید:`

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: productsListInlineKeyboard(enriched),
      }).catch(async () => {
        await ctx.reply(text, {
          parse_mode: 'Markdown',
          reply_markup: productsListInlineKeyboard(enriched),
        })
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: productsListInlineKeyboard(enriched),
      })
    }
  } catch (error) {
    console.error('Error in handleShowProducts:', error)
    await ctx.reply('متأسفانه در دریافت لیست محصولات خطایی رخ داد. لطفاً دوباره تلاش کنید.')
  }
}

export async function handleSelectProduct(ctx: Context, productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || product.status !== 'ACTIVE') {
      await ctx.answerCallbackQuery({ text: 'محصول یافت نشد یا غیرفعال است.', show_alert: true }).catch(() => {})
      return
    }

    const [stock, purchaseCount] = await Promise.all([
      FulfillmentService.getProductStock(product.id),
      FulfillmentService.getProductPurchaseCount(product.id),
    ])

    const isAvailable = stock > 0
    const title = product.title || product.name

    let detailsText = `✨ **${title}** ✨\n\n`

    if (product.shortDescription) {
      detailsText += `📝 ${product.shortDescription}\n\n`
    }

    if (product.description) {
      detailsText += `📋 **توضیحات کامل:**\n${product.description}\n\n`
    }

    detailsText += `━━━━━━━━━━━━━━━━━━━━\n`
    detailsText += `💵 **قیمت:** ${product.price.toLocaleString('fa-IR')} تومان\n`
    detailsText += `📦 **وضعیت موجودی:** ${isAvailable ? `✅ موجود (${stock.toLocaleString('fa-IR')} عدد)` : '❌ اتمام موجودی موقت'}\n`
    if (purchaseCount > 0) {
      detailsText += `👥 **خریداران راضی:** ${purchaseCount.toLocaleString('fa-IR')} خریدار\n`
    }
    detailsText += `🚀 **نوع تحویل:** آنی و خودکار پس از پرداخت آنلاین\n`
    detailsText += `🔐 **امنیت:** بدون نیاز به پسورد یا اطلاعات حساس`

    await ctx.editMessageText(detailsText, {
      parse_mode: 'Markdown',
      reply_markup: productDetailsKeyboard(product.id, product.price, isAvailable),
    }).catch(async () => {
      await ctx.reply(detailsText, {
        parse_mode: 'Markdown',
        reply_markup: productDetailsKeyboard(product.id, product.price, isAvailable),
      })
    })

    await ctx.answerCallbackQuery().catch(() => {})
  } catch (error) {
    console.error('Error in handleSelectProduct:', error)
    await ctx.reply('خطا در دریافت اطلاعات محصول. لطفاً مجدداً تلاش کنید.')
  }
}

export async function handleBuyProduct(ctx: Context, productId: string) {
  const from = ctx.from
  if (!from || !ctx.chat) return

  const telegramId = String(from.id)
  const chatId = String(ctx.chat.id)

  await ctx.answerCallbackQuery({ text: 'در حال صدور فاکتور خرید...' }).catch(() => {})

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user || !user.phone) {
      const { startLoginFlow } = await import('./auth')
      await startLoginFlow(ctx, '⚠️ برای خرید اشتراک و دریافت لینک فعال‌سازی، ابتدا باید با شماره موبایل خود وارد شوید:')
      return
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, status: 'ACTIVE', active: true },
      include: { plans: true },
    })

    if (!product) {
      await ctx.reply('محصول انتخاب‌شده یافت نشد یا غیرفعال شده است.')
      return
    }

    const stock = await FulfillmentService.getProductStock(product.id)
    if (stock <= 0) {
      await ctx.reply(MESSAGES.stockExhausted, { parse_mode: 'Markdown' })
      return
    }

    // Create Order referencing productId and snapshot amount
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        productId: product.id,
        planId: product.plans?.[0]?.id || null,
        amount: product.price, // SNAPSHOT: will not change if product price is changed later
        status: 'PENDING_PAYMENT',
        source: 'telegram',
        telegramChatId: chatId,
      },
    })

    // Request Payment via PaymentService
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/payment/callback?source=telegram&orderId=${order.id}`
    const productTitle = product.title || product.name

    const paymentResult = await PaymentService.createPayment({
      orderId: order.id,
      amount: product.price,
      description: `خرید تلگرام: ${productTitle}`,
      callbackUrl,
      mobile: user.phone,
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      await ctx.reply(
        `خطا در اتصال به درگاه پرداخت: ${paymentResult.error || 'لطفاً دقایقی دیگر مجدداً تلاش نمایید.'}`
      )
      return
    }

    let messageText = MESSAGES.orderCreated(order.id, productTitle, product.price)

    const fullPaymentUrl = paymentResult.paymentUrl.startsWith('http')
      ? paymentResult.paymentUrl
      : `${appUrl}${paymentResult.paymentUrl}`

    const isLocalhost =
      fullPaymentUrl.includes('localhost') || fullPaymentUrl.includes('127.0.0.1')

    if (isLocalhost) {
      messageText += `\n\n💳 **لینک مستقیم درگاه پرداخت (توسعه):**\n\`${fullPaymentUrl}\``
    }

    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      reply_markup: orderPaymentKeyboard(fullPaymentUrl),
    })
  } catch (error) {
    console.error('Error in handleBuyProduct:', error)
    await ctx.reply('متأسفانه در پردازش سفارش خطایی رخ داد. لطفاً دوباره تلاش کنید.')
  }
}

export async function handleBuyCallback(ctx: Context, planOrProductId: string) {
  // Check if it's a product
  const product = await prisma.product.findUnique({ where: { id: planOrProductId } })
  if (product) {
    return handleBuyProduct(ctx, product.id)
  }

  // Fallback to plan
  const plan = await prisma.plan.findUnique({ where: { id: planOrProductId }, include: { product: true } })
  if (plan) {
    return handleBuyProduct(ctx, plan.productId)
  }

  await ctx.reply('محصول یا پلن انتخاب‌شده یافت نشد.')
}
