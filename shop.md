# رفع باگ تحویل اشتباه آیتم انبار و حفظ موجودی در خرید ناموفق

## خلاصه مشکل

دو باگ اساسی در سیستم انبار و تحویل آیتم شناسایی شد:

1. **تحویل آیتم اشتباه**: وقتی ادمین یک لینک/اکانت را به یک محصول خاص (مثلاً ChatGPT Pro) اساین می‌کند، ممکن است لینک مربوط به محصول دیگری به کاربر تحویل داده شود.
2. **حذف آیتم از انبار در خرید ناموفق**: وقتی خرید ناموفق است، انتظار داریم آیتم رزرو شده به انبار بازگردد.

---

## تحلیل ریشه‌ای مشکلات

### 🔴 باگ ۱: تحویل آیتم اشتباه از انبار (بحرانی)

**محل مشکل**: [activation-link.handler.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/activation-link.handler.ts#L69-L100) و [pre-created-account.handler.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/pre-created-account.handler.ts#L112-L143)

**ریشه مشکل**: کوئری SQL رزرو اولیه در [orders/route.ts خطوط 354-364](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L354-L364) هنگام ساخت سفارش **`variantId` را فیلتر نمی‌کند**:

```sql
SELECT id FROM inventory_items
WHERE type = ${invType}::"InventoryType"
  AND (
    ("planId" = ${targetPlanId} AND "planId" IS NOT NULL) OR
    ("productId" = ${targetProductId} AND ("planId" IS NULL OR "planId" = ${targetPlanId}))
  )
  AND status = 'AVAILABLE'::"LinkStatus"
LIMIT 1
FOR UPDATE SKIP LOCKED
```

> [!CAUTION]
> **مشکل اصلی**: این کوئری `variantId` را اصلاً در نظر نمی‌گیرد! اگر محصول ChatGPT دو نوع Pro و Plus داشته باشد و هر کدام لینک‌های مختلفی در انبار داشته باشند، کوئری فقط بر اساس `productId` و `planId` فیلتر می‌کند و ممکن است لینک مربوط به Plus را برای خریدار Pro رزرو کند.

**بیشتر از آن**: حتی در handler‌های fulfillment (که موقع تایید پرداخت اجرا می‌شوند)، اگر آیتم قبلاً رزرو شده باشد، فقط بر اساس `orderId` جستجو می‌شود (خطوط [43-49](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/activation-link.handler.ts#L43-L49)) و آیتم اشتباهی که در مرحله رزرو انتخاب شده بود، به کاربر تحویل داده می‌شود.

### 🟡 باگ ۲: وضعیت بازگشت آیتم در خرید ناموفق

وضعیت فعلی **بازگشت آیتم** در سناریوهای ناموفق بررسی شد:

| سناریو | وضعیت فعلی | ارزیابی |
|--------|------------|---------|
| خطای ایجاد درگاه پرداخت | ✅ آیتم آزاد می‌شود | [خط 500-509](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts#L500-L509) |
| انصراف کاربر از پرداخت (isFailed) | ✅ آیتم آزاد می‌شود | [خط 169-172](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/payment/callback/route.ts#L169-L172) |
| خطای تایید پرداخت (verificationFailed) | ✅ آیتم آزاد می‌شود | [خط 245-248](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/payment/callback/route.ts#L245-L248) |
| مغایرت مبلغ (amountMismatch) | ✅ آیتم آزاد می‌شود | [خط 277-280](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/payment/callback/route.ts#L277-L280) |
| انقضای سفارش (timeout 30 دقیقه) | ✅ آیتم آزاد می‌شود | [order-expiration.ts خط 46-56](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/orders/order-expiration.ts#L46-L56) |

> [!NOTE]
> بخش بازگشت آیتم در خرید ناموفق در حال حاضر **به درستی** پیاده‌سازی شده و در تمام سناریوهای شکست، آیتم RESERVED به AVAILABLE بازمی‌گردد.

---

## تغییرات پیشنهادی

### بخش ۱: فیلتر `variantId` در رزرو اولیه سفارش

#### [MODIFY] [route.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts)

کوئری رزرو موجودی (خطوط 354-364) باید `variantId` را نیز فیلتر کند. فیلتر جدید:

```sql
SELECT id FROM inventory_items
WHERE type = ${invType}::"InventoryType"
  AND status = 'AVAILABLE'::"LinkStatus"
  AND (
    ${effectiveVariantId}::text IS NOT NULL AND "variantId" = ${effectiveVariantId}
    OR
    ${effectiveVariantId}::text IS NULL AND "variantId" IS NULL
    OR
    "variantId" IS NULL AND "productId" = ${targetProductId}
  )
  AND (
    "planId" = ${targetPlanId} OR "planId" IS NULL
  )
  AND (
    "productId" = ${targetProductId}
  )
ORDER BY
  (CASE
    WHEN "variantId" = ${effectiveVariantId} AND "planId" = ${targetPlanId} THEN 100
    WHEN "variantId" = ${effectiveVariantId} AND "planId" IS NULL THEN 80
    WHEN "variantId" IS NULL AND "planId" = ${targetPlanId} THEN 50
    WHEN "variantId" IS NULL AND "planId" IS NULL THEN 30
    ELSE 10
  END) DESC,
  "createdAt" ASC
LIMIT 1
FOR UPDATE SKIP LOCKED
```

**تغییرات کلیدی**:
- اضافه کردن `effectiveVariantId` از `variant?.id || plan?.variantId || null`
- فیلتر دقیق بر اساس variantId: ابتدا آیتم‌های مختص variant، سپس fallback به آیتم‌های بدون variant
- ترتیب‌بندی اولویت‌دار: آیتم‌های خاص variant+plan اول، سپس variant بدون plan، و در نهایت آیتم‌های عمومی

---

### بخش ۲: هماهنگی handler‌ها با کوئری رزرو

handler‌های fulfillment (activation-link و pre-created-account) در حال حاضر از همین کوئری اولویت‌دار استفاده می‌کنند (fallback). کوئری fallback آن‌ها را نیز بررسی خواهم کرد تا مطمئن شویم هماهنگ هستند - **ولی** در واقع handler‌ها ابتدا آیتم RESERVED را چک می‌کنند و فقط در صورت نبود رزرو، سراغ fallback می‌روند. پس مشکل اصلی در مرحله رزرو اولیه (orders/route.ts) است.

---

### بخش ۳: اضافه کردن Safety Check در fulfillment (دفاع در عمق)

#### [MODIFY] [activation-link.handler.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/activation-link.handler.ts)

یک بررسی اضافی هنگام استفاده از آیتم RESERVED اضافه می‌شود: اطمینان از اینکه آیتم رزرو شده واقعاً به variant و product صحیح تعلق دارد (defense-in-depth):

```typescript
// Safety Check: Verify reserved item belongs to the correct product/variant
if (reservedInventory) {
  const matchesProduct = !productId || reservedInventory.productId === productId
  const matchesVariant = !variantId || reservedInventory.variantId === variantId || !reservedInventory.variantId
  
  if (!matchesProduct || !matchesVariant) {
    // Release mismatched reserved item and fall through to dynamic allocation
    await tx.inventoryItem.update({
      where: { id: reservedInventory.id },
      data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
    })
    reservedInventory = null  // Force fallback to correct allocation
  }
}
```

#### [MODIFY] [pre-created-account.handler.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/pre-created-account.handler.ts)

همین Safety Check برای handler اکانت آماده نیز اعمال می‌شود.

---

## خلاصه فایل‌ها

| فایل | نوع تغییر | توضیح |
|------|-----------|-------|
| [route.ts (orders)](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/app/api/orders/route.ts) | MODIFY | اضافه کردن فیلتر `variantId` به کوئری رزرو موجودی |
| [activation-link.handler.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/activation-link.handler.ts) | MODIFY | Safety check بر اساس product/variant در آیتم رزرو شده |
| [pre-created-account.handler.ts](file:///c:/Users/AFRAA/Desktop/ali/Projects/sell-google-acc/src/lib/fulfillment/handlers/pre-created-account.handler.ts) | MODIFY | Safety check بر اساس product/variant در آیتم رزرو شده |

---

## طرح تایید (Verification Plan)

### تست‌های خودکار
```bash
pnpm vitest run src/lib/orders/phase-7-validation.test.ts
pnpm vitest run src/lib/orders/phase-6.test.ts
```

### تایید دستی
1. ایجاد دو محصول با variant‌های مختلف (مثلاً ChatGPT Pro و ChatGPT Plus)
2. اضافه کردن لینک‌های متفاوت به انبار هر variant
3. خرید یکی از variant‌ها و بررسی اینکه لینک صحیح تحویل داده شود
4. شبیه‌سازی خرید ناموفق و بررسی بازگشت آیتم به انبار
5. بررسی TypeScript build: `pnpm tsc --noEmit`
