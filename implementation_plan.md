# ریدیزاین صفحه اختصاصی محصول — آریوچت

## تحلیل وضع موجود و مشکلات اصلی

صفحه فعلی محصول ([page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/products/%5Bslug%5D/page.tsx)) از ۳ بخش اصلی تشکیل شده:

| کامپوننت | فایل | مسئولیت |
|---|---|---|
| Product Page (Server) | [page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/products/%5Bslug%5D/page.tsx) | چیدمان کلی، breadcrumb، ویژگی‌ها، توضیحات |
| ProductDetailVisual | [product-detail-visual.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/components/product/product-detail-visual.tsx) | نمایش تصویر/فالبک محصول |
| ProductBuyCard | [product-buy-card.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/components/product/product-buy-card.tsx) | انتخاب پلن، قیمت، دکمه خرید |

---

## ❌ مشکلات طراحی فعلی (چرا "حس AI" دارد)

### ۱. Over-Decoration (تزئینات اضافه و بی‌هدف)

> [!CAUTION]
> بزرگ‌ترین مشکل صفحه فعلی. تقریباً هر المان یک لایه اضافی تزئینی دارد که در سایت‌های واقعی دیده نمی‌شود.

- **Ambient Aura Glow** روی تصویر محصول (`blur-2xl opacity-40`) — هیچ فروشگاه معتبری این کار را نمی‌کند
- **blurred background image** پشت تصویر اصلی — اضافه و سنگین
- **Gradient stripe** بالای BuyCard (`h-1.5 bg-gradient-to-r from-primary via-emerald-500`) — رنگ سبز از هیچ‌جای Design System نمی‌آید
- **dot pattern** در فالبک تصویر — کاملاً AI-style
- **Glowing 3D-styled Icon** با `blur-xl` برای فالبک — اغراق‌آمیز
- **hover:scale-[1.02]** روی تصویر محصول — بی‌مورد و distracting
- **shadow-xl shadow-primary/5** روی BuyCard — سایه رنگی غیرطبیعی

### ۲. Trust Badge Overload (اعتمادسازی افراطی)

> [!WARNING]
> یکی از بارزترین نشانه‌های طراحی AI، تکرار پیام‌های اعتماد در هر گوشه صفحه است.

در حال حاضر عبارات زیر **همزمان** در صفحه نمایش داده می‌شوند:
- Badge: «اشتراک ویژه» (بالای عنوان)
- Badge: «آماده تحویل آنی» (بالای عنوان)  
- Badge: «اشتراک رسمی و معتبر» (روی تصویر)
- Badge: «تحویل ۱۰۰٪ خودکار» (فالبک تصویر)
- Badge: «پشتیبانی شبانه‌روزی» (فالبک تصویر)
- Badge: «لینک فعال‌سازی آنی» (BuyCard)
- Row: «فعال‌سازی رسمی و قانونی» (BuyCard trust)
- Row: «۱۰۰٪ امن و با ضمانت بازگشت وجه» (BuyCard trust)
- Row: «پشتیبانی همه‌روزه و راهنمای گام‌به‌گام» (BuyCard trust)
- متن زیر دکمه: «پرداخت امن شتابی با درگاه شاپرک...» (BuyCard)
- لیست ۵ تایی ویژگی‌های محصول (بسیاری تکراری با بالا)

**≈ ۱۲ پیام اعتمادسازی** در یک صفحه! کاربر احساس می‌کند صفحه "التماس" فروش دارد.

### ۳. Information Architecture نامناسب

- **تصویر محصول** زیر عنوان و توضیحات قرار دارد (باید اولین چیزی باشد که دیده شود)
- **ترتیب ستون‌ها**: در لتراوت RTL، محتوای سمت راست (col-span-7) دیده می‌شود ولی BuyCard سمت چپ (col-span-5) — برعکس چیزی که کاربر انتظار دارد
- **توضیحات Markdown** و **ویژگی‌ها** هر دو در ستون اصلی هستند ولی بدون سلسله‌مراتب بصری واضح
- **قیمت** فقط در BuyCard نمایش داده می‌شود — اگر BuyCard هنوز در viewport نباشد، کاربر قیمت را نمی‌بیند

### ۴. Color Palette بی‌هویت

- استفاده از `emerald-500` و `amber-500` و `rose-500` به صورت تصادفی — هیچ‌کدام در Design System تعریف نشده
- رنگ‌های Google Brand (`--color-brand-blue`, `--color-brand-green`) تعریف شده ولی اصلاً استفاده نمی‌شود
- ترکیب `primary/10` + `emerald-500/15` + `primary/20` در گرادیان‌ها — ناهماهنگ

### ۵. Typography بدون سلسله‌مراتب

