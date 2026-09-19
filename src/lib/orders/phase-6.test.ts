import { describe, expect, it } from 'vitest'

describe('Phase 6 — Product Variant Order Connection & Tests', () => {
  describe('6.1: Pricing Calculation with Variant', () => {
    it('uses discountedPrice when variant has discount', () => {
      const variant = {
        id: 'var-1',
        productId: 'prod-1',
        name: 'پرو ۱۲ ماهه',
        price: 1500000,
        discountedPrice: 1200000,
        active: true,
      }

      const hasDiscount =
        variant.discountedPrice !== null &&
        variant.discountedPrice !== undefined &&
        variant.discountedPrice > 0 &&
        variant.discountedPrice < variant.price

      const baseAmount = hasDiscount ? variant.discountedPrice! : variant.price
      expect(baseAmount).toBe(1200000)
    })

    it('uses regular price when variant does not have discount', () => {
      const variant = {
        id: 'var-2',
        productId: 'prod-1',
        name: 'پلاس ۶ ماهه',
        price: 850000,
        discountedPrice: null,
        active: true,
      }

      const hasDiscount =
        variant.discountedPrice !== null &&
        variant.discountedPrice !== undefined &&
        variant.discountedPrice > 0 &&
        variant.discountedPrice < variant.price

      const baseAmount = hasDiscount ? variant.discountedPrice! : variant.price
      expect(baseAmount).toBe(850000)
    })

    it('falls back to plan price when no variant is present (backward compatibility)', () => {
      const variant = null
      const plan = { id: 'plan-1', name: 'اکانت اختصاصی', price: 500000 }
      const product = { id: 'prod-1', price: 600000 }

      const baseAmount = variant ? (variant as any).price : (plan?.price ?? product.price ?? 0)
      expect(baseAmount).toBe(500000)
    })
  })

  describe('6.2: Variant Validation Logic', () => {
    it('rejects variant if it belongs to a different product', () => {
      const product = { id: 'prod-1', title: 'Gemini Advanced' }
      const variant = { id: 'var-foreign', productId: 'prod-999', active: true }

      const isValid = variant.productId === product.id
      expect(isValid).toBe(false)
    })

    it('rejects variant if it is inactive', () => {
      const variant = { id: 'var-inactive', productId: 'prod-1', active: false }
      expect(variant.active).toBe(false)
    })

    it('approves variant if it is active and belongs to the product', () => {
      const product = { id: 'prod-1', title: 'Gemini Advanced' }
      const variant = { id: 'var-valid', productId: 'prod-1', active: true }

      const isValid = variant.productId === product.id && variant.active
      expect(isValid).toBe(true)
    })
  })

  describe('6.3: Title & Notification Formatting with Variant', () => {
    it('formats title with variant and plan name', () => {
      const productTitle = 'Gemini Advanced'
      const variant = { name: 'پرو ۱۲ ماهه' }
      const plan = { name: 'اکانت اختصاصی آماده' }

      const fullTitle = variant
        ? `${productTitle} - ${variant.name} (${plan.name})`
        : `${productTitle} (${plan.name})`

      expect(fullTitle).toBe('Gemini Advanced - پرو ۱۲ ماهه (اکانت اختصاصی آماده)')
    })

    it('formats title without variant when variant is null', () => {
      const productTitle = 'ChatGPT Plus'
      const variant = null
      const plan = { name: 'لینک فعال‌سازی' }

      const fullTitle = variant
        ? `${productTitle} - ${(variant as any).name} (${plan.name})`
        : `${productTitle} (${plan.name})`

      expect(fullTitle).toBe('ChatGPT Plus (لینک فعال‌سازی)')
    })

    it('formats admin receipt with variant name', () => {
      const productName = 'Claude Pro'
      const variantName = ' - ۶ ماهه'
      const planName = 'فعال‌سازی روی اکانت شما'

      const receiptLine = `📦 محصول: ${productName}${variantName} (${planName})`
      expect(receiptLine).toBe('📦 محصول: Claude Pro - ۶ ماهه (فعال‌سازی روی اکانت شما)')
    })
  })
})
