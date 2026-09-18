'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Lock,
  Loader2,
  FileText,
  Clock,
  PencilLine,
  HelpCircle,
  Headphones,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/loading-state'
import { toast } from 'sonner'
import { AuthModal } from '@/components/auth/auth-modal'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'
import { DynamicCheckoutForm } from '@/components/checkout/dynamic-checkout-form'
import { CheckoutDeliverySection } from '@/components/checkout/checkout-delivery-section'
import { CheckoutOrderSummary } from '@/components/checkout/checkout-order-summary'
import { CheckoutMobileBar } from '@/components/checkout/checkout-mobile-bar'
import { type CheckoutFieldDefinition } from '@/lib/fulfillment/types'

interface PlanData {
  id: string
  name: string
  price: number
  duration: number
  active: boolean
  fulfillmentType: string
  checkoutFields?: CheckoutFieldDefinition[]
  availableInventoryCount?: number | null
}

interface ProductData {
  id: string
  title: string
  name: string
  slug: string
  shortDescription: string | null
  description: string | null
  image?: string | null
  price: number
  stock: number
  fulfillmentType: string
  features?: string[] | any
  plans?: PlanData[]
}

function getFulfillmentLabel(type?: string) {
  switch (type) {
    case 'ACTIVATION_LINK':
      return 'لینک فعال‌سازی آنی'
    case 'PRE_CREATED_ACCOUNT':
      return 'اکانت اختصاصی'
    case 'CUSTOMER_PROVISIONING':
      return 'فعال‌سازی روی اکانت شما'
    case 'MANUAL':
      return 'تحویل توسط پشتیبانی'
    default:
      return 'تحویل آنی'
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const slugParam = searchParams.get('slug') || searchParams.get('product')
  const productIdParam = searchParams.get('productId')
  const planIdParam = searchParams.get('planId')

  const [product, setProduct] = useState<ProductData | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planIdParam)
  const [checkoutData, setCheckoutData] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; phone?: string } | null>(null)

  // Pre-Created Account specific state
  const [preCreatedMode, setPreCreatedMode] = useState<'inventory' | 'own'>('inventory')
  const [customerGmail, setCustomerGmail] = useState('')
  const [customerPassword, setCustomerPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
    finalAmount: number
  } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      try {
        let loadedProduct: ProductData | null = null

        if (slugParam) {
          const res = await fetch(`/api/products/${slugParam}`)
          if (res.ok) {
            const data = await res.json()
            if (data.product) loadedProduct = data.product
          }
        }

        if (!loadedProduct) {
          const res = await fetch('/api/products')
          if (res.ok) {
            const data = await res.json()
            if (data.products && data.products.length > 0) {
              if (productIdParam) {
                const found = data.products.find((p: any) => p.id === productIdParam)
                if (found) loadedProduct = found
              }
              if (!loadedProduct) loadedProduct = data.products[0]
            }
          }
        }

        if (loadedProduct) {
          setProduct(loadedProduct)
          const activePlans = loadedProduct.plans?.filter((p) => p.active) || []
          if (planIdParam && activePlans.some((p) => p.id === planIdParam)) {
            setSelectedPlanId(planIdParam)
          } else if (activePlans.length > 0) {
            setSelectedPlanId(activePlans[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load product for checkout:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slugParam, productIdParam, planIdParam])

  const activePlans = product?.plans?.filter((p) => p.active) || []
  const selectedPlan = activePlans.find((p) => p.id === selectedPlanId) || activePlans[0]
  const effectivePrice = selectedPlan ? selectedPlan.price : product?.price || 0
  const productTitle = product?.title || product?.name || 'اشتراک ویژه'
  const isPreCreatedPlan = selectedPlan?.fulfillmentType === 'PRE_CREATED_ACCOUNT'

  const payablePrice = appliedCoupon
    ? Math.max(1000, effectivePrice - appliedCoupon.discountAmount)
    : effectivePrice

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('لطفاً کد تخفیف را وارد نمایید.')
      return
    }

    if (!currentUser) {
      setAuthModalOpen(true)
      toast.error('برای استفاده از کد تخفیف ابتدا وارد حساب کاربری خود شوید.')
      return
    }

    setValidatingCoupon(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          amount: effectivePrice,
          productId: product?.id,
        }),
      })
      const data = await res.json()

      if (res.status === 401) {
        setAuthModalOpen(true)
        toast.error('برای استفاده از کد تخفیف ابتدا وارد حساب کاربری خود شوید.')
        return
      }

      if (data.success && data.coupon) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.discountAmount || 0,
          finalAmount: data.finalAmount || effectivePrice,
        })
        toast.success(data.message || 'کد تخفیف با موفقیت اعمال گردید.')
      } else {
        toast.error(data.error || 'کد تخفیف معتبر نیست.')
      }
    } catch {
      toast.error('خطای سرور در اعتبارسنجی کد تخفیف.')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    toast.info('کد تخفیف حذف گردید.')
  }

  const handleFieldChange = (key: string, value: any) => {
    setCheckoutData((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // PRE_CREATED_ACCOUNT own mode validation
    if (isPreCreatedPlan && preCreatedMode === 'own') {
      if (!customerGmail.trim()) {
        errors.customerGmail = 'لطفاً آدرس جیمیل خود را جهت فعال‌سازی وارد نمایید.'
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(customerGmail.trim())) {
          errors.customerGmail = 'فرمت آدرس جیمیل وارد شده نامعتبر است.'
        }
      }
      if (!customerPassword.trim()) {
        errors.customerPassword = 'لطفاً رمزعبور جیمیل خود را جهت فعال‌سازی وارد نمایید.'
      }
    }

    if (selectedPlan?.checkoutFields && selectedPlan.checkoutFields.length > 0) {
      for (const field of selectedPlan.checkoutFields) {
        const val = checkoutData[field.key]
        if (field.required && (!val || String(val).trim() === '')) {
          errors[field.key] = `تکمیل ${field.label} الزامی است.`
        } else if (val && field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(String(val).trim())) {
            errors[field.key] = 'فرمت ایمیل نامعتبر است.'
          }
        }
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBuy = async (overrideUser?: any) => {
    if (!product) return

    if (!validateForm()) {
      toast.error('لطفاً اطلاعات موردنیاز فرم را به درستی تکمیل فرمایید.')
      return
    }

    const activeUser = overrideUser || currentUser
    if (!activeUser) {
      setAuthModalOpen(true)
      return
    }

    let finalCheckoutData = { ...checkoutData }
    if (isPreCreatedPlan) {
      if (preCreatedMode === 'own' && customerGmail.trim() && customerPassword.trim()) {
        finalCheckoutData = {
          ...finalCheckoutData,
          customer_email: customerGmail.trim(),
          customer_gmail: customerGmail.trim(),
          customer_password: customerPassword.trim(),
          delivery_preference: 'own_account',
        }
      } else {
        finalCheckoutData = {
          ...finalCheckoutData,
          delivery_preference: 'ready_account',
        }
      }
    }

    setBuying(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          slug: product.slug,
          planId: selectedPlan?.id,
          checkoutData: finalCheckoutData,
          couponCode: appliedCoupon?.code || undefined,
          source: 'web',
        }),
      })
      const data = await res.json()

      if (res.status === 401) {
        setCurrentUser(null)
        setAuthModalOpen(true)
        return
      }

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.message || 'خطا در ثبت سفارش.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور. لطفاً دوباره تلاش کنید.')
    } finally {
      setBuying(false)
    }
  }

  const deliveryPreferenceLabel = isPreCreatedPlan
    ? preCreatedMode === 'inventory'
      ? 'اکانت اختصاصی آماده (تحویل آنی)'
      : 'شارژ روی جیمیل شخصی شما'
    : getFulfillmentLabel(selectedPlan?.fulfillmentType)

  return (
    <div className='relative min-h-screen bg-background text-foreground flex flex-col font-sans' dir='rtl'>
      {/* Background Ambient Glow */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl' />
      </div>

      {/* Global Site Header for seamless consistency */}
      <LandingHeader showBottomNav={false} />

      {/* Main Checkout Section */}
      <main className='flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 max-w-6xl'>
        {/* Breadcrumb Navigation */}
        <nav aria-label='مسیر جاری' className='mb-4 sm:mb-6 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap font-sans'>
          <Link href='/' className='hover:text-foreground transition-colors shrink-0'>
            خانه
          </Link>
          <ChevronLeft className='size-3 shrink-0' />
          <Link href='/products' className='hover:text-foreground transition-colors shrink-0'>
            محصولات
          </Link>
          {product && (
            <>
              <ChevronLeft className='size-3 shrink-0' />
              <Link
                href={`/products/${product.slug}`}
                className='hover:text-foreground transition-colors truncate max-w-[140px] sm:max-w-[220px]'
              >
                {productTitle}
              </Link>
            </>
          )}
          <ChevronLeft className='size-3 shrink-0' />
          <span className='truncate text-foreground font-medium'>
            تکمیل سفارش و پرداخت
          </span>
        </nav>

        {/* Page Top Header Bar */}
        <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/50'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <Badge className='bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold'>
                <Sparkles className='size-3 me-1' />
                تکمیل نهایی خرید
              </Badge>
            </div>
            <h1 className='text-lg sm:text-2xl font-extrabold text-foreground tracking-tight'>
              خرید و فعال‌سازی {productTitle}
            </h1>
          </div>

          {selectedPlan && (
            <div className='flex items-center gap-2 bg-muted/40 border border-border/60 rounded-xl px-3.5 py-2 text-xs self-start sm:self-auto'>
              <span className='text-muted-foreground'>پلن انتخابی:</span>
              <span className='font-bold text-foreground'>{selectedPlan.name}</span>
              {product?.slug && (
                <Link
                  href={`/products/${product.slug}`}
                  className='text-[11px] text-primary hover:underline flex items-center gap-1 font-medium ms-1.5'
                  title='تغییر پلن یا انتخاب گزینه دیگر'
                >
                  <PencilLine className='size-3' />
                  <span>تغییر پلن</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className='max-w-md mx-auto py-16'>
            <LoadingState message='در حال آماده‌سازی اطلاعات پیش‌فاکتور...' />
          </div>
        ) : !product ? (
          <Card className='max-w-md mx-auto p-6 sm:p-8 text-center border-border/70'>
            <p className='text-muted-foreground mb-4 text-xs sm:text-sm'>
              محصول مورد نظر جهت پرداخت یافت نشد.
            </p>
            <Link href='/products'>
              <Button variant='outline' size='sm' className='text-xs'>
                مشاهده کاتالوگ محصولات
              </Button>
            </Link>
          </Card>
        ) : (
          /* Balanced 2-Column Responsive Layout */
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-16 lg:pb-0'>
            {/* RIGHT COLUMN (lg:col-span-7) — Delivery details & custom fields */}
            <div className='lg:col-span-7 space-y-4 sm:space-y-5'>
              {/* Delivery Section (if PRE_CREATED_ACCOUNT) */}
              {isPreCreatedPlan && (
                <CheckoutDeliverySection
                  availableCount={selectedPlan?.availableInventoryCount}
                  mode={preCreatedMode}
                  setMode={setPreCreatedMode}
                  customerGmail={customerGmail}
                  setCustomerGmail={setCustomerGmail}
                  customerPassword={customerPassword}
                  setCustomerPassword={setCustomerPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  errors={formErrors}
                  onClearError={(key) =>
                    setFormErrors((prev) => {
                      const next = { ...prev }
                      delete next[key]
                      return next
                    })
                  }
                  disabled={buying}
                />
              )}

              {/* Dynamic Checkout Form (custom fields configured on plan) */}
              {selectedPlan?.checkoutFields && selectedPlan.checkoutFields.length > 0 && (
                <div className='rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-xs space-y-3.5'>
                  <div className='flex items-center gap-2 pb-2.5 border-b border-border/60'>
                    <div className='size-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0'>
                      <FileText className='size-4' />
                    </div>
                    <div>
                      <h2 className='text-sm sm:text-base font-bold text-foreground'>
                        اطلاعات موردنیاز فعال‌سازی
                      </h2>
                      <p className='text-[11px] text-muted-foreground'>
                        جهت تکمیل اشتراک، فیلدهای ستاره‌دار را تکمیل نمایید.
                      </p>
                    </div>
                  </div>

                  <DynamicCheckoutForm
                    fields={selectedPlan.checkoutFields}
                    values={checkoutData}
                    onChange={handleFieldChange}
                    disabled={buying}
                    errors={formErrors}
                  />
                </div>
              )}

              {/* Reassurance & How it Works Card (for instant link or other fulfillment) */}
              {!isPreCreatedPlan && (!selectedPlan?.checkoutFields || selectedPlan.checkoutFields.length === 0) && (
                <div className='rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-xs space-y-3'>
                  <div className='flex items-center gap-2.5 pb-2.5 border-b border-border/60'>
                    <div className='size-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0'>
                      <Zap className='size-4' />
                    </div>
                    <div>
                      <h2 className='text-sm sm:text-base font-bold text-foreground'>
                        شیوه فعال‌سازی و تحویل اشتراک
                      </h2>
                      <p className='text-[11px] text-muted-foreground'>
                        نحوه دریافت اکانت پس از تکمیل پرداخت آنلاین
                      </p>
                    </div>
                  </div>

                  <div className='space-y-2 text-xs text-muted-foreground leading-relaxed'>
                    <div className='flex items-start gap-2 text-foreground'>
                      <Clock className='size-4 text-primary shrink-0 mt-0.5' />
                      <span>
                        بلافاصله پس از پرداخت موفق، اطلاعات فعال‌سازی و دسترسی در صفحه رهگیری سفارش و پنل کاربری‌تان تحویل داده خواهد شد.
                      </span>
                    </div>
                    <div className='flex items-start gap-2 text-foreground'>
                      <ShieldCheck className='size-4 text-primary shrink-0 mt-0.5' />
                      <span>
                        اشتراک دارای گارانتی تعویض و فعال‌سازی قانونی بدون قطعی در طول مدت استفاده است.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Customer Support & Peace of Mind Box */}
              <div className='rounded-2xl border border-border/50 bg-muted/20 p-3.5 sm:p-4 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
                <div className='flex items-center gap-2.5'>
                  <Headphones className='size-4 text-primary shrink-0' />
                  <div>
                    <span className='font-semibold text-foreground block text-xs'>
                      نیاز به راهنمایی قبل از خرید دارید؟
                    </span>
                    <span className='text-[11px]'>
                      پشتیبانی تلگرام و آنلاین در تمامی ساعات پاسخگوی شماست.
                    </span>
                  </div>
                </div>

                <a
                  href='https://t.me/ArioChatSupport'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 shrink-0'
                >
                  <span>ارتباط با پشتیبانی</span>
                  <ChevronLeft className='size-3' />
                </a>
              </div>
            </div>

            {/* LEFT COLUMN (lg:col-span-5) — Sticky Order Summary & Pay */}
            <div className='lg:col-span-5 lg:sticky lg:top-24 space-y-4'>
              <CheckoutOrderSummary
                productTitle={productTitle}
                productSlug={product.slug}
                productImage={product.image}
                planName={selectedPlan?.name || 'پلن عادی'}
                fulfillmentType={getFulfillmentLabel(selectedPlan?.fulfillmentType)}
                effectivePrice={effectivePrice}
                payablePrice={payablePrice}
                appliedCoupon={appliedCoupon}
                couponInput={couponInput}
                setCouponInput={setCouponInput}
                validatingCoupon={validatingCoupon}
                handleApplyCoupon={handleApplyCoupon}
                handleRemoveCoupon={handleRemoveCoupon}
                buying={buying}
                handleBuy={handleBuy}
                deliveryPreferenceLabel={deliveryPreferenceLabel}
              />
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <LandingFooter />

      {/* Mobile Sticky CTA Bar */}
      {!loading && product && (
        <CheckoutMobileBar
          payablePrice={payablePrice}
          buying={buying}
          handleBuy={handleBuy}
          productTitle={productTitle}
        />
      )}

      {/* Deferred Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={(newUser) => {
          setCurrentUser(newUser)
          setAuthModalOpen(false)
          handleBuy(newUser)
        }}
      />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center' role='status' aria-live='polite'>
          <Loader2 className='size-8 animate-spin text-primary' aria-hidden='true' />
          <span className='sr-only'>در حال بارگذاری صفحه پرداخت...</span>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