- عنوان: `text-2xl sm:text-4xl font-extrabold` — خوب ولی عنوان بخش‌ها هم `font-bold` هستند و تفاوت بصری کم است
- استفاده همزمان از `text-xs`, `text-[11px]`, `text-[10px]` — inconsistent
- `font-sans` روی قیمت‌ها اعمال شده ولی کل سایت Vazirmatn (فارسی) است — اعداد باید با Vazirmatn نمایش داده شوند چون `font-feature-settings: 'ss01'` فعال است

### ۶. Spacing & Density بی‌نظم

- `space-y-6 sm:space-y-8` در ستون اصلی
- `space-y-3 pt-2` در بخش ویژگی‌ها  
- `space-y-2 pb-2` در بخش پلن‌ها
- `space-y-6` در BuyCard
- عدم وجود ریتم عمودی یکنواخت (vertical rhythm)

### ۷. مشکلات موبایل

- BuyCard **sticky** نیست در موبایل — کاربر باید اسکرول کند تا دکمه خرید را ببیند
- تصویر محصول `min-h-[260px]` دارد — فضای زیادی از viewport را اشغال می‌کند
- لیست ویژگی‌ها `sm:grid-cols-2` — در موبایل همه single column هستند و صفحه را بسیار طولانی می‌کنند

---

## ✅ پیشنهاد ریدیزاین

### فلسفه کلی

> **"کمتر بگو، بهتر نشان بده"** — این یک فروشگاه اکانت دیجیتال است، نه صفحه فرود. کاربر از لندینگ‌پیج آمده و تصمیم نسبی‌اش را گرفته. صفحه محصول باید **سریع، شفاف و بی‌شلوغی** باشد.

### الهام‌گیری

| ویژگی | الگوی مرجع |
|---|---|
| چیدمان ۲ ستونه ساده | Apple Store Product Pages |
| نمایش تصویر minimal | Gumroad / Paddle product cards |
| BuyCard ثابت و شفاف | Digikala product sidebar |
| انتخاب پلن | Spotify / YouTube Premium plan selectors |

---

### ساختار جدید صفحه (Mobile-First)

```
┌──────────────────────────────────────────────────┐
│  Header (LandingHeader — بدون تغییر)              │
├──────────────────────────────────────────────────┤
│  Breadcrumb (ساده‌تر)                             │
├──────────────────────────────────────────────────┤
│  ┌─────────────────┬────────────────────────┐    │
│  │  Product Image   │  Product Title         │    │
│  │  (ساده، بدون glow│  Short Description     │    │
│  │   بدون blur bg)  │  Price (prominent)     │    │
│  │                  │  Status Badge (یکی)    │    │
│  │                  ├────────────────────────┤    │
│  │                  │  Plan Selector         │    │
│  │                  │  (اگر چند پلن باشد)     │    │
│  │                  ├────────────────────────┤    │
│  │                  │  [  ثبت سفارش  ]        │    │
│  │                  │  زیرمتن پرداخت          │    │
│  └─────────────────┴────────────────────────┘    │
│                                                    │
│  ── خط جدا‌کننده ──                                │
│                                                    │
│  توضیحات محصول (Markdown)                          │
│  (بدون کارت و بدون بوردر اضافی)                     │
│                                                    │
│  ── خط جدا‌کننده ──                                │
│                                                    │
│  ویژگی‌ها (ساده، ۲ ستونه)                           │
│                                                    │
│  ── خط جدا‌کننده ──                                │
│                                                    │
│  Trust Bar (یک خط، ۳ آیتم، بدون کارت)              │
│                                                    │
├──────────────────────────────────────────────────┤
│  Footer                                            │
├──────────────────────────────────────────────────┤
│  [Sticky Mobile CTA] (فقط موبایل)                  │
└──────────────────────────────────────────────────┘
```

---

### تغییرات پیشنهادی به تفکیک کامپوننت

---

### ۱. صفحه اصلی محصول
#### [MODIFY] [page.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/products/%5Bslug%5D/page.tsx)

**تغییرات اساسی:**

| مورد | وضع فعلی | پیشنهاد |
|---|---|---|
| Grid | `lg:grid-cols-12` (7+5) | `lg:grid-cols-2` ساده (تصویر + محتوا) |
| Image Position | زیر عنوان | **بالا، سمت راست** (ستون اول) |
| BuyCard Position | ستون جداگانه sticky | **ادغام در ستون محتوا** — قیمت و دکمه خرید مستقیم زیر عنوان |
| Badges | ۳ عدد بالای عنوان | **حداکثر ۱ عدد**: فقط وضعیت موجودی |
| ویژگی‌ها | Card با border برای هر ویژگی | لیست ساده با checkmark، بدون کارت |
| توضیحات | داخل card با border | متن ساده با heading، بدون container اضافی |
| Default Features | ۵ مورد hardcode | حذف کامل — اگر محصول feature ندارد، بخش نمایش داده نشود |
| Trust section | ۳ آیتم در BuyCard + ۵ ویژگی + badges | **یک Trust Bar ساده** در انتهای صفحه |

