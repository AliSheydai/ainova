import { Keyboard, InlineKeyboard } from 'grammy'

export const BUTTONS = {
  BUY: '🛒 خرید اشتراک',
  ORDERS: '📦 سفارش‌های من',
  GUIDE: '📖 راهنمای فعال‌سازی',
  SUPPORT: '🎧 پشتیبانی',
  LINK_ACCOUNT: '📱 ورود به حساب کاربری',
  LOGOUT: '🚪 خروج از حساب کاربری',
}

export function mainMenuKeyboard(isLinked: boolean = false) {
  const kb = new Keyboard()
    .text(BUTTONS.BUY)
    .text(BUTTONS.ORDERS)
    .row()
    .text(BUTTONS.GUIDE)
    .text(BUTTONS.SUPPORT)

  if (isLinked) {
    kb.row().text(BUTTONS.LOGOUT)
  } else {
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

export function phoneRequestKeyboard() {
  return new Keyboard()
    .requestContact('📱 ارسال شماره موبایل')
    .row()
    .text('🔙 بازگشت به منوی اصلی')
    .resized()
}

export function otpInlineKeyboard() {
  return new InlineKeyboard()
    .text('🔄 ارسال مجدد کد', 'auth:resend')
    .text('✏️ تغییر شماره موبایل', 'auth:change_phone')
    .row()
    .text('🔙 انصراف و بازگشت', 'nav:main')
}

export function accountLinkInlineKeyboard(webUrl: string) {
  return new InlineKeyboard()
    .url('🌐 باز کردن وب‌سایت', webUrl)
    .row()
    .text('🔙 بازگشت به منوی اصلی', 'nav:main')
}

export function productsListInlineKeyboard(
  products: Array<{ id: string; title: string; price: number; stock: number }>
) {
  const kb = new InlineKeyboard()
  for (const prod of products) {
    const stockStr = prod.stock > 0 ? '' : ' (ناموجود)'
    kb.text(
      `🔹 ${prod.title} — ${prod.price.toLocaleString('fa-IR')} تومان${stockStr}`,
      `product:select:${prod.id}`
    ).row()
  }
  kb.text('🔙 بازگشت به منوی اصلی', 'nav:main')
  return kb
}

export function productDetailsKeyboard(
  productId: string,
  price: number,
  isAvailable: boolean
) {
  const kb = new InlineKeyboard()
  if (isAvailable) {
    kb.text(
      `💳 خرید این محصول (${price.toLocaleString('fa-IR')} تومان)`,
      `buy:product:${productId}`
    ).row()
  }
  kb.text('📋 بازگشت به لیست محصولات', 'nav:products').row()
  kb.text('🔙 منوی اصلی', 'nav:main')
  return kb
}

export function productBuyKeyboard(planId: string, planName: string, price: number) {
  return new InlineKeyboard()
    .text(`💳 خرید ${planName} — ${price.toLocaleString('fa-IR')} تومان`, `buy:${planId}`)
    .row()
    .text('🔙 بازگشت به منوی اصلی', 'nav:main')
}

export function orderPaymentKeyboard(paymentUrl: string) {
  const keyboard = new InlineKeyboard()
  const isInvalidUrl =
    !paymentUrl ||
    paymentUrl.startsWith('/') ||
    paymentUrl.includes('localhost') ||
    paymentUrl.includes('127.0.0.1')

  if (!isInvalidUrl && (paymentUrl.startsWith('http://') || paymentUrl.startsWith('https://'))) {
    keyboard.url('💳 پرداخت آنلاین', paymentUrl).row()
  }

  keyboard.text('🔙 بازگشت به منوی اصلی', 'nav:main')
  return keyboard
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
