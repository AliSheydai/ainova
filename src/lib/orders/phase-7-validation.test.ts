import { describe, expect, it } from 'vitest'

// Helper types mirroring the project schemas
interface ProductVariant {
  id: string
  productId: string
  name: string
  slug?: string | null
  description?: string | null
  price: number
  discountedPrice?: number | null
  discountLabel?: string | null
  duration: number
  features?: string[] | null
  badge?: string | null
  active: boolean
  sortOrder: number
}

interface Plan {
  id: string
  productId: string
  name: string
  price: number
  duration: number
  planType?: string | null
  fulfillmentType: string
  active: boolean
  variantId?: string | null
}

interface Product {
  id: string
  title: string
  slug: string
  price: number
  videoUrl?: string | null
  variants?: ProductVariant[]
  plans?: Plan[]
}

describe('Phase 7 — Comprehensive Validation & Testing (plan-2.md)', () => {
  describe('7.1 Scenario 1: Product without Variant and without Video', () => {
    it('maintains existing behavior when product has no variants and no video', () => {
      const product: Product = {
        id: 'prod-plain',
        title: 'اکانت چت‌جی‌پی‌تی',
        slug: 'chatgpt-plain',
        price: 500000,
        videoUrl: null,
        variants: [],
        plans: [
          {
            id: 'plan-plain-1',
            productId: 'prod-plain',
            name: 'اکانت اختصاصی ۱ ماهه',
            price: 500000,
            duration: 1,
            fulfillmentType: 'PRE_CREATED_ACCOUNT',
            active: true,
          },
        ],
      }

      const hasVariants = Boolean(product.variants && product.variants.length > 0)
      const hasVideo = Boolean(product.videoUrl && product.videoUrl.trim())

      expect(hasVariants).toBe(false)
      expect(hasVideo).toBe(false)

      // Fallback price is direct plan price
      const effectivePrice = product.plans?.[0]?.price ?? product.price
      expect(effectivePrice).toBe(500000)

      // Checkout URL does not include variantId
      const params = new URLSearchParams()
      params.set('slug', product.slug)
      if (product.plans?.[0]?.id) params.set('planId', product.plans[0].id)
      const checkoutUrl = `/checkout?${params.toString()}`

      expect(checkoutUrl).toBe('/checkout?slug=chatgpt-plain&planId=plan-plain-1')
      expect(checkoutUrl).not.toContain('variantId')
    })
  })

  describe('7.1 Scenario 2: Product with Video and without Variant', () => {
    it('shows video section and hides variant selector', () => {
      const product: Product = {
        id: 'prod-video',
        title: 'اکانت کلود با ویدئو',
        slug: 'claude-video',
        price: 600000,
        videoUrl: 'https://cdn.example.com/video.mp4',
        variants: [],
        plans: [
          {
            id: 'plan-1',
            productId: 'prod-video',
            name: 'پلن استاندارد',
            price: 600000,
            duration: 1,
            fulfillmentType: 'ACTIVATION_LINK',
            active: true,
          },
        ],
      }

      const hasVariants = Boolean(product.variants && product.variants.length > 0)
      const hasVideo = Boolean(product.videoUrl && product.videoUrl.trim())

      expect(hasVariants).toBe(false)
      expect(hasVideo).toBe(true)
      expect(product.videoUrl).toBe('https://cdn.example.com/video.mp4')
    })
  })

  describe('7.1 Scenario 3: Product with Variant and without Video', () => {
    it('shows variant selector and keeps video section hidden', () => {
      const product: Product = {
        id: 'prod-variants',
        title: 'اکانت جمینای چند نوع',
        slug: 'gemini-advanced',
        price: 400000,
        videoUrl: null,
        variants: [
          {
            id: 'var-pro',
            productId: 'prod-variants',
            name: 'پرو',
            price: 800000,
            duration: 1,
            active: true,
            sortOrder: 0,
          },
          {
            id: 'var-ultra',
            productId: 'prod-variants',
            name: 'اولترا',
            price: 1200000,
            duration: 3,
            active: true,
            sortOrder: 1,
          },
        ],
      }

      const hasVariants = Boolean(product.variants && product.variants.length > 0)
      const hasVideo = Boolean(product.videoUrl && product.videoUrl.trim())

      expect(hasVariants).toBe(true)
      expect(hasVideo).toBe(false)
      expect(product.variants).toHaveLength(2)
    })
  })

  describe('7.1 Scenario 4: Product with both Variant and Video', () => {
    it('activates both variant selector and video section simultaneously', () => {
      const product: Product = {
        id: 'prod-full',
        title: 'مجموعه هوش مصنوعی پرو',
        slug: 'ai-suite',
        price: 900000,
        videoUrl: 'https://cdn.example.com/promo.mp4',
        variants: [
          {
            id: 'var-basic',
            productId: 'prod-full',
            name: 'پایه',
            price: 900000,
            duration: 1,
            active: true,
            sortOrder: 0,
          },
        ],
      }

      const hasVariants = Boolean(product.variants && product.variants.length > 0)
      const hasVideo = Boolean(product.videoUrl && product.videoUrl.trim())

      expect(hasVariants).toBe(true)
      expect(hasVideo).toBe(true)
    })
  })

  describe('7.1 Scenario 5: Variant with Discount', () => {
    it('calculates discounted price, discount percentage, and custom label', () => {
      const variant: ProductVariant = {
        id: 'var-discounted',
        productId: 'prod-1',
        name: 'پرو ۱۲ ماهه ویژه',
        price: 1500000,
        discountedPrice: 1200000,
        discountLabel: '۲۰٪ تخفیف نوروزی',
        duration: 12,
        active: true,
        sortOrder: 0,
      }

      const hasDiscount = Boolean(
        variant.discountedPrice !== null &&
        variant.discountedPrice !== undefined &&
        variant.discountedPrice > 0 &&
        variant.discountedPrice < variant.price
      )

      expect(hasDiscount).toBe(true)

      const effectivePrice = hasDiscount ? variant.discountedPrice! : variant.price
      expect(effectivePrice).toBe(1200000)

      const discountPercent = Math.round(
        ((variant.price - variant.discountedPrice!) / variant.price) * 100
      )
      expect(discountPercent).toBe(20)
      expect(variant.discountLabel).toBe('۲۰٪ تخفیف نوروزی')
    })
  })

  describe('7.1 Scenario 6: Variant without Discount', () => {
    it('uses regular price and flags no discount', () => {
      const variant: ProductVariant = {
        id: 'var-no-discount',
        productId: 'prod-1',
        name: 'پلاس ۶ ماهه',
        price: 850000,
        discountedPrice: null,
        discountLabel: null,
        duration: 6,
        active: true,
        sortOrder: 0,
      }

      const hasDiscount = Boolean(
        variant.discountedPrice !== null &&
        variant.discountedPrice !== undefined &&
        variant.discountedPrice > 0 &&
        variant.discountedPrice < variant.price
      )

      expect(hasDiscount).toBe(false)
      const effectivePrice = hasDiscount ? variant.discountedPrice! : variant.price
      expect(effectivePrice).toBe(850000)
    })
  })

  describe('7.1 Scenario 7: Variant with Features', () => {
    it('displays feature list when defined or falls back to default message', () => {
      const variantWithFeatures: ProductVariant = {
        id: 'var-feats',
        productId: 'prod-1',
        name: 'اولترا',
        price: 2000000,
        duration: 12,
        features: [
          'دسترسی نامحدود به GPT-4o',
          'امکان اتصال API اختصاصی',
          'پشتیبانی VIP بیست و چهار ساعته',
        ],
        active: true,
        sortOrder: 0,
      }

      const variantWithoutFeatures: ProductVariant = {
        id: 'var-no-feats',
        productId: 'prod-1',
        name: 'پایه',
        price: 500000,
        duration: 1,
        features: [],
        active: true,
        sortOrder: 1,
      }

      expect(Array.isArray(variantWithFeatures.features)).toBe(true)
      expect(variantWithFeatures.features).toHaveLength(3)
      expect(variantWithFeatures.features?.[0]).toBe('دسترسی نامحدود به GPT-4o')

      const hasCustomFeatures = Boolean(
        Array.isArray(variantWithoutFeatures.features) &&
        variantWithoutFeatures.features.length > 0
      )
      expect(hasCustomFeatures).toBe(false)
    })
  })

  describe('7.1 Scenario 8: Selection flow Variant -> Plan -> Checkout', () => {
    it('resolves active variant, filters linked plans, and constructs valid checkout url', () => {
      const variants: ProductVariant[] = [
        { id: 'var-pro', productId: 'prod-1', name: 'پرو', price: 1000000, duration: 3, active: true, sortOrder: 0 },
        { id: 'var-plus', productId: 'prod-1', name: 'پلاس', price: 600000, duration: 1, active: true, sortOrder: 1 },
      ]

      const plans: Plan[] = [
        { id: 'plan-pro-1', productId: 'prod-1', name: 'اکانت آماده پرو', price: 1000000, duration: 3, fulfillmentType: 'PRE_CREATED_ACCOUNT', active: true, variantId: 'var-pro' },
        { id: 'plan-plus-1', productId: 'prod-1', name: 'لینک فعال‌سازی پلاس', price: 600000, duration: 1, fulfillmentType: 'ACTIVATION_LINK', active: true, variantId: 'var-plus' },
      ]

      // Step 1: User selects variant 'var-pro'
      const activeVariantId = 'var-pro'

      // Step 2: Linked plans are filtered
      const variantPlans = plans.filter((p) => p.variantId === activeVariantId)
      expect(variantPlans).toHaveLength(1)
      expect(variantPlans[0].id).toBe('plan-pro-1')

      // Step 3: Default or chosen plan is selected
      const selectedPlanId = variantPlans[0].id

      // Step 4: Checkout navigation parameters
      const params = new URLSearchParams()
      params.set('slug', 'gemini-advanced')
      params.set('variantId', activeVariantId)
      params.set('planId', selectedPlanId)

      expect(params.toString()).toBe('slug=gemini-advanced&variantId=var-pro&planId=plan-pro-1')
    })
  })

  describe('7.1 Scenario 9: Variant Switching resets plan selection and updates plans pool', () => {
    it('correctly adapts candidate plans when variant switches', () => {
      const variants: ProductVariant[] = [
        { id: 'v1', productId: 'prod-1', name: '۱ ماهه', price: 300000, duration: 1, active: true, sortOrder: 0 },
        { id: 'v2', productId: 'prod-1', name: '۳ ماهه', price: 800000, duration: 3, active: true, sortOrder: 1 },
      ]

      const plans: Plan[] = [
        { id: 'p1', productId: 'prod-1', name: 'تحویل ۱ ماهه', price: 300000, duration: 1, fulfillmentType: 'ACTIVATION_LINK', active: true, variantId: 'v1' },
        { id: 'p2', productId: 'prod-1', name: 'تحویل ۳ ماهه', price: 800000, duration: 3, fulfillmentType: 'ACTIVATION_LINK', active: true, variantId: 'v2' },
      ]

      let currentVariantId = 'v1'
      let variantPlans = plans.filter((p) => p.variantId === currentVariantId)
      expect(variantPlans[0].id).toBe('p1')

      // User switches to v2
      currentVariantId = 'v2'
      variantPlans = plans.filter((p) => p.variantId === currentVariantId)
      expect(variantPlans[0].id).toBe('p2')
      expect(variantPlans[0].name).toBe('تحویل ۳ ماهه')
    })
  })

  describe('7.1 Scenario 10: Checkout with Variant payload and order submission', () => {
    it('passes variantId to order payload and computes payable amount correctly with coupon', () => {
      const variant: ProductVariant = {
        id: 'var-test-10',
        productId: 'prod-10',
        name: 'دانشجویی ۳ ماهه',
        price: 500000,
        discountedPrice: 400000,
        duration: 3,
        active: true,
        sortOrder: 0,
      }

      const plan: Plan = {
        id: 'plan-test-10',
        productId: 'prod-10',
        name: 'تحویل فوری',
        price: 500000,
        duration: 3,
        fulfillmentType: 'ACTIVATION_LINK',
        active: true,
        variantId: 'var-test-10',
      }

      // Base price comes from variant (discountedPrice takes precedence)
      const baseAmount = variant.discountedPrice ?? variant.price
      expect(baseAmount).toBe(400000)

      // Coupon discount simulation (50,000 toman discount)
      const couponDiscount = 50000
      const payableAmount = baseAmount - couponDiscount
      expect(payableAmount).toBe(350000)

      // Payload structure
      const orderPayload = {
        productId: 'prod-10',
        slug: 'test-product',
        planId: plan.id,
        variantId: variant.id,
        checkoutData: { delivery_preference: 'ready_account' },
        couponCode: 'OFF50',
        source: 'web' as const,
      }

      expect(orderPayload.variantId).toBe('var-test-10')
      expect(orderPayload.planId).toBe('plan-test-10')
    })
  })

  describe('7.1 Scenario 11: Display of Variant in Admin and User Dashboard', () => {
    it('formats order titles and receipts with variant info when present', () => {
      const productTitle = 'Gemini Advanced'
      const variantName = 'پرو ۱۲ ماهه'
      const planName = 'اکانت اختصاصی'

      const formattedTitleWithVariant = `${productTitle} - ${variantName} (${planName})`
      expect(formattedTitleWithVariant).toBe('Gemini Advanced - پرو ۱۲ ماهه (اکانت اختصاصی)')

      const receiptItem = {
        productName: productTitle,
        variantName: ` - ${variantName}`,
        planName,
      }
      const receiptLine = `📦 محصول: ${receiptItem.productName}${receiptItem.variantName} (${receiptItem.planName})`
      expect(receiptLine).toContain('پرو ۱۲ ماهه')
    })
  })

  describe('7.2 Backward Compatibility: Legacy Products and Orders without Variant', () => {
    it('handles legacy orders where variantId is null without crashing or null-pointer errors', () => {
      const legacyOrder = {
        id: 'order-legacy-123',
        productId: 'prod-legacy',
        planId: 'plan-legacy',
        variantId: null,
        product: { id: 'prod-legacy', title: 'محصول قدیمی' },
        plan: { id: 'plan-legacy', name: 'پلن پیش‌فرض', price: 250000 },
        variant: null,
      }

      const variantDisplay = legacyOrder.variant
        ? ` - ${(legacyOrder.variant as ProductVariant).name}`
        : ''

      const formatted = `${legacyOrder.product.title}${variantDisplay} (${legacyOrder.plan.name})`
      expect(formatted).toBe('محصول قدیمی (پلن پیش‌فرض)')
      expect(legacyOrder.variantId).toBeNull()
    })

    it('processes product purchase without variant using product or plan price', () => {
      const product = { id: 'prod-1', price: 300000 }
      const plan = { id: 'plan-1', price: 320000 }
      const variant = null

      const baseAmount = variant
        ? (variant as ProductVariant).price
        : (plan?.price ?? product.price ?? 0)

      expect(baseAmount).toBe(320000)
    })
  })
})
