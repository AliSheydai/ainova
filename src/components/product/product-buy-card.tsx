'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthModal, type AuthUserData } from '@/components/auth/auth-modal'
import { formatPrice, toPersianDigits } from '@/lib/persian-utils'
import { ProductVariantSelector, type ProductVariantItem } from './product-variant-selector'

export interface PlanItem {
  id: string
  name: string
  price: number
  duration: number
  planType?: string | null
  fulfillmentType?: string
  stock?: number
  variantId?: string | null
}

export interface ProductBuyCardProps {
  productId: string
  productTitle: string
  slug: string
  price: number
  stock: number
  purchaseCount: number
  fulfillmentType?: string
  shortDescription?: string | null
  plans?: PlanItem[]
  variants?: ProductVariantItem[]
}

export function ProductBuyCard({
  productId: _productId,
  productTitle: _productTitle,
  slug,
  price,
  stock,
  purchaseCount,
  fulfillmentType: _fulfillmentType,
  shortDescription: _shortDescription,
  plans = [],
  variants = [],
}: ProductBuyCardProps) {
  const router = useRouter()
  const hasVariants = Boolean(variants && variants.length > 0)

  // Selected Variant state
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? variants[0].id : null
  )

  // Derive active variant ID safely without triggering setState in effect
  const activeVariantId = useMemo(() => {
    if (!hasVariants) return null
    if (selectedVariantId && variants.some((v) => v.id === selectedVariantId)) {
      return selectedVariantId
    }
    return variants[0]?.id ?? null
  }, [hasVariants, selectedVariantId, variants])

  // Filter plans when variants exist
  const variantPlans = useMemo(() => {
    if (!hasVariants || !activeVariantId) return plans
    const matching = plans.filter((p) => p.variantId === activeVariantId)
    if (matching.length > 0) return matching
    const unassigned = plans.filter((p) => !p.variantId)
    return unassigned.length > 0 ? unassigned : plans
  }, [hasVariants, activeVariantId, plans])

  // Flat & Matrix Plan Modes (only active if NO variants exist)
  const availablePlanTypes = useMemo(() => {
    if (hasVariants) return []
    const hasAnyType = plans.some((p) => Boolean(p.planType?.trim()))
    if (!hasAnyType) return []
    const types: string[] = []
    for (const p of plans) {
      const t = p.planType?.trim() || 'سایر'
      if (!types.includes(t)) {
        types.push(t)
      }
    }
    return types
  }, [hasVariants, plans])

  const isMatrixMode = !hasVariants && availablePlanTypes.length > 1

  const [selectedPlanType, setSelectedPlanType] = useState<string>(() => {
    if (plans.length > 0) {
      return plans[0].planType?.trim() || availablePlanTypes[0] || ''
    }
    return ''
  })

  // Derive active plan type safely
  const activePlanType = useMemo(() => {
    if (!isMatrixMode) return ''
    if (selectedPlanType && availablePlanTypes.includes(selectedPlanType)) {
      return selectedPlanType
    }
    return availablePlanTypes[0] || ''
  }, [isMatrixMode, selectedPlanType, availablePlanTypes])

  const filteredPlans = useMemo(() => {
    if (hasVariants) return variantPlans
    if (!isMatrixMode) return plans
    return plans.filter((p) => {
      const t = p.planType?.trim() || 'سایر'
      return t.toLowerCase() === activePlanType.toLowerCase()
    })
  }, [hasVariants, variantPlans, isMatrixMode, plans, activePlanType])

  // Selected Plan state
  const [userSelectedPlanId, setUserSelectedPlanId] = useState<string | null>(null)

  // Derive active plan ID safely across all modes
  const activePlanId = useMemo(() => {
    const currentPool = hasVariants ? variantPlans : isMatrixMode ? filteredPlans : plans
    if (userSelectedPlanId && currentPool.some((p) => p.id === userSelectedPlanId)) {
      return userSelectedPlanId
    }
    return currentPool[0]?.id ?? null
  }, [hasVariants, isMatrixMode, userSelectedPlanId, variantPlans, filteredPlans, plans])

  // User & Auth state
  const [buying, setBuying] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUserData | null>(null)

  useEffect(() => {
    let isMounted = true
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  // Selected item calculations
  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === activeVariantId) || variants[0]
    : null

  const currentPlansPool = hasVariants ? variantPlans : isMatrixMode ? filteredPlans : plans
  const selectedPlan = currentPlansPool.find((p) => p.id === activePlanId) || currentPlansPool[0]

  const hasVariantDiscount = Boolean(
    selectedVariant &&
    selectedVariant.discountedPrice !== null &&
    selectedVariant.discountedPrice !== undefined &&
    selectedVariant.discountedPrice > 0 &&
    selectedVariant.discountedPrice < selectedVariant.price
  )

  const effectivePrice = selectedVariant
    ? (hasVariantDiscount ? selectedVariant.discountedPrice! : selectedVariant.price)
    : (selectedPlan ? selectedPlan.price : price)

  const isPreCreated = selectedPlan?.fulfillmentType === 'PRE_CREATED_ACCOUNT'
  const planStock = selectedPlan?.stock !== undefined ? selectedPlan.stock : stock

  const navigateToCheckout = () => {
    setBuying(true)
    const params = new URLSearchParams()
    if (slug) params.set('slug', slug)
    if (activeVariantId) params.set('variantId', activeVariantId)
    if (activePlanId) params.set('planId', activePlanId)

    const checkoutUrl = `/checkout?${params.toString()}`
    router.push(checkoutUrl)
  }

  const handleBuy = async () => {
    // Deferred Authentication: If user is not logged in, prompt AuthModal at purchase moment
    if (!currentUser) {
      setAuthModalOpen(true)
      return
    }

    navigateToCheckout()
  }

  return (
    <div className='space-y-5'>
      {/* SCENARIO A: PRODUCT HAS VARIANTS */}
      {hasVariants && (
        <div className='space-y-4'>
          {/* Variant Selector Component */}
          <ProductVariantSelector
            variants={variants}
            selectedVariantId={activeVariantId}
            onSelectVariant={(id) => {
              setSelectedVariantId(id)
              setUserSelectedPlanId(null)
            }}
          />

          {/* Delivery Option Selector (Plans linked to this variant) */}
          {variantPlans.length > 0 && (
            <div className='space-y-2 pt-2 border-t border-border/50'>
              <span id='delivery-plan-label' className='text-xs font-semibold text-muted-foreground flex items-center gap-1.5'>
                <span>نحوه تحویل (پلن):</span>
              </span>
              <div className='flex flex-wrap gap-2' role='radiogroup' aria-labelledby='delivery-plan-label'>
                {variantPlans.map((p) => {
                  const isSelected = selectedPlan?.id === p.id
                  const isPlanPreCreated = p.fulfillmentType === 'PRE_CREATED_ACCOUNT'
                  const planHasStock = (p.stock !== undefined ? p.stock : stock) > 0

                  return (
                    <button
                      key={p.id}
                      type='button'
                      role='radio'
                      aria-checked={isSelected}
                      onClick={() => setUserSelectedPlanId(p.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground font-semibold ring-2 ring-primary/30 shadow-2xs'
                          : 'border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      <span>{p.name}</span>
                      {isPlanPreCreated ? (
                        <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20'>
                          اکانت اختصاصی
                        </span>
                      ) : (
                        <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium border border-border'>
                          {p.fulfillmentType === 'ACTIVATION_LINK' ? 'لینک آنی' : 'تحویل مستقیم'}
                        </span>
                      )}
                      {planHasStock ? (
                        <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20'>
                          تحویل آنی
                        </span>
                      ) : (
                        <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium border border-border'>
                          ارسال ۱ روزه
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCENARIO B: NO VARIANTS — 2D Plan Matrix Selector (when multiple types exist) */}
      {!hasVariants && isMatrixMode && (
        <div className='space-y-3.5'>
          {/* Row 1: Plan Type Tabs / Chips */}
          <div className='space-y-2'>
            <span id='plan-type-label' className='text-xs font-semibold text-muted-foreground flex items-center gap-1.5'>
              <span>نوع اشتراک:</span>
            </span>
            <div className='flex flex-wrap gap-2' role='radiogroup' aria-labelledby='plan-type-label'>
              {availablePlanTypes.map((type) => {
                const isSelected = activePlanType.toLowerCase() === type.toLowerCase()
                const typePlans = plans.filter(
                  (p) => (p.planType?.trim() || 'سایر').toLowerCase() === type.toLowerCase()
                )
                const minPrice = typePlans.length > 0 ? Math.min(...typePlans.map((p) => p.price)) : 0

                return (
                  <button
                    key={type}
                    type='button'
                    role='radio'
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedPlanType(type)
                      setUserSelectedPlanId(null)
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-xs'
                        : 'border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    <span>{type}</span>
                    {minPrice > 0 && (
                      <span className='text-[11px] font-normal font-sans opacity-80'>
                        از {formatPrice(minPrice)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 2: Duration / Plan Options for Selected Type */}
          <div className='space-y-2'>
            <span id='plan-duration-label' className='text-xs font-medium text-muted-foreground'>
              مدت زمان:
            </span>
            <div className='flex flex-wrap gap-1.5 sm:gap-2' role='radiogroup' aria-labelledby='plan-duration-label'>
              {filteredPlans.map((p) => {
                const isSelected = selectedPlan?.id === p.id
                const isPlanPreCreated = p.fulfillmentType === 'PRE_CREATED_ACCOUNT'
                const planHasStock = (p.stock !== undefined ? p.stock : stock) > 0
                return (
                  <button
                    key={p.id}
                    type='button'
                    role='radio'
                    aria-checked={isSelected}
                    onClick={() => setUserSelectedPlanId(p.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/8 text-foreground font-semibold ring-1 ring-primary/30 shadow-2xs'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span
                      className={`text-xs font-medium font-sans ${isSelected ? 'text-primary font-bold' : ''}`}
                    >
                      {formatPrice(p.price)}
                    </span>
                    {isPlanPreCreated && (
                      <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20'>
                        اکانت اختصاصی
                      </span>
                    )}
                    {!planHasStock && (
                      <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20'>
                        ارسال ۱ روزه
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO C: NO VARIANTS — Flat Plan Selector (when multiple plans exist) */}
      {!hasVariants && !isMatrixMode && plans.length > 1 && (
        <div className='space-y-2'>
          <span id='plan-label' className='text-xs font-medium text-muted-foreground'>
            انتخاب پلن:
          </span>
          <div className='flex flex-wrap gap-1.5 sm:gap-2' role='radiogroup' aria-labelledby='plan-label'>
            {plans.map((p) => {
              const isSelected = selectedPlan?.id === p.id
              const isPlanPreCreated = p.fulfillmentType === 'PRE_CREATED_ACCOUNT'
              return (
                <button
                  key={p.id}
                  type='button'
                  role='radio'
                  aria-checked={isSelected}
                  onClick={() => setUserSelectedPlanId(p.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/8 text-foreground font-semibold ring-1 ring-primary/30'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <span>{p.name}</span>
                  {p.planType && (
                    <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold border border-primary/20'>
                      {p.planType}
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium font-sans ${isSelected ? 'text-primary' : ''}`}
                  >
                    {formatPrice(p.price)}
                  </span>
                  {isPlanPreCreated && (
                    <span className='text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20'>
                      اکانت اختصاصی
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price + Status Breakdown */}
      <div className='flex items-end justify-between gap-3 border-t border-border/50 pt-4 sm:pt-5'>
        <div>
          <span className='mb-1 block text-xs text-muted-foreground'>قیمت نهایی:</span>
          {hasVariantDiscount ? (
            <div className='flex flex-wrap items-baseline gap-2'>
              <span className='text-xl sm:text-2xl font-bold text-foreground font-sans'>
                {formatPrice(effectivePrice)}
              </span>
              <span className='line-through text-xs sm:text-sm text-muted-foreground font-sans'>
                {formatPrice(selectedVariant!.price)}
              </span>
              {selectedVariant?.discountLabel && (
                <span className='text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20'>
                  {selectedVariant.discountLabel}
                </span>
              )}
            </div>
          ) : (
            <span className='text-xl sm:text-2xl font-bold text-foreground font-sans'>
              {formatPrice(effectivePrice)}
            </span>
          )}
        </div>
        {isPreCreated ? (
          planStock > 0 ? (
            <div className='flex flex-col items-end gap-1'>
              <Badge className='bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs font-medium'>
                تحویل آنی اکانت آماده
              </Badge>
              <span className='text-[10px] text-muted-foreground'>
                یا فعال‌سازی روی اکانت شخصی شما
              </span>
            </div>
          ) : (
            <div className='flex flex-col items-end gap-1'>
              <Badge className='bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs font-medium'>
                ارسال طی یک روز کاری
              </Badge>
              <span className='text-[10px] text-muted-foreground'>
                یا فعال‌سازی روی اکانت شخصی شما
              </span>
            </div>
          )
        ) : planStock > 0 ? (
          <Badge className='bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs font-medium'>
            تحویل آنی
          </Badge>
        ) : (
          <Badge className='bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs font-medium'>
            ارسال طی یک روز کاری
          </Badge>
        )}
      </div>

      {/* Purchase count */}
      {purchaseCount > 0 && (
        <p className='text-xs text-muted-foreground'>
          {toPersianDigits(purchaseCount)} نفر این محصول را خریداری کرده‌اند
        </p>
      )}

      {/* CTA Button */}
      <div id='buy-button-anchor' className='space-y-2'>
        <Button
          id='main-buy-button'
          onClick={handleBuy}
          disabled={buying}
          aria-busy={buying}
          size='lg'
          className='h-11 sm:h-12 w-full text-xs sm:text-sm font-semibold rounded-xl'
        >
          {buying ? (
            <>
              <Loader2 className='size-4 animate-spin me-2' aria-hidden='true' />
              <span>در حال انتقال...</span>
            </>
          ) : (
            <>
              <ShoppingCart className='size-4 me-2' aria-hidden='true' />
              <span>ادامه و ثبت سفارش</span>
            </>
          )}
        </Button>

        <p className='text-center text-[11px] sm:text-xs text-muted-foreground'>
          <Lock className='me-1 inline size-3' aria-hidden='true' />
          {planStock > 0
            ? 'پرداخت امن — تحویل بلافاصله پس از پرداخت'
            : 'پرداخت امن — تحویل طی یک روز کاری'}
        </p>
      </div>

      {/* Auth Modal for deferred login */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={(user) => {
          setCurrentUser(user)
          setAuthModalOpen(false)
          navigateToCheckout()
        }}
      />
    </div>
  )
}
