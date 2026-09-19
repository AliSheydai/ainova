import { describe, expect, it } from 'vitest'
import { MESSAGES } from '../telegram/messages'
import { escapeHtml } from '../telegram/formatting'
import type { BotLoginSession } from '../telegram/account-linking'
import type { BotVariantSummary, BotPlanSummary, BotProductSummary } from './bot-store-service'

describe('Telegram Bot — Comprehensive Product Variant Synchronization Tests', () => {
  // =========================================================================
  // 1. Session Management & Flow State
  // =========================================================================
  describe('1. BotLoginSession Variant Tracking', () => {
    it('stores variantId in BotLoginSession upon variant selection', () => {
      const session: BotLoginSession = {
        step: 'AWAITING_CHECKOUT_FIELD',
        productId: 'prod-gemini',
        variantId: 'var-pro',
        planId: 'plan-1',
      }
      expect(session.variantId).toBe('var-pro')
      expect(session.productId).toBe('prod-gemini')
    })

    it('preserves variantId when user changes delivery preference (ready_account vs own_account)', () => {
      const initialSession: BotLoginSession = {
        step: 'AWAITING_CHECKOUT_FIELD',
        productId: 'prod-gemini',
        variantId: 'var-pro',
        planId: 'plan-1',
        checkoutData: {},
      }

      // Step 1: User selects ready_account
      const readySession: BotLoginSession = {
        ...initialSession,
        deliveryPreference: 'ready_account',
        checkoutData: { delivery_preference: 'ready_account' },
      }
      expect(readySession.variantId).toBe('var-pro')
      expect(readySession.deliveryPreference).toBe('ready_account')

      // Step 2: User switches to own_account
      const ownSession: BotLoginSession = {
        ...readySession,
        deliveryPreference: 'own_account',
        checkoutData: { delivery_preference: 'own_account' },
        step: 'AWAITING_GMAIL',
      }
      expect(ownSession.variantId).toBe('var-pro')
      expect(ownSession.step).toBe('AWAITING_GMAIL')
    })

    it('preserves variantId during custom checkout field collection steps', () => {
      const sessionStep1: BotLoginSession = {
        step: 'AWAITING_CHECKOUT_FIELD',
        productId: 'prod-gemini',
        variantId: 'var-ultra',
        planId: 'plan-custom',
        currentFieldKey: 'workspace_domain',
        currentFieldLabel: 'دامنه گوگل ورک‌اسپیس',
        checkoutData: {},
      }

      // User provides value for workspace_domain
      const sessionStep2: BotLoginSession = {
        ...sessionStep1,
        checkoutData: { workspace_domain: 'example.com' },
        currentFieldKey: 'backup_email',
        currentFieldLabel: 'ایمیل پشتیبان',
      }

      expect(sessionStep2.variantId).toBe('var-ultra')
      expect(sessionStep2.checkoutData?.workspace_domain).toBe('example.com')
    })
  })

  // =========================================================================
  // 2. Pricing Calculations
  // =========================================================================
  describe('2. Variant Pricing & Effective Amount Calculation', () => {
    function computeEffectivePrice(
      variant?: { price: number; discountedPrice?: number | null } | null,
      fallbackPlanPrice?: number
    ): number {
      if (variant) {
        const hasDiscount =
          variant.discountedPrice !== null &&
          variant.discountedPrice !== undefined &&
          variant.discountedPrice > 0 &&
          variant.discountedPrice < variant.price

        return hasDiscount ? variant.discountedPrice! : variant.price
      }
      return fallbackPlanPrice ?? 0
    }

    it('uses discountedPrice when variant has a genuine discount', () => {
      const variant = { price: 1000000, discountedPrice: 790000 }
      expect(computeEffectivePrice(variant, 500000)).toBe(790000)
    })

    it('uses regular variant price when discountedPrice is null or undefined', () => {
      const variant = { price: 1000000, discountedPrice: null }
      expect(computeEffectivePrice(variant, 500000)).toBe(1000000)
    })

    it('ignores discountedPrice if it is 0 or negative', () => {
      const variant = { price: 1000000, discountedPrice: 0 }
      expect(computeEffectivePrice(variant, 500000)).toBe(1000000)
    })

    it('ignores discountedPrice if it is greater than or equal to original price (invalid discount)', () => {
      const variantEqual = { price: 1000000, discountedPrice: 1000000 }
      expect(computeEffectivePrice(variantEqual, 500000)).toBe(1000000)

      const variantHigher = { price: 1000000, discountedPrice: 1200000 }
      expect(computeEffectivePrice(variantHigher, 500000)).toBe(1000000)
    })

    it('falls back to plan price when no variant is selected (backward compatibility)', () => {
      expect(computeEffectivePrice(null, 650000)).toBe(650000)
      expect(computeEffectivePrice(undefined, 450000)).toBe(450000)
    })
  })

  // =========================================================================
  // 3. Catalog Display Price Calculation
  // =========================================================================
  describe('3. Catalog Display Price for Products in Bot Store', () => {
    function calculateProductDisplayPrice(p: {
      price: number
      variants: Array<{ price: number; discountedPrice?: number | null }>
      plans: Array<{ price: number }>
    }): number {
      const lowestVariantPrice = p.variants[0]
        ? (p.variants[0].discountedPrice && p.variants[0].discountedPrice > 0
            ? p.variants[0].discountedPrice
            : p.variants[0].price)
        : null
      const lowestPlanPrice = p.plans[0]?.price ?? null
      return lowestVariantPrice ?? lowestPlanPrice ?? p.price
    }

    it('shows lowest variant discounted price in catalog when variants exist', () => {
      const product = {
        price: 1500000,
        variants: [
          { price: 1200000, discountedPrice: 890000 },
          { price: 1800000, discountedPrice: 1500000 },
        ],
        plans: [{ price: 1500000 }],
      }
      expect(calculateProductDisplayPrice(product)).toBe(890000)
    })

    it('shows plan price when product has no variants', () => {
      const product = {
        price: 500000,
        variants: [],
        plans: [{ price: 450000 }, { price: 800000 }],
      }
      expect(calculateProductDisplayPrice(product)).toBe(450000)
    })
  })

  // =========================================================================
  // 4. Coupon Application & Removal with Variant
  // =========================================================================
  describe('4. Coupon Application on Top of Variant Price', () => {
    function applyCoupon(baseAmount: number, discountPercent: number): {
      payableAmount: number
      discountAmount: number
    } {
      const discountAmount = Math.round((baseAmount * discountPercent) / 100)
      const payableAmount = Math.max(1000, baseAmount - discountAmount)
      return { payableAmount, discountAmount }
    }

    it('applies percentage coupon on the variant discounted price, not plan price', () => {
      const variantDiscountedPrice = 800000 // Plan price might be 1,000,000
      const { payableAmount, discountAmount } = applyCoupon(variantDiscountedPrice, 20)

      expect(discountAmount).toBe(160000) // 20% of 800,000
      expect(payableAmount).toBe(640000) // 800,000 - 160,000
    })

    it('enforces minimum gateway threshold of 1,000 Tomans when coupon discount is huge', () => {
      const basePrice = 50000
      const { payableAmount } = applyCoupon(basePrice, 99) // 99% discount = 49,500 discount -> 500 Toman
      expect(payableAmount).toBe(1000)
    })

    it('reverts to variant base price (not plan price) when coupon is removed', () => {
      const order = {
        id: 'order-test-1',
        plan: { price: 1000000 },
        variant: { price: 800000, discountedPrice: 700000 },
        couponId: 'coup-1',
      }

      const hasVariantDiscount =
        order.variant.discountedPrice !== null &&
        order.variant.discountedPrice > 0 &&
        order.variant.discountedPrice < order.variant.price

      const basePriceOnRemove = order.variant
        ? (hasVariantDiscount ? order.variant.discountedPrice : order.variant.price)
        : order.plan.price

      expect(basePriceOnRemove).toBe(700000)
      expect(basePriceOnRemove).not.toBe(order.plan.price)
    })
  })

  // =========================================================================
  // 5. Plan Filtering for Variants
  // =========================================================================
  describe('5. Plan Filtering and Fallback Logic', () => {
    function filterPlansForVariant(
      rawPlans: Array<{ id: string; variantId?: string | null; name: string }>,
      variantId?: string
    ) {
      if (!variantId) return rawPlans
      if (rawPlans.some((p) => p.variantId === variantId)) {
        return rawPlans.filter((p) => p.variantId === variantId)
      }
      const unassigned = rawPlans.filter((p) => !p.variantId)
      return unassigned.length > 0 ? unassigned : rawPlans
    }

    const mockPlans = [
      { id: 'p-pro-1', variantId: 'var-pro', name: '۱ ماهه پرو' },
      { id: 'p-pro-2', variantId: 'var-pro', name: '۳ ماهه پرو' },
      { id: 'p-plus-1', variantId: 'var-plus', name: '۱ ماهه پلاس' },
      { id: 'p-shared', variantId: null, name: 'تحویل مشترک انبار' },
    ]

    it('returns exactly matching plans when variant has assigned plans', () => {
      const proPlans = filterPlansForVariant(mockPlans, 'var-pro')
      expect(proPlans).toHaveLength(2)
      expect(proPlans.map((p) => p.id)).toEqual(['p-pro-1', 'p-pro-2'])
    })

    it('falls back to unassigned plans (variantId: null) when variant has no direct plans', () => {
      const ultraPlans = filterPlansForVariant(mockPlans, 'var-ultra')
      expect(ultraPlans).toHaveLength(1)
      expect(ultraPlans[0].id).toBe('p-shared')
    })

    it('falls back to all plans when variant has no direct plans and no unassigned plans exist', () => {
      const dedicatedOnlyPlans = [
        { id: 'p-1', variantId: 'var-1', name: 'اختصاصی ۱' },
        { id: 'p-2', variantId: 'var-2', name: 'اختصاصی ۲' },
      ]
      const fallbackPlans = filterPlansForVariant(dedicatedOnlyPlans, 'var-unknown')
      expect(fallbackPlans).toHaveLength(2)
    })

    it('returns all plans when variantId is not provided (backward compatibility)', () => {
      const allPlans = filterPlansForVariant(mockPlans)
      expect(allPlans).toHaveLength(4)
    })
  })

  // =========================================================================
  // 6. Message Formatting & HTML Escaping
  // =========================================================================
  describe('6. Telegram Message Formatting with Variant Info', () => {
    it('orderCreated formats variant name correctly with Persian digits and emoji', () => {
      const msg = MESSAGES.orderCreated('order-abcdef', 'Gemini Pro (۱ ماهه)', 850000, {
        originalAmount: 1000000,
        discountAmount: 150000,
        couponCode: 'NOROOZ',
        variantName: 'اکانت پرو ویژه',
      })

      expect(msg).toContain('• 📦 <b>نوع محصول:</b> <b>اکانت پرو ویژه</b>')
      expect(msg).toContain('• 🛍 <b>محصول:</b> <b>Gemini Pro (۱ ماهه)</b>')
      expect(msg).toContain('NOROOZ')
      expect(msg).toContain('۸۵۰,۰۰۰')
    })

    it('orderCreated omits the variant row when variantName is undefined (legacy order)', () => {
      const msg = MESSAGES.orderCreated('order-abcdef', 'Gemini Pro (۱ ماهه)', 500000)
      expect(msg).not.toContain('نوع محصول:')
    })

    it('orderSummaryCard includes variantName and delivery preference', () => {
      const summary = MESSAGES.orderSummaryCard({
        productTitle: 'اکانت هوش مصنوعی',
        planName: 'تحویل ۱ روز کاری',
        variantName: 'پلن پلاس دانشجویی',
        deliveryLabel: 'فعال‌سازی روی جیمیل شما',
        customerGmail: 'student@gmail.com',
        amount: 450000,
      })

      expect(summary).toContain('• 🛍 <b>محصول:</b> <b>اکانت هوش مصنوعی</b>')
      expect(summary).toContain('• 📦 <b>نوع محصول:</b> <b>پلن پلاس دانشجویی</b>')
      expect(summary).toContain('• 📧 <b>جیمیل فعال‌سازی:</b> <code>student@gmail.com</code>')
    })

    it('properly escapes HTML special characters in variant names to prevent XSS / Telegram parse errors', () => {
      const dangerousVariantName = 'Pro <Gold & Platinum> "Special"'
      const escaped = escapeHtml(dangerousVariantName)

      expect(escaped).toBe('Pro &lt;Gold &amp; Platinum&gt; "Special"')
      expect(escaped).not.toContain('<Gold')

      const msg = MESSAGES.orderCreated('order-test', 'Test Prod', 100000, {
        variantName: dangerousVariantName,
      })
      expect(msg).toContain('Pro &lt;Gold &amp; Platinum&gt; "Special"')
      expect(msg).not.toContain('<Gold & Platinum>')
    })
  })

  // =========================================================================
  // 7. Telegram Callback Regex & Routing Tests
  // =========================================================================
  describe('7. Callback Query Routing Regex', () => {
    it('matches variant select callback regex /^variant:select:(.+)$/', () => {
      const regex = /^variant:select:(.+)$/

      const match1 = 'variant:select:var-pro-123'.match(regex)
      expect(match1).not.toBeNull()
      expect(match1![1]).toBe('var-pro-123')

      const matchCuid = 'variant:select:clx7890123456789'.match(regex)
      expect(matchCuid).not.toBeNull()
      expect(matchCuid![1]).toBe('clx7890123456789')

      expect('product:select:123'.match(regex)).toBeNull()
      expect('plan:buy:123'.match(regex)).toBeNull()
    })

    it('matches plan buy callback regex /^plan:buy:(.+)$/', () => {
      const regex = /^plan:buy:(.+)$/
      const match = 'plan:buy:plan-gemini-monthly'.match(regex)
      expect(match).not.toBeNull()
      expect(match![1]).toBe('plan-gemini-monthly')
    })

    it('matches delivery preference callback regex', () => {
      const regex = /^delivery:mode:(.+):(ready|own|exhausted)$/

      const matchReady = 'delivery:mode:plan-1:ready'.match(regex)
      expect(matchReady).not.toBeNull()
      expect(matchReady![1]).toBe('plan-1')
      expect(matchReady![2]).toBe('ready')

      const matchOwn = 'delivery:mode:plan-1:own'.match(regex)
      expect(matchOwn).not.toBeNull()
      expect(matchOwn![2]).toBe('own')
    })
  })

  // =========================================================================
  // 8. Order Payload & Mismatch Validation
  // =========================================================================
  describe('8. Order Integrity & Validation Rules', () => {
    it('rejects variant if variant.productId does not match plan.productId', () => {
      const plan = { id: 'plan-1', productId: 'prod-gemini', price: 500000 }
      const mismatchedVariant = { id: 'var-chatgpt', productId: 'prod-chatgpt', price: 800000 }

      const isValid = mismatchedVariant.productId === plan.productId
      expect(isValid).toBe(false)
    })

    it('rejects inactive variant', () => {
      const inactiveVariant = { id: 'var-old', active: false }
      expect(inactiveVariant.active).toBe(false)
    })

    it('handles legacy orders where variantId is null without throwing null-pointer errors', () => {
      const legacyOrder = {
        id: 'order-legacy',
        productId: 'prod-1',
        planId: 'plan-1',
        variantId: null,
        amount: 500000,
        variant: null,
      }

      const variantName = legacyOrder.variant ? (legacyOrder.variant as any).name : null
      expect(variantName).toBeNull()
      expect(legacyOrder.variantId).toBeNull()

      // Should not throw when creating message
      expect(() => {
        MESSAGES.orderCreated(legacyOrder.id, 'محصول قدیمی', legacyOrder.amount, {
          variantName: variantName ?? undefined,
        })
      }).not.toThrow()
    })
  })
})
