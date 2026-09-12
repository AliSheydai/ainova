# 🔍 بررسی جامع و سخت‌گیرانه پروژه AiNova — فروشگاه اشتراک‌های هوش مصنوعی

> این سند نتیجه بررسی عمیق تمام فایل‌های پروژه، از دیتابیس و API گرفته تا لندینگ، چک‌اوت، داشبورد ادمین و سیستم Fulfillment است.
> هر مورد به‌صورت مستقل قابل اجراست و از **بحرانی‌ترین** به **کم‌اهمیت‌ترین** مرتب شده‌اند.

---

## ⚠️ بخش ۱: باگ‌ها و مشکلات امنیتی بحرانی (Critical)

### ۱.۱ — `JWT_SECRET` هاردکد شده در کد (خطر امنیتی فوری)

> [!CAUTION]
> **فایل‌ها:** [jwt.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/auth/jwt.ts#L4), [middleware.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/middleware.ts#L5), [crypto.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/security/crypto.ts#L7-L10)

در سه فایل مختلف، یک `fallback secret` یکسان هاردکد شده:
```
'fallback-secret-at-least-32-chars-long-for-google-ai-pro'
```

**مشکل:** اگر `JWT_SECRET` در `.env` تنظیم نباشد، هر کسی که سورس‌کد را ببیند (مثلاً در Git) می‌تواند توکن JWT جعلی با نقش ADMIN بسازد.

**رفع:**
- حذف کامل fallback — اگر `JWT_SECRET` ست نشده، اپلیکیشن نباید استارت شود.
- همچنین `CREDENTIALS_ENCRYPTION_KEY` هم به `JWT_SECRET` فال‌بک می‌کند — باید کلید مجزا با fallback = throw error داشته باشد.

---

### ۱.۲ — عدم Rate Limiting واقعی روی OTP (حمله Brute-Force)

> [!CAUTION]
> **فایل:** [otp.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/auth/otp.ts#L62-L83)

فقط یک cooldown ساده بر اساس آخرین OTP موجود هست. اما:
- **هیچ محدودیتی بر تعداد تلاش‌های اشتباه verify وجود ندارد** — مهاجم می‌تواند 100000 بار کد مختلف ارسال کند (کد ۵ رقمی = فقط ۱۰۰ هزار حالت).
- هیچ بلاک IP یا شماره وجود ندارد.
- OTP با `Math.random()` تولید می‌شود که cryptographically secure نیست.

**رفع:**
- محدود کردن تلاش‌های verify به ۵ بار (بعد از آن، OTP ابطال شود).
- بلاک شماره بعد از ۱۰ درخواست OTP در ساعت.
- استفاده از `crypto.randomInt(0, 100000)` به‌جای `Math.random()`.
- افزودن Rate Limiting بر اساس IP (مثلاً با `@upstash/ratelimit` یا middleware).

---

### ۱.۳ — باگ: OTP Code با `normalizePhone` پردازش می‌شود

> [!WARNING]
> **فایل:** [otp.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/auth/otp.ts#L144)

```typescript
const code = normalizePhone(rawCode)  // ❌ BUG!
```

کد OTP (مثلاً `"12345"`) از تابع `normalizePhone` رد می‌شود که اعداد فارسی/عربی را تبدیل، `+` را حذف و prefix `0` اضافه می‌کند. اگر کد OTP `"09123"` باشد، ممکن است به `"009123"` یا چیز دیگری تبدیل شود و verification شکست بخورد.

**رفع:** یک تابع مجزا `normalizeOtpCode` بنویسید که فقط اعداد فارسی/عربی را به انگلیسی تبدیل کند (بدون حذف prefix و بدون اضافه کردن `0`).

---

### ۱.۴ — TOCTOU Race Condition در سفارش‌گذاری (Stock Check)

> [!WARNING]
> **فایل:** [orders/route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L103-L116)

Stock در خط ۱۰۴ چک می‌شود، بعد سفارش در خط ۱۲۹ ساخته می‌شود. بین این دو مرحله، ۱۰ سفارش هم‌زمان می‌توانند stock مثبت ببینند ولی همگی سفارش ثبت کنند — و سپس در Fulfillment فقط یکی لینک بگیرد. بقیه STOCK_EXHAUSTED می‌شوند.

**مشکل:** پول ۹ نفر گرفته شده و سفارششان در صف معلق (PAID) می‌ماند.

**رفع:**
- بررسی stock و رزرو آیتم باید **درون یک Transaction** با `FOR UPDATE SKIP LOCKED` انجام شود — یعنی همان لحظه ثبت سفارش، inventory item رزرو شود.
- یا از یک counter atomik در database استفاده شود.

---

### ۱.۵ — ایمیل‌ها و رمزعبور حساب‌های از پیش آماده در response API ارسال می‌شوند

> [!WARNING]
> **فایل:** [orders/route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L204-L222)

در GET `/api/orders`، delivery data شامل `password` (decrypt شده!) به کلاینت ارسال می‌شود. اگر توکن JWT کاربر لو برود، تمام رمزعبور حساب‌هایش قابل دسترسی است.

**رفع:**
- رمزعبور فقط یک‌بار نمایش داده شود (مثلاً فقط در صفحه success بلافاصله بعد از خرید).
- در API لیست سفارش‌ها، password ماسک شود (`••••••••`).

---

### ۱.۶ — عدم Idempotency در Payment Callback

> [!WARNING]
> **فایل:** [payment/callback/route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/payment/callback/route.ts#L9-L245)

Payment callback از نوع GET است (redirect). اگر کاربر صفحه را refresh کند، callback دوباره اجرا می‌شود. اگرچه در FulfillmentService یک idempotency check هست، ولی:
- Verify payment ممکن است دوبار به gateway ارسال شود.
- در خطوط ۵۸-۶۷، وضعیت cancel بدون اطمینان از اینکه قبلاً SUCCESS نشده، اعمال می‌شود.

**رفع:**
- ابتدا بررسی شود آیا payment قبلاً `SUCCESS` شده (قبل از verify مجدد).
- یک فلگ `processed` یا `lastCallbackAt` اضافه شود.

---

## 🏗️ بخش ۲: مشکلات معماری و ساختاری

### ۲.۱ — دوگانگی سیستم Inventory: `ActivationLink` + `InventoryItem`

> [!IMPORTANT]
> **فایل‌ها:** [schema.prisma](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/prisma/schema.prisma#L210-L307), [activation-link.handler.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/activation-link.handler.ts)

دو مدل `ActivationLink` و `InventoryItem` عملاً کار مشابهی انجام می‌دهند. `ActivationLinkFulfillmentHandler` ابتدا `activation_links` را چک می‌کند، بعد `inventory_items` را. این دوگانگی باعث:
- اشتباه در شمارش stock (جمع هر دو جدول).
- پیچیدگی غیرضروری در کد.
- احتمال بالای باگ هنگام اضافه‌کردن موجودی.

**رفع:** `ActivationLink` model را منسوخ (deprecate) کنید. همه موجودی‌ها فقط از `InventoryItem` مدیریت شوند. یک migration بنویسید که داده‌های `activation_links` را به `inventory_items` منتقل کند.

---

### ۲.۲ — دوگانگی فیلدهای Product: `title`/`name` و `status`/`active`

> [!IMPORTANT]
> **فایل:** [schema.prisma](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/prisma/schema.prisma#L87-L112)

```prisma
title  String  @default("")
name   String  @default("") // Keep synced for compatibility
status ProductStatus @default(ACTIVE)
active Boolean       @default(true) // Keep synced for compatibility
```

این "synced for compatibility" نشان می‌دهد که یک مهاجرت نیمه‌کاره انجام شده. در خیلی جاها `prod.title || prod.name` نوشته شده. این باعث:
- خطا در جستجو (کدام فیلد canonical است؟)
- ناسازگاری داده‌ها اگر یکی آپدیت شود و دیگری نه.

**رفع:** فیلدهای `name` و `active` را حذف کنید. فقط از `title` و `status` استفاده کنید. یک migration اجرا کنید.

---

### ۲.۳ — فایل dashboard/products/page.tsx بسیار بزرگ است (۱۴۱۹ خط!)

> [!WARNING]
> **فایل:** [products/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/dashboard/products/page.tsx) (66KB)

یک فایل ۱۴۱۹ خطی `use client` که شامل لیست محصولات، ایجاد/ویرایش/حذف محصول، مدیریت پلن‌ها، مدیریت checkout fields و inventory همه در یک فایل است.

**رفع:**
- به کامپوننت‌های مجزا بشکنید: `ProductList`, `ProductForm`, `PlanManager`, `CheckoutFieldEditor`, `InventoryManager`.
- منطق API را در custom hooks (`useProducts`, `usePlans`) جدا کنید.

---

### ۲.۴ — `FulfillmentType` دو بار در Product و Plan تعریف شده

> [!IMPORTANT]
> **فایل:** [schema.prisma](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/prisma/schema.prisma#L100-L121)

هم Product و هم Plan فیلد `fulfillmentType` دارند. در [order-fulfillment.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/order-fulfillment.ts#L143-L146):
```typescript
const fulfillmentType = effectivePlan?.fulfillmentType || effectiveProduct?.fulfillmentType || 'ACTIVATION_LINK'
```

**مشکل:** گیج‌کننده است. اگر Product نوع `MANUAL` باشد و Plan نوع `ACTIVATION_LINK`، کدام اولویت دارد؟ و اگر پلنی نداشته باشد چی؟

**رفع:** `fulfillmentType` را از Product حذف کنید. هر پلن نوع خودش را مشخص کند. اگر محصول بدون پلن خریده شود (که نباید!)، یک default وجود داشته باشد.

---

### ۲.۵ — `price` دو بار: هم در Product و هم در Plan

> [!IMPORTANT]
> **فایل:** [schema.prisma](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/prisma/schema.prisma#L95-L119)

`Product.price` و `Plan.price` هر دو وجود دارند. در [orders/route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L119):
```typescript
const orderAmount = plan?.price || product.price || 0
```

اگر `plan.price === 0` باشد (مثلاً آیتم رایگان)، `product.price` استفاده می‌شود که اشتباه است!

**رفع:**
- از `plan?.price ?? product.price` استفاده شود (nullish coalescing به جای OR).
- یا بهتر: قیمت فقط در Plan باشد، و Product.price صرفاً "شروع از" باشد.

---

### ۲.۶ — عدم وجود مکانیزم اجباری «هر محصول حداقل یک پلن باید داشته باشد»

> [!WARNING]

کد اجازه خرید مستقیم محصول بدون انتخاب پلن را می‌دهد (خطوط ۳۵-۵۱ در orders/route.ts). ولی سیستم Fulfillment اصلاً بر اساس Plan کار می‌کند. اگر پلنی نباشد، fallback‌های عجیب فعال می‌شوند.

**رفع:** 
- محصول بدون پلن فعال نباید قابل خرید باشد.
- در API سفارش، اگر `planId` ارسال نشده و محصول پلنی ندارد، خطا برگردانید.

---

## 🎨 بخش ۳: مشکلات UI/UX

### ۳.۱ — ناسازگاری برندینگ: «جمینای» vs «آینوا» vs «فروشگاه اشتراک‌های دیجیتال»

> [!CAUTION]
> **فایل‌ها:** [layout.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/layout.tsx#L14-L18), [landing-header.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/components/landing/landing-header.tsx#L109), [checkout/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/checkout/page.tsx#L233), [login/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/login/page.tsx#L207-L209)

- **Root Layout metadata:** `"جمینای — خرید و فعال‌سازی اشتراک هوش مصنوعی گوگل"`
- **Landing Page metadata:** `"آینوا (AiNova) | فروشگاه رسمی اشتراک‌های هوش مصنوعی و دیجیتال"`
- **Header:** `"آینوا"` + `"AiNova Store"`
- **Checkout Header:** `"فروشگاه اشتراک‌های دیجیتال"` (بدون لوگو!)
- **Login Page:** `"جمینای"` با گرادیانت متفاوت و استایل کاملاً متفاوت!
- **Keywords:** `['جمینای', 'هوش مصنوعی گوگل', ...]` — ربطی به AiNova ندارد.

**مشکل:** کاربر نمی‌فهمد در چه سایتی است. از صفحه اصلی به لاگین می‌رود و یک برند کاملاً متفاوت می‌بیند.

**رفع:**
- یک نام، یک لوگو، یک هویت بصری.
- تمام metadata یکپارچه شود.
- Header چک‌اوت هم همان لوگوی landing را داشته باشد.

---

### ۳.۲ — صفحه چک‌اوت هدر متفاوت و ناقصی دارد

> [!WARNING]
> **فایل:** [checkout/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/checkout/page.tsx#L226-L246)

- هدر چک‌اوت از صفر نوشته شده و `LandingHeader` را include نمی‌کند.
- کاربر لاگین‌شده هیچ نشانه‌ای از هویتش نمی‌بیند.
- دکمه «بازگشت» هست ولی تلگرام ربات و حساب کاربری نیست.

**رفع:** از یک Header مشترک (Shared Layout) استفاده شود یا حداقل اجزای ضروری (لوگو + نام کاربر + لینک داشبورد) حفظ شود.

---

### ۳.۳ — صفحه لاگین هنوز برندینگ «جمینای» قدیمی دارد

> [!WARNING]
> **فایل:** [login/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/login/page.tsx#L203-L215)

لوگوی صفحه لاگین یک گرادیانت `from-primary via-blue-600 to-indigo-600` دارد و نام «جمینای» به‌جای «آینوا» نمایش داده می‌شود. حتی زیرنویس `"سامانه قانونی فعال‌سازی اشتراک"` دارد که فقط به یک محصول اشاره می‌کند.

**رفع:** با هویت بصری «آینوا» هماهنگ شود.

---

### ۳.۴ — عدم وجود صفحه «سفارش‌های من» برای کاربر عادی در وب

> [!WARNING]

کاربر عادی (غیر ادمین) بعد از خرید، فقط یک `DashboardModal` (مودال) دارد. هیچ صفحه مستقلی برای مشاهده تاریخچه سفارش‌ها، لینک‌های فعال‌سازی و اطلاعات delivery ندارد. این مودال بسیار محدود است.

**رفع:** یک صفحه `/my-orders` یا `/account` بسازید که:
- لیست تمام سفارش‌ها
- وضعیت هر سفارش
- لینک فعال‌سازی / اطلاعات اکانت
- تیکت‌های پشتیبانی
را نشان دهد.

---

### ۳.۵ — ویترین محصولات قیمت Product را نمایش می‌دهد، نه Plan

> [!WARNING]
> **فایل:** [products-showcase-section.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/components/landing/products-showcase-section.tsx#L93-L95)

```typescript
<strong>{formatPrice(prod.price)}</strong>
```

`Product.price` نمایش داده می‌شود، ولی اگر محصولی چند پلن با قیمت‌های مختلف داشته باشد (مثلاً ۳ ماهه ۱۰۰ هزار، ۱ ساله ۳۰۰ هزار)، فقط قیمت ثابت Product نشان داده می‌شود — نه حتی «شروع از ...».

**رفع:** نمایش «شروع از X تومان» (حداقل قیمت پلن‌های فعال) یا نمایش رنج قیمت.

---

### ۳.۶ — عدم نمایش عکس واقعی محصول

> [!WARNING]
> **فایل:** [products/[slug]/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/products/%5Bslug%5D/page.tsx#L152-L162)

جای عکس محصول، یک آیکون `<Package>` بزرگ نمایش داده می‌شود. حتی با وجود اینکه فیلد `image` در دیتابیس هست، استفاده نشده.

**رفع:** اگر `product.image` موجود است، تصویر واقعی نمایش داده شود. از `next/image` استفاده شود.

---

### ۳.۷ — Header در حالت RTL از `[direction:ltr] md:[direction:rtl]` استفاده می‌کند

> [!WARNING]
> **فایل:** [landing-header.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/components/landing/landing-header.tsx#L101)

```html
<header className='... [direction:ltr] md:[direction:rtl]'>
```

در موبایل LTR و در دسکتاپ RTL? این رفتار بسیار عجیب و confusing است. کل سایت RTL است ولی header در موبایل LTR می‌شود.

**رفع:** حذف این override. سایت یکپارچه RTL باشد. اگر المان خاصی نیاز به LTR دارد (مثلاً شماره تلفن)، فقط آن المان `dir="ltr"` بگیرد.

---

### ۳.۸ — صفحه لندینگ بخش `PricingSection` فقط یک محصول خاص را نشان می‌دهد

> [!WARNING]
> **فایل:** [page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/page.tsx#L61-L77)

```typescript
const primaryProduct = products.find((p) => p.slug === 'google-ai-pro') || products[0]
```

بخش Pricing هاردکد شده روی `google-ai-pro` است. اگر این محصول وجود نداشته باشد یا حذف شود، اولین محصول انتخاب می‌شود. این منطق برای فروشگاه چندمحصولی مناسب نیست.

**رفع:** `PricingSection` حذف شود (چون ویترین محصولات قبلاً قیمت‌ها را نشان می‌دهد) یا به‌صورت داینامیک تمام محصولات را مقایسه کند.

---

### ۳.۹ — توضیحات محصول فقط plaintext هستند

> [!WARNING]
> **فایل:** [products/[slug]/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/products/%5Bslug%5D/page.tsx#L170)

```html
<div className='... whitespace-pre-line'>{product.description}</div>
```

`description` فقط متن ساده نشان داده می‌شود. بولد، لینک، لیست، تصویر — هیچ‌کدام پشتیبانی نمی‌شوند.

**رفع:** از Markdown renderer (مثلاً `react-markdown`) یا یک Rich Text Editor (مثلاً Tiptap) در ادمین پنل استفاده شود.

---

### ۳.۱۰ — فیچرهای محصول هاردکد هستند

> [!WARNING]
> **فایل‌ها:** [checkout/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/checkout/page.tsx#L56-L62), [products/[slug]/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/products/%5Bslug%5D/page.tsx#L91-L97)

یک `defaultFeatures` آرایه ثابت برای همه محصولات نمایش داده می‌شود. اگر محصول «اشتراک Netflix» باشد، باز هم می‌نویسد «فعال‌سازی رسمی روی اکانت شخصی» و «بدون نیاز به ارسال رمز عبور» — که ممکن است اشتباه باشد.

**رفع:** فیچرها باید per-product قابل تنظیم باشند (مثلاً فیلد JSON `features` در جدول Product).

---

## 🧩 بخش ۴: مشکلات منطق کسب‌وکار

### ۴.۱ — عدم مکانیزم بازگشت وجه (Refund)

> [!IMPORTANT]

اگر پرداخت موفق شود ولی stock تمام شده باشد (`STOCK_EXHAUSTED`)، سفارش در وضعیت `PAID` باقی می‌ماند. ولی:
- هیچ مکانیزم خودکار refund وجود ندارد.
- هیچ notification به ادمین ارسال نمی‌شود.
- هیچ تایم‌آوتی نیست (ممکن است هفته‌ها بماند).
- کاربر فقط یک پیام «در صف تامین» می‌بیند.

**رفع:**
- اضافه‌کردن مکانیزم Refund در پنل ادمین.
- Notification فوری به ادمین (تلگرام/ایمیل) وقتی STOCK_EXHAUSTED رخ می‌دهد.
- SLA / تایم‌اوت ۲۴ ساعته: اگر ظرف ۲۴ ساعت stock تامین نشد، خودکار refund شود.

---

### ۴.۲ — سفارش‌های `PENDING_PAYMENT` هرگز منقضی نمی‌شوند

> [!WARNING]

اگر کاربر سفارش بزند ولی پرداخت نکند (مثلاً صفحه بانک را ببندد)، سفارش تا ابد `PENDING_PAYMENT` باقی می‌ماند. این باعث:
- آلودگی دیتابیس
- آمار نادرست
- احتمال confusion در داشبورد

**رفع:**
- یک Cron Job / Scheduled Task: سفارش‌های `PENDING_PAYMENT` قدیمی‌تر از ۳۰ دقیقه را `EXPIRED` یا `CANCELLED` کنید.
- اضافه کردن وضعیت `EXPIRED` به `OrderStatus` enum.

---

### ۴.۳ — عدم وجود سیستم تخفیف و کوپن

> [!NOTE]

برای یک فروشگاه، نبود سیستم تخفیف یک کمبود بزرگ است. کد تخفیف، تخفیف زمانی، تخفیف روی اولین خرید — هیچ‌کدام وجود ندارد.

**رفع:** یک جدول `Coupon` و `Discount` اضافه کنید و در checkout اعمال شود.

---

### ۴.۴ — عدم سیستم اعلان‌رسانی به ادمین

> [!NOTE]

وقتی سفارش جدیدی ثبت می‌شود، وقتی stock تمام می‌شود، وقتی تیکت پشتیبانی جدید می‌آید — هیچ اعلانی به ادمین ارسال نمی‌شود (نه تلگرام، نه ایمیل).

**رفع:** بعد از هر سفارش موفق، یک پیام به ربات تلگرام ادمین ارسال شود. همچنین alert وقتی stock از threshold مشخصی کمتر شود.

---

## ⚡ بخش ۵: مشکلات Performance

### ۵.۱ — N+1 Query در لندینگ و داشبورد

> [!WARNING]
> **فایل:** [page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/page.tsx#L32-L37)

```typescript
const enriched = await Promise.all(
  products.map(async (prod) => {
    const [stock, purchaseCount] = await Promise.all([
      FulfillmentService.getProductStock(prod.id),        // 2+ queries per product
      FulfillmentService.getProductPurchaseCount(prod.id), // 1 query per product
    ])
```

هر محصول حداقل ۳ query به DB ارسال می‌کند. برای ۱۰ محصول = ۳۰+ query! و `getProductStock` خودش per-plan query هم می‌زند.

**رفع:**
- از `COUNT ... GROUP BY` یا aggregate queries استفاده کنید.
- نتایج stock و purchaseCount را cache کنید (حتی ۶۰ ثانیه).
- یا اصلاً stock و purchaseCount را به صورت materialized/denormalized در Product ذخیره و با trigger آپدیت کنید.

---

### ۵.۲ — Overview داشبورد ۱۵ query هم‌زمان ارسال می‌کند

> [!WARNING]
> **فایل:** [admin/overview/route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/admin/overview/route.ts#L12-L86)

۱۵ `prisma.xxx.count()` / `findMany()` / `aggregate()` به صورت `Promise.all` اجرا می‌شوند. با رشد دیتابیس، response time افزایش خواهد یافت.

**رفع:**
- بعضی count‌ها را combine کنید (raw SQL).
- Cache layer اضافه کنید (Redis یا in-memory با TTL).
- فقط آنچه لازم است lazy load شود.

---

### ۵.۳ — صفحه محصول SSR بدون Caching

> [!NOTE]
> **فایل:** [products/[slug]/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/products/%5Bslug%5D/page.tsx)

هر بار که کاربری صفحه محصول را باز می‌کند، query‌ها از نو اجرا می‌شوند. برای محصولاتی که خیلی آپدیت نمی‌شوند، `revalidate` اضافه شود.

**رفع:**
```typescript
export const revalidate = 60 // revalidate every 60 seconds
```

---

## 🔧 بخش ۶: مشکلات کیفیت کد و DevOps

### ۶.۱ — استفاده از `any` در جاهای مختلف

> [!WARNING]

در بسیاری از فایل‌ها `any` استفاده شده:
- [types.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/types.ts#L80): `tx: any`
- [activation-link.handler.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/activation-link.handler.ts#L7): `tx: any; order: any`
- API route‌ها: `const where: any = {}`

**رفع:** Type‌های مناسب برای `PrismaTransactionClient` و سایر موارد تعریف شود.

---

### ۶.۲ — `@prisma/client` به عنوان devDependency تعریف شده

> [!CAUTION]
> **فایل:** [package.json](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/package.json#L79)

```json
"devDependencies": {
    "@prisma/client": "^6.19.3",
```

`@prisma/client` در production runtime لازم است! باید در `dependencies` باشد.

**رفع:** `@prisma/client` را به `dependencies` منتقل کنید.

---

### ۶.۳ — فایل `.env` در ریشه پروژه (اگر commit شده باشد)

> [!CAUTION]

فایل `.env` با ۱۱۳۹ بایت وجود دارد. اگر در Git commit شده باشد، تمام secret‌ها لو رفته‌اند. البته `.gitignore` ممکن است آن را exclude کرده باشد.

**رفع:** مطمئن شوید `.env` در `.gitignore` هست. Git history را هم بررسی کنید (`git log --all -- .env`).

---

### ۶.۴ — فایل‌ها و Import‌های بلااستفاده

> [!NOTE]

- `src/main.tsx` و `src/routeTree.gen.ts` — به نظر بقایای یک setup اولیه Vite/TanStack Router هستند که الان با Next.js App Router جایگزین شده‌اند.
- `@tanstack/react-router` و `@tanstack/router-plugin` در dependencies — ولی routing با Next.js انجام می‌شود.
- `src/vite-env.d.ts` — مربوط به Vite.
- `@vitejs/plugin-react` و `vite` — پروژه Next.js است نه Vite.
- `src/features/`, `src/routes/`, `src/stores/` — محتوای این پوشه‌ها بقایای پروژه قبلی به نظر می‌رسند.
- `@clerk/react` در dependencies — ولی auth سفارشی OTP/JWT استفاده می‌شود.

**رفع:** تمام dependency‌ها و فایل‌های اضافی را حذف کنید. `knip` (که نصب هست) اجرا کنید:
```bash
npx knip
```

---

### ۶.۵ — `package.json` هنوز نام `"shadcn-admin"` دارد

> [!NOTE]
> **فایل:** [package.json](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/package.json#L2)

```json
"name": "shadcn-admin",
```

**رفع:** به `"ainova-store"` یا نام مناسب تغییر دهید.

---

### ۶.۶ — عدم وجود Error Boundary در صفحات Client

> [!NOTE]

هیچ `error.tsx` یا React Error Boundary در صفحات client وجود ندارد. اگر خطای render رخ دهد، صفحه سفید نمایش داده می‌شود.

**رفع:** فایل‌های `error.tsx` و `loading.tsx` برای هر route segment اضافه شود.

---

## 📱 بخش ۷: مشکلات ریسپانسیو و دسترس‌پذیری (a11y)

### ۷.۱ — جدول‌ها در موبایل overflow دارند

> [!NOTE]

جدول‌های داشبورد ادمین (سفارش‌ها، کاربران) با `min-w-[550px]` و `overflow-x-auto` هستند. اگرچه mobile card view اضافه شده (خوب!)، ولی بعضی جداول فقط نسخه دسکتاپ دارند.

**رفع:** بررسی تمام جداول و اطمینان از وجود mobile-friendly view.

---

### ۷.۲ — عدم وجود `aria-live` برای toast و notification

> [!NOTE]

پیام‌های toast (Sonner) احتمالاً aria-live را handle می‌کنند، ولی المان‌های loading state (مثل `<Loader2>`) و dynamic content هیچ `aria-live` یا `role="alert"` ندارند.

**رفع:** اطمینان از اینکه صفحه‌خوان‌ها تغییرات وضعیت را announce می‌کنند.

---

### ۷.۳ — عدم focus management در مودال‌ها و step transitions

> [!NOTE]
> **فایل:** [login/page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/login/page.tsx)

وقتی کاربر از مرحله phone به otp می‌رود، `autoFocus` روی InputOTP هست — اما اگر از keyboard navigation استفاده شود، focus trap مناسبی وجود ندارد.

---

## 🗄️ بخش ۸: مشکلات Database و Data Integrity

### ۸.۱ — عدم وجود Index مناسب

> [!WARNING]
> **فایل:** [schema.prisma](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/prisma/schema.prisma)

- `Order` فاقد index روی `userId`, `productId`, `planId`, `status` است.
- `InventoryItem` فاقد index روی `productId + planId + status` (که مهم‌ترین query pattern fulfillment است).
- `Plan` فاقد index روی `productId`.
- `Payment` فاقد composite index.

**رفع:** Index‌های زیر اضافه شوند:
```prisma
// Order
@@index([userId])
@@index([productId])
@@index([planId])
@@index([status])

// InventoryItem  
@@index([productId, planId, status])
@@index([type, status])

// Plan
@@index([productId])
```

---

### ۸.۲ — OTP Token‌ها هیچ‌وقت cleanup نمی‌شوند

> [!NOTE]
> **فایل:** [schema.prisma](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/prisma/schema.prisma#L38-L48)

OTP‌های استفاده‌شده و منقضی‌شده تا ابد در DB باقی می‌مانند.

**رفع:** یک cron job هفتگی اضافه شود: OTP‌های قدیمی‌تر از ۷ روز حذف شوند.

---

### ۸.۳ — عدم وجود `onDelete` مناسب در relations

> [!NOTE]

- `Order.productId` و `Order.planId` nullable هستند ولی `onDelete` تعریف نشده — اگر Product یا Plan حذف شود (با وجود soft delete)، reference شکسته نمی‌شود ولی data integrity ضعیف است.
- فقط `Delivery` `onDelete: Cascade` دارد.

**رفع:** `onDelete: SetNull` یا `Restrict` مناسب اضافه شود.

---

## 📋 بخش ۹: فهرست تسک‌ها به ترتیب اولویت

| # | اولویت | عنوان | بخش |
|---|--------|-------|------|
| 1 | 🔴 بحرانی | حذف JWT fallback secret | امنیت |
| 2 | 🔴 بحرانی | رفع باگ `normalizePhone` روی OTP code | باگ |
| 3 | 🔴 بحرانی | Rate limit تلاش‌های verify OTP | امنیت |
| 4 | 🔴 بحرانی | انتقال `@prisma/client` به dependencies | DevOps |
| 5 | 🔴 بحرانی | بررسی `.env` در Git history | امنیت |
| 6 | 🟠 مهم | Atomic stock reservation (TOCTOU fix) | معماری |
| 7 | 🟠 مهم | ماسک کردن password در GET orders | امنیت |
| 8 | 🟠 مهم | یکپارچه‌سازی برندینگ (آینوا/جمینای) | UI/UX |
| 9 | 🟠 مهم | حذف دوگانگی ActivationLink/InventoryItem | معماری |
| 10 | 🟠 مهم | حذف فیلدهای تکراری (name/title, active/status) | دیتابیس |
| 11 | 🟠 مهم | رفع اولویت‌بندی قیمت (nullish coalescing) | باگ |
| 12 | 🟠 مهم | اضافه کردن Database Index‌ها | عملکرد |
| 13 | 🟡 متوسط | Idempotency بهتر در payment callback | معماری |
| 14 | 🟡 متوسط | منقضی کردن سفارش‌های PENDING_PAYMENT | منطق |
| 15 | 🟡 متوسط | مکانیزم refund و notification ادمین | منطق |
| 16 | 🟡 متوسط | صفحه سفارش‌ها برای کاربر عادی | UI/UX |
| 17 | 🟡 متوسط | نمایش صحیح رنج قیمت در ویترین | UI/UX |
| 18 | 🟡 متوسط | حذف dependency‌ها و فایل‌های بلااستفاده | DevOps |
| 19 | 🟡 متوسط | Header مشترک در checkout | UI/UX |
| 20 | 🟡 متوسط | رفع direction bug در header | UI/UX |
| 21 | 🟢 کم | نمایش تصویر واقعی محصول | UI/UX |
| 22 | 🟢 کم | پشتیبانی Markdown در description | UI/UX |
| 23 | 🟢 کم | فیچرهای داینامیک per-product | UI/UX |
| 24 | 🟢 کم | OTP cleanup cron job | دیتابیس |
| 25 | 🟢 کم | Error boundary اضافه شود | DX |
| 26 | 🟢 کم | حذف `any` types | کیفیت کد |
| 27 | 🟢 کم | Cache layer برای stock/overview | عملکرد |
| 28 | 🟢 کم | PricingSection داینامیک شود | UI/UX |
| 29 | 🟢 کم | تغییر نام package.json | DevOps |
| 30 | 🟢 کم | سیستم تخفیف و کوپن | منطق |

---

> [!TIP]
> پیشنهاد: با ۵ مورد اول (قرمز) شروع کنید. اینها می‌توانند باعث مشکلات جدی امنیتی و runtime شوند. بعد به ترتیب لیست پایین بیایید.