**Breadcrumb ساده‌تر:**
```tsx
// قبل:
<span>/</span>

// بعد: استفاده از chevron icon یا ›
<ChevronLeft className="size-3" />
```

**حذف import‌های بلااستفاده:**
`Sparkles`, `Zap`, `ArrowRight`, `Clock`, `HelpCircle` — هیچ‌کدام مستقیم استفاده نمی‌شوند

---

### ۲. کامپوننت ویژوال محصول
#### [MODIFY] [product-detail-visual.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/components/product/product-detail-visual.tsx)

**تغییرات اساسی:**

| مورد | وضع فعلی | پیشنهاد |
|---|---|---|
| Ambient Glow | `blur-2xl opacity-40` gradient | **حذف کامل** |
| Blurred BG image | `blur-2xl opacity-20` copy | **حذف کامل** |
| Card styling | `backdrop-blur-md shadow-xl` + hover effects | `rounded-2xl border bg-muted/20 overflow-hidden` ساده |
| Trust Badge overlay | روی تصویر | **حذف** |
| Hover scale | `group-hover:scale-[1.02]` | **حذف** |
| Fallback state | گلو + آیکون ۳D + dot pattern + trust pills | آیکون ساده `Package` + عنوان محصول |
| aspect ratio | `aspect-16/10 sm:aspect-16/9` | `aspect-video` یا `aspect-4/3` ساده |
| min-height | `min-h-[260px] sm:min-h-[340px] max-h-[440px]` | ارتفاع طبیعی بر اساس تصویر |

**نتیجه:** کامپوننت از ≈۱۱۵ خط به ≈۴۰ خط کاهش می‌یابد.

---

### ۳. کارت خرید (BuyCard)
#### [MODIFY] [product-buy-card.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/components/product/product-buy-card.tsx)

> [!IMPORTANT]
> بزرگ‌ترین تغییر ساختاری: **BuyCard باید از یک کارت sidebar، به یک بخش inline تبدیل شود.** در فروشگاه‌های اکانت دیجیتال (برخلاف فروشگاه‌های فیزیکی مثل دیجیکالا) محصول ساده است و نیاز به sidebar جداگانه ندارد.

**تغییرات اساسی:**

| مورد | وضع فعلی | پیشنهاد |
|---|---|---|
| Container | `Card` با border-primary و shadow | **بدون Card** — بخشی از flow صفحه |
| Gradient stripe | `h-1.5 bg-gradient-to-r` بالای کارت | **حذف** |
| Plan selector | Radio buttons با custom styling | طراحی ساده‌تر — دکمه‌های segment‌شده یا pill tabs |
| Price display | `text-3xl sm:text-4xl font-extrabold` | `text-2xl font-bold` — بزرگ ولی نه اغراق‌آمیز |
| Stats grid | ۲ آمار (وضعیت + سفارش‌های موفق) | فقط تعداد خرید (اگر > 0)، وضعیت را از badge بگیرد |
| Trust section | ۳ آیتم با آیکون رنگی | **حذف از BuyCard** — انتقال به Trust Bar انتهای صفحه |
| Lock text | زیر دکمه | ساده‌تر، بدون آیکون Lock |
| Button | `py-6 text-base shadow-lg shadow-primary/20` | `h-12 text-sm font-semibold` — هم‌اندازه با بقیه UI |

---

### ۴. Sticky Mobile CTA
#### [NEW] بخش جدید در page.tsx

در موبایل، وقتی کاربر اسکرول می‌کند، دکمه خرید از دید خارج می‌شود. یک **sticky bottom bar** ساده:

```
┌─────────────────────────────────────┐
│  ۳۹۰,۰۰۰ تومان    [ادامه خرید →]   │
└─────────────────────────────────────┘
```

- فقط در موبایل نمایش داده شود (`lg:hidden`)
- فقط وقتی دکمه اصلی خرید از viewport خارج شود (Intersection Observer)
- ارتفاع ثابت `h-16` با `backdrop-blur-sm`

---

### ۵. Loading State
#### [MODIFY] [loading.tsx](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/products/%5Bslug%5D/loading.tsx)

Skeleton فعلی با ساختار جدید match نمی‌کند. باید آپدیت شود تا شکل جدید صفحه را reflect کند.

---

## جزئیات Visual/CSS

### رنگ‌ها

