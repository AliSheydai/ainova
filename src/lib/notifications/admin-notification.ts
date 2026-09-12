import { prisma } from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram/bot'

export interface RefundNotificationDetails {
  refundAmount: number
  refundReason?: string
  refundRefId?: string
  adminUserName?: string
}

export class AdminNotificationService {
  /**
   * Retrieves the configured Admin Telegram Chat ID from system settings or environment variables.
   */
  static async getAdminChatId(): Promise<string | null> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'admin_telegram_chat_id' },
      })
      if (setting && setting.value?.trim()) {
        return setting.value.trim()
      }
    } catch {
      // Fallback silently if DB is temporarily unreachable
    }

    return (
      process.env.ADMIN_TELEGRAM_CHAT_ID?.trim() ||
      process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() ||
      null
    )
  }

  /**
   * Checks if admin notifications are enabled in settings (defaults to true).
   */
  static async isNotificationEnabled(): Promise<boolean> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'admin_notifications_enabled' },
      })
      if (setting && setting.value === 'false') {
        return false
      }
    } catch {
      // Fallback to true
    }
    return true
  }

  /**
   * Retrieves the threshold below which a low stock alert should be triggered.
   */
  static async getLowStockThreshold(): Promise<number> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'low_stock_threshold' },
      })
      if (setting && setting.value) {
        const parsed = parseInt(setting.value, 10)
        if (!isNaN(parsed) && parsed >= 0) return parsed
      }
    } catch {
      // Fallback to default
    }
    return 3
  }

  /**
   * Formats numbers to Persian currency string.
   */
  private static formatPrice(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
  }

  /**
   * 1. Notify Admin about a newly paid and verified order.
   */
  static async notifyOrderPaid(order: {
    id: string
    amount: number
    discountAmount?: number
    source?: string | null
    user?: { phone?: string | null; name?: string | null; telegramUsername?: string | null } | null
    product?: { title?: string } | null
    plan?: { name?: string; product?: { title?: string } } | null
    payment?: { refId?: string | null; gatewayName?: string } | null
  }): Promise<boolean> {
    try {
      if (!(await this.isNotificationEnabled())) return false
      const chatId = await this.getAdminChatId()
      if (!chatId) return false

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const productTitle =
        order.product?.title || order.plan?.product?.title || 'اشتراک'
      const planName = order.plan?.name ? `(${order.plan.name})` : ''
      const customerInfo =
        order.user?.name ||
        order.user?.phone ||
        (order.user?.telegramUsername ? `@${order.user.telegramUsername}` : 'مشتری ناشناس')

      const shortOrderId = order.id.slice(-6).toUpperCase()

      const text =
        `🛍 **ثبت سفارش جدید در سامانه!**\n\n` +
        `📦 **سفارش:** #${shortOrderId}\n` +
        `🏷 **محصول:** ${productTitle} ${planName}\n` +
        `💰 **مبلغ واریزی:** ${this.formatPrice(order.amount)}\n` +
        (order.discountAmount && order.discountAmount > 0
          ? `🎟 **تخفیف اعمال‌شده:** ${this.formatPrice(order.discountAmount)}\n`
          : '') +
        `👤 **خریدار:** ${customerInfo}\n` +
        `🌐 **درگاه / پیگیری:** ${order.payment?.gatewayName || 'زرین‌پال'} (${order.payment?.refId || 'موفق'})\n` +
        `🔗 [مشاهده در پنل مدیریت](${appUrl}/dashboard/orders)`

      return await sendTelegramNotification(chatId, text)
    } catch (err) {
      console.error('Failed to send admin order paid notification:', err)
      return false
    }
  }

  /**
   * 2. Critical Alert: Stock Exhausted after payment!
   */
  static async notifyStockExhausted(
    orderId: string,
    productTitle: string,
    planName: string
  ): Promise<boolean> {
    try {
      const chatId = await this.getAdminChatId()
      if (!chatId) return false

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const shortOrderId = orderId.slice(-6).toUpperCase()

      const text =
        `🚨 **هشدار بحرانی: اتمام موجودی انبار!**\n\n` +
        `⚠️ موجودی پلن **${productTitle} — ${planName}** به پایان رسیده است!\n` +
        `سفارش **#${shortOrderId}** با موفقیت پرداخت شده اما در صف انتظار تامین کالا (STOCK_EXHAUSTED) قرار گرفت.\n\n` +
        `⚡ اقدام فوری موردنیاز: لطفاً نسبت به شارژ موجودی انبار یا استرداد وجه مشتری اقدام فرمایید.\n` +
        `🔗 [مدیریت سفارش‌ها](${appUrl}/dashboard/orders)`

      return await sendTelegramNotification(chatId, text)
    } catch (err) {
      console.error('Failed to send admin stock exhausted alert:', err)
      return false
    }
  }

  /**
   * 3. Low Stock Warning when stock dips below configured threshold.
   */
  static async notifyLowStock(
    productTitle: string,
    planName: string,
    remainingStock: number
  ): Promise<boolean> {
    try {
      if (!(await this.isNotificationEnabled())) return false
      const threshold = await this.getLowStockThreshold()
      if (remainingStock > threshold) return false

      const chatId = await this.getAdminChatId()
      if (!chatId) return false

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      const text =
        `⚠️ **هشدار کمبود موجودی انبار**\n\n` +
        `📦 **محصول:** ${productTitle} (${planName})\n` +
        `📊 **موجودی باقی‌مانده:** فقط **${remainingStock}** عدد!\n\n` +
        `برای جلوگیری از توقف فروش، لطفاً موجودی را شارژ نمایید.\n` +
        `🔗 [مدیریت موجودی انبار](${appUrl}/dashboard/activation-links)`

      return await sendTelegramNotification(chatId, text)
    } catch (err) {
      console.error('Failed to send low stock notification:', err)
      return false
    }
  }

  /**
   * 4. Manual Delivery notification for products requiring support delivery.
   */
  static async notifyManualDeliveryNeeded(
    orderId: string,
    productTitle: string,
    planName: string,
    customerInfo: string
  ): Promise<boolean> {
    try {
      if (!(await this.isNotificationEnabled())) return false
      const chatId = await this.getAdminChatId()
      if (!chatId) return false

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const shortOrderId = orderId.slice(-6).toUpperCase()

      const text =
        `⏳ **سفارش نیازمند تحویل دستی پشتیبانی**\n\n` +
        `سفارش **#${shortOrderId}** پرداخت شد و منتظر تحویل دستی توسط ادمین است.\n` +
        `📦 **محصول:** ${productTitle} (${planName})\n` +
        `👤 **خریدار:** ${customerInfo}\n\n` +
        `🔗 [ثبت تحویل در پنل ادمین](${appUrl}/dashboard/orders)`

      return await sendTelegramNotification(chatId, text)
    } catch (err) {
      console.error('Failed to send manual delivery notification:', err)
      return false
    }
  }

  /**
   * 5. Refund notification when an order is refunded.
   */
  static async notifyOrderRefunded(
    orderId: string,
    details: RefundNotificationDetails
  ): Promise<boolean> {
    try {
      const chatId = await this.getAdminChatId()
      if (!chatId) return false

      const shortOrderId = orderId.slice(-6).toUpperCase()

      const text =
        `💸 **گزارش استرداد وجه (Refund)**\n\n` +
        `سفارش **#${shortOrderId}** با موفقیت استرداد شد.\n` +
        `💰 **مبلغ استرداد:** ${this.formatPrice(details.refundAmount)}\n` +
        (details.refundRefId ? `🧾 **کد پیگیری بانکی/شبا:** \`${details.refundRefId}\`\n` : '') +
        (details.refundReason ? `📝 **علت:** ${details.refundReason}\n` : '') +
        (details.adminUserName ? `👤 **ثبت توسط:** ${details.adminUserName}\n` : '')

      return await sendTelegramNotification(chatId, text)
    } catch (err) {
      console.error('Failed to send refund notification:', err)
      return false
    }
  }

  /**
   * Test telegram notification sent from settings page.
   */
  static async sendTestNotification(targetChatId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const chatId = targetChatId || (await this.getAdminChatId())
      if (!chatId) {
        return {
          success: false,
          error: 'شناسه چت تلگرام ادمین مشخص نشده است.',
        }
      }

      const text =
        `🔔 **پیام آزمایشی سیستم اعلان ادمین AiNova**\n\n` +
        `اتصال ربات تلگرام با سامانه با موفقیت برقرار است.\n` +
        `از این پس تمامی اعلان‌های ثبت سفارش، هشدار کمبود موجودی و استرداد وجه در این چت ارسال خواهد شد.`

      const sent = await sendTelegramNotification(chatId, text)
      if (!sent) {
        return {
          success: false,
          error: 'ارسال پیام با خطا مواجه شد. لطفاً توکن ربات تلگرام و چت‌آیدی را بررسی فرمایید.',
        }
      }

      return { success: true }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'خطای ناشناخته در ارسال پیام تلگرام.',
      }
    }
  }
}
