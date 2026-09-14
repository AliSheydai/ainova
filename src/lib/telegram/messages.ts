import { formatPrice, toPersianDigits } from '@/lib/persian-utils'

export const MESSAGES = {
  welcome: (name?: string) =>
    `👋 سلام ${name || 'کاربر'} عزیز!\n\nبه ربات آریوچت خوش آمدید.\nاز منوی پایین گزینه مورد نظر را انتخاب کنید.`,

  mainMenuPrompt: 'لطفاً یکی از گزینه‌های زیر را انتخاب کنید:',

  activationGuideOverview: `📖 **راهنمای فعال‌سازی**

سفارش‌ها در دو پلن تحویل داده می‌شوند:

**پلن ۱ — لینک آنی:** بدون رمز عبور. لینک دعوت بلافاصله پس از پرداخت تحویل می‌شود.

**پلن ۲ — اکانت روی ایمیل:** شارژ مستقیم روی جیمیل شما یا تحویل اکانت آماده.

برای راهنمای کامل هر پلن، دکمه مربوطه را انتخاب کنید.`,

  get activationGuide() {
    return this.activationGuideOverview
  },

  activationGuidePlanLink: `⚡ **راهنمای پلن ۱ — لینک آنی**

بدون نیاز به ارسال رمز عبور. بلافاصله پس از پرداخت، لینک دعوت اختصاصی دریافت می‌کنید.

مراحل فعال‌سازی:
۱. لینک را از بخش «سفارش‌های من» بردارید.
۲. با فیلترشکن روشن (آمریکا یا اروپا)، لینک را در پنجره ناشناس (Incognito) باز کنید.
۳. با حساب گوگل خود وارد شوید و دکمه تایید (Accept/Join) را بزنید.

نکته: هر جیمیل در ۱۲ ماه یک‌بار امکان عضویت در خانواده گوگل را دارد. در صورت بروز خطا، از یک جیمیل تازه استفاده کنید.`,

  activationGuidePlanEmail: `📧 **راهنمای پلن ۲ — اکانت روی ایمیل**

این پلن به دو شیوه تحویل می‌شود:

**۱. اکانت آماده انبار (تحویل فوری):**
مشخصات اکانت نو پس از پرداخت در بخش «سفارش‌های من» تحویل داده می‌شود. اشتراک فعال است و امکان تغییر کامل مشخصات امنیتی وجود دارد.

**۲. فعال‌سازی روی جیمیل شما (۱ الی ۲۴ ساعت):**
اشتراک مستقیماً روی جیمیل اعلامی شما توسط کارشناسان فعال می‌شود و نیازی به انتقال اطلاعات ندارید.`,

  activationGuideGoldenTips: `✨ **نکات طلایی فعال‌سازی**

۱. **اتصال VPN:** از آی‌پی پایدار (آمریکا یا اروپا) استفاده کنید.

۲. **تب ناشناس (Incognito):** برای جلوگیری از تداخل حساب‌ها، لینک را در تب ناشناس باز کنید.

۳. **حریم خصوصی ۱۰۰٪:** چت‌ها و فایل‌های شما کاملاً محرمانه و در انحصار خودتان باقی می‌ماند.`,

  activationGuideFaq: `❓ **پرسش‌های متداول**

**آیا در لینک آنی به رمز عبور نیازی است؟**
خیر، فقط با جیمیل خود وارد شده و دعوت را تایید می‌کنید.

**خطای محدودیت خانواده گوگل (Family Restriction) چیست؟**
هر اکانت گوگل در ۱۲ ماه یک‌بار امکان تعویض فمیلی دارد. در صورت بروز این خطا، لینک را روی یک جیمیل جدید فعال کنید.

**آیا در اکانت آماده امکان تغییر رمز عبور وجود دارد؟**
بله، اکانت اختصاصی و نو است و می‌توانید تمامی اطلاعات آن را تغییر دهید.

**ارتباط با پشتیبانی:**
از دکمه «پشتیبانی» در منوی اصلی استفاده کنید (ساعات ۹ صبح تا ۱۱ شب).`,

  support: (phone: string, _telegramUrl?: string) =>
    `🎧 **پشتیبانی آریوچت**\n\nساعات پاسخگویی: ۹ صبح تا ۱۱ شب\n\nشماره تماس: \`${phone}\``,

  noOrders: '📦 شما هنوز سفارشی ثبت نکرده‌اید.\nبرای خرید، از دکمه «خرید اشتراک» استفاده کنید.',

  stockExhausted:
    '⚠️ **اتمام موجودی موقت**\n\nموجودی این پلن موقتاً تمام شده است. به زودی موجودی جدید شارژ خواهد شد.',

  orderCreated: (orderId: string, planName: string, amount: number) =>
    `🧾 **سفارش ایجاد شد**\n\n` +
    `شماره سفارش: \`#${toPersianDigits(orderId.slice(-6).toUpperCase())}\`\n` +
    `محصول: ${planName}\n` +
    `مبلغ: **${formatPrice(amount)}**\n\n` +
    `برای تکمیل خرید، روی دکمه «پرداخت آنلاین» بزنید.`,

  paymentSuccess: (_orderId: string, planName: string, activationUrl: string) =>
    `✅ **پرداخت تایید شد**\n\n` +
    `سفارش ${planName} ثبت شد.\n` +
    `لینک فعال‌سازی اختصاصی شما:\n\n` +
    `${activationUrl}\n\n` +
    `لینک در بخش «سفارش‌های من» هم در دسترس است.`,

  paymentSuccessStockWaiting: (orderId: string, planName: string) =>
    `✅ **پرداخت تایید شد**\n\n` +
    `سفارش ${planName} با شماره \`#${orderId.slice(-6).toUpperCase()}\` ثبت شد.\n` +
    `به دلیل اتمام موقت موجودی آنی، لینک فعال‌سازی به زودی توسط پشتیبانی ارسال خواهد شد.\n` +
    `لینک در بخش «سفارش‌های من» نیز قرار خواهد گرفت.`,

  linkSuccess: (userName: string, phone: string) =>
    `🎉 **اتصال حساب کاربری انجام شد**\n\n` +
    `سلام ${userName} عزیز، اکانت تلگرام شما به شماره \`${phone}\` متصل شد.\n\n` +
    `اکنون می‌توانید سفارش‌ها و لینک‌های فعال‌سازی را در بخش «سفارش‌های من» مشاهده کنید.`,

  linkExpired:
    `⚠️ **لینک اتصال منقضی شده است**\n\n` +
    `لطفاً در داشبورد وب‌سایت از بخش پروفایل، مجدداً روی «اتصال به ربات تلگرام» بزنید.`,

  linkPrompt:
    `🔗 **اتصال حساب به وب‌سایت**\n\n` +
    `برای همگام‌سازی سفارش‌ها و لینک‌های فعال‌سازی، یکی از دو روش زیر را انتخاب کنید:\n\n` +
    `۱. دکمه «ارسال شماره موبایل» را لمس کنید.\n` +
    `۲. وارد وب‌سایت شده و در پروفایل، روی «اتصال به ربات تلگرام» بزنید.`,

  loginPrompt:
    `برای ادامه، شماره موبایل خود را وارد کنید.\n\n` +
    `از دکمه زیر استفاده کنید یا مستقیم تایپ کنید (مثال: \`۰۹۱۲۳۴۵۶۷۸۹\`).`,

  otpSent: (phone: string, expireMinutes: number = 5, devCode?: string) =>
    `📨 کد تأیید به شماره \`${toPersianDigits(phone)}\` پیامک شد.\n\n` +
    `لطفاً کد ۵ رقمی را ارسال فرمایید (اعتبار: ${toPersianDigits(expireMinutes)} دقیقه)` +
    (devCode ? `\n\n*(کد تست محیط توسعه: \`${toPersianDigits(devCode)}\`)*` : ''),

  otpInvalid:
    `❌ کد تأیید نامعتبر یا منقضی شده است.\n` +
    `لطفاً مجدداً ارسال کنید یا روی «ارسال مجدد کد» بزنید.`,

  phoneInvalid:
    `❌ شماره موبایل وارد شده نامعتبر است.\n` +
    `لطفاً شماره‌ای مانند \`۰۹۱۲۳۴۵۶۷۸۹\` وارد کنید یا از دکمه ارسال شماره موبایل استفاده کنید.`,

  loginSuccess: (phone: string) =>
    `🎉 **ورود موفق**\n\nحساب شما با شماره \`${phone}\` متصل شد.`,

  deeplinkLoginSuccess: (phone: string) =>
    `🎉 **اتصال مستقیم برقرار شد**\n\nحساب کاربری شما با شماره \`${phone}\` به ربات متصل شد.`,

  logoutSuccess:
    `🚪 **از حساب خارج شدید**\n\nاتصال این اکانت تلگرام قطع شد.\nبرای ورود مجدد، از دکمه «ورود به حساب کاربری» استفاده کنید.`,

  preCreatedDeliveryChoice: (planName: string, warehouseCount: number | null | undefined) => {
    const hasInventory = warehouseCount !== null && warehouseCount !== undefined && warehouseCount > 0
    const countText = hasInventory
      ? `هم‌اکنون **${warehouseCount.toLocaleString('fa-IR')} اکانت آماده** در انبار موجود است.`
      : `موجودی اکانت‌های آماده انبار موقتاً تمام شده است، اما سفارش شما روی جیمیل شخصی فعال خواهد شد.`

    return (
      `📦 **انتخاب شیوه تحویل — ${planName}**\n\n` +
      `${countText}\n\n` +
      `یکی از روش‌های زیر را انتخاب کنید:\n\n` +
      `**۱. اکانت آماده انبار:** تحویل فوری مشخصات ورود بلافاصله پس از پرداخت.\n\n` +
      `**۲. فعال‌سازی روی جیمیل شما:** شارژ مستقیم روی جیمیل شخصی توسط کارشناسان (۱ الی ۲۴ ساعت).`
    )
  },

  gmailPrompt: (planName: string) =>
    `📧 **ثبت جیمیل — ${planName}**\n\n` +
    `لطفاً آدرس جیمیل خود را ارسال کنید:\n` +
    `*(مثال: example@gmail.com)*`,

  passwordPrompt: (gmail: string) =>
    `🔑 **رمز عبور جیمیل**\n\n` +
    `لطفاً رمز عبور اکانت گوگل \`${gmail}\` را ارسال فرمایید:\n\n` +
    `اطلاعات شما با پروتکل AES-256 رمزنگاری می‌شود و صرفاً جهت فعال‌سازی اشتراک استفاده می‌گردد.`,

  couponPrompt: (currentAmount: number) =>
    `🏷 **کد تخفیف**\n\n` +
    `مبلغ سفارش: **${formatPrice(currentAmount)}**\n\n` +
    `لطفاً کد تخفیف را ارسال فرمایید (جهت انصراف، کلمه «انصراف» را ارسال کنید):`,

  orderSummaryCard: (options: {
    productTitle: string
    planName: string
    deliveryLabel: string
    amount: number
    originalAmount?: number
    discountAmount?: number
    couponCode?: string
    customerGmail?: string
  }) => {
    const {
      productTitle,
      planName,
      deliveryLabel,
      amount,
      originalAmount,
      discountAmount,
      couponCode,
      customerGmail,
    } = options

    let text = `🧾 **پیش‌فاکتور سفارش**\n\n`
    text += `محصول: ${productTitle}\n`
    text += `پلن: ${planName}\n`
    text += `شیوه تحویل: ${deliveryLabel}\n`
    if (customerGmail) {
      text += `جیمیل: \`${customerGmail}\`\n`
    }

    if (couponCode && discountAmount && discountAmount > 0 && originalAmount) {
      text += `قیمت پایه: ~~${formatPrice(originalAmount)}~~\n`
      text += `کد تخفیف: \`${couponCode}\` (${formatPrice(discountAmount)} تخفیف)\n`
    }
    text += `مبلغ: **${formatPrice(amount)}**\n\n`
    text += `پرداخت از طریق درگاه شاپرک انجام می‌شود.`

    return text
  },
}

export function formatProductDetails(
  productName: string,
  planName: string,
  durationMonths: number,
  price: number
): string {
  return (
    `✨ **${productName} — ${planName}**\n\n` +
    `اشتراک ${toPersianDigits(durationMonths)} ماهه با دسترسی کامل به Gemini پیشرفته،\n` +
    `Google Workspace AI، فضای ابری Google One و Deep Research.\n\n` +
    `قیمت: **${formatPrice(price)}**\n` +
    `تحویل: آنی پس از پرداخت`
  )
}
