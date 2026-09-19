import { Bot, InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'
import { escapeHtml } from './formatting'

export async function notifyTelegramPaymentSuccess(orderId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        plan: {
          include: { product: true },
        },
        inventoryItem: true,
        delivery: true,
        payment: true,
      },
    })

    if (!order || !order.telegramChatId) {
      return
    }

    const linkUrl =
      (order.delivery?.data as any)?.url ||
      (order.inventoryItem?.data as any)?.url

    if (!linkUrl) {
      return
    }

    const bot = new Bot(token)

    const productTitle = order.plan?.product?.title || 'سرویس هوش مصنوعی'
    const planName = order.plan?.name || ''

    const successMessage = `
🎉 <b>پرداخت با موفقیت تأیید شد</b>

سفارش شما با موفقیت در سیستم ثبت و تأیید گردید:
• 🛍 <b>محصول:</b> <b>${escapeHtml(productTitle)}${planName ? ` — ${escapeHtml(planName)}` : ''}</b>
• 🔢 <b>شناسه پیگیری بانکی:</b> <code>${escapeHtml(order.payment?.refId || '-')}</code>

🔗 <b>لینک فعال‌سازی اختصاصی شما:</b>
<code>${linkUrl}</code>

<blockquote>🔐 <b>توجه مهم:</b>
برای فعال‌سازی، نیازی به ارسال رمز عبور نیست. کافیست روی دکمه یا لینک فوق کلیک کرده و مراحل را با اکانت گوگل خود تایید فرمایید.</blockquote>

📱 این لینک هم‌اکنون در بخش «سفارش‌های من» نیز ثبت و در دسترس است.
`.trim()

    const keyboard = new InlineKeyboard()
      .url('🔗 فعال‌سازی جمینای', linkUrl)
      .row()
      .text('📖 راهنمای فعال‌سازی', 'show_activation_guide')

    await bot.api.sendMessage(order.telegramChatId, successMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    })
  } catch (error) {
    console.error('Error sending Telegram payment notification:', error)
  }
}
