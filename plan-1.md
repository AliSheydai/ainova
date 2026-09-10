می‌خواهم معماری فعلی فروشگاه را از حالت وابسته به Google Gemini خارج کنی و آن را به یک **Product-Based Store قابل توسعه** تبدیل کنی.

هدف این است که از طریق **Admin Panel** بتوانم هر محصولی را اضافه و مدیریت کنم و هر محصول نیز صفحه فروش اختصاصی خودش را داشته باشد.

قبل از هر تغییر، Architecture، Database، APIها، Admin Panel، User Dashboard، Telegram Bot و Flow فعلی Order/Payment/Activation را بررسی کن و تغییرات را با ساختار موجود هماهنگ کن.

---

# 1. Product باید Entity اصلی فروش باشد

سیستم نباید هیچ‌جا فرض کند که فقط یک محصول به نام Gemini وجود دارد.

یک Entity مستقل `Product` داشته باش.

حداقل اطلاعات:

```text
Product
- id
- title
- slug
- shortDescription
- description
- image
- price
- status
- stock
- purchaseCount
- sortOrder
- createdAt
- updatedAt
```

در صورت نیاز فیلدهای مناسب دیگری نیز اضافه کن.

### Status

حداقل:

```text
active
inactive
```

محصولات inactive نباید برای خرید عمومی قابل سفارش باشند.

---

# 2. محصولات از Admin Panel مدیریت شوند

در `/dashboard` بخش:

```text
محصولات
```

ایجاد/تکمیل کن.

ادمین بتواند:

* محصول جدید ایجاد کند.
* محصول را ویرایش کند.
* محصول را فعال/غیرفعال کند.
* تصویر محصول را مدیریت کند.
* قیمت را تغییر دهد.
* توضیحات را تغییر دهد.
* موجودی را مشاهده کند.
* تعداد فروش را مشاهده کند.
* ترتیب نمایش را تغییر دهد.
* محصول را حذف یا Archive کند.

برای حذف، اگر محصول سابقه Order دارد، از حذف مخرب Database خودداری کن و از Soft Delete/Archive مناسب استفاده کن.

---

# 3. صفحه اختصاصی هر محصول

هر محصول باید URL اختصاصی داشته باشد.

مثلاً:

```text
/products/gemini-ai-pro-18-months
/products/product-2
/products/product-3
```

از `slug` برای URL استفاده کن.

صفحه Product باید اطلاعات واقعی همان Product را از Backend دریافت کند و هیچ اطلاعات Product در Frontend Hard-code نشود.

---

# 4. طراحی صفحه محصول

صفحه اختصاصی محصول باید حرفه‌ای و مناسب فروش باشد.

حداقل شامل:

```text
تصویر محصول

عنوان محصول

توضیح کوتاه

قیمت

تعداد خرید / تعداد فروش

وضعیت موجودی

دکمه خرید

توضیحات کامل محصول

ویژگی‌ها / اطلاعات تکمیلی در صورت وجود
```

مثلاً:

```text
Google AI Pro
18 ماهه

124 خرید

2,490,000 تومان

[ خرید محصول ]
```

طراحی باید RTL، فارسی، Responsive و هماهنگ با Theme فعلی سایت باشد.

---

# 5. Landing Page

Landing Page دیگر نباید فقط برای Gemini طراحی شده باشد.

محصولات فعال باید به صورت Dynamic نمایش داده شوند.

مثلاً:

```text
محصولات ما

[ Product 1 ]
[ Product 2 ]
[ Product 3 ]
...
```

هر Card باید به صفحه اختصاصی همان Product لینک شود.

اگر فقط یک محصول وجود دارد، ظاهر فعلی سایت همچنان باید حرفه‌ای باشد و تجربه فعلی Gemini حفظ شود.

---

# 6. Product و Order را از هم جدا نگه دار

Order باید به Product اشاره کند.

ساختار مفهومی:

```text
Product
   ↓
Order
   ↓
Payment
   ↓
Fulfillment
```

Order باید حداقل اطلاعات لازم Product در زمان خرید را به صورت امن حفظ کند.

به‌خصوص قیمت:

**قیمت Order نباید بعداً با تغییر قیمت Product تغییر کند.**

هنگام ایجاد Order، قیمت همان لحظه به عنوان Order Amount / Snapshot ذخیره شود.

مثلاً:

```text
Product.price = 2,490,000

Order.amount = 2,490,000
```

اگر ادمین بعداً قیمت Product را تغییر داد، Order قبلی نباید تغییر کند.

---

# 7. وابستگی به Gemini را حذف کن

تمام مواردی که در Code فرض کرده‌اند:

```text
Google AI Pro
Gemini
18 months
Gemini activation link
```

را پیدا و بررسی کن.

