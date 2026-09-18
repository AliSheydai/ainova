import { formatPrice, toPersianDigits } from '@/lib/persian-utils'
import { escapeHtml } from './formatting'

export const MESSAGES = {
  welcome: (name?: string) =>
    `👋 <b>به ربات رسمی آریوچت خوش آمدید</b>\n\n` +
    `سلام <b>${escapeHtml(name || 'کاربر')}</b> عزیز! 🎉\n\n` +
    `به سامانه هوشمند خرید و تحویل آنی اشتراک‌های رسمی هوش مصنوعی خوش آمدید.\n\n` +
    `🌟 <b>مزایای خرید از آریوچت:</b>\n` +
    `• تحویل فوری و خودکار بلافاصله پس از پرداخت\n` +
    `• اشتراک‌های قانونی و اختصاصی با تضمین کامل\n` +
    `• پشتیبانی ۲۴ ساعته و راهنمای مرحله‌به‌مرحله فعال‌سازی\n\n` +
    `لطفاً یکی از گزینه‌های منوی زیر را انتخاب نمایید:`,

  mainMenuPrompt:
    `🏠 <b>منوی اصلی آریوچت</b>\n\n` +
    `لطفاً یکی از گزینه‌های زیر را جهت دسترسی به امکانات انتخاب فرمایید:`,

  activationGuideOverview:
    `📖 <b>راهنمای جامع فعال‌سازی اشتراک‌ها</b>\n\n` +
    `سفارش‌ها بسته به نوع محصول، در دو شیوه کلی تحویل داده می‌شوند:\n\n` +
    `⚡ <b>پلن ۱ — لینک فعال‌سازی آنی:</b>\n` +
    `بدون نیاز به رمز عبور؛ لینک اختصاصی بلافاصله پس از پرداخت به شما نمایش داده می‌شود.\n\n` +
    `📧 <b>پلن ۲ — اکانت روی ایمیل:</b>\n` +
    `تحویل اکانت آماده با مشخصات کامل یا فعال‌سازی مستقیم روی جیمیل شخصی شما.\n\n` +
    `جهت مطالعه راهنمای دقیق هر شیوه یا نکات مهم، روی دکمه‌های زیر کلیک فرمایید:`,

  get activationGuide() {
    return this.activationGuideOverview
  },

  activationGuidePlanLink:
    `⚡ <b>راهنمای پلن ۱ — لینک فعال‌سازی آنی</b>\n\n` +
    `در این شیوه <b>هیچ نیازی به ارسال رمز عبور نیست</b> و لینک دعوت بلافاصله پس از پرداخت صادر می‌گردد.\n\n` +
    `📋 <b>مراحل گام‌به‌گام فعال‌سازی:</b>\n` +
    `۱. لینک اختصاصی را از بخش «سفارش‌های من» بردارید.\n` +
    `۲. فیلترشکن خود را روی سرور پایدار (آمریکا یا اروپا) روشن کنید.\n` +
    `۳. لینک را در تب ناشناس مرورگر (Incognito Window) باز کنید.\n` +
    `۴. با جیمیل خود وارد شده و دکمه عضویت یا تأیید (Accept/Join) را لمس فرمایید.\n\n` +
    `<blockquote>💡 <b>نکته مهم:</b>\n` +
    `طبق قوانین گوگل، هر اکانت جیمیل در هر ۱۲ ماه فقط یک‌بار می‌تواند عضو فمیلی جدید شود. در صورت مشاهده خطای محدودیت، کافیست لینک را روی یک جیمیل تازه باز کنید.</blockquote>`,

  activationGuidePlanEmail:
    `📧 <b>راهنمای پلن ۲ — اکانت روی ایمیل</b>\n\n` +
    `این پلن به دو روش قابل تحویل است:\n\n` +
    `۱. <b>اکانت آماده انبار (تحویل فوری ۰ ثانیه):</b>\n` +
    `مشخصات یک اکانت نو و اختصاصی بلافاصله پس از پرداخت در بخش «سفارش‌های من» تحویل داده می‌شود. اشتراک فعال است و کنترل امنیتی کامل اکانت متعلق به شماست.\n\n` +
    `۲. <b>فعال‌سازی روی جیمیل شخصی (۱ الی ۲۴ ساعت):</b>\n` +
    `اشتراک مستقیماً روی ایمیل اعلامی شما توسط کارشناسان فعال می‌شود و نیازی به جابجایی اطلاعات ندارید.`,

  activationGuideGoldenTips:
    `✨ <b>نکات طلایی و توصیه‌های فعال‌سازی</b>\n\n` +
    `۱. <b>آی‌پی اتصال (VPN):</b>\n` +
    `همواره از آی‌پی تمیز و پایدار آمریکا یا اروپا استفاده نمایید.\n\n` +
    `۲. <b>استفاده از تب ناشناس (Incognito):</b>\n` +
    `جهت جلوگیری از تداخل حساب‌های کاربری فعال روی مرورگر، همواره لینک را در تب ناشناس باز کنید.\n\n` +
    `۳. <b>حفظ ۱۰۰٪ حریم خصوصی:</b>\n` +
    `چت‌ها، فایل‌ها و پرامپت‌های شما کاملاً محرمانه بوده و سایر اعضای فمیلی یا مدیر به هیچ‌وجه دسترسی به محتوای شما نخواهند داشت.`,

  activationGuideFaq:
    `❓ <b>پرسش‌های متداول (FAQ)</b>\n\n` +
    `• <b>آیا در لینک آنی نیازی به ارسال رمز عبور هست؟</b>\n` +
    `خیر، فعال‌سازی تنها با ورود به جیمیل شخصی خودتان انجام می‌شود.\n\n` +
    `• <b>خطای محدودیت خانواده گوگل (Family Restriction) چیست؟</b>\n` +
    `هر اکانت در ۱۲ ماه یک‌بار امکان تعویض فمیلی دارد؛ در صورت بروز خطا، لینک را روی یک جیمیل دیگر باز نمایید.\n\n` +
    `• <b>آیا در اکانت آماده امکان تغییر رمز عبور وجود دارد؟</b>\n` +
    `بله، اکانت اختصاصی و نو است و می‌توانید تمامی اطلاعات امنیتی آن را تغییر دهید.\n\n` +
    `• <b>ساعات پشتیبانی چگونه است؟</b>\n` +
    `همه روزه از ساعت ۹ صبح الی ۲۳ شب از طریق دکمه «پشتیبانی» پاسخگوی شما هستیم.`,

  support: (phone: string, telegramUrl?: string) =>
    `🎧 <b>مرکز پشتیبانی و خدمات پس از فروش آریوچت</b>\n\n` +
    `تیم پشتیبانی ما همه روزه آماده پاسخگویی و راهنمایی شماست:\n\n` +
    `• ⏰ <b>ساعات کاری:</b> همه روزه ۹ صبح الی ۲۳ شب\n` +
    `• 📞 <b>شماره تماس:</b> <code>${escapeHtml(phone)}</code>\n` +
    (telegramUrl ? `• 💬 <b>پشتیبانی در تلگرام:</b> <a href="${telegramUrl}">ارسال پیام به کارشناس</a>\n` : '') +
    `\nاز طریق دکمه‌های زیر می‌توانید مستقیماً ارتباط برقرار فرمایید:`,

  noOrders:
    `📦 <b>صندوق سفارش‌های شما</b>\n\n` +
    `شما هنوز سفارشی در سامانه ثبت نکرده‌اید.\n\n` +
    `جهت مشاهده و خرید اشتراک‌ها، از دکمه «🛒 خرید اشتراک» استفاده کنید.`,

  stockExhausted:
    `⚠️ <b>اتمام موجودی موقت</b>\n\n` +
    `موجودی این پلن در حال حاضر تمام شده است.\n` +
    `ظرفیت‌های جدید به زودی شارژ خواهند شد. برای اطلاع سریع‌تر با پشتیبانی در ارتباط باشید.`,

  orderCreated: (
    orderId: string,
    planName: string,
    amount: number,
    options?: {
      originalAmount?: number
      discountAmount?: number
      couponCode?: string
    }
  ) => {
    let text = `🧾 <b>سفارش شما ایجاد شد</b>\n\n`
    text += `• 🔢 <b>شناسه سفارش:</b> <code>#${toPersianDigits(orderId.slice(-6).toUpperCase())}</code>\n`
    text += `• 🛍 <b>محصول:</b> <b>${escapeHtml(planName)}</b>\n`

    if (
      options?.couponCode &&
      options?.discountAmount &&
      options.discountAmount > 0 &&
      options.originalAmount
    ) {
      text += `• 🏷 <b>قیمت پایه:</b> <s>${formatPrice(options.originalAmount)}</s>\n`
      text += `• 🎁 <b>کد تخفیف:</b> <code>${escapeHtml(options.couponCode)}</code> (${formatPrice(options.discountAmount)} تخفیف)\n`
    }

    text += `• 💰 <b>مبلغ قابل پرداخت:</b> <b>${formatPrice(amount)}</b>\n\n`
    text += `برای تکمیل خرید و دریافت سفارش، روی دکمه «💳 تأیید و پرداخت آنلاین» در زیر کلیک کنید.`
    return text
  },

  paymentSuccess: (orderId: string, planName: string, activationUrl: string) =>
    `🎉 <b>پرداخت با موفقیت تأیید شد</b>\n\n` +
    `سفارش شما با موفقیت ثبت گردید:\n` +
    `• 🔢 <b>شناسه سفارش:</b> <code>#${toPersianDigits(orderId.slice(-6).toUpperCase())}</code>\n` +
    `• 🛍 <b>محصول:</b> <b>${escapeHtml(planName)}</b>\n\n` +
    `🔗 <b>لینک فعال‌سازی اختصاصی شما:</b>\n` +
    `<code>${activationUrl}</code>\n\n` +
    `<blockquote>🔐 <b>راهنمای فعال‌سازی:</b>\n` +
    `کافیست روی لینک بالا یا دکمه فعال‌سازی کلیک کنید. نیازی به ارسال رمز عبور نیست.</blockquote>\n\n` +
    `این لینک هم‌اکنون در بخش «سفارش‌های من» نیز ذخیره و در دسترس است.`,

  paymentSuccessStockWaiting: (orderId: string, planName: string) =>
    `🎉 <b>پرداخت با موفقیت تأیید شد</b>\n\n` +
    `سفارش <b>${escapeHtml(planName)}</b> با شناسه <code>#${toPersianDigits(orderId.slice(-6).toUpperCase())}</code> ثبت گردید.\n\n` +
    `<blockquote>⏳ <b>در صف آماده‌سازی:</b>\n` +
    `به دلیل تقاضای بالا، اکانت شما در صف آماده‌سازی اختصاصی قرار گرفت و مشخصات به زودی توسط پشتیبانی ارسال خواهد شد.</blockquote>\n\n` +
    `وضعیت سفارش در بخش «سفارش‌های من» قابل پیگیری است.`,

  linkSuccess: (userName: string, phone: string) =>
    `🎉 <b>اتصال حساب کاربری با موفقیت انجام شد</b>\n\n` +
    `سلام <b>${escapeHtml(userName)}</b> عزیز! حساب تلگرام شما به شماره موبایل <code>${escapeHtml(phone)}</code> متصل گردید.\n\n` +
    `اکنون می‌توانید تمامی سفارش‌ها، فاکتورها و لینک‌های فعال‌سازی خود را در ربات مشاهده فرمایید.`,

  linkExpired:
    `⚠️ <b>لینک اتصال منقضی گردیده است</b>\n\n` +
    `مهلت استفاده از این لینک به پایان رسیده است.\n` +
    `لطفاً در داشبورد وب‌سایت از بخش پروفایل، مجدداً روی «اتصال به ربات تلگرام» بزنید.`,

  linkPrompt:
    `🔗 <b>اتصال حساب به وب‌سایت</b>\n\n` +
    `جهت همگام‌سازی لحظه‌ای سفارش‌ها و لینک‌های فعال‌سازی، یکی از دو روش زیر را انتخاب کنید:\n\n` +
    `۱. دکمه «ارسال شماره موبایل» را در پایین صفحه لمس کنید.\n` +
    `۲. وارد وب‌سایت شده و در بخش پروفایل، روی «اتصال به ربات تلگرام» کلیک فرمایید.`,

  loginPrompt:
    `🔐 <b>ورود به حساب کاربری</b>\n\n` +
    `برای دسترسی به سفارش‌ها، دریافت آنی لینک‌ها و ثبت خرید، لطفاً شماره موبایل خود را ارسال فرمایید:\n\n` +
    `می‌توانید از دکمه «ارسال شماره موبایل» استفاده کنید یا شماره را مستقیم تایپ نمایید (مثال: <code>۰۹۱۲۳۴۵۶۷۸۹</code>).`,

  otpSent: (phone: string, expireMinutes: number = 5, devCode?: string) =>
    `📨 <b>ارسال کد تأیید ورود</b>\n\n` +
    `کد تأیید ورود به شماره <code>${escapeHtml(toPersianDigits(phone))}</code> پیامک شد.\n\n` +
    `• ⏳ <b>مدت اعتبار:</b> ${toPersianDigits(expireMinutes)} دقیقه\n\n` +
    `لطفاً کد ۵ رقمی را در چت ارسال فرمایید:` +
    (devCode ? `\n\n<code>(کد تست توسعه: ${escapeHtml(toPersianDigits(devCode))})</code>` : ''),

  otpInvalid:
    `❌ <b>کد تأیید نامعتبر یا منقضی شده است</b>\n\n` +
    `لطفاً کد را به درستی وارد کنید یا روی «ارسال مجدد کد» کلیک نمایید.`,

  phoneInvalid:
    `❌ <b>شماره موبایل وارد شده نامعتبر است</b>\n\n` +
    `لطفاً شماره‌ای مانند <code>۰۹۱۲۳۴۵۶۷۸۹</code> وارد فرمایید یا از دکمه «ارسال شماره موبایل» استفاده کنید.`,

  loginSuccess: (phone: string) =>
    `🎉 <b>ورود با موفقیت انجام شد</b>\n\n` +
    `حساب کاربری شما با شماره <code>${escapeHtml(phone)}</code> متصل گردید.\n` +
    `اکنون می‌توانید از تمامی امکانات ربات استفاده فرمایید.`,

  deeplinkLoginSuccess: (phone: string) =>
    `🎉 <b>اتصال مستقیم با موفقیت برقرار شد</b>\n\n` +
    `حساب کاربری شما با شماره <code>${escapeHtml(phone)}</code> با موفقیت به ربات متصل گردید.`,

  logoutSuccess:
    `🚪 <b>از حساب کاربری خارج شدید</b>\n\n` +
    `اتصال این اکانت تلگرام به شماره شما قطع شد.\n` +
    `جهت ورود مجدد، می‌توانید از دکمه «ورود به حساب کاربری» استفاده فرمایید.`,

  preCreatedDeliveryChoice: (planName: string, warehouseCount: number | null | undefined) => {
    const hasInventory = warehouseCount !== null && warehouseCount !== undefined && warehouseCount > 0
    const countText = hasInventory
      ? `✅ هم‌اکنون <b>${warehouseCount.toLocaleString('fa-IR')} اکانت آماده</b> در انبار موجود است.`
      : `⚠️ موجودی اکانت‌های آماده انبار موقتاً تمام شده است، اما سفارش شما روی جیمیل شخصی فعال خواهد شد.`

    return (
      `📦 <b>انتخاب شیوه تحویل — ${escapeHtml(planName)}</b>\n\n` +
      `${countText}\n\n` +
      `یکی از روش‌های زیر را جهت تحویل سفارش انتخاب نمایید:\n\n` +
      `۱. <b>اکانت آماده انبار (تحویل فوری ۰ ثانیه):</b>\n` +
      `مشخصات ورود به اکانت اختصاصی و نو، بلافاصله پس از پرداخت تحویل داده می‌شود.\n\n` +
      `۲. <b>فعال‌سازی روی جیمیل شخصی شما (۱ الی ۲۴ ساعت):</b>\n` +
      `شارژ مستقیم روی جیمیل اختصاصی شما توسط کارشناسان پشتیبانی انجام می‌شود.\n\n` +
      `لطفاً شیوه مورد نظر را لمس فرمایید:`
    )
  },

  gmailPrompt: (planName: string) =>
    `📧 <b>ثبت جیمیل جهت فعال‌سازی — ${escapeHtml(planName)}</b>\n\n` +
    `لطفاً آدرس جیمیل اکانت گوگل خود را در چت ارسال فرمایید:\n\n` +
    `مثال: <code>example@gmail.com</code>`,

  passwordPrompt: (gmail: string) =>
    `🔑 <b>ثبت رمز عبور اکانت — ${escapeHtml(gmail)}</b>\n\n` +
    `لطفاً رمز عبور اکانت گوگل <code>${escapeHtml(gmail)}</code> را ارسال فرمایید:\n\n` +
    `<blockquote>🔒 <b>حفظ حریم خصوصی و امنیت:</b>\n` +
    `اطلاعات ورود شما با پروتکل فوق‌امنیتی AES-256 رمزنگاری شده و صرفاً جهت فعال‌سازی اشتراک توسط کارشناس استفاده می‌گردد.</blockquote>`,

  couponPrompt: (currentAmount: number) =>
    `🏷 <b>کد تخفیف</b>\n\n` +
    `• 💰 <b>مبلغ جاری سفارش:</b> <b>${formatPrice(currentAmount)}</b>\n\n` +
    `لطفاً کد تخفیف خود را ارسال فرمایید:\n` +
    `(جهت انصراف، کلمه «انصراف» را ارسال فرمایید)`,

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

    let text = `🧾 <b>پیش‌فاکتور و بررسی نهایی سفارش</b>\n\n`
    text += `• 🛍 <b>محصول:</b> <b>${escapeHtml(productTitle)}</b>\n`
    text += `• ⏱ <b>پلن انتخابی:</b> <b>${escapeHtml(planName)}</b>\n`
    text += `• 🚀 <b>شیوه تحویل:</b> <code>${escapeHtml(deliveryLabel)}</code>\n`
    if (customerGmail) {
      text += `• 📧 <b>جیمیل فعال‌سازی:</b> <code>${escapeHtml(customerGmail)}</code>\n`
    }

    if (couponCode && discountAmount && discountAmount > 0 && originalAmount) {
      text += `• 🏷 <b>قیمت پایه:</b> <s>${formatPrice(originalAmount)}</s>\n`
      text += `• 🎁 <b>کد تخفیف:</b> <code>${escapeHtml(couponCode)}</code> (${formatPrice(discountAmount)} تخفیف)\n`
    }
    text += `\n💰 <b>مبلغ نهایی قابل پرداخت:</b> <b>${formatPrice(amount)}</b>\n\n`
    text += `پرداخت امن و آنی از طریق شبکه شاپرک و درگاه شتاب`

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
    `✨ <b>${escapeHtml(productName)} — ${escapeHtml(planName)}</b>\n\n` +
    `اشتراک ${toPersianDigits(durationMonths)} ماهه با دسترسی کامل به Gemini پیشرفته،\n` +
    `Google Workspace AI، فضای ابری Google One و Deep Research.\n\n` +
    `• 💰 <b>قیمت:</b> <b>${formatPrice(price)}</b>\n` +
    `• ⚡ <b>شیوه تحویل:</b> آنی پس از پرداخت`
  )
}
