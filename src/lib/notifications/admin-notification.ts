import { prisma } from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram/bot'
import { escapeHtml } from '@/lib/telegram/formatting'

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
    variant?: { name?: string } | null
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
      const variantName = order.variant?.name ? `[${order.variant.name}] ` : ''
      const planName = order.plan?.name ? `(${order.plan.name})` : ''
      const customerInfo =
        order.user?.name ||
        order.user?.phone ||
        (order.user?.telegramUsername ? `@${order.user.telegramUsername}` : 'مشتری ناشناس')

      const shortOrderId = order.id.slice(-6).toUpperCase()

      const text =
        `🛍 <b>سفارش جدید ثبت شد — #${shortOrderId}</b>\n\n` +
        `• 📦 <b>محصول:</b> <b>${escapeHtml(productTitle)} ${escapeHtml(variantName)}${escapeHtml(planName)}</b>\n` +
        `• 💰 <b>مبلغ پرداختی:</b> <b>${this.formatPrice(order.amount)}</b>\n` +
        (order.discountAmount && order.discountAmount > 0
          ? `• 🎁 <b>تخفیف:</b> ${this.formatPrice(order.discountAmount)}\n`
          : '') +
        `• 👤 <b>خریدار:</b> <code>${escapeHtml(customerInfo)}</code>\n` +
        `• 💳 <b>درگاه:</b> ${escapeHtml(
          order.payment?.gatewayName === 'zibal'
            ? 'زیبال'
            : order.payment?.gatewayName === 'jibit'
              ? 'جیبیت'
              : order.payment?.gatewayName === 'mock'
                ? 'تستی (Mock)'
                : order.payment?.gatewayName === 'zarinpal'
                  ? 'زرین‌پال'
                  : order.payment?.gatewayName || 'زیبال'
        )}\n\n` +
        `🔗 <a href="${appUrl}/dashboard/orders">مشاهده و بررسی در پنل مدیریت</a>`

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
        `🚨 <b>هشدار اتمام موجودی انبار — #${shortOrderId}</b>\n\n` +
        `موجودی پلن <b>${escapeHtml(productTitle)} — ${escapeHtml(planName)}</b> تمام شد.\n` +
        `سفارش در صف انتظار تأمین کالا قرار گرفت.\n\n` +
        `🔗 <a href="${appUrl}/dashboard/orders">مدیریت سفارش‌ها</a>`

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
        `⚠️ <b>هشدار کمبود موجودی انبار</b>\n\n` +
        `• 📦 <b>محصول:</b> ${escapeHtml(productTitle)} (${escapeHtml(planName)})\n` +
        `• 📊 <b>موجودی باقی‌مانده:</b> <b>${remainingStock} عدد</b>\n\n` +
        `🔗 <a href="${appUrl}/dashboard/activation-links">مدیریت موجودی انبار</a>`

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
        `⏳ <b>سفارش نیازمند تحویل دستی — #${shortOrderId}</b>\n\n` +
        `• 📦 <b>محصول:</b> ${escapeHtml(productTitle)} (${escapeHtml(planName)})\n` +
        `• 👤 <b>خریدار:</b> <code>${escapeHtml(customerInfo)}</code>\n\n` +
        `🔗 <a href="${appUrl}/dashboard/orders">ثبت تحویل در پنل مدیریت</a>`

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
        `💸 <b>ثبت استرداد وجه — #${shortOrderId}</b>\n\n` +
        `• 💰 <b>مبلغ استرداد:</b> <b>${this.formatPrice(details.refundAmount)}</b>\n` +
        (details.refundRefId ? `• 🔢 <b>کد پیگیری:</b> <code>${escapeHtml(details.refundRefId)}</code>\n` : '') +
        (details.refundReason ? `• 📝 <b>علت:</b> ${escapeHtml(details.refundReason)}\n` : '') +
        (details.adminUserName ? `• 👤 <b>ثبت توسط:</b> ${escapeHtml(details.adminUserName)}\n` : '')

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
        `🔔 <b>پیام آزمایشی سامانه اعلان ادمین آریوچت</b>\n\n` +
        `اتصال ربات تلگرام با سامانه با موفقیت برقرار است.\n` +
        `از این پس تمامی اعلان‌های سفارش‌های جدید، هشدارهای موجودی و استردادها در این چت ارسال خواهد شد.`

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

  /**
   * 6. Notification when customer updates their credentials after admin requested action.
   */
  static async notifyCustomerUpdatedCredentials(
    orderId: string,
    customerInfo: string,
    serviceName: string
  ): Promise<boolean> {
    try {
      if (!(await this.isNotificationEnabled())) return false
      const chatId = await this.getAdminChatId()
      if (!chatId) return false

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const shortOrderId = orderId.slice(-6).toUpperCase()

      const text =
        `🔄 <b>اصلاح اطلاعات اکانت توسط کاربر — #${shortOrderId}</b>\n\n` +
        `خریدار سفارش اطلاعات ورود جدید را ثبت کرد و در انتظار بررسی است:\n` +
        `• 📦 <b>محصول:</b> ${escapeHtml(serviceName)}\n` +
        `• 👤 <b>خریدار:</b> <code>${escapeHtml(customerInfo)}</code>\n\n` +
        `🔗 <a href="${appUrl}/dashboard/orders">بررسی سفارش در پنل مدیریت</a>`

      return await sendTelegramNotification(chatId, text)
    } catch (err) {
      console.error('Failed to send credentials update notification:', err)
      return false
    }
  }
}
