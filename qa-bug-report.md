# 🔴 گزارش باگ‌ها و مشکلات امنیتی فرایند خرید — QA Report

> **تحلیلگر:** QA ارشد — بررسی سخت‌گیرانه قبل از لانچ
> **محدوده بررسی:** فرایند کامل خرید از داشبورد وب + چت‌بات تلگرام
> **تعداد باگ‌ها:** ۲۲ مورد در ۵ فاز

---

## نقشه فازها

```mermaid
flowchart LR
    A["فاز ۱\nبحرانی امنیتی\n۴ باگ"] --> B["فاز ۲\nآسیب‌پذیری مالی\n۵ باگ"]
    B --> C["فاز ۳\nحفاظت API\n۵ باگ"]
    C --> D["فاز ۴\nپایداری بکند\n۴ باگ"]
    D --> E["فاز ۵\nتجربه کاربری\n۴ باگ"]
    style A fill:#dc2626,color:#fff
    style B fill:#ea580c,color:#fff
    style C fill:#d97706,color:#fff
    style D fill:#2563eb,color:#fff
    style E fill:#059669,color:#fff
```

| فاز | عنوان | تعداد باگ | اولویت | وضعیت |
|-----|-------|-----------|--------|-------|
| ۱ | آسیب‌پذیری‌های بحرانی امنیتی | ۴ | 🔴 فوری | ✅ تکمیل شد |
| ۲ | باگ‌های مالی و سوءاستفاده از پرداخت | ۵ | 🟠 بالا | ☐ |
| ۳ | حفاظت و اعتبارسنجی APIها | ۵ | 🟠 بالا | ☐ |
| ۴ | پایداری و قابلیت اطمینان بکند | ۴ | 🟡 متوسط | ☐ |
| ۵ | بهبود تجربه کاربری و Hardening نهایی | ۴ | 🟡 متوسط | ☐ |

---
---

# فاز ۱ — آسیب‌پذیری‌های بحرانی امنیتی 🔴

> [!CAUTION]
> این فاز شامل باگ‌هایی است که اگر قبل از لانچ رفع نشوند، **خسارت مالی یا نشت اطلاعات حساس** ایجاد می‌کنند. بدون رفع این موارد، سیستم قابل لانچ نیست.

## ☑ باگ 1.1 — ذخیره رمز عبور Gmail به صورت Plaintext در `checkoutData`

**سطح:** 🔴 بحرانی | **نوع:** امنیتی

### شرح مشکل
وقتی کاربر در فرایند خرید پلن `PRE_CREATED_ACCOUNT` با گزینه «فعال‌سازی روی اکانت شخصی»، رمز Gmail خود را وارد می‌کند، این رمز **بدون هیچ رمزنگاری** مستقیماً در فیلد `checkoutData` جدول `orders` ذخیره می‌شود.

