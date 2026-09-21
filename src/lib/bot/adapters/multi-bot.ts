import { BotStoreService } from '../bot-store-service'

export interface BotIncomingMessage {
  platform: 'telegram' | 'bale' | 'rubika' | 'soroush'
  chatId: string
  userId: string
  text?: string
  contactPhone?: string
}

export interface BotOutgoingMessage {
  text: string
  replyKeyboard?: string[][]
  inlineKeyboard?: Array<Array<{ text: string; callbackData?: string; url?: string }>>
}

/**
 * Multi-Platform Bot Handler:
 * Standardized controller serving Telegram, Bale, Rubika, and Soroush bots with identical business logic.
 */
export class MultiBotController {
  static async handleCatalogRequest(): Promise<BotOutgoingMessage> {
    const products = await BotStoreService.getActiveProducts()

    if (products.length === 0) {
      return {
        text: 'در حال حاضر محصول فعالی در فروشگاه موجود نیست. لطفاً بعداً مراجعه فرمایید.',
      }
    }

    let text = '🛍 <b>فروشگاه اشتراک‌های دیجیتال و هوش مصنوعی</b>\n\nلطفاً محصول مورد نظر خود را انتخاب کنید:\n\n'
    const inlineKeyboard: Array<Array<{ text: string; callbackData?: string }>> = []

    for (const p of products) {
      const stockBadge = p.stock > 0 ? `⚡ تحویل آنی (${p.stock} عدد)` : '🕒 ارسال طی یک روز کاری'
      text += `📦 <b>${p.title}</b>\n💰 قیمت از: ${p.price.toLocaleString('fa-IR')} تومان — ${stockBadge}\n\n`

      inlineKeyboard.push([
        {
          text: `مشاهده و خرید ${p.title}`,
          callbackData: `product:select:${p.id}`,
        },
      ])
    }

    return { text, inlineKeyboard }
  }

  static async handleProductSelect(productId: string): Promise<BotOutgoingMessage> {
    const data = await BotStoreService.getProductPlans(productId)
    if (!data) {
      return { text: 'محصول یافت نشد یا غیرفعال است.' }
    }

    const { product, plans } = data
    const title = product.title

    let text = `✨ <b>${title}</b> ✨\n\n`
    if (product.shortDescription) text += `${product.shortDescription}\n\n`
    text += `📋 <b>پلن‌های قابل انتخاب:</b>\n\n`

    const inlineKeyboard: Array<Array<{ text: string; callbackData?: string }>> = []

    for (const plan of plans) {
      const isAvailable = plan.stock > 0
      text += `🔹 <b>${plan.name}</b>\n`
      text += `   💵 قیمت: ${plan.price.toLocaleString('fa-IR')} تومان\n`
      text += `   📦 وضعیت: ${isAvailable ? `تحویل آنی (${plan.stock} عدد)` : 'ارسال طی یک روز کاری'}\n\n`

      inlineKeyboard.push([
        {
          text: `🛒 انتخاب پلن: ${plan.name} (${plan.price.toLocaleString('fa-IR')} تومان)`,
          callbackData: `plan:select:${plan.id}`,
        },
      ])
    }

    inlineKeyboard.push([{ text: '🔙 بازگشت به لیست محصولات', callbackData: 'nav:products' }])

    return { text, inlineKeyboard }
  }
}
