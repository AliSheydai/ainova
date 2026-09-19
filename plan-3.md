# 🔍 Full Codebase Audit — plan-3.md

**تاریخ:** ۱۳ شهریور ۱۴۰۵ (Sep 19, 2026)
**نوع:** Security & Engineering Audit
**هدف:** شناسایی حداکثری مشکلات واقعی قبل از لانچ Production

---

## 📋 خلاصه وضعیت کلی پروژه

پروژه یک فروشگاه آنلاین فروش اشتراک‌های دیجیتال (حساب‌های Google AI Pro و ...) است که با **Next.js 16 + Prisma + PostgreSQL** توسعه یافته و شامل سیستم‌های پرداخت (Jibit/Zarinpal)، تلگرام‌بات، مدیریت موجودی، کد تخفیف و نوتیفیکیشن می‌باشد.

**نقاط قوت:**
- معماری امنیتی مناسب: JWT با `tokenVersion` برای Token Revocation
- رمزنگاری AES-256-GCM برای اطلاعات حساس (رمز عبور جیمیل)
- Rate Limiting چندلایه (IP + Phone + Per-user)
- مدیریت Race Condition در سفارش‌ها با `FOR UPDATE SKIP LOCKED`
- Admin Guard دولایه (middleware + API-level)
- مدیریت صحیح Coupon Usage با Atomic Operations

**آمار مشکلات شناسایی شده:**

| Severity | تعداد |
|:---------|:-----:|
| CRITICAL | 4     |
| HIGH     | 8     |
| MEDIUM   | 10    |
| LOW      | 6     |
| **مجموع** | **28** |

---

## 🚨 مشکلات Critical و High

1. **[CRITICAL]** `.env` حاوی Secretهای واقعی در Repository
2. **[CRITICAL]** Telegram Setup API بدون Authentication
3. **[CRITICAL]** Payment Callback Race Condition — قفل خارج از Transaction
4. **[CRITICAL]** SVG Upload — خطر Stored XSS
5. **[HIGH]** JWT Secret ضعیف و Hardcoded
6. **[HIGH]** اختلاف Token Expiry بین JWT و Cookie
7. **[HIGH]** Cron Secret قابل ارسال از Query String
8. **[HIGH]** OTP Code لیک شدن در Response حالت Dev
9. **[HIGH]** Encryption Key وابسته به JWT_SECRET
10. **[HIGH]** Next.js Images — Open Proxy با `hostname: '**'`
11. **[HIGH]** عدم محدودیت Per-User برای استفاده از Coupon
12. **[HIGH]** Review Spam — عدم Rate Limiting و احراز هویت

---

## 🔑 مهم‌ترین ریسک‌های امنیتی

1. افشای Secretها در `.env` (API Key پیامکی، توکن تلگرام، JWT Secret)
2. Telegram Setup endpoint بدون هرگونه Auth → هر کسی می‌تواند webhook بات را تغییر دهد
3. امکان Stored XSS از طریق آپلود SVG
4. امکان سوءاستفاده از اختلاف عمر Cookie (30 روز) و JWT (7 روز)
5. Cron Secret ارسال از طریق URL query string → قابل لاگ شدن در Access Log و Proxy

---

## 🔧 مهم‌ترین مشکلات Backend

1. Payment callback lock خارج از transaction → امکان double-fulfillment
2. عدم دریافت مبلغ تأیید شده از Jibit در Production Verify
3. Rate Limiter مبتنی بر حافظه → بی‌اثر با Multiple Instances / Restart

---

## 🏗️ مهم‌ترین مشکلات معماری

1. In-Memory Rate Limiter مناسب تک‌سرور است، نه Horizontal Scale
2. دو Cron Route تکراری برای Expire Orders
3. Legacy ActivationLink model هنوز در schema موجود است

---

## ترتیب پیشنهادی اجرای اصلاحات

1. **فوری (قبل از لانچ):** مشکلات CRITICAL + HIGH امنیتی
2. **هفته اول:** Rate Limiting, Payment Callback Fix, Cookie/JWT Fix
3. **هفته دوم:** Validation, Review Spam, Coupon Per-User
4. **بعد از لانچ:** بهبود معماری، پاکسازی Technical Debt

---

## Phase 1 — مشکلات CRITICAL (فوری، قبل از لانچ)

---

#### [CRITICAL] 1. `.env` حاوی Secretهای واقعی — نشت اطلاعات حساس

* **Location:** `.env` — کل فایل
* **Problem:** فایل `.env` حاوی مقادیر واقعی Secretها شامل `KAVEH_NEGAR_API_KEY`، `TELEGRAM_BOT_TOKEN`، `JWT_SECRET`، `CRON_SECRET`، و `TELEGRAM_WEBHOOK_SECRET` است. اگرچه `.gitignore` فایل `.env` را exclude کرده، اما اگر در هر زمانی commit شده باشد یا از طریق backup/screenshot/log لو رفته باشد، تمام کلیدها به خطر می‌افتد.
* **Impact:** دسترسی مهاجم به API پیامکی (ارسال SMS به نام شما)، کنترل ربات تلگرام، جعل توکن JWT، و فراخوانی Cron APIها.
* **Root Cause:** عدم چرخش Secretها و استفاده از مقادیر ضعیف (`super-secret-jwt-key-...`, `telegram_secret_token_123456`, `super-secure-cron-secret-2026`).
* **Solution:**
  1. تمام Secretها را فوراً Rotate کنید (JWT_SECRET, CRON_SECRET, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN با `/revoke` تلگرام)
  2. از یک Secret Manager (مثل Vercel Environment Variables با Encrypt) استفاده کنید
  3. JWT_SECRET باید حداقل ۶۴ کاراکتر تصادفی باشد: `openssl rand -hex 32`
  4. Verify کنید که `.env` هرگز در Git History وجود نداشته