### فایل‌های مرتبط
- [route.ts — خط ۲۵۰](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L242-L255) — `checkoutData: submittedData` بدون رمزنگاری
- [bot-store-service.ts — خط ۲۷۷](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/bot/bot-store-service.ts#L269-L283) — همین مشکل در بات تلگرام
- [update-credentials — خط ۶۴](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/%5Bid%5D/update-credentials/route.ts#L62-L66) — رمز جدید هم Plaintext

### ریسک
- هر Admin با دسترسی به DB یا API مدیریت، رمز Gmail کاربران را می‌بیند
- نفوذ به دیتابیس = لو رفتن رمز Gmail همه مشتریان
- نقض قوانین حریم خصوصی

### راه‌حل
```diff
// در هر سه فایل بالا، قبل از ذخیره checkoutData:
+ import { encryptCredential } from '@/lib/security/crypto'

+ if (submittedData.customer_password) {
+   submittedData.customer_password = encryptCredential(submittedData.customer_password)
+ }
```

### تست
- [x] سفارش جدید با Gmail شخصی ثبت کنید → در DB بررسی کنید `customer_password` فرمت `iv:tag:cipher` داشته باشد
- [x] در پنل ادمین، رمز به صورت رمزنگاری‌شده نمایش داده شود
- [x] `update-credentials` هم رمز را encrypt ذخیره کند

---

## ☑ باگ 1.2 — Mock Payment در محیط پروداکشن فعال است

**سطح:** 🔴 بحرانی | **نوع:** امنیتی/مالی

### شرح مشکل
در فایل `.env` فعلی:
```
PAYMENT_PROVIDER=mock
ALLOW_MOCK_PAYMENT=true
```

با این تنظیمات، **هر کاربری بدون پرداخت واقعی** می‌تواند سفارش ثبت و محصول دریافت کند — حتی در production.

### فایل‌های مرتبط
- [mock.provider.ts — خط ۱۱-۱۹](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/payment/providers/mock.provider.ts#L11-L19)
- [.env — خط ۱۵-۱۶](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/.env#L15-L16)

### راه‌حل
```diff
# .env برای پروداکشن:
- PAYMENT_PROVIDER=mock
- ALLOW_MOCK_PAYMENT=true
+ PAYMENT_PROVIDER=zarinpal
+ # ALLOW_MOCK_PAYMENT را حذف یا false کنید
```

### تست
- [x] با `PAYMENT_PROVIDER=zarinpal` و بدون `ALLOW_MOCK_PAYMENT`، درگاه واقعی Zarinpal باز شود
- [x] با `NODE_ENV=production` و بدون `ALLOW_MOCK_PAYMENT`، Mock Provider خطای امنیتی بدهد
- [x] Merchant ID واقعی Zarinpal تنظیم شده باشد

---

## ☑ باگ 1.3 — ارسال رمز عبور Plaintext در پیام تلگرام

**سطح:** 🟠 بالا | **نوع:** امنیتی

### شرح مشکل
بعد از تکمیل سفارش `PRE_CREATED_ACCOUNT`، رمز عبور اکانت مستقیماً در پیام تلگرام ارسال می‌شود:
```typescript
`🔑 **رمز عبور:** \`${deliveryData.password || '••••••'}\``
```
پیام‌های تلگرام روی سرورهای تلگرام ذخیره می‌شوند و هر کسی با دسترسی به اکانت تلگرام آن را می‌بیند.

### فایل‌های مرتبط
- [callback/route.ts — خط ۳۴۱-۳۵۱](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/payment/callback/route.ts#L341-L351)
- [bot-store-service.ts — خط ۳۸۲-۳۸۸](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/bot/bot-store-service.ts#L382-L388)

### راه‌حل
```diff
- `🔑 **رمز عبور:** \`${deliveryData.password || '••••••'}\``
+ `🔑 **رمز عبور:** برای مشاهده رمز، به پنل کاربری مراجعه فرمایید.`

// و لینک مستقیم به صفحه سفارش:
+ const orderUrl = `${appUrl}/orders?orderId=${payment.orderId}`
+ keyboard.url('🔐 مشاهده اطلاعات ورود', orderUrl)
```

### تست
- [x] خرید اکانت آماده → پیام تلگرام بدون رمز plaintext ارسال شود
- [x] لینک «مشاهده اطلاعات ورود» به صفحه صحیح هدایت کند

---

## ☑ باگ 1.4 — صفحه Mock Bank و simulate-gateway در پروداکشن قابل دسترسی

**سطح:** 🟡 متوسط | **نوع:** امنیتی

### شرح مشکل
صفحه `/checkout/mock-bank` و API `/api/payment/simulate-gateway` در هر محیطی (حتی پروداکشن) قابل دسترسی هستند و هیچ guard محیطی ندارند.

### فایل‌های مرتبط
- [mock-bank/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/checkout/mock-bank/page.tsx)

### راه‌حل
```diff
// در mock-bank/page.tsx — ابتدای کامپوننت:
+ if (process.env.NODE_ENV === 'production' && 
+     process.env.ALLOW_MOCK_PAYMENT !== 'true') {
+   notFound()
+ }
```

### تست
- [x] در `NODE_ENV=production`، دسترسی به `/checkout/mock-bank` ← صفحه ۴۰۴
- [x] در `NODE_ENV=development`، صفحه عادی نمایش داده شود

---

### ✅ معیار تکمیل فاز ۱
- [x] رمز عبور Gmail در هیچ جای DB به صورت plaintext ذخیره نمی‌شود
- [x] Mock Payment در production غیرفعال است
- [x] رمز عبور در پیام تلگرام ارسال نمی‌شود
- [x] صفحات Mock در production بلاک شده‌اند

---
---

# فاز ۲ — باگ‌های مالی و سوءاستفاده از پرداخت 🟠

> [!WARNING]
> این فاز شامل باگ‌هایی است که امکان **سوءاستفاده مالی** یا **دور زدن پرداخت** را فراهم می‌کنند. رفع این موارد قبل از لانچ ضروری است.

## ☐ باگ 2.1 — عدم اعتبارسنجی مبلغ پرداخت در Callback

**سطح:** 🔴 بحرانی | **نوع:** مالی

### شرح مشکل
در `payment/callback/route.ts`، بعد از verify شدن پرداخت، **هیچ مقایسه‌ای بین مبلغ پرداخت‌شده واقعی و مبلغ سفارش انجام نمی‌شود.** اگر درگاه یک تراکنش کمتر از مبلغ سفارش را تأیید کند، سفارش تکمیل و محصول تحویل داده می‌شود.

### فایل مرتبط
- [callback/route.ts — خط ۱۳۶-۱۸۲](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/payment/callback/route.ts#L136-L182)

### راه‌حل
```diff
// بعد از verifyResult.success:
+ if (verifyResult.rawResponse?.amount && 
+     Number(verifyResult.rawResponse.amount) !== payment.amount) {
+   console.error(`SECURITY: Amount mismatch! Expected ${payment.amount}, got ${verifyResult.rawResponse.amount}`)
+   // mark as FAILED and redirect
+   await prisma.payment.update({
+     where: { id: payment.id },
+     data: { status: 'FAILED' },
+   })
+   return NextResponse.redirect(`${appUrl}/checkout/success?orderId=${payment.orderId}&status=amount_mismatch`)
+ }
```

### تست
- [ ] پرداخت با مبلغ صحیح → سفارش تکمیل شود
- [ ] (در محیط تست) verify با مبلغ متفاوت → سفارش FAILED شود

---

## ☐ باگ 2.2 — Race Condition در استفاده از کوپن تخفیف

**سطح:** 🟠 بالا | **نوع:** مالی

### شرح مشکل
کوپن با `maxUses = 1`. دو کاربر همزمان سفارش می‌دهند:
1. هر دو `CouponService.validateAndCalculate` → هر دو `valid: true`
2. هر دو سفارش با تخفیف ایجاد می‌شود
3. **نتیجه: کوپن ۱ باره، ۲ بار مصرف شده**

### فایل‌های مرتبط
- [coupon-service.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/discounts/coupon-service.ts#L54)
- [orders/route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts)

### راه‌حل
```diff
// داخل prisma.$transaction ایجاد سفارش (orders/route.ts):
+ if (appliedCouponId) {
+   const couponCheck = await tx.$queryRaw`
+     SELECT id, "usedCount", "maxUses" FROM coupons
+     WHERE id = ${appliedCouponId}
+     FOR UPDATE
+   `
+   if (couponCheck[0].maxUses !== null && 
+       couponCheck[0].usedCount >= couponCheck[0].maxUses) {
+     throw new Error('COUPON_EXHAUSTED')
+   }
+   await tx.coupon.update({
+     where: { id: appliedCouponId },
+     data: { usedCount: { increment: 1 } },
+   })
+ }
```

### تست
- [ ] دو درخواست همزمان با کوپن `maxUses=1` → فقط یکی موفق شود
- [ ] سفارش دوم پیام «کوپن تمام شده» دریافت کند

---

## ☐ باگ 2.3 — امکان سفارش با مبلغ صفر

**سطح:** 🟠 بالا | **نوع:** مالی/منطقی

### شرح مشکل
در [route.ts — خط ۱۵۶](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L154-L161):
```typescript
if (baseAmount < 0) { ... }
```
فقط مقادیر **منفی** رد می‌شوند. مبلغ `0` مجاز است! اگر پلنی با `price: 0` ساخته شود (اشتباه ادمین)، کاربر بدون پرداخت سفارش می‌دهد.

### راه‌حل
```diff
- if (baseAmount < 0) {
+ if (baseAmount <= 0) {
    return NextResponse.json(
      { success: false, message: 'قیمت محصول یا پلن نامعتبر است.' },
      { status: 400 }
    )
  }

// بعد از اعمال تخفیف:
+ if (payableAmount < 1000) {
+   return NextResponse.json(
+     { success: false, message: 'مبلغ نهایی کمتر از حداقل مجاز درگاه (۱۰۰۰ تومان) است.' },
+     { status: 400 }
+   )
+ }
```

### تست
- [ ] محصول با قیمت `0` → خطای «قیمت نامعتبر»
- [ ] کوپن ۱۰۰٪ → خطای «مبلغ کمتر از حداقل»

---

## ☐ باگ 2.4 — Double-Fulfillment در صورت Retry شدن Callback

**سطح:** 🟡 متوسط | **نوع:** مالی

### شرح مشکل
اگر callback از طرف Zarinpal دوبار ارسال شود (network retry) و بین دو درخواست اولی هنوز در transaction باشد، ممکن است `CouponService.incrementCouponUsage` دوبار اجرا شود.

### فایل مرتبط
- [callback/route.ts — خط ۶۱-۶۵ و ۱۹۳-۱۹۷](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/payment/callback/route.ts)

### راه‌حل
```diff
// قبل از verify، از SELECT FOR UPDATE روی payment record استفاده کنید:
+ const paymentLock = await prisma.$queryRaw`
+   SELECT id FROM payments
+   WHERE id = ${payment.id} AND status = 'PENDING'
+   FOR UPDATE SKIP LOCKED
+ `
+ if (!paymentLock || paymentLock.length === 0) {
+   return NextResponse.redirect(`${appUrl}/checkout/success?orderId=${payment.orderId}`)
+ }
```

### تست
- [ ] دو callback همزمان با یک authority → فقط یکی fulfillment اجرا کند

---

## ☐ باگ 2.5 — عدم Atomic بودن بررسی و مصرف کوپن

**سطح:** 🟡 متوسط | **نوع:** مالی

### شرح مشکل
`incrementCouponUsage` فقط `update` ساده‌ای در callback انجام می‌دهد. اگر خطای DB رخ دهد، کوپن مصرف نشده ولی سفارش تحویل داده شده. همچنین: Refund سفارش `usedCount` را کم نمی‌کند.

### فایل مرتبط
- [coupon-service.ts — خط ۱۰۸-۱۲۳](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/discounts/coupon-service.ts#L108-L123)

### راه‌حل
```
1. incrementCouponUsage را داخل transaction ایجاد سفارش انجام دهید (باگ 2.2)
2. در صورت Refund، decrementCouponUsage صدا بزنید
```

### تست
- [ ] سفارش با کوپن → `usedCount` افزایش یابد
- [ ] Refund سفارش → `usedCount` کاهش یابد

---

### ✅ معیار تکمیل فاز ۲
- [ ] مبلغ verify شده با مبلغ سفارش مقایسه می‌شود
- [ ] کوپن به صورت atomic در transaction بررسی و مصرف می‌شود
- [ ] سفارش با مبلغ ≤ ۰ رد می‌شود
- [ ] Callback تکراری باعث double-fulfillment نمی‌شود

---
---

# فاز ۳ — حفاظت و اعتبارسنجی APIها 🟠

> [!IMPORTANT]
> این فاز روی بستن سوراخ‌های APIها تمرکز دارد: Rate Limit، احراز هویت، و اعتبارسنجی ورودی.

## ☐ باگ 3.1 — عدم وجود Rate Limit در API ثبت سفارش

**سطح:** 🔴 بحرانی | **نوع:** امنیتی

### شرح مشکل
`POST /api/orders` هیچ Rate Limiting ندارد. مهاجم می‌تواند هزاران سفارش `PENDING_PAYMENT` ایجاد و تمام موجودی انبار را `RESERVED` کند (Denial of Inventory).

### فایل‌های مرتبط
- [route.ts — orders](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L9-L12)
- [bot-store-service.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/bot/bot-store-service.ts#L131-L140)

### راه‌حل
```typescript
// در api/orders/route.ts:
import { InMemoryRateLimiter, getClientIp } from '@/lib/security/rate-limit'

const orderRateLimiter = new InMemoryRateLimiter(60 * 1000, 5) // 5 سفارش در دقیقه

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const rateCheck = orderRateLimiter.check(ip)
  if (!rateCheck.success) {
    return NextResponse.json(
      { success: false, message: 'تعداد درخواست‌ها بیش از حد مجاز.' },
      { status: 429 }
    )
  }
  // ادامه ...
}
```

برای بات تلگرام هم محدودیت بر اساس `telegramId` (۳ سفارش در ۵ دقیقه).

### تست
- [ ] ۶ سفارش متوالی از یک IP → سفارش ۶ام ← `429`
- [ ] بعد از ۶۰ ثانیه، امکان سفارش مجدد

---

## ☐ باگ 3.2 — عدم بررسی سفارش‌های PENDING_PAYMENT قبلی کاربر

**سطح:** 🟠 بالا | **نوع:** بکندی / Resource Exhaustion

### شرح مشکل
کاربر می‌تواند بارها `POST /api/orders` بزند و هر بار یک سفارش `PENDING_PAYMENT` جدید بسازد. هر سفارش یک آیتم انبار رزرو می‌کند. تا ۳۰ دقیقه (زمان Expiry) تمام موجودی قفل شده باقی می‌ماند.

### فایل مرتبط
- [route.ts — orders](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts)

### راه‌حل
```diff
// قبل از ایجاد سفارش جدید:
+ const pendingOrders = await prisma.order.count({
+   where: {
+     userId: session.userId,
+     status: 'PENDING_PAYMENT',
+     createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
+   },
+ })
+ if (pendingOrders >= 3) {
+   return NextResponse.json({
+     success: false,
+     message: 'شما سفارش‌های پرداخت‌نشده فعالی دارید. لطفاً ابتدا آنها را تکمیل کنید.',
+   }, { status: 429 })
+ }
```

### تست
- [ ] ۳ سفارش pending → سفارش ۴ام رد شود
- [ ] بعد از پرداخت یا expiry یکی، سفارش جدید مجاز باشد

---

## ☐ باگ 3.3 — API اعتبارسنجی کوپن بدون احراز هویت

**سطح:** 🟠 بالا | **نوع:** امنیتی

### شرح مشکل
`POST /api/coupons/validate` هیچ احراز هویتی ندارد. هر کسی — حتی بدون Login — می‌تواند کدهای تخفیف را Brute Force بزند.

### فایل مرتبط
- [validate/route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/coupons/validate/route.ts)

### راه‌حل
```diff
+ import { getCurrentUser } from '@/lib/auth/jwt'
+ import { InMemoryRateLimiter, getClientIp } from '@/lib/security/rate-limit'
+ const couponRateLimiter = new InMemoryRateLimiter(60 * 1000, 10)

export async function POST(req: NextRequest) {
+   const session = await getCurrentUser()
+   if (!session) {
+     return NextResponse.json({ success: false, error: 'ابتدا وارد شوید.' }, { status: 401 })
+   }
+   const ip = getClientIp(req.headers)
+   if (!couponRateLimiter.check(ip).success) {
+     return NextResponse.json({ success: false, error: 'تلاش بیش از حد.' }, { status: 429 })
+   }
  // ادامه ...
}
```

### تست
- [ ] بدون لاگین → `401`
- [ ] ۱۱ درخواست متوالی → `429`
- [ ] با لاگین و Rate Limit مجاز → پاسخ عادی

---

## ☐ باگ 3.4 — Payment Callback بدون CSRF و اعتبارسنجی

**سطح:** 🟠 بالا | **نوع:** امنیتی

### شرح مشکل
`GET /api/payment/callback` یک URL عمومی است. در Mock Provider هر authority تأیید می‌شود. همچنین هیچ بررسی مالکیت سفارش وجود ندارد.

### فایل مرتبط
- [callback/route.ts — خط ۱۳](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/payment/callback/route.ts#L13)

### راه‌حل
```diff
// اعتبارسنجی کاربر وارد شده برای وب:
+ if (!isTelegram) {
+   const session = await getCurrentUser()
+   if (session && session.userId !== payment.order.userId) {
+     return NextResponse.redirect(`${appUrl}/?payment=unauthorized`)
+   }
+ }
```

### تست
- [ ] Callback با authority سفارش کاربر دیگر → redirect به unauthorized

---

## ☐ باگ 3.5 — عدم Validation فیلد `source` در سفارش

**سطح:** 🟡 متوسط | **نوع:** امنیتی

### شرح مشکل
مقدار `source` از body خوانده و مستقیماً در DB ذخیره می‌شود. کاربر می‌تواند هر مقدار دلخواهی بفرستد.

### فایل مرتبط
- [route.ts — خط ۲۵۳](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L253)

### راه‌حل
```diff
+ const ALLOWED_SOURCES = ['web', 'telegram', 'bale', 'rubika', 'soroush'] as const
+ const validSource = ALLOWED_SOURCES.includes(source) ? source : 'web'

- source: source || 'web',
+ source: validSource,
```

### تست
- [ ] `source: "malicious<script>"` → ذخیره به عنوان `web`
- [ ] `source: "telegram"` → ذخیره `telegram`

---

### ✅ معیار تکمیل فاز ۳
- [ ] Rate Limit روی `/api/orders` و `/api/coupons/validate` فعال
- [ ] محدودیت سفارش‌های pending همزمان
- [ ] Coupon validate نیاز به Auth دارد
- [ ] Callback بررسی مالکیت سفارش می‌کند
- [ ] فیلد `source` فقط مقادیر مجاز می‌پذیرد

---
---

# فاز ۴ — پایداری و قابلیت اطمینان بکند 🔵

> [!NOTE]
> این فاز شامل مشکلاتی است که ممکن است در بار بالا یا شرایط خاص باعث **از دست رفتن داده یا عملکرد نادرست** شوند.

## ☐ باگ 4.1 — Session تلگرام بات در Memory Cache

**سطح:** 🟡 متوسط | **نوع:** بکندی/پایداری

### شرح مشکل
`memorySessionStore` یک `Map` ساده در حافظه است. با هر ریستارت سرور، تمام session‌های فعال بات (شامل فرایند خرید نیمه‌تمام) از بین می‌رود.

### فایل مرتبط
- [account-linking.ts — خط ۴۳](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/telegram/account-linking.ts#L43-L47)

### راه‌حل
```
1. مدل اختصاصی BotSession در Prisma بسازید
2. یا از Redis به‌عنوان session store استفاده کنید
3. حداقل: DB fallback همیشه اول خوانده شود نه cache
```

### تست
- [ ] فرایند خرید در بات شروع کنید → سرور ریستارت → فرایند از سر گرفته شود

---

## ☐ باگ 4.2 — Order Expiration فقط Lazy (بدون Cron Schedule)

**سطح:** 🟡 متوسط | **نوع:** بکندی

### شرح مشکل
`OrderExpirationService.triggerBackgroundCleanup()` فقط هنگام ایجاد سفارش جدید صدا زده می‌شود. اگر هیچ‌کس سفارش جدید ندهد، سفارش‌های قدیمی و آیتم‌های رزرو شده هرگز آزاد نمی‌شوند.

### فایل مرتبط
- [order-expiration.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/orders/order-expiration.ts#L90-L102)

### راه‌حل
```
1. یک API route بسازید: GET /api/cron/expire-orders (با API Key)
2. هر 5 دقیقه از cron job خارجی صدا بزنید
3. یا از Vercel Cron / GitHub Actions استفاده کنید
```

### تست
- [ ] سفارش pending بعد از ۳۰ دقیقه بدون پرداخت → وضعیت EXPIRED
- [ ] آیتم انبار رزرو شده → وضعیت AVAILABLE

---

## ☐ باگ 4.3 — InventoryItem با رمز رمزنگاری‌نشده در `data`

**سطح:** 🟡 متوسط | **نوع:** امنیتی

### شرح مشکل
آیتم‌های انبار `PRE_CREATED_ACCOUNT` ممکن است با رمز عبور plaintext در `data.password` ذخیره شده باشند. تابع `decryptCredential` اگر فرمت `iv:tag:cipher` نباشد، string اصلی را برمی‌گرداند — یعنی از ابتدا plaintext بوده.

### فایل مرتبط
- [crypto.ts — خط ۴۰-۴۲](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/security/crypto.ts#L40-L42)

### راه‌حل
```
1. Migration script بنویسید:
   - تمام InventoryItem با type = PRE_CREATED_ACCOUNT را بخوانید
   - اگر password در data فرمت encrypted نداشت، encrypt و update کنید
2. در Admin API افزودن inventory: password همیشه با encryptCredential ذخیره شود
```

### تست
- [ ] Migration: تمام inventory items بعد از اجرا → رمز encrypted
- [ ] افزودن inventory جدید → رمز encrypt شده ذخیره شود

---

## ☐ باگ 4.4 — Webhook تلگرام بدون Secret Token اجباری

**سطح:** 🟡 متوسط | **نوع:** امنیتی

### شرح مشکل
اگر `TELEGRAM_WEBHOOK_SECRET` تنظیم نشده باشد، **هر کسی** می‌تواند webhook POST کند و update جعلی بفرستد.

### فایل مرتبط
- [webhook/route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/telegram/webhook/route.ts#L11-L17)

### راه‌حل
```diff
- if (secret) {
+ if (!secret) {
+   console.error('SECURITY: TELEGRAM_WEBHOOK_SECRET is not configured!')
+   return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
+ }
+ {
    const headerSecret = req.headers.get('x-telegram-bot-api-secret-token')
    if (headerSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }
```

### تست
- [ ] بدون `TELEGRAM_WEBHOOK_SECRET` → خطای ۵۰۰
- [ ] با secret اشتباه → خطای ۴۰۳
- [ ] با secret صحیح → پردازش عادی

---

### ✅ معیار تکمیل فاز ۴
- [ ] Session بات در ریستارت از بین نمی‌رود
- [ ] Cron job برای expire سفارش‌ها فعال
- [ ] تمام رمزهای انبار encrypt شده‌اند
- [ ] Webhook بدون secret رد می‌شود

---
---

# فاز ۵ — بهبود تجربه کاربری و Hardening نهایی 🟢

> [!TIP]
> این فاز شامل بهبودهای تکمیلی و hardening نهایی قبل از لانچ است. رفع این موارد به کیفیت و اعتماد کاربران کمک می‌کند.

## ☐ باگ 5.1 — JWT Token بدون Rotation (۳۰ روزه)

**سطح:** 🟡 متوسط | **نوع:** امنیتی

### شرح مشکل
توکن JWT با انقضای ۳۰ روزه صادر می‌شود و هیچ مکانیزم Rotation یا Revocation ندارد. لو رفتن توکن = ۳۰ روز دسترسی مهاجم.

### فایل مرتبط
- [jwt.ts — خط ۱۳](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/auth/jwt.ts#L13)

### راه‌حل
```
1. TOKEN_EXPIRY را به '7d' یا '3d' کاهش دهید
2. مکانیزم Refresh Token اضافه کنید
3. فیلد tokenVersion در User اضافه کنید و در verifyToken بررسی شود
```

### تست
- [ ] توکن بعد از مدت تعیین‌شده expire شود
- [ ] Logout باعث بی‌اعتبار شدن توکن شود

---

## ☐ باگ 5.2 — نمایش رمز عبور رمزگشایی‌شده بدون Cache-Control

**سطح:** 🟡 متوسط | **نوع:** امنیتی

### شرح مشکل
`GET /api/orders/[id]` رمز عبور delivery را decrypt و در HTTP response برمی‌گرداند. بدون هدرهای anti-cache، CDN یا proxy ممکن است response را cache کند.

### فایل مرتبط
- [orders/[id]/route.ts — خط ۸۷](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/%5Bid%5D/route.ts#L82-L91)

### راه‌حل
```diff
+ const response = NextResponse.json({ success: true, order: { ...order, delivery: safeDelivery } })
+ response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
+ response.headers.set('Pragma', 'no-cache')
+ return response
```

### تست
- [ ] Response header شامل `Cache-Control: no-store` باشد

---

## ☐ باگ 5.3 — عدم ارسال SMS تأیید سفارش

**سطح:** 🟡 متوسط | **نوع:** تجربه کاربری

### شرح مشکل
بعد از پرداخت موفق، فقط Telegram notification ارسال می‌شود. کاربرانی که از وب خرید می‌کنند و تلگرام ندارند، هیچ تأییدیه‌ای خارج از سایت دریافت نمی‌کنند.

### راه‌حل
```
بعد از تکمیل سفارش (در callback):
- SMS ساده ارسال کنید: «سفارش #XXXXXX ثبت شد. مشاهده: [لینک]»
- به شماره order.user.phone ارسال شود
```

### تست
- [ ] خرید موفق → SMS تأیید دریافت شود
- [ ] SMS شامل شناسه سفارش و لینک مشاهده باشد

---

## ☐ باگ 5.4 — عدم محدودیت تعداد Coupon Validate (Brute Force)

**سطح:** 🟡 متوسط | **نوع:** امنیتی

### شرح مشکل
حتی با Auth (باگ 3.3)، بدون Rate Limit اختصاصی، کاربر لاگین‌شده می‌تواند هزاران کد تخفیف را امتحان کند.

### راه‌حل
اگر باگ 3.3 را با Rate Limiter پیاده‌سازی کرده‌اید، این باگ هم حل شده. فقط تأیید کنید Rate Limit فعال است.

### تست
- [ ] ۱۱ validate متوالی → `429` از درخواست ۱۱ام

---

### ✅ معیار تکمیل فاز ۵
- [ ] JWT با مدت کوتاه‌تر و امکان Revocation
- [ ] هدرهای anti-cache روی API حساس
- [ ] SMS تأیید سفارش ارسال می‌شود
- [ ] Rate Limit روی validate کوپن فعال

---
---

# 📋 چک‌لیست نهایی قبل از لانچ

| فاز | ✅ | آیتم |
|-----|---|------|
| ۱ | ☐ | رمز Gmail در هیچ جای DB به صورت plaintext نیست |
| ۱ | ☐ | `PAYMENT_PROVIDER=zarinpal` و Mock غیرفعال |
| ۱ | ☐ | رمز عبور در پیام تلگرام ارسال نمی‌شود |
| ۱ | ☐ | صفحات Mock در production بلاک شده |
| ۲ | ☐ | مبلغ verify با مبلغ سفارش مقایسه می‌شود |
| ۲ | ☐ | کوپن atomic در transaction بررسی/مصرف می‌شود |
| ۲ | ☐ | سفارش با مبلغ ≤ ۰ رد می‌شود |
| ۲ | ☐ | Callback تکراری باعث double-fulfillment نمی‌شود |
| ۳ | ☐ | Rate Limit روی `/api/orders` فعال |
| ۳ | ☐ | Rate Limit روی `/api/coupons/validate` فعال |
| ۳ | ☐ | محدودیت سفارش‌های pending همزمان |
| ۳ | ☐ | Coupon validate نیاز به Auth دارد |
| ۳ | ☐ | `source` field فقط مقادیر مجاز می‌پذیرد |
| ۴ | ☐ | Session بات persistent (نه فقط memory) |
| ۴ | ☐ | Cron job برای expire سفارش‌ها |
| ۴ | ☐ | رمزهای inventory encrypt شده |
| ۴ | ☐ | Webhook بدون secret رد می‌شود |
| ۵ | ☐ | JWT Token با مدت کوتاه‌تر |
| ۵ | ☐ | Anti-cache headers روی API حساس |
| ۵ | ☐ | SMS تأیید سفارش |

> [!IMPORTANT]
> **ترتیب اجرا:** فاز ۱ → فاز ۲ → فاز ۳ → فاز ۴ → فاز ۵
> بعد از تکمیل هر فاز، یک **تست integration کامل** از فرایند خرید انجام دهید.
