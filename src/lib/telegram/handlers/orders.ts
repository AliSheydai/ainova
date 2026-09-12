import { type Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { MESSAGES } from '../messages'
import { ordersPaginationKeyboard } from '../keyboards'

const PAGE_SIZE = 3

function getStatusBadge(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return '✅ فعال و تکمیل شده'
    case 'PAID':
      return '⏳ پرداخت شده (در انتظار ارسال لینک)'
    case 'PENDING_PAYMENT':
      return '🟡 در انتظار پرداخت'
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

    let messageText = `📦 **لیست سفارش‌های شما (تعداد کل: ${totalOrders})**\n`
    messageText += `━━━━━━━━━━━━━━━━━━━━\n\n`

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

      messageText += `🔢 **سفارش #${orderCode}**\n`
      messageText += `📦 **محصول:** ${productTitle}\n`
      messageText += `💰 **مبلغ:** ${order.amount.toLocaleString('fa-IR')} تومان\n`
      messageText += `📅 **تاریخ:** ${dateStr}\n`
      messageText += `📊 **وضعیت:** ${getStatusBadge(order.status)}\n\n`

      const deliveryMessage = BotStoreService.formatDeliveryMessage(order)
      messageText += `${deliveryMessage}\n`

      messageText += `\n────────────────────\n\n`
    }

    const keyboard = ordersPaginationKeyboard(validPage, totalPages)

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
