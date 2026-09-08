import { Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { PaymentService } from '@/lib/payment'
import { MESSAGES, formatProductDetails } from '../messages'
import { productBuyKeyboard, orderPaymentKeyboard } from '../keyboards'

export async function handleShowProducts(ctx: Context) {
  try {
    // Find active plans with product
    const plans = await prisma.plan.findMany({
      where: { active: true },
      include: { product: true },
      orderBy: { price: 'asc' },
    })

    if (!plans || plans.length === 0) {
      await ctx.reply('در حال حاضر پلن فعالی در سیستم موجود نیست. لطفاً بعداً مراجعه نمایید.')
      return
    }

    // Default to the first active plan (e.g., 18 months plan)
    // Architecture supports multiple plans seamlessly
    for (const plan of plans) {
      const messageText = formatProductDetails(
        plan.product.name,
        plan.name,
        plan.duration,
        plan.price
      )

      await ctx.reply(messageText, {
        parse_mode: 'Markdown',
        reply_markup: productBuyKeyboard(plan.id, plan.name, plan.price),
      })
    }
  } catch (error) {
    console.error('Error in handleShowProducts:', error)
    await ctx.reply('متأسفانه در دریافت اطلاعات محصول خطایی رخ داد. لطفاً دوباره تلاش کنید.')
  }
}

export async function handleBuyCallback(ctx: Context, planId: string) {
  const from = ctx.from
  if (!from || !ctx.chat) return

  const telegramId = String(from.id)
  const chatId = String(ctx.chat.id)

  await ctx.answerCallbackQuery({ text: 'در حال ایجاد پیش‌فاکتور...' }).catch(() => {})

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user || !user.phone) {
      const { startLoginFlow } = await import('./auth')
      await startLoginFlow(ctx, '⚠️ برای خرید اشتراک و دریافت لینک فعال‌سازی، ابتدا باید با شماره موبایل خود وارد شوید:')
      return
    }

    // Find plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId, active: true },
      include: { product: true },
    })

    if (!plan) {
      await ctx.reply('پلن انتخاب‌شده یافت نشد یا غیرفعال شده است.')
      return
    }

    // Check inventory
    const availableCount = await prisma.activationLink.count({
      where: {
        planId: plan.id,
        status: 'AVAILABLE',
      },
    })

    if (availableCount === 0) {
      await ctx.reply(MESSAGES.stockExhausted, { parse_mode: 'Markdown' })
      return
    }

    // Create Order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        status: 'PENDING_PAYMENT',
        source: 'telegram',
        telegramChatId: chatId,
      },
    })

    // Request Payment via PaymentService (supports Mock & Zarinpal)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/payment/callback?source=telegram&orderId=${order.id}`

    const paymentResult = await PaymentService.createPayment({
      orderId: order.id,
      amount: plan.price,
      description: `خرید تلگرام: ${plan.product.name} (${plan.name})`,
      callbackUrl,
      mobile: user.phone,
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      await ctx.reply(
        `خطا در اتصال به درگاه پرداخت: ${paymentResult.error || 'لطفاً دقایقی دیگر مجدداً تلاش نمایید.'}`
      )
      return
    }

    // Send order confirmation and payment button
    const productFullTitle = `${plan.product.name} — ${plan.name}`
    let messageText = MESSAGES.orderCreated(order.id, productFullTitle, plan.price)

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
    console.error('Error handling buy callback:', error)
    await ctx.reply('متأسفانه در پردازش سفارش شما خطایی رخ داد. لطفاً دوباره تلاش کنید.')
  }
}