اطلاعات ثابت مربوط به Gemini را تا حد امکان به Database/Product Configuration منتقل کن.

Gemini فقط باید **یکی از Productهای سیستم** باشد، نه اینکه در Architecture نقش Product اصلی/ثابت داشته باشد.

محصول فعلی Google AI Pro 18 Months را حفظ کن و به عنوان اولین Product واقعی سیستم Seed/Migration کن.

---

# 8. Fulfillment را Generic طراحی کن

این بخش بسیار مهم است.

نباید سیستم به این شکل باشد:

```text
Payment Success
→ Gemini Link
```

بلکه:

```text
Payment Success
→ Fulfillment
→ Delivery
```

چون محصولات آینده ممکن است روش تحویل متفاوت داشته باشند.

مثلاً:

```text
Product A → Activation Link
Product B → Activation Code
Product C → Download Link
Product D → Manual Delivery
```

فعلاً برای Gemini همان Activation Link فعلی را استفاده کن.

اما Architecture باید قابل توسعه باشد.

مثلاً می‌توانی مفهوم زیر را داشته باشی:

```text
FulfillmentType
- activation_link
- activation_code
- download
- manual
```

یا abstraction مناسب‌تر بر اساس Architecture فعلی پروژه.

**در این مرحله لازم نیست تمام روش‌های تحویل را پیاده‌سازی کنی؛ فقط Architecture را برای آن‌ها باز بگذار و روش فعلی Activation Link را سالم نگه دار.**

---

# 9. Activation Links به Product مرتبط باشند

Activation Link نباید صرفاً یک Pool عمومی باشد.

اگر یک Product نیاز به Activation Link دارد، لینک‌ها باید قابل ارتباط با Product باشند.

مثلاً:

```text
ActivationLink
- id
- productId
- url
- status
- orderId
- assignedAt
- usedAt
- createdAt
```

در نتیجه:

```text
Gemini Product
    ↓
Gemini Activation Links
```

و بعداً:

```text
Product B
    ↓
Product B Activation Links
```

یک لینک متعلق به یک Product نباید به Product دیگری اختصاص داده شود.

---

# 10. Flow خرید فعلی حفظ شود

Flow فعلی باید همچنان کار کند:

```text
User
 ↓
Product Page
 ↓
Buy
 ↓
Create Order
 ↓
Mock Payment
 ↓
Payment Success
 ↓
Find available delivery
 ↓
Assign Activation Link
 ↓
Order Completed
 ↓
Show Link
```

فعلاً Mock Payment همچنان فعال باشد.

درگاه واقعی بعداً به Payment Provider متصل خواهد شد.

**این تغییر نباید Mock Payment یا سیستم فعلی تحویل فوری را خراب کند.**

---

# 11. Orderهای قبلی

اگر Database فعلی دارای Orderهای Gemini است، Migration را طوری طراحی کن که Orderهای قبلی از بین نروند.

آن‌ها باید به Product مربوط به:

```text
Google AI Pro 18 Months
```

متصل شوند.

اگر لازم است Product اولیه قبل از Migration ایجاد شود، این کار را با Migration/Seed امن انجام بده.

---

# 12. User Dashboard

در User Dashboard که اکنون به صورت Modal روی Landing Page ارائه می‌شود، وابستگی به Gemini را حذف کن.

بخش‌هایی مثل:

```text
سفارش‌های من
```

باید برای تمام محصولات کار کند.

مثلاً:

```text
Google AI Pro — 18 Months
Status: Completed
Activation Link: ...
```

در آینده:

```text
Product B
Status: Completed
Delivery: ...
```

هر User فقط Orderهای خودش را ببیند.

---

# 13. Telegram Bot

Telegram Bot نیز باید Product-Based شود.

منوی فعلی:

```text
🛒 خرید
📦 سفارش‌های من
📖 راهنمای فعال‌سازی
🎧 پشتیبانی
```

نباید فقط Gemini را فرض کند.

در بخش خرید:

```text
🛒 خرید
   ↓
لیست محصولات فعال
   ↓
انتخاب Product
   ↓
نمایش اطلاعات Product
   ↓
قیمت
   ↓
ثبت سفارش
   ↓
Payment
   ↓
Fulfillment
```

Orderهای خریداری‌شده از سایت و Bot باید از یک Database و همان Order/Payment/Fulfillment System استفاده کنند.

نباید برای Telegram یک سیستم فروش جدا ساخته شود.

---

# 14. Bot Product Information

وقتی User محصولی را در Telegram انتخاب می‌کند، اطلاعات همان Product نمایش داده شود:

```text
عنوان
قیمت
توضیح کوتاه
وضعیت موجودی
تعداد خرید در صورت نیاز
```

و خرید از همان Product انجام شود.

---

# 15. Admin Dashboard Overview

Dashboard ادمین را نیز از Gemini-specific بودن خارج کن.

