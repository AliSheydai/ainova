import { Keyboard, InlineKeyboard } from 'grammy'

export const BUTTONS = {
  BUY: '🛒 خرید Google AI Pro',
  ORDERS: '📦 سفارش‌های من',
  GUIDE: '📖 راهنمای فعال‌سازی',
  SUPPORT: '🎧 پشتیبانی',
  LINK_ACCOUNT: '🔗 اتصال به حساب سایت',
}

export function mainMenuKeyboard(isLinked: boolean = false) {
  const kb = new Keyboard()
    .text(BUTTONS.BUY)
    .text(BUTTONS.ORDERS)
    .row()
    .text(BUTTONS.GUIDE)
    .text(BUTTONS.SUPPORT)

  if (!isLinked) {
    kb.row().text(BUTTONS.LINK_ACCOUNT)
  }

  return kb.resized()
}

export function accountLinkKeyboard(webUrl: string) {
  const keyboard = new Keyboard()
    .requestContact('📱 ارسال شماره موبایل (اتصال خودکار)')
    .row()
    .text('🔙 بازگشت به منوی اصلی')
    .resized()

  return keyboard
}

export function accountLinkInlineKeyboard(webUrl: string) {
  return new InlineKeyboard()
    .url('🌐 باز کردن وب‌سایت', webUrl)
    .row()
    .text('🔙 بازگشت به منوی اصلی', 'nav:main')
}

export function productBuyKeyboard(planId: string, planName: string, price: number) {
  return new InlineKeyboard()
    .text(`💳 خرید ${planName} — ${price.toLocaleString('fa-IR')} تومان`, `buy:${planId}`)
    .row()
    .text('🔙 بازگشت به منوی اصلی', 'nav:main')
}

export function orderPaymentKeyboard(paymentUrl: string) {
  return new InlineKeyboard()
    .url('💳 پرداخت آنلاین', paymentUrl)
    .row()
    .text('🔙 بازگشت به منوی اصلی', 'nav:main')
}

export function ordersPaginationKeyboard(page: number, totalPages: number) {
  const keyboard = new InlineKeyboard()

  if (totalPages > 1) {
    if (page > 1) {
      keyboard.text('➡️ صفحه قبلی', `orders:page:${page - 1}`)
    }
    keyboard.text(`صفحه ${page} از ${totalPages}`, 'noop')
    if (page < totalPages) {
      keyboard.text('⬅️ صفحه بعدی', `orders:page:${page + 1}`)
    }
    keyboard.row()
  }

  keyboard.text('🔄 به‌روزرسانی لیست', `orders:page:${page}`).row()
  keyboard.text('🔙 بازگشت به منوی اصلی', 'nav:main')

  return keyboard
}

export function guideKeyboard() {
  return new InlineKeyboard()
    .url('🌍 مدیریت کشور/Region حساب Google', 'https://policies.google.com/country-association-form')
    .row()
    .text('🔙 بازگشت به منوی اصلی', 'nav:main')
}

export function supportKeyboard(phone: string, telegramUrl: string) {
  const keyboard = new InlineKeyboard()

  if (telegramUrl) {
    keyboard.url('💬 پشتیبانی در تلگرام', telegramUrl).row()
  }

  keyboard.text(`☎️ شماره تماس پشتیبانی`, 'support:phone').row()
  keyboard.text('🔙 بازگشت به منوی اصلی', 'nav:main')

  return keyboard
}