| المان | فعلی | پیشنهاد |
|---|---|---|
| Status badge (موجود) | `text-emerald-600 bg-emerald-500/10` | `text-primary bg-primary/8` |
| Status badge (ناموجود) | `text-rose-500 border-rose-500/30` | `text-destructive/80 border-destructive/20` |
| Trust icons | emerald, primary, amber (سه رنگ متفاوت) | **همه muted-foreground** |
| BuyCard border | `border-primary/25` | `border-border` |
| Price | `text-foreground` | `text-foreground` (بدون تغییر) |
| Feature checkmarks | `text-primary` | `text-muted-foreground` |

### Typography Scale

| المان | فعلی | پیشنهاد |
|---|---|---|
| Product title | `text-2xl sm:text-4xl font-extrabold` | `text-xl sm:text-2xl lg:text-3xl font-bold` |
| Section headings | `text-base sm:text-lg font-bold` | `text-sm font-semibold text-muted-foreground uppercase tracking-wide` |
| Price | `text-3xl sm:text-4xl font-extrabold` | `text-2xl font-bold` |
| Body text | `text-sm sm:text-base` | `text-sm` ثابت |
| Micro text | `text-[11px]`, `text-[10px]` | `text-xs` (12px) برای همه |

### Spacing

| المان | فعلی | پیشنهاد |
|---|---|---|
| Page padding | `py-8 md:py-14` | `py-6 md:py-10` |
| Section gaps | `space-y-6 sm:space-y-8` | `space-y-8` ثابت |
| Grid gap | `gap-8 lg:gap-12` | `gap-8 lg:gap-10` |
| Inner cards | `p-6 sm:p-7` | `p-5` |

### Animations

| المان | فعلی | پیشنهاد |
|---|---|---|
| Image hover | `scale-[1.02]` + `shadow-2xl` | **هیچ** |
| BuyCard border hover | `hover:border-primary/40` | **هیچ** |
| Visual card transition | `transition-all duration-300` | **هیچ** — صفحه استاتیک باشد |
| Button | `shadow-lg shadow-primary/20 hover:shadow-primary/30` | `shadow-sm hover:shadow` |

---

## خلاصه تغییرات

### حذف‌شدنی‌ها ❌

1. Ambient Aura Glow (product-detail-visual)
2. Blurred background image copy
3. Gradient stripe بالای BuyCard
4. Dot pattern fallback
5. Trust Badge روی تصویر
6. Badge «اشتراک ویژه» (Sparkles)
7. آمار «وضعیت دسترسی» (تکراری با badge)
8. Trust section پایین BuyCard (انتقال به Trust Bar)
9. Default features hardcoded (حذف اگر محصول feature ندارد)
10. Hover scale effects
11. Shadow-primary (سایه رنگی)
12. Import‌های بلااستفاده

### اضافه‌شدنی‌ها ✅

1. Sticky Mobile CTA bar
2. Trust Bar ساده در انتهای صفحه (یک خط، ۳ آیتم)
3. Breadcrumb با chevron بجای `/`

### اصلاح‌شدنی‌ها 🔧

1. Grid layout: تصویر سمت راست، محتوا سمت چپ
2. BuyCard → inline section (نه sidebar)
3. Plan selector → pill/segment tabs
4. Typography scale هماهنگ
5. Color palette هماهنگ (فقط primary + muted)
6. Loading skeleton مطابق ساختار جدید

---

## Open Questions

> [!IMPORTANT]
> **۱. آیا BuyCard باید کاملاً inline شود یا در دسکتاپ sticky sidebar بماند؟**
> پیشنهاد من inline است (چون محصول اکانت دیجیتال ساده است و نیاز به sidebar ندارد)، ولی اگر در آینده محصولات پیچیده‌تری اضافه شوند، sidebar بهتر است.

> [!IMPORTANT]
> **۲. آیا بخش «ویژگی‌ها» اصلاً لازم است؟**
> در حال حاضر ۵ ویژگی پیش‌فرض hardcode شده‌اند. اگر قرار باشد ویژگی‌های واقعی از دیتابیس بیایند، نگه داشتنش خوب است. اگر همیشه همین ۵ تا هستند، بهتر است حذف شوند چون تکراری‌اند.

> [!IMPORTANT]
> **۳. آیا تصویر محصول از ادمین آپلود می‌شود یا اکثر محصولات بدون تصویر هستند؟**
> اگر اکثر محصولات تصویر ندارند، ممکن است بهتر باشد اصلاً بخش تصویر را در لتراوت نداشته باشیم و صفحه single-column باشد.

## Verification Plan

### Manual Verification
- بررسی صفحه محصول در مرورگر (دسکتاپ و موبایل) قبل و بعد از تغییرات
- مقایسه وزن بصری و تعداد المان‌های تزئینی
- تست sticky CTA در موبایل
- تست حالت بدون تصویر (fallback state)
- تست حالت تک‌پلن و چند‌پلن
- تست حالت ناموجود (stock = 0)