آمارها باید Generic باشند:

```text
تعداد محصولات
محصولات فعال
تعداد کاربران
تعداد سفارش‌ها
فروش موفق
درآمد
پرداخت‌های Pending
```

و در صورت نیاز:

```text
پرفروش‌ترین محصولات
آخرین سفارش‌ها
آخرین کاربران
```

---

# 16. Product Stock

موجودی باید با منطق واقعی Fulfillment هماهنگ باشد.

برای Productهایی که Activation Link دارند:

```text
Available Links = Stock
```

یا محاسبه مناسب بر اساس Delivery Inventory.

نباید Admin یک Stock دستی ببیند که با لینک‌های واقعی اختلاف دارد.

اگر لازم است Stock را از Inventory محاسبه کن.

---

# 17. Purchase Count

`purchaseCount` باید بر اساس Orderهای موفق/تکمیل‌شده مدیریت شود.

Payment ناموفق یا Order لغوشده نباید به عنوان خرید موفق شمرده شود.

اگر معماری بهتر این است که این مقدار Dynamic محاسبه شود، از ذخیره مقدار redundant خودداری کن.

اولویت با Data Consistency است.

---

# 18. امنیت

تمام موارد زیر باید Server-Side کنترل شوند:

* Product فعال است یا نه.
* قیمت Product.
* ایجاد Order.
* Amount سفارش.
* Payment Status.
* تخصیص Delivery.
* Activation Link.
* دسترسی User به Order.

Frontend نباید بتواند قیمت را تعیین کند یا Product دیگری را به Order نسبت دهد.

---

# 19. SEO و URL

برای Product Pageها:

```text
/products/[slug]
```

ساختار مناسب Metadata ایجاد کن:

* title
* description
* Open Graph image
* canonical در صورت نیاز

به شکلی که هر Product بتواند SEO مستقل داشته باشد.

---

# 20. Migration / Seed

Product فعلی Gemini را به عنوان Product واقعی وارد Database کن.

اطلاعات فعلی آن را حفظ کن:

```text
Google AI Pro
18 Months
```

و Activation Linkهای Fake فعلی نیز به همین Product متصل شوند.

Seed باید Idempotent باشد.

---

# 21. تست‌های مهم

بعد از توسعه این موارد را تست کن:

### Product

```text
Admin creates Product
→ Product appears on Landing
→ Product has dedicated page
```

### Purchase

```text
User opens Product A
→ Buy
→ Order references Product A
→ Mock Payment Success
→ Correct Delivery assigned
```

### Multiple Products

```text
Product A → Link A
Product B → Link B
```

نباید لینک Product A برای Product B تخصیص داده شود.

### Price

```text
Product price changes
→ Old Orders remain unchanged
→ New Orders use new price
```

### User

```text
User A
→ sees own orders

User B
→ cannot see User A orders
```

### Telegram

```text
Site Product
↕
Telegram Product

Same Product
Same Order System
Same Payment System
Same Fulfillment System
```

---

# 22. اصل معماری

این اصل را در تمام پیاده‌سازی رعایت کن:

```text
Product
   ↓
Order
   ↓
Payment
   ↓
Fulfillment
   ↓
Delivery
```

و نه:

```text
Gemini
   ↓
Gemini Order
   ↓
Gemini Payment
   ↓
Gemini Link
```

هدف این است که سیستم در آینده بتواند بدون بازنویسی Core Logic محصولات مختلف بفروشد.

---

## خروجی مورد انتظار

در پایان:

1. Product Entity و Migrationهای لازم را ایجاد/تکمیل کن.
2. Admin Product Management را پیاده‌سازی کن.
3. Product Listing را Dynamic کن.
4. صفحه اختصاصی `/products/[slug]` را ایجاد کن.
5. Product فعلی Gemini را به سیستم منتقل کن.
6. Activation Links فعلی را به Product مربوط متصل کن.
7. Order/Payment/Fulfillment فعلی را با Product Architecture هماهنگ کن.
8. User Dashboard را Generic کن.
9. Telegram Bot را با Product System هماهنگ کن.
10. Mock Payment فعلی را حفظ کن.
11. هیچ قابلیت فعلی خرید Gemini را خراب نکن.
12. تست‌های End-to-End مربوط به چند محصول را انجام بده.
13. در پایان دقیقاً گزارش بده چه فایل‌ها، APIها، Modelها، Migrationها و Componentهایی تغییر کرده‌اند.

**نکته مهم:** قبل از کدنویسی، Codebase را بررسی کن و اگر بخشی از Architecture فعلی با این مدل تضاد دارد، ابتدا بهترین راه Migration/Refactor را انتخاب کن. از ایجاد سیستم موازی یا Duplicate Logic برای Product، Order، Payment یا Fulfillment خودداری کن.