* **Implementation Notes:** بعد از rotate کردن JWT_SECRET تمام sessionهای کاربران invalidate می‌شود (این رفتار مورد انتظار است). کاربران باید مجدد login کنند.
* **Priority:** فوری — قبل از Deploy اول

---

#### [CRITICAL] 2. Telegram Setup API بدون Authentication

* **Location:** `src/app/api/telegram/setup/route.ts` — تابع `GET`
* **Problem:** این endpoint هیچ‌گونه Authentication یا Authorization ندارد. هر کسی با دسترسی به URL می‌تواند:
  - `?action=info` → اطلاعات ربات و webhook فعلی را ببیند
  - `?action=set` → Webhook ربات را به آدرس دلخواه تغییر دهد
  - `?action=delete` → Webhook ربات را حذف کند
* **Impact:** مهاجم می‌تواند webhook ربات را به سرور خود redirect کند و تمام پیام‌های کاربران (شامل اطلاعات سفارش و احتمالاً اطلاعات حساس) را Intercept کند. همچنین می‌تواند سرویس ربات را با حذف webhook از کار بیاندازد.
* **Root Cause:** عدم اعمال `requireAdminApi()` روی این route.
* **Solution:**
  ```typescript
  export async function GET(req: NextRequest) {
    const { errorResponse } = await requireAdminApi()
    if (errorResponse) return errorResponse
    // ... rest of the logic
  }
  ```
* **Implementation Notes:** فقط ادمین باید بتواند webhook را تنظیم کند. این تغییر یک خط اضافه کردن guard است.
* **Priority:** فوری

---

#### [CRITICAL] 3. Payment Callback — قفل `FOR UPDATE SKIP LOCKED` خارج از Transaction

* **Location:** `src/app/api/payment/callback/route.ts` — خطوط ۱۹۳–۲۰۷
* **Problem:** دستور `$queryRaw` با `FOR UPDATE SKIP LOCKED` خارج از یک `$transaction` اجرا می‌شود. این قفل فقط تا پایان آن query (implicit transaction Prisma) فعال است و بلافاصله آزاد می‌شود. بنابراین دو request همزمان می‌توانند هر دو قفل بگیرند و double-fulfillment رخ دهد.
* **Impact:** امکان تحویل دوبار یک سفارش (دو لینک فعال‌سازی، دو اکانت) در شرایط همزمانی بالا (مثلاً retry callback درگاه).
* **Root Cause:** `FOR UPDATE SKIP LOCKED` تنها در scope یک explicit transaction معتبر است. اینجا به صورت standalone اجرا می‌شود.
* **Solution:** کل منطق verification + fulfillment باید داخل یک `prisma.$transaction` واحد قرار گیرد:
  ```typescript
  await prisma.$transaction(async (tx) => {
    const paymentLock = await tx.$queryRaw`
      SELECT id FROM payments
      WHERE id = ${payment.id} AND status = 'PENDING'
      FOR UPDATE SKIP LOCKED
    `
    if (!paymentLock || paymentLock.length === 0) return // already processed
    
    // verify payment
    // fulfill order
  })
  ```
* **Implementation Notes:** Refactor به صورتی که `FulfillmentService.fulfillOrder` هم tx دریافتی از بیرون را accept کند، یا حداقل خود payment lock و status update اول داخل transaction باشد. الان `fulfillOrder` خودش transaction داخلی دارد و idempotency check انجام می‌دهد اما gap بین lock و ورود به `fulfillOrder` وجود دارد.
* **Priority:** فوری

---

#### [CRITICAL] 4. SVG Upload — خطر Stored XSS

* **Location:** `src/app/api/admin/upload/route.ts` — خط ۱۴ (`'image/svg+xml': '.svg'`)
* **Problem:** فایل SVG می‌تواند حاوی کد JavaScript باشد (`<script>alert(1)</script>` یا `onload` events). این فایل در `/public/uploads/products/` ذخیره و مستقیماً serve می‌شود. مرورگر هنگام نمایش SVG، JavaScript embed-شده را اجرا می‌کند.
* **Impact:** Stored XSS — ادمین مخرب (یا حمله XSS به ادمین) می‌تواند فایل SVG آلوده آپلود کند. هر کاربری که تصویر محصول را باز کند، کد مخرب در context سایت اجرا می‌شود → سرقت Cookie/Session، Keylogging، Phishing.
* **Root Cause:** پذیرش MIME type `image/svg+xml` بدون sanitization محتوا.
* **Solution:** دو راه:
  1. **(توصیه شده)** SVG را از لیست MIME types مجاز حذف کنید:
     ```typescript
     // حذف خط: 'image/svg+xml': '.svg'
     ```
  2. **(جایگزین)** اگر SVG لازم است، از کتابخانه `DOMPurify` (server-side) برای sanitize کردن محتوای SVG استفاده کنید و header `Content-Disposition: attachment` تنظیم کنید.
* **Implementation Notes:** اگر محصولات فعلی تصویر SVG ندارند، حذف SVG ساده‌ترین و مطمئن‌ترین راه‌حل است.
* **Priority:** فوری

---

## Phase 2 — مشکلات HIGH (هفته اول بعد از رفع CRITICAL)

---

#### [HIGH] 5. JWT Secret ضعیف و قابل حدس

* **Location:** `.env` — خط ۱۲
* **Problem:** مقدار فعلی `JWT_SECRET=super-secret-jwt-key-for-google-ai-pro-activation-service-2026` یک رشته قابل حدس و pattern-based است. مهاجم با دانستن نام پروژه می‌تواند آن را حدس بزند.
* **Impact:** جعل JWT Token → دسترسی به هر حساب کاربری یا ادمین.
* **Root Cause:** استفاده از رشته توصیفی به جای مقدار تصادفی رمزنگارانه.
* **Solution:** تولید مقدار تصادفی با `openssl rand -hex 32` و جایگزینی در متغیر محیطی Production.
* **Implementation Notes:** بعد از تغییر، تمام JWT tokenهای موجود invalid می‌شوند. این مطلوب است.
* **Priority:** قبل از لانچ

