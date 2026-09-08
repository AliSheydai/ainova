import { Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { requestZarinpalPayment } from '@/lib/payment/zarinpal'
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
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user) {
      const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'کاربر گرامی'
      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: from.username || null,
          name,
        },
      })
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

    // Request Zarinpal Payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/payment/callback?source=telegram&orderId=${order.id}`

    const paymentResult = await requestZarinpalPayment({
      amount: plan.price,
      description: `خرید تلگرام: ${plan.product.name} (${plan.name})`,
      callbackUrl,
    })

    if (!paymentResult.success || !paymentResult.authority || !paymentResult.paymentUrl) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      })

      await ctx.reply(
        `خطا در اتصال به درگاه پرداخت: ${paymentResult.error || 'لطفاً دقایقی دیگر مجدداً تلاش نمایید.'}`
      )
      return
    }

    // Create Payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: plan.price,
        authority: paymentResult.authority,
        status: 'PENDING',
        gatewayName: 'zarinpal',
      },
    })

    // Send order confirmation and payment button
    const productFullTitle = `${plan.product.name} — ${plan.name}`
    await ctx.reply(
      MESSAGES.orderCreated(order.id, productFullTitle, plan.price),
      {
        parse_mode: 'Markdown',
        reply_markup: orderPaymentKeyboard(paymentResult.paymentUrl),
      }
    )
  } catch (error) {
    console.error('Error handling buy callback:', error)
    await ctx.reply('متأسفانه در پردازش سفارش شما خطایی رخ داد. لطفاً دوباره تلاش کنید.')
  }
}
