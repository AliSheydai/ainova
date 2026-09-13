import { Keyboard, InlineKeyboard } from 'grammy'

export const BUTTONS = {
  BUY: '🛒 خرید اشتراک',
  ORDERS: '📦 سفارش‌های من',
  NOTIFICATIONS: '🔔 اعلان‌ها',
  GUIDE: '📖 راهنمای فعال‌سازی',
  SUPPORT: '🎧 پشتیبانی',
  LINK_ACCOUNT: '📱 ورود به حساب کاربری',
  LOGOUT: '🚪 خروج از حساب کاربری',
}

export function mainMenuKeyboard(isLinked: boolean = false, unreadCount: number = 0) {
  const notifButton =
    unreadCount > 0 ? `🔔 اعلان‌ها (${unreadCount.toLocaleString('fa-IR')})` : BUTTONS.NOTIFICATIONS

  const kb = new Keyboard()
    .text(BUTTONS.BUY)
    .text(BUTTONS.ORDERS)
    .row()
    .text(notifButton)
    .text(BUTTONS.SUPPORT)
    .row()
    .text(BUTTONS.GUIDE)

  if (isLinked) {
    kb.text(BUTTONS.LOGOUT)
  } else {
    kb.text(BUTTONS.LINK_ACCOUNT)
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

export function deliveryPreferenceKeyboard(
  planId: string,
  productId: string,
  warehouseCount: number | null | undefined
) {
  const kb = new InlineKeyboard()
  const hasInventory = warehouseCount !== null && warehouseCount !== undefined && warehouseCount > 0

  if (hasInventory) {
    kb.text(
      `⚡ اکانت آماده انبار (${warehouseCount.toLocaleString('fa-IR')} عدد - تحویل فوری)`,
      `delivery:mode:${planId}:ready`
    ).row()
  } else {
    kb.text(
      '⚠️ اکانت آماده انبار (موقتاً ناموجود)',
      `delivery:mode:${planId}:exhausted`
    ).row()
  }

  kb.text('👤 فعال‌سازی روی جیمیل شخصی من (۱ الی ۲۴ ساعت)', `delivery:mode:${planId}:own`).row()
  kb.text('🔙 بازگشت به مشخصات محصول', `product:select:${productId}`)

  return kb
}

export function orderSummaryKeyboard(
  planId: string,
  hasCoupon: boolean,
  paymentUrl?: string
) {
  const kb = new InlineKeyboard()

  if (paymentUrl) {
    kb.url('💳 پرداخت آنلاین شاپرک', paymentUrl).row()
  } else {
    kb.text('💳 تأیید و پرداخت آنلاین شاپرک', `order:pay:${planId}`).row()
  }

  if (hasCoupon) {
    kb.text('❌ حذف کد تخفیف', `order:coupon:remove:${planId}`)
  } else {
    kb.text('🏷 ثبت کد تخفیف', `order:coupon:prompt:${planId}`)
  }
  kb.row()

  kb.text('🔙 انصراف و بازگشت', `order:cancel:${planId}`)

  return kb
}

export function ordersPaginationKeyboard(
  page: number,
  totalPages: number,
  actionRequiredOrders?: Array<{ id: string; code: string }>
) {
  const keyboard = new InlineKeyboard()

  // If there are orders waiting for user credential fix, show action buttons on top
  if (actionRequiredOrders && actionRequiredOrders.length > 0) {
    for (const item of actionRequiredOrders) {
      keyboard.text(`✏️ ویرایش اطلاعات اکانت #${item.code}`, `fix_cred:${item.id}`).row()
    }
  }

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

export function fixCredentialsEmailKeyboard(orderId: string, currentEmail?: string) {
  const kb = new InlineKeyboard()
  if (currentEmail) {
    kb.text(`⏭️ تأیید همین جیمیل (${currentEmail})`, 'fix_cred:keep_email').row()
  }
  kb.text('❌ انصراف', `order:fix_cancel:${orderId}`)
  return kb
}

export function fixCredentialsPasswordKeyboard(orderId: string, hasExistingPassword?: boolean) {
  const kb = new InlineKeyboard()
  if (hasExistingPassword) {
    kb.text('⏭️ رمز عبور قبلی تغییر نکند', 'fix_cred:keep_pass').row()
  }
  kb.text('❌ انصراف', `order:fix_cancel:${orderId}`)
  return kb
}

export function fixCredentialsNoteKeyboard(orderId: string) {
  return new InlineKeyboard()
    .text('⏭️ بدون یادداشت (رد شدن)', 'fix_cred:skip_note')
    .row()
    .text('❌ انصراف', `order:fix_cancel:${orderId}`)
}

export function fixCredentialsConfirmKeyboard(orderId: string) {
  return new InlineKeyboard()
    .text('✅ ثبت و ارسال اطلاعات به مدیر', 'fix_cred:submit')
    .row()
    .text('🔄 ویرایش مجدد از ابتدا', `fix_cred:${orderId}`)
    .row()
    .text('❌ انصراف', `order:fix_cancel:${orderId}`)
}

export function fixCredentialsCancelKeyboard(orderId: string) {
  return new InlineKeyboard()
    .text('❌ انصراف', `order:fix_cancel:${orderId}`)
    .row()
    .text('🔙 بازگشت به سفارش‌ها', 'orders:page:1')
}

function getValidWebUrl(path: string, customUrl?: string): string {
  const candidate = customUrl || process.env.NEXT_PUBLIC_APP_URL || ''
  const isInvalid =
    !candidate ||
    candidate.startsWith('/') ||
    candidate.includes('localhost') ||
    candidate.includes('127.0.0.1')

  const base = isInvalid ? 'https://ariachat.org' : candidate.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

export function guideMenuKeyboard(webUrl?: string) {
  const kb = new InlineKeyboard()
    .text('⚡ پلن ۱: لینک فعال‌سازی آنی', 'guide:link')
    .row()
    .text('📧 پلن ۲: اکانت اختصاصی روی ایمیل', 'guide:email')
    .row()
    .text('✨ ۳ نکته طلایی فعال‌سازی', 'guide:tips')
    .text('❓ سوالات متداول و رفع خطا', 'guide:faq')
    .row()

  const guideWebUrl = getValidWebUrl('/dashboard/activation-guide', webUrl)
  kb.url('🌐 مشاهده راهنما در وب‌سایت', guideWebUrl).row()
  kb.url('🌍 فرم تغییر ریجن گوگل', 'https://policies.google.com/country-association-form').row()

  kb.text('🔙 بازگشت به منوی اصلی', 'nav:main')
  return kb
}

export function guideSubSectionKeyboard(
  currentSection: 'link' | 'email' | 'tips' | 'faq',
  webUrl?: string
) {
  const kb = new InlineKeyboard()

  if (currentSection === 'link') {
    kb.text('📧 پلن ۲: اکانت اختصاصی روی ایمیل', 'guide:email').row()
  } else if (currentSection === 'email') {
    kb.text('⚡ پلن ۱: لینک فعال‌سازی آنی', 'guide:link').row()
  } else if (currentSection === 'tips') {
    kb.text('❓ سوالات متداول و رفع خطا', 'guide:faq').row()
  } else if (currentSection === 'faq') {
    kb.text('✨ ۳ نکته طلایی فعال‌سازی', 'guide:tips').row()
  }

  const guideWebUrl = getValidWebUrl('/dashboard/activation-guide', webUrl)

  kb.url('🌐 راهنمای تصویری وب‌سایت', guideWebUrl).row()
  kb.text('📖 بازگشت به فهرست راهنما', 'guide:menu')
  kb.text('🔙 منوی اصلی', 'nav:main')

  return kb
}

export function guideKeyboard(webUrl?: string) {
  return guideMenuKeyboard(webUrl)
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

export function notificationsListKeyboard(
  notifications: Array<{ id: string; isRead: boolean }>,
  page: number,
  totalPages: number,
  filter: 'all' | 'unread',
  unreadCount: number
) {
  const kb = new InlineKeyboard()

  // Row 1: Filter switch & Read all
  if (filter === 'all') {
    if (unreadCount > 0) {
      kb.text(`🔴 فقط خوانده‌نشده‌ها (${unreadCount.toLocaleString('fa-IR')})`, `notif:filter:unread:1`)
    }
  } else {
    kb.text('📋 همه اعلان‌ها', `notif:filter:all:1`)
  }

  if (unreadCount > 0) {
    kb.text('✅ خواندن همه', 'notif:read_all')
  }
  kb.row()

  // Row 2: Quick mark-as-read buttons for unread items on current page
  const unreadItems = notifications.filter((n) => !n.isRead)
  if (unreadItems.length > 0) {
    for (let i = 0; i < unreadItems.length; i++) {
      kb.text(`✓ خواندن #${(i + 1).toLocaleString('fa-IR')}`, `notif:read:${unreadItems[i].id}`)
    }
    kb.row()
  }

  // Row 3: Pagination
  if (totalPages > 1) {
    if (page > 1) {
      kb.text('➡️ قبلی', `notif:page:${page - 1}:${filter}`)
    }
    kb.text(`${page.toLocaleString('fa-IR')} از ${totalPages.toLocaleString('fa-IR')}`, 'noop')
    if (page < totalPages) {
      kb.text('⬅️ بعدی', `notif:page:${page + 1}:${filter}`)
    }
    kb.row()
  }

  // Row 4: Refresh & Main Menu
  kb.text('🔄 به‌روزرسانی', `notif:refresh:${page}:${filter}`)
  kb.text('🔙 منوی اصلی', 'nav:main')

  return kb
}

export function notificationDetailKeyboard(
  notificationId: string,
  isRead: boolean,
  link?: string | null
) {
  const kb = new InlineKeyboard()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ariachat.org'

  if (link) {
    if (link.startsWith('http://') || link.startsWith('https://')) {
      kb.url('🔗 باز کردن پیوند', link).row()
    } else {
      const fullUrl = link.startsWith('/') ? `${appUrl}${link}` : `${appUrl}/${link}`
      kb.url('🌐 مشاهده در سایت', fullUrl).row()
    }
  }

  if (!isRead) {
    kb.text('✓ علامت‌گذاری به عنوان خوانده‌شده', `notif:read:${notificationId}`).row()
  }

  kb.text('📋 بازگشت به لیست اعلان‌ها', 'notif:list:1')
  kb.text('🔙 منوی اصلی', 'nav:main')

  return kb
}