---

#### [HIGH] 6. اختلاف عمر Cookie (30 روز) و JWT Token (7 روز)

* **Location:** `src/app/api/auth/verify-otp/route.ts` — خط ۴۲ (`maxAge: 30 * 24 * 60 * 60`) و `src/lib/auth/jwt.ts` — خط ۱۴ (`TOKEN_EXPIRY = '7d'`)
* **Problem:** Cookie عمر ۳۰ روز دارد اما JWT داخل آن ۷ روز اعتبار دارد. بعد از ۷ روز، cookie هنوز وجود دارد اما token expired است. این باعث می‌شود:
  - هر request به `getCurrentUser()` یک query DB بزند و null برگرداند
  - UX ضعیف: کاربر به ظاهر لاگین است اما هر عملیاتی fail می‌کند
* **Impact:** تجربه کاربری مخدوش + بار اضافی بر DB بعد از هفته اول.
* **Root Cause:** عدم هماهنگی بین دو مقدار ثابت.
* **Solution:** مقدار `maxAge` Cookie را برابر با عمر JWT قرار دهید:
  ```typescript
  maxAge: 7 * 24 * 60 * 60, // 7 days — match JWT expiry
  ```
* **Implementation Notes:** یا اگر ۳۰ روز مطلوب است، `TOKEN_EXPIRY` را به `'30d'` تغییر دهید. مهم این است که یکسان باشند.
* **Priority:** قبل از لانچ

---

#### [HIGH] 7. Cron Secret قابل ارسال از Query String

* **Location:** `src/app/api/cron/expire-orders/route.ts` — خط ۱۵ و `src/app/api/cron/orders/expire/route.ts` — خط ۱۸ و `src/app/api/cron/otp/cleanup/route.ts` — خط ۲۱
* **Problem:** Cron endpoints پارامتر `?secret=...` یا `?key=...` را از Query String قبول می‌کنند. Query Stringها در Access Log سرور، CDN log، Referer header و حتی browser history ذخیره می‌شوند.
* **Impact:** لو رفتن Cron Secret → مهاجم می‌تواند دستی سفارش‌ها را expire کند یا OTPها را پاک کند.
* **Root Cause:** پذیرش secret از query parameter علاوه بر header.
* **Solution:** فقط از `Authorization: Bearer <secret>` یا header `x-cron-secret` پشتیبانی کنید و query param را حذف کنید:
  ```typescript
  // حذف بررسی querySecret
  const querySecret = req.nextUrl.searchParams.get('secret')?.trim() // ← حذف شود
  ```
* **Implementation Notes:** Vercel Cron از header `Authorization: Bearer` پشتیبانی می‌کند. مطمئن شوید config Vercel فقط header ارسال می‌کند.
* **Priority:** قبل از لانچ

---

#### [HIGH] 8. OTP Code در Response حالت Dev

* **Location:** `src/lib/auth/otp.ts` — خط ۱۸۲ (`devCode: smsResult.devCode`)
* **Problem:** وقتی SMS در حالت Dev Bypass ارسال می‌شود، کد OTP در پاسخ API به کلاینت برگردانده می‌شود (`devCode`). اگر متغیر `KAVEH_NEGAR_DEV_BYPASS` به اشتباه در Production روی `true` باشد (یا API key تنظیم نشده باشد)، کد OTP مستقیماً به مهاجم ارسال می‌شود.
* **Impact:** دور زدن کامل احراز هویت — ورود به هر حساب کاربری بدون دسترسی به گوشی.
* **Root Cause:** عدم بررسی `NODE_ENV` قبل از بازگرداندن `devCode`.
* **Solution:**
  ```typescript
  return {
    success: true,
    message: smsResult.message,
    cooldownRemaining: cooldownSeconds,
    devCode: process.env.NODE_ENV === 'development' ? smsResult.devCode : undefined,
  }
  ```
  همچنین در `sms.ts` خط ۲۹ نیز `devCode` فقط در development باید بازگردانده شود.
* **Implementation Notes:** یک safeguard اضافی: اگر `NODE_ENV === 'production'` و `apiKey` خالی باشد، به جای bypass، یک خطا throw کنید.
* **Priority:** قبل از لانچ

---

#### [HIGH] 9. Encryption Key مشترک با JWT_SECRET

* **Location:** `src/lib/security/crypto.ts` — خط ۷ (`process.env.CREDENTIALS_ENCRYPTION_KEY || process.env.JWT_SECRET`)
* **Problem:** اگر `CREDENTIALS_ENCRYPTION_KEY` تنظیم نشود (که الان در `.env` تنظیم نشده)، از `JWT_SECRET` برای رمزنگاری credential استفاده می‌شود. Rotate کردن JWT_SECRET باعث می‌شود تمام credentialهای رمزنگاری شده در DB غیرقابل بازیابی شوند.
* **Impact:** از دست رفتن رمز عبور جیمیل‌های ذخیره‌شده کاربران بعد از rotate کردن JWT_SECRET.
* **Root Cause:** عدم تفکیک کلید رمزنگاری از کلید احراز هویت.
* **Solution:**
  1. `CREDENTIALS_ENCRYPTION_KEY` را به صورت مجزا تولید و تنظیم کنید
  2. در `.env.example` این مورد را مستند کنید
  3. یک migration script بنویسید که credentialهای فعلی را با کلید قدیمی decrypt و با کلید جدید re-encrypt کند
