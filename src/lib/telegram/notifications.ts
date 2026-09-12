import { Bot, InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'

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
        activationLink: true,
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
      (order.inventoryItem?.data as any)?.url ||
      order.activationLink?.url

    if (!linkUrl) {
      return
    }

    const bot = new Bot(token)

    const productTitle = order.plan?.product?.title || 'سرویس هوش مصنوعی'
    const planName = order.plan?.name || ''

    const successMessage = `
✅ **پرداخت با موفقیت انجام شد**

سفارش شما با موفقیت ثبت و تأیید گردید:
🌟 **${productTitle}${planName ? ` — ${planName}` : ''}**
🔢 **شناسه پیگیری بانکی:** \`${order.payment?.refId || '-'}\`

🔐 **توجه مهم:**
برای فعال‌سازی، نیازی به ارسال ایمیل، رمز عبور یا اطلاعات ورود حساب Google خود ندارید.

فقط کافیست با کلیک روی دکمه یا لینک اختصاصی زیر، مراحل فعال‌سازی را با حساب Google خودتان تکمیل فرمایید:

🔗 **لینک فعال‌سازی اختصاصی شما:**
\`${linkUrl}\`
`.trim()

    const keyboard = new InlineKeyboard()
      .url('🔗 فعال‌سازی جمینای', linkUrl)
      .row()
      .text('📖 راهنمای فعال‌سازی', 'show_activation_guide')

    await bot.api.sendMessage(order.telegramChatId, successMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    })
  } catch (error) {
    console.error('Error sending Telegram payment notification:', error)
  }
}