* **Implementation Notes:** این باید قبل از rotate کردن JWT_SECRET (Issue #1) حل شود.
* **Priority:** قبل از لانچ — باید قبل از rotate شدن JWT_SECRET حل شود

---

#### [HIGH] 10. Next.js Images — Open Proxy با `hostname: '**'`

* **Location:** `next.config.mjs` — خطوط ۱۵–۲۰
* **Problem:** تنظیم `hostname: '**'` به هر دامنه‌ای اجازه می‌دهد از طریق `next/image` بارگذاری شود. مهاجم می‌تواند از سرور شما به عنوان Image Proxy استفاده کند.
* **Impact:** SSRF (Server-Side Request Forgery) — دسترسی به سرویس‌های داخلی، مصرف پهنای باند سرور، سوءاستفاده از IP سرور.
* **Root Cause:** تنظیم بیش‌ازحد باز به جای Allowlist دقیق.
* **Solution:** فقط دامنه‌های مورد نیاز را مجاز کنید:
  ```javascript
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'your-cdn-domain.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // add only needed domains
    ],
  },
  ```
* **Implementation Notes:** اگر تصاویر محصولات از URL خارجی بارگذاری می‌شوند، دامنه‌های مورد استفاده را شناسایی کرده و فقط آنها را اضافه کنید. اگر تصاویر فقط local هستند، بخش `remotePatterns` را کاملاً حذف کنید.
* **Priority:** قبل از لانچ

---

#### [HIGH] 11. عدم محدودیت Per-User برای استفاده از Coupon

* **Location:** `src/lib/discounts/coupon-service.ts` — تابع `validateAndCalculate`
* **Problem:** هیچ بررسی وجود ندارد که آیا یک کاربر قبلاً از یک کد تخفیف استفاده کرده یا خیر. یک کاربر می‌تواند نامحدود بار از یک کد تخفیف استفاده کند (تا سقف `maxUses` کلی).
* **Impact:** سوءاستفاده مالی — یک کاربر می‌تواند تمام ظرفیت تخفیف را خودش مصرف کند.
* **Root Cause:** عدم وجود فیلد `maxUsesPerUser` یا بررسی سابقه استفاده کاربر.
* **Solution:**
  1. در schema `Coupon`، فیلد `maxUsesPerUser Int? @default(1)` اضافه کنید
  2. در `validateAndCalculate`، تعداد سفارش‌های قبلی کاربر با این coupon را بررسی کنید:
     ```typescript
     if (userId && coupon.maxUsesPerUser) {
       const userUsageCount = await prisma.order.count({
         where: { couponId: coupon.id, userId, status: { not: 'EXPIRED' } }
       })
       if (userUsageCount >= coupon.maxUsesPerUser) {
         return { valid: false, error: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید.' }
       }
     }
     ```
  3. پارامتر `userId` را به `validateAndCalculate` اضافه کنید
* **Implementation Notes:** این نیاز به migration دارد. `userId` باید از session خوانده شود. در API مسیر `/api/orders` و `/api/coupons/validate` نیز userId ارسال شود.
* **Priority:** قبل از لانچ

---

#### [HIGH] 12. Review Spam — عدم Rate Limiting و احراز هویت اجباری

* **Location:** `src/app/api/reviews/route.ts` — تابع `POST` (خطوط ۹۹–۱۷۶)
* **Problem:** 
  1. هیچ Rate Limit وجود ندارد → یک bot می‌تواند هزاران review ارسال کند
  2. Login اجباری نیست (`session` اختیاری است) → anonymous spam
  3. بررسی خرید قبلی وجود ندارد → کاربری که محصول نخریده می‌تواند نظر بدهد
* **Impact:** Review bombing، SEO spam، و بی‌اعتبار شدن نظرات واقعی.
* **Root Cause:** عدم اعمال rate limiting و عدم الزام احراز هویت.
* **Solution:**
  1. Login را اجباری کنید و `userId` را اجباری ثبت کنید
  2. `InMemoryRateLimiter` اضافه کنید (مثلاً ۳ نظر در ساعت per user)
  3. (اختیاری) بررسی کنید آیا کاربر حداقل یک سفارش PAID/COMPLETED برای آن محصول دارد
* **Implementation Notes:** از آنجا که نظرات قبل از انتشار `PENDING` هستند و ادمین تایید می‌کند، مشکل محتوای نامناسب کمتر است. اما حجم spam می‌تواند ادمین را تحت فشار قرار دهد.
* **Priority:** هفته اول

---

## Phase 3 — مشکلات MEDIUM (هفته دوم)

---

#### [MEDIUM] 13. In-Memory Rate Limiter — بی‌اثر در Multi-Instance

* **Location:** `src/lib/security/rate-limit.ts` — کل کلاس `InMemoryRateLimiter`
* **Problem:** Rate Limiter در حافظه Node.js ذخیره می‌شود. در محیط Serverless (Vercel) هر invocation یک instance جداگانه است و state به اشتراک گذاشته نمی‌شود. همچنین با restart سرور، تمام stateها پاک می‌شوند.
* **Impact:** Rate Limiting به طور کامل بی‌اثر می‌شود در محیط Serverless. مهاجم می‌تواند brute-force OTP انجام دهد.
* **Root Cause:** استفاده از `Map` در حافظه به جای یک store خارجی.
* **Solution:**
  - **کوتاه‌مدت:** از Vercel KV (Redis) یا Upstash Redis استفاده کنید
  - **جایگزین ساده:** از rate limiting سمت DB استفاده کنید (مثل شمارش OTPهای اخیر per phone/IP که الان برای hourly limit وجود دارد)
  - **جایگزین:** Vercel Edge Middleware با `@vercel/kv`
* **Implementation Notes:** In-Memory limiter برای development خوب است. برای production، یک Redis-based limiter لازم است. Package `@upstash/ratelimit` گزینه خوبی است.
* **Priority:** هفته اول

---

#### [MEDIUM] 14. دو Cron Route تکراری برای Expire Orders

* **Location:** 
  - `src/app/api/cron/expire-orders/route.ts` (جدیدتر، بهتر)
  - `src/app/api/cron/orders/expire/route.ts` (قدیمی‌تر، auth ضعیف‌تر)
* **Problem:** دو endpoint متفاوت همان کار را انجام می‌دهند. Route قدیمی authentication ضعیف‌تری دارد و پیام‌های encoding شکسته دارد.
* **Impact:** نگهداری سخت‌تر، surface attack بزرگ‌تر، و احتمال confuse شدن در deploy.
* **Root Cause:** Technical Debt — route جدید ایجاد شده اما قدیمی حذف نشده.
* **Solution:** Route قدیمی `src/app/api/cron/orders/` را حذف کنید. `vercel.json` فقط به route جدید اشاره می‌کند.
* **Implementation Notes:** قبل از حذف مطمئن شوید هیچ سرویس خارجی به path قدیمی اشاره نمی‌کند.
* **Priority:** هفته اول

---

#### [MEDIUM] 15. عدم Sanitization ورودی‌های `adminNote` و `manualNote`

* **Location:** `src/app/api/admin/orders/route.ts` — خطوط ۶۱۸, ۶۸۷, و سایر bodyهای PATCH
* **Problem:** فیلدهای `adminNote`, `manualNote`, `deliveredInfo`, `refundReason` مستقیماً `.trim()` شده و ذخیره می‌شوند بدون sanitization. اگرچه XSS حملات معمولاً در rendering رخ می‌دهند، این مقادیر ممکن است در Telegram messages (Markdown injection) یا notification UI بدون escaping نمایش داده شوند.
* **Impact:** تزریق Markdown/HTML در نوتیفیکیشن‌های تلگرام یا UI.
* **Root Cause:** اعتماد به ورودی ادمین بدون sanitization.
* **Solution:** یک تابع `sanitizeText` بنویسید که HTML tags و کاراکترهای خطرناک Markdown را strip کند:
  ```typescript
  function sanitizeText(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim()
  }
  ```
* **Implementation Notes:** از آنجا که این فیلدها فقط توسط ادمین نوشته می‌شوند، ریسک کمتر است ولی defense-in-depth اقتضا می‌کند sanitize شوند.
* **Priority:** هفته دوم

---

#### [MEDIUM] 16. OTP Brute-Force Tracker در حافظه — بی‌اثر در Serverless

* **Location:** `src/lib/auth/otp.ts` — خط ۷۳ (`verifyAttemptsMap`)
* **Problem:** `verifyAttemptsMap` یک `Map` در حافظه است. هر Serverless invocation یک Map جدید و خالی دارد. بنابراین محدودیت ۵ تلاش ناموفق عملاً اعمال نمی‌شود.
* **Impact:** مهاجم می‌تواند بدون محدودیت OTP brute-force کند (OTP ۵ رقمی = ۱۰۰,۰۰۰ حالت). با ۲۵ request در ۱۵ دقیقه (IP rate limit فعلی)، در حدود ۲۵ درخواست = ۲۵ * ۵ = ۱۲۵ حدس، که کافی نیست. **اما** اگر IP rate limit هم بی‌اثر باشد (Issue #13)، brute-force کاملاً ممکن است.
* **Root Cause:** ذخیره state در حافظه process به جای DB یا Redis.
* **Solution:** تعداد تلاش‌های ناموفق را در DB ذخیره کنید (فیلد `attempts Int @default(0)` در مدل `OtpToken`) یا از Redis استفاده کنید.
* **Implementation Notes:** ساده‌ترین راه: فیلد `attempts` را به `OtpToken` schema اضافه کنید و به جای Map، مستقیماً در DB بخوانید و بنویسید.
* **Priority:** هفته اول (مرتبط با Issue #13)

---

#### [MEDIUM] 17. User Profile — عدم محدودیت طول و محتوای `name`

* **Location:** `src/app/api/user/profile/route.ts` — خط ۱۹
* **Problem:** فیلد `name` فقط `trim()` می‌شود بدون هیچ validation:
  - حداکثر طول بررسی نمی‌شود (کاربر می‌تواند نام ۱۰,۰۰۰ کاراکتری ارسال کند)
  - کاراکترهای خاص یا HTML بررسی نمی‌شود
  - رشته خالی (`""`) مجاز است
* **Impact:** فشار بر DB (Json field)، نمایش نادرست در UI ادمین، احتمال XSS اگر name بدون escape render شود.
* **Root Cause:** عدم validation ورودی.
* **Solution:**
  ```typescript
  const trimmedName = typeof name === 'string' ? name.trim().slice(0, 100) : null
  if (trimmedName !== null && trimmedName.length < 2) {
    return NextResponse.json({ success: false, message: 'نام باید حداقل ۲ کاراکتر باشد.' }, { status: 400 })
  }
  ```
* **Implementation Notes:** React بطور پیش‌فرض مقادیر را escape می‌کند، پس XSS ریسک کمی دارد. اما defense-in-depth لازم است.
* **Priority:** هفته دوم

---

#### [MEDIUM] 18. Payment Callback — عدم بررسی مبلغ از Jibit Live

* **Location:** `src/lib/payment/providers/jibit.provider.ts` — خطوط ۲۹۷–۳۳۵ (تابع `verifyPayment` حالت Production)
* **Problem:** در حالت Production، پاسخ `/ppg/v3/purchases/{id}/verify` فقط `status` را بررسی می‌کند و مبلغ تأیید شده (`payableAmount`) را از پاسخ درگاه نمی‌خواند و در `amount` نتیجه بازنمی‌گرداند. بنابراین بررسی مبلغ در callback (خطوط ۲۷۱–۲۷۴) با `verifiedAmount` ممکن است `undefined` باشد و skip شود.
* **Impact:** اگر درگاه مبلغ متفاوتی تایید کند، سیستم متوجه نمی‌شود → تحویل محصول با پرداخت ناقص.
* **Root Cause:** عدم خواندن فیلد `payableAmount` از response Jibit verify.
* **Solution:** در `verifyPayment` حالت Live، مبلغ تأیید شده را از پاسخ بخوانید:
  ```typescript
  return {
    success: true,
    provider: this.name,
    refId: `JIBIT-${transactionId}`,
    amount: result.payableAmount ? Math.floor(result.payableAmount / 10) : amount,
    // ...
  }
  ```
  همچنین بعد از verify، باید inquiry هم بزنید (`GET /ppg/v3/purchases/{purchaseId}`) تا `payableAmount` دقیق را بخوانید.
* **Implementation Notes:** مستندات Jibit را بررسی کنید. ممکن است لازم باشد بعد از verify یک inquiry call انجام دهید. مبلغ در Rial (IRR) برگردانده می‌شود، تبدیل به تومان ضروری است.
* **Priority:** هفته اول

---

#### [MEDIUM] 19. Inventory Delete — بدون بررسی وضعیت Item

* **Location:** `src/app/api/admin/inventory/route.ts` — تابع `DELETE` خطوط ۲۲۰–۲۵۲
* **Problem:** ادمین می‌تواند یک `InventoryItem` با وضعیت `RESERVED` یا `USED` را حذف کند. اگر item در حال استفاده یک سفارش باشد، حذف آن باعث orphaned reference می‌شود.
* **Impact:** از دست رفتن اطلاعات سفارش‌ها، ناسازگاری داده.
* **Root Cause:** عدم بررسی `status` قبل از حذف.
* **Solution:**
  ```typescript
  const item = await prisma.inventoryItem.findUnique({ where: { id } })
  if (!item) { ... 404 }
  if (item.status !== 'AVAILABLE') {
    return NextResponse.json(
      { success: false, error: 'فقط آیتم‌های با وضعیت «موجود» قابل حذف هستند.' },
      { status: 400 }
    )
  }
  ```
* **Implementation Notes:** می‌توانید حذف item‌های `INVALID` را نیز مجاز کنید.
* **Priority:** هفته دوم

---

#### [MEDIUM] 20. Admin Order Status Update — بدون State Machine Validation

* **Location:** `src/app/api/admin/orders/route.ts` — خطوط ۶۷۹–۷۰۱ (Standard Status Update)
* **Problem:** ادمین می‌تواند هر status را به هر status دیگری تغییر دهد بدون هیچ State Machine validation. مثلاً:
  - `COMPLETED` → `PENDING_PAYMENT` (بازگشت به وضعیت قبلی)
  - `REFUNDED` → `COMPLETED` (بدون repayment)
* **Impact:** ناسازگاری وضعیت سفارش‌ها با واقعیت، مشکلات گزارش‌گیری مالی.
* **Root Cause:** عدم تعریف transition‌های مجاز بین statusها.
* **Solution:** یک map از transitionهای مجاز تعریف کنید:
  ```typescript
  const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING_PAYMENT: ['CANCELLED', 'EXPIRED', 'FAILED'],
    PAID: ['COMPLETED', 'REFUNDED', 'CANCELLED'],
    COMPLETED: ['REFUNDED'],
    // ...
  }
  ```
* **Implementation Notes:** این یک business logic improvement است. در صورت نیاز ادمین به انعطاف بیشتر، یک override با warning log اضافه کنید.
* **Priority:** هفته دوم

---

#### [MEDIUM] 21. Payment Amount به تومان ذخیره می‌شود — ریسک Rounding

* **Location:** `prisma/schema.prisma` — خط ۲۸۸ (`amount Int`) و `src/lib/payment/providers/jibit.provider.ts` — خط ۱۳۶
* **Problem:** مبلغ در DB به تومان (`Int`) ذخیره می‌شود اما Jibit با ریال کار می‌کند (`amount * 10`). هنگام verify، مبلغ باید از ریال به تومان تبدیل شود (`/ 10`). Integer Division ممکن است ۱ تومان اختلاف ایجاد کند.
* **Impact:** False negative در amount verification → رد شدن پرداخت معتبر.
* **Root Cause:** استفاده از واحدهای مختلف بدون یکپارچه‌سازی.
* **Solution:** همه مبالغ را به ریال ذخیره کنید (standard ایران) یا مطمئن شوید تبدیل‌ها همیشه `Math.floor` یا `Math.round` استفاده می‌کنند. فعلاً از `Math.round` برای تبدیل verify استفاده کنید.
* **Implementation Notes:** تغییر واحد به ریال نیاز به migration دارد و تأثیر زیادی روی کل سیستم دارد. در حال حاضر اطمینان از consistency در تبدیل‌ها کافی است.
* **Priority:** هفته دوم

---

#### [MEDIUM] 22. `$queryRawUnsafe` در Admin Products API

* **Location:** `src/app/api/admin/products/route.ts` — خط ۶۷
* **Problem:** استفاده از `$queryRawUnsafe` با پارامتر `missingTypeIds` که از کلاینت (plans ID) می‌آید. اگرچه IDها از DB خوانده شده‌اند (نه مستقیم از کلاینت)، استفاده از `RawUnsafe` یک anti-pattern است.
* **Impact:** ریسک SQL Injection کم (چون ورودی از DB است) اما اگر منطق تغییر کند و ورودی مستقیم شود، آسیب‌پذیر می‌شود.
* **Root Cause:** استفاده از raw query برای workaround مشکل Prisma client.
* **Solution:** از `$queryRaw` با tagged template literals استفاده کنید:
  ```typescript
  const rawRows = await prisma.$queryRaw<{ id: string; planType: string | null }[]>`
    SELECT "id", "planType" FROM "plans" WHERE "id" = ANY(${missingTypeIds}::text[])
  `
  ```
* **Implementation Notes:** مطمئن شوید Prisma tagged templates آرایه‌ها را درست handle می‌کند. اگر نه، از `Prisma.sql` helper استفاده کنید.
* **Priority:** هفته دوم

---

## Phase 4 — مشکلات LOW (بعد از لانچ)

---

#### [LOW] 23. Legacy `ActivationLink` Model

* **Location:** `prisma/schema.prisma` — خطوط ۳۰۸–۳۳۷
* **Problem:** مدل `ActivationLink` با کامنت `@deprecated` علامت‌گذاری شده اما هنوز در schema و API responses (include در orders) وجود دارد. `InventoryItem` جایگزین آن شده است.
* **Impact:** Confusion در توسعه، overhead اضافی در queryها، data duplication.
* **Root Cause:** عدم تکمیل migration از سیستم قدیم به جدید.
* **Solution:** بررسی کنید آیا هنوز داده‌ای در `ActivationLink` وجود دارد. اگر نه، مدل و تمام referenceهایش را حذف کنید. اگر بله، ابتدا داده‌ها را migrate و سپس حذف کنید.
* **Implementation Notes:** این نیاز به migration و بررسی تمام کدهایی که `activationLink` include می‌کنند دارد.
* **Priority:** بعد از لانچ

---

#### [LOW] 24. Docker — عدم تنظیم `CREDENTIALS_ENCRYPTION_KEY`

* **Location:** `Dockerfile` و `.env.example`
* **Problem:** `.env.example` فیلد `CREDENTIALS_ENCRYPTION_KEY` را ذکر کرده اما مقدار خالی دارد. در production build بدون این متغیر، سیستم به JWT_SECRET fallback می‌کند (Issue #9).
* **Impact:** وابستگی ناخواسته encryption به JWT key.
* **Root Cause:** عدم وجود runtime validation برای environment variables حیاتی.
* **Solution:** یک startup check اضافه کنید:
  ```typescript
  if (process.env.NODE_ENV === 'production' && !process.env.CREDENTIALS_ENCRYPTION_KEY) {
    console.warn('WARNING: CREDENTIALS_ENCRYPTION_KEY not set, falling back to JWT_SECRET')
  }
  ```
* **Implementation Notes:** می‌توانید در `prisma.ts` یا `layout.tsx` یک env validation با Zod انجام دهید.
* **Priority:** بعد از لانچ

---

#### [LOW] 25. CRON_SECRET در `.env.example` بدون توضیح Production

* **Location:** `.env.example` — بخش Telegram Bot
* **Problem:** `CRON_SECRET` در `.env.example` نیست. اگر deploy بدون آن انجام شود، در production cron endpoint بدون auth رد نمی‌شود (خط 23-26 expire-orders: در production بدون secret، reject می‌شود) اما ممکن است فراموش شود.
* **Impact:** عدم اجرای cron jobs در production.
* **Root Cause:** مستندسازی ناقص env variables.
* **Solution:** `CRON_SECRET` را به `.env.example` اضافه کنید با توضیح.
* **Implementation Notes:** همچنین `CREDENTIALS_ENCRYPTION_KEY` را مستند کنید.
* **Priority:** بعد از لانچ

---

#### [LOW] 26. عدم محدودیت طول ورودی‌های Checkout Fields

* **Location:** `src/app/api/orders/route.ts` — خطوط ۱۸۳–۲۰۷
* **Problem:** Dynamic checkout fields فقط `required` و `email` format بررسی می‌شوند اما طول مقادیر محدود نشده. مهاجم می‌تواند یک مقدار ۱ مگابایتی ارسال کند.
* **Impact:** فشار بر DB (Json field)، مصرف حافظه.
* **Root Cause:** عدم validation طول.
* **Solution:** در حلقه validation، `String(val).length > 500` را بررسی کنید.
* **Implementation Notes:** ساده و سریع.
* **Priority:** بعد از لانچ

---

#### [LOW] 27. Package `@tanstack/react-router` — بدون استفاده

* **Location:** `package.json` — خط ۴۹
* **Problem:** `@tanstack/react-router` در dependencies وجود دارد اما Next.js خودش routing دارد و این پکیج احتمالاً استفاده نمی‌شود.
* **Impact:** افزایش اندازه `node_modules` و bundle.
* **Root Cause:** dependency اضافه شده و حذف نشده.
* **Solution:** با `knip` بررسی کنید و اگر استفاده نمی‌شود، حذف کنید: `pnpm remove @tanstack/react-router`
* **Implementation Notes:** قبل از حذف، `grep -r "react-router" src/` بزنید.
* **Priority:** بعد از لانچ

---

#### [LOW] 28. `document.json` — فایل بزرگ (533KB) در root

* **Location:** `document.json` — ۵۳۲ کیلوبایت
* **Problem:** یک فایل JSON بزرگ (احتمالاً مستندات Jibit API) در root پروژه بدون استفاده در runtime. اگر به git اضافه شده باشد، فقط repository را سنگین‌تر می‌کند.
* **Impact:** افزایش اندازه repository و deploy.
* **Root Cause:** فایل مستندات خارجی commit شده.
* **Solution:** به `.gitignore` اضافه کنید یا به دایرکتوری `docs/` منتقل کنید.
* **Implementation Notes:** اگر برای reference لازم است، در یک پوشه جداگانه نگهداری کنید.
* **Priority:** بعد از لانچ

---

## 📊 Implementation Roadmap

### Phase 1 — Critical Security Fixes (فوری، قبل از اولین Deploy)

| # | Issue | عملیات کلیدی | تخمین |
|---|-------|-------------|-------|
| 1 | Rotate Secrets | تولید مقادیر جدید، جایگزینی در env | ۳۰ دقیقه |
| 2 | Telegram Setup Auth | اضافه کردن `requireAdminApi()` | ۵ دقیقه |
| 3 | Payment Lock Fix | انتقال lock به داخل transaction | ۲ ساعت |
| 4 | SVG Upload Block | حذف `image/svg+xml` از allowed types | ۵ دقیقه |

**وابستگی:** Issue #9 (Encryption Key) باید قبل از Issue #1 (Rotate Secrets) حل شود.

---

### Phase 2 — High Priority Fixes (هفته اول)

| # | Issue | عملیات کلیدی | تخمین |
|---|-------|-------------|-------|
| 5 | Strong JWT Secret | جایگزینی با `openssl rand -hex 32` | ۱۰ دقیقه |
| 6 | Cookie/JWT Expiry Sync | هماهنگ‌سازی `maxAge` | ۱۰ دقیقه |
| 7 | Cron Query Param | حذف `querySecret` | ۳۰ دقیقه |
| 8 | OTP DevCode Guard | اضافه کردن `NODE_ENV` check | ۱۵ دقیقه |
| 9 | Separate Encryption Key | تولید key جدید، migration script | ۱ ساعت |
| 10 | Images Allowlist | جایگزینی `**` با دامنه‌های مجاز | ۱۵ دقیقه |
| 11 | Coupon Per-User Limit | Schema migration + validation | ۲ ساعت |
| 12 | Review Rate Limiting | اضافه کردن auth + rate limit | ۱ ساعت |

---

### Phase 3 — Medium Priority (هفته دوم)

| # | Issue | عملیات کلیدی | تخمین |
|---|-------|-------------|-------|
| 13 | Redis Rate Limiter | نصب `@upstash/ratelimit` + refactor | ۳ ساعت |
| 14 | Duplicate Cron Routes | حذف route قدیمی | ۱۵ دقیقه |
| 15 | Admin Note Sanitization | تابع sanitize + اعمال | ۳۰ دقیقه |
| 16 | OTP Attempts in DB | Migration + refactor | ۱.۵ ساعت |
| 17 | Profile Name Validation | اضافه کردن min/max + sanitize | ۱۵ دقیقه |
| 18 | Jibit Amount Verify | خواندن payableAmount از response | ۱ ساعت |
| 19 | Inventory Delete Guard | بررسی status قبل از حذف | ۱۵ دقیقه |
| 20 | Order State Machine | تعریف allowed transitions | ۱ ساعت |
| 21 | Amount Unit Consistency | بررسی rounding + Math.round | ۳۰ دقیقه |
| 22 | queryRawUnsafe Fix | تغییر به tagged template | ۱۵ دقیقه |

---

### Phase 4 — Low Priority / Technical Debt (بعد از لانچ)

| # | Issue | عملیات کلیدی | تخمین |
|---|-------|-------------|-------|
| 23 | Legacy ActivationLink | بررسی + حذف مدل | ۲ ساعت |
| 24 | Docker Env Validation | Startup check اضافه شود | ۳۰ دقیقه |
| 25 | Env Example Completion | مستندسازی CRON_SECRET | ۱۵ دقیقه |
| 26 | Checkout Field Length | اضافه کردن max length check | ۱۵ دقیقه |
| 27 | Unused Dependencies | اجرای knip + حذف | ۳۰ دقیقه |
| 28 | document.json cleanup | انتقال یا gitignore | ۵ دقیقه |

---

## بخش‌های صحیح و امن بررسی شده

موارد زیر بررسی شدند و مشکلی یافت نشد:

- **Admin Guard:** `requireAdminApi()` به درستی در تمام admin API routes اعمال شده
- **IDOR Prevention:** Order API فقط سفارش‌های `userId === session.userId` را برمی‌گرداند
- **Token Revocation:** سیستم `tokenVersion` برای invalidate کردن فوری session به درستی کار می‌کند
- **CSRF Protection:** Cookie با `sameSite: 'lax'` و `httpOnly: true` تنظیم شده
- **OTP Security:** تولید OTP با `crypto.randomInt` (cryptographically secure) + cooldown + hourly limit
- **Race-Safe User Creation:** `pg_advisory_xact_lock` برای جلوگیری از race condition در ایجاد اولین ادمین
- **Atomic Stock Reservation:** `FOR UPDATE SKIP LOCKED` در transaction ایجاد سفارش
- **Coupon Atomic Operations:** `FOR UPDATE` lock هنگام increment usage + decrement هنگام refund/expire
- **Credential Encryption:** AES-256-GCM با IV تصادفی و Auth Tag
- **Webhook Security:** Telegram webhook با `x-telegram-bot-api-secret-token` محافظت شده
- **Soft Delete Products:** محصولات دارای سفارش بایگانی می‌شوند نه حذف
- **Cookie Security:** `httpOnly`, `secure` (in prod), `sameSite: 'lax'`
- **File Upload:** محدودیت اندازه + MIME type validation + نام تصادفی (`crypto.randomUUID`)
- **Product Delete Cascade:** InventoryItems, Plans, Variants قبل از Product حذف می‌شوند
- **Prisma Singleton:** Pattern صحیح globalForPrisma برای جلوگیری از connection leak

---

> **این plan به عنوان نقشه راه اصلاحات قبل و بعد از لانچ استفاده شود. اجرای Phase 1 و 2 قبل از Production Deploy الزامی است.**
