'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Check,
  Loader2,
  ShoppingCart,
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  Lock,
  Zap,
  Package,
  User as UserIcon,
  Tag,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Warehouse,
  Mail,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingState } from '@/components/ui/loading-state'
import { toast } from 'sonner'
import { AuthModal } from '@/components/auth/auth-modal'
import { DynamicCheckoutForm } from '@/components/checkout/dynamic-checkout-form'
import { type CheckoutFieldDefinition } from '@/lib/fulfillment/types'
import { formatPrice } from '@/lib/persian-utils'

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
  price: number
  stock: number
  fulfillmentType: string
  features?: string[] | any
  plans?: PlanData[]
}

const defaultFeatures = [
  'فعال‌سازی رسمی و قانونی بدون ریسک قطعی',
  'تحویل فوری و خودکار بلافاصله پس از پرداخت',
  'دسترسی کامل به قابلیت‌های هوش مصنوعی',
  'پشتیبانی تخصصی در تمامی مراحل فعال‌سازی',
  'بدون نیاز به ارسال رمز عبور یا اطلاعات حساس',
]



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

// ─── Pre-Created Account Section ──────────────────────────────────────────────
interface PreCreatedAccountSectionProps {
  availableCount: number | null | undefined
  customerGmail: string
  setCustomerGmail: (v: string) => void
  customerPassword: string
  setCustomerPassword: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  mode: 'inventory' | 'own'
  setMode: (v: 'inventory' | 'own') => void
}

function PreCreatedAccountSection({
  availableCount,
  customerGmail,
  setCustomerGmail,
  customerPassword,
  setCustomerPassword,
  showPassword,
  setShowPassword,
  mode,
  setMode,
}: PreCreatedAccountSectionProps) {
  const hasInventory = availableCount !== null && availableCount !== undefined && availableCount > 0
  const isInventoryExhausted = availableCount !== null && availableCount !== undefined && availableCount === 0
  const inventoryUnknown = availableCount === null || availableCount === undefined

  return (
    <div className='rounded-2xl border border-border/80 bg-card/70 overflow-hidden shadow-sm transition-all'>
      {/* Header Banner */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-border/60 bg-muted/30'>
        <div className='flex items-center gap-2.5 min-w-0'>
          <div className='size-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs'>
            <Package className='size-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs sm:text-sm font-bold text-foreground'>
              پلن اکانت اختصاصی — شیوه تحویل اشتراک
            </p>
            <p className='text-[11px] sm:text-xs text-muted-foreground'>
              می‌توانید اکانت آماده تحویل بگیرید یا جیمیل خودتان را وارد کنید
            </p>
          </div>
        </div>

        {/* Live Warehouse Badge */}
        <div className='shrink-0 self-start sm:self-auto'>
          {!inventoryUnknown ? (
            hasInventory ? (
              <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs'>
                <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                <Warehouse className='size-3.5 shrink-0' />
                <span>انبار: {availableCount} اکانت آماده تحویل فوری</span>
              </div>
            ) : (
              <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-2xs'>
                <AlertTriangle className='size-3.5 shrink-0' />
                <span>انبار: اکانت آماده موقتاً ناموجود</span>
              </div>
            )
          ) : (
            <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs text-muted-foreground bg-muted/40 border border-border/60'>
              <Warehouse className='size-3.5 shrink-0' />
              <span>وضعیت انبار: در حال استعلام...</span>
            </div>
          )}
        </div>
      </div>

      <div className='p-3.5 sm:p-5 space-y-4'>
        {/* Notice if warehouse is exhausted */}
        {isInventoryExhausted && (
          <div className='flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm leading-relaxed animate-in fade-in duration-300'>
            <AlertTriangle className='size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
            <div>
              <span className='font-bold'>موجودی اکانت‌های آماده در انبار موقتاً تمام شده است.</span>
              <p className='text-[11px] sm:text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5'>
                هیچ جای نگرانی نیست! این سفارش به صورت اختصاصی مستقیماً روی آدرس جیمیل و اکانت شخصی شما توسط کارشناس پشتیبانی فعال خواهد شد.
              </p>
            </div>
          </div>
        )}

        {/* 2 Choice Cards */}
        <div className='flex flex-col gap-3.5'>
          {/* Option A: Pre-created account from warehouse */}
          <div
            role='button'
            tabIndex={isInventoryExhausted ? -1 : 0}
            onClick={() => {
              if (!isInventoryExhausted) setMode('inventory')
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isInventoryExhausted) {
                setMode('inventory')
              }
            }}
            className={`relative flex flex-col justify-between rounded-xl border p-3.5 sm:p-4 transition-all select-none ${
              mode === 'inventory' && !isInventoryExhausted
                ? 'border-purple-500/70 bg-purple-500/8 ring-2 ring-purple-500/20 shadow-xs'
                : isInventoryExhausted
                ? 'border-border/40 bg-muted/20 opacity-55 cursor-not-allowed'
                : 'border-border/70 bg-card hover:border-border hover:bg-muted/30 cursor-pointer'
            }`}
          >
            <div>
              <div className='flex items-start justify-between gap-2 mb-2'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      mode === 'inventory' && !isInventoryExhausted
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-border'
                    }`}
                  >
                    {mode === 'inventory' && !isInventoryExhausted && (
                      <div className='size-2 rounded-full bg-white' />
                    )}
                  </div>
                  <span className='text-xs sm:text-sm font-bold text-foreground'>
                    دریافت اکانت آماده از انبار
                  </span>
                </div>
                <Badge
                  variant='outline'
                  className={`text-[10px] sm:text-[11px] font-semibold ${
                    isInventoryExhausted
                      ? 'bg-muted text-muted-foreground border-border'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <Zap className='size-2.5 me-1' />
                  {isInventoryExhausted ? 'ناموجود' : 'تحویل فوری (۰ ثانیه)'}
                </Badge>
              </div>

              <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                بلافاصله پس از پرداخت، مشخصات ورود (ایمیل و رمز عبور یک اکانت آماده و اختصاصی) به شما تحویل داده می‌شود.
              </p>
            </div>

            <div className='mt-3 pt-3 border-t border-border/40 space-y-1.5 text-[11px] sm:text-xs text-muted-foreground'>
              <div className='flex items-center gap-1.5'>
                <Check className='size-3.5 text-emerald-500 shrink-0' />
                <span>تحویل ۱۰۰٪ خودکار بلافاصله پس از پرداخت</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Check className='size-3.5 text-emerald-500 shrink-0' />
                <span>اکانت کاملاً جدید و اختصاصی شما</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Check className='size-3.5 text-emerald-500 shrink-0' />
                <span>امکان تغییر رمز عبور و افزودن بازیابی</span>
              </div>
            </div>

            {isInventoryExhausted && (
              <div className='mt-2 text-xs sm:text-sm text-rose-500 font-semibold flex items-center gap-1'>
                <AlertTriangle className='size-3.5 shrink-0' />
                <span>موجودی انبار خالی است</span>
              </div>
            )}
          </div>

          {/* Option B: Customer's own account */}
          <div
            role='button'
            tabIndex={0}
            onClick={() => setMode('own')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setMode('own')
            }}
            className={`relative flex flex-col justify-between rounded-xl border p-3.5 sm:p-4 transition-all cursor-pointer select-none ${
              mode === 'own'
                ? 'border-blue-500/70 bg-blue-500/8 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-border/70 bg-card hover:border-border hover:bg-muted/30'
            }`}
          >
            <div>
              <div className='flex items-start justify-between gap-2 mb-2'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      mode === 'own' ? 'border-blue-600 bg-blue-600 text-white' : 'border-border'
                    }`}
                  >
                    {mode === 'own' && <div className='size-2 rounded-full bg-white' />}
                  </div>
                  <span className='text-xs sm:text-sm font-bold text-foreground'>
                    فعال‌سازی روی جیمیل شخصی من
                  </span>
                </div>
                <Badge
                  variant='outline'
                  className='text-[10px] sm:text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold'
                >
                  <UserIcon className='size-2.5 me-1' />
                  اکانت شخصی
                </Badge>
              </div>

              <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                جیمیل شخصی خودتان را وارد می‌کنید تا اشتراک مستقیماً روی حساب گوگل فعلی شما فعال شود.
              </p>
            </div>

            <div className='mt-3 pt-3 border-t border-border/40 space-y-1.5 text-[11px] sm:text-xs text-muted-foreground'>
              <div className='flex items-center gap-1.5'>
                <Check className='size-3.5 text-blue-500 shrink-0' />
                <span>حفظ کامل اطلاعات و تاریخچه قبلی شما</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Check className='size-3.5 text-blue-500 shrink-0' />
                <span>بدون نیاز به تعویض حساب کاربری</span>
              </div>
              <div className='flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium'>
                <span className='size-1.5 rounded-full bg-amber-500 shrink-0' />
                <span>زمان فعال‌سازی: ۱ الی ۲۴ ساعت کاری توسط ادمین</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input fields for Option B (Customer's own account) */}
        {mode === 'own' && (
          <div className='rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 sm:p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200'>
            <div className='flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300'>
              <Mail className='size-4 shrink-0' />
              <span>مشخصات حساب شخصی شما جهت فعال‌سازی</span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
              {/* Gmail field */}
              <div className='space-y-1.5'>
                <label className='text-xs sm:text-sm font-semibold text-foreground flex items-center justify-between'>
                  <span className='flex items-center gap-1.5'>
                    <Mail className='size-3.5 text-blue-500 shrink-0' />
                    <span>آدرس جیمیل شما</span>
                    <span className='text-rose-500 font-bold'>*</span>
                  </span>
                  <span className='text-[10px] sm:text-xs text-muted-foreground font-normal'>الزامی</span>
                </label>
                <Input
                  type='email'
                  placeholder='example@gmail.com'
                  value={customerGmail}
                  onChange={(e) => setCustomerGmail(e.target.value)}
                  className='h-10 text-xs sm:text-sm font-mono placeholder:text-xs sm:placeholder:text-sm bg-background border-blue-500/30 focus:border-blue-500'
                  dir='ltr'
                />
              </div>

              {/* Password field */}
              <div className='space-y-1.5'>
                <label className='text-xs sm:text-sm font-semibold text-foreground flex items-center justify-between'>
                  <span className='flex items-center gap-1.5'>
                    <KeyRound className='size-3.5 text-blue-500 shrink-0' />
                    <span>رمزعبور جیمیل</span>
                    <span className='text-rose-500 font-bold'>*</span>
                  </span>
                  <span className='text-[10px] sm:text-xs text-muted-foreground font-normal'>الزامی</span>
                </label>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='رمزعبور اکانت گوگل'
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    className='h-10 text-xs sm:text-sm font-mono placeholder:text-xs sm:placeholder:text-sm bg-background border-blue-500/30 focus:border-blue-500 pe-9'
                    dir='rtl'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                    aria-label={showPassword ? 'مخفی کردن رمزعبور' : 'نمایش رمزعبور'}
                  >
                    {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Comparison Summary Table */}
        {/* <div className='rounded-xl border border-border/50 bg-muted/20 p-3 text-[11px] space-y-1.5'>
          <p className='font-bold text-foreground flex items-center gap-1.5 text-[11.5px]'>
            <span>💡 راهنمای سریع تفاوت دو شیوه تحویل:</span>
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-muted-foreground'>
            <div className='p-2 rounded-lg bg-background/60 border border-border/40'>
              <span className='font-bold text-foreground block mb-0.5'>⚡ اکانت آماده انبار:</span>
              <span>تحویل ۰ ثانیه‌ای بلافاصله پس از پرداخت | ایمیل جدید گوگل بدون نیاز به وارد کردن مشخصات.</span>
            </div>
            <div className='p-2 rounded-lg bg-background/60 border border-border/40'>
              <span className='font-bold text-foreground block mb-0.5'>👤 اکانت شخصی شما:</span>
              <span>تحویل طی چند ساعت توسط ادمین | حفظ تمامی چت‌ها، فایل‌ها و اکانت اصلی فعلی خودتان.</span>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}

// ─── Main Checkout Content ─────────────────────────────────────────────────────
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

  // Coupon states (Section 4.3)
  const [couponInput, setCouponInput] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
    finalAmount: number
  } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user)
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
          const data = await res.json()
          if (data.product) loadedProduct = data.product
        }

        if (!loadedProduct) {
          const res = await fetch('/api/products')
          const data = await res.json()
          if (data.products && data.products.length > 0) {
            if (productIdParam) {
              const found = data.products.find((p: any) => p.id === productIdParam)
              if (found) loadedProduct = found
            }
            if (!loadedProduct) loadedProduct = data.products[0]
          }
        }

        if (loadedProduct) {
          setProduct(loadedProduct)
          // Determine active plan
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

  // Reset or initialize pre-created mode when plan changes or inventory count is updated
  useEffect(() => {
    if (selectedPlan?.fulfillmentType === 'PRE_CREATED_ACCOUNT') {
      if (selectedPlan.availableInventoryCount === 0) {
        setPreCreatedMode('own')
      } else {
        setPreCreatedMode('inventory')
      }
    } else {
      setPreCreatedMode('inventory')
    }
    setCustomerGmail('')
    setCustomerPassword('')
  }, [selectedPlanId, selectedPlan?.availableInventoryCount, selectedPlan?.fulfillmentType])

  const payablePrice = appliedCoupon
    ? Math.max(1000, effectivePrice - appliedCoupon.discountAmount)
    : effectivePrice

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('لطفاً کد تخفیف را وارد نمایید.')
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
    // For PRE_CREATED_ACCOUNT, if 'own' mode, validate gmail and password
    if (isPreCreatedPlan && preCreatedMode === 'own') {
      if (!customerGmail.trim()) {
        toast.error('لطفاً آدرس جیمیل خود را جهت فعال‌سازی وارد نمایید.')
        return false
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(customerGmail.trim())) {
        toast.error('فرمت آدرس جیمیل وارد شده نامعتبر است.')
        return false
      }
      if (!customerPassword.trim()) {
        toast.error('لطفاً رمزعبور جیمیل خود را جهت فعال‌سازی وارد نمایید.')
        return false
      }
    }

    // For PRE_CREATED_ACCOUNT, if in 'inventory' mode but warehouse has 0 stock
    if (
      isPreCreatedPlan &&
      preCreatedMode === 'inventory' &&
      selectedPlan?.availableInventoryCount === 0
    ) {
      toast.error(
        'موجودی اکانت‌های آماده انبار موقتاً به پایان رسیده است. لطفاً گزینه فعال‌سازی روی اکانت شخصی را انتخاب فرمایید.'
      )
      setPreCreatedMode('own')
      return false
    }

    if (!selectedPlan?.checkoutFields || selectedPlan.checkoutFields.length === 0) {
      return true
    }

    const errors: Record<string, string> = {}
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

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBuy = async () => {
    if (!product) return

    if (!validateForm()) {
      if (!isPreCreatedPlan || preCreatedMode !== 'own') {
        toast.error('لطفاً اطلاعات موردنیاز فرم خرید را به درستی تکمیل فرمایید.')
      }
      return
    }

    // Build final checkoutData including pre-created account fields
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

  return (
    <div className='relative min-h-screen bg-background text-foreground flex flex-col font-sans' dir='rtl'>
      {/* Background Ambient Glow */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/6 blur-3xl' />
      </div>

      {/* Header */}
      <header className='border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
          <Link href='/' className='flex items-center gap-2.5 select-none'>
            <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
              <Sparkles className='size-4' />
            </div>
            <span className='text-base sm:text-lg font-bold text-foreground leading-tight'>آریوچت</span>
          </Link>

          <div className='flex items-center gap-2.5'>
            {currentUser && (
              <Link href='/orders'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 sm:h-8.5 gap-1.5 text-xs sm:text-sm rounded-xl border-primary/25 bg-primary/5 hover:bg-primary/10 text-foreground font-medium'
                >
                  <Package className='size-3.5 text-primary' />
                  <span className='hidden sm:inline'>سفارش‌های من</span>
                  <span className='sm:hidden'>سفارش‌ها</span>
                </Button>
              </Link>
            )}
            <ThemeSwitch />
          </div>
        </div>
      </header>

      {/* Main Checkout Section */}
      <main className='flex-1 container mx-auto px-3.5 sm:px-6 py-5 sm:py-8 md:py-10 max-w-xl'>
        {/* Breadcrumb */}
        <nav className='mb-5 sm:mb-6 flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground flex-wrap'>
          <Link href='/' className='hover:text-foreground transition-colors shrink-0'>
            صفحه اصلی
          </Link>
          <ChevronLeft className='size-3 shrink-0' />
          <Link href='/#products' className='hover:text-foreground transition-colors shrink-0'>
            محصولات
          </Link>
          {product && (
            <>
              <ChevronLeft className='size-3 shrink-0' />
              {product.slug ? (
                <Link
                  href={`/products/${product.slug}`}
                  className='hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-[200px]'
                >
                  {productTitle}
                </Link>
              ) : (
                <span className='truncate max-w-[120px] sm:max-w-[200px]'>
                  {productTitle}
                </span>
              )}
            </>
          )}
          <ChevronLeft className='size-3 shrink-0' />
          <span className='truncate text-foreground font-medium'>
            تکمیل سفارش و پرداخت
          </span>
        </nav>

        {/* Page Title & Badges */}
        <div className='text-center mb-5 sm:mb-6'>
          <Badge className='mb-2 bg-primary/10 text-primary border border-primary/20 px-2.5 sm:px-3 py-0.5 text-[11px] sm:text-xs font-semibold'>
            تکمیل سفارش و پرداخت آنلاین
          </Badge>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight'>
            خرید {productTitle}
          </h1>
          {selectedPlan && (
            <p className='text-xs sm:text-sm text-muted-foreground mt-1.5'>
              پلن انتخابی: <strong className='text-foreground'>{selectedPlan.name}</strong> ({getFulfillmentLabel(selectedPlan.fulfillmentType)})
            </p>
          )}
        </div>

        {loading ? (
          <LoadingState message='در حال آماده‌سازی اطلاعات سفارش...' />
        ) : !product ? (
          <Card className='p-6 sm:p-8 text-center border-border/70'>
            <p className='text-muted-foreground mb-4 text-xs sm:text-sm'>محصولی برای خرید در دسترس نیست.</p>
            <Link href='/'>
              <Button variant='outline' size='sm' className='text-xs sm:text-sm'>بازگشت به صفحه اصلی</Button>
            </Link>
          </Card>
        ) : (
          <Card className='relative overflow-hidden border border-primary/30 shadow-2xl shadow-primary/5 bg-card/95 backdrop-blur-xl rounded-2xl'>
            <div className='absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary' />

            <CardHeader className='pb-4 pt-5 sm:pt-6 px-4 sm:px-6 text-center space-y-3'>
              <CardTitle className='text-lg sm:text-xl md:text-2xl font-bold'>{productTitle}</CardTitle>
              {product.shortDescription && (
                <CardDescription className='text-xs sm:text-sm leading-relaxed'>
                  {product.shortDescription}
                </CardDescription>
              )}

              {/* Multiple Plans Selector Pills */}
              {activePlans.length > 1 && (
                <div className='pt-2'>
                  <span className='text-xs sm:text-sm text-muted-foreground block mb-2 font-medium'>
                    انتخاب مدت و پلن اشتراک:
                  </span>
                  <div
                    className='flex flex-wrap items-center justify-center gap-2'
                    role='radiogroup'
                    aria-label='انتخاب مدت و پلن اشتراک'
                  >
                    {activePlans.map((p) => {
                      const isSelected = selectedPlan?.id === p.id
                      return (
                        <button
                          key={p.id}
                          type='button'
                          role='radio'
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60'
                          }`}
                        >
                          <span>{p.name}</span>
                          <span className='ms-1.5 opacity-80'>— {formatPrice(p.price)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Price Display */}
              <div className='mt-3 rounded-2xl bg-primary/5 border border-primary/15 py-3.5 sm:py-4 px-3 sm:px-4'>
                <div className='flex flex-col items-center justify-center gap-1'>
                  {appliedCoupon && (
                    <div className='flex items-center gap-2 text-xs sm:text-sm text-muted-foreground'>
                      <span className='line-through'>{formatPrice(effectivePrice)}</span>
                      <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] sm:text-xs font-bold'>
                        {formatPrice(appliedCoupon.discountAmount)} تخفیف
                      </Badge>
                    </div>
                  )}
                  <div className='flex items-baseline justify-center gap-1.5'>
                    <span className='text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground font-sans'>
                      {formatPrice(payablePrice)}
                    </span>
                  </div>
                </div>
                <div className='mt-1.5 flex flex-wrap items-center justify-center gap-2'>
                  <Badge variant='outline' className='text-[10px] sm:text-xs bg-background/80 text-primary border-primary/30'>
                    {getFulfillmentLabel(selectedPlan?.fulfillmentType)}
                  </Badge>
                  <span className='text-[11px] sm:text-xs text-muted-foreground'>
                    پرداخت امن با شبکه شتاب شاپرک
                  </span>
                </div>
              </div>
            </CardHeader>

            <Separator className='mx-4 sm:mx-6' />

            <CardContent className='pt-5 px-4 sm:px-6 space-y-5 sm:space-y-6'>
              {/* Pre-Created Account Section — special UI for PRE_CREATED_ACCOUNT plans */}
              {isPreCreatedPlan && (
                <PreCreatedAccountSection
                  availableCount={selectedPlan?.availableInventoryCount}
                  customerGmail={customerGmail}
                  setCustomerGmail={setCustomerGmail}
                  customerPassword={customerPassword}
                  setCustomerPassword={setCustomerPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  mode={preCreatedMode}
                  setMode={setPreCreatedMode}
                />
              )}

              {/* Dynamic Checkout Form for Plan Fields */}
              {selectedPlan?.checkoutFields && selectedPlan.checkoutFields.length > 0 && (
                <div className='p-3.5 sm:p-4 rounded-xl bg-muted/25 border border-border/60'>
                  <DynamicCheckoutForm
                    fields={selectedPlan.checkoutFields}
                    values={checkoutData}
                    onChange={handleFieldChange}
                    disabled={buying}
                    errors={formErrors}
                  />
                </div>
              )}

              {/* Coupon Box (Section 4.3) */}
              <div className='p-3 sm:p-3.5 rounded-2xl bg-muted/25 border border-border/70 space-y-2.5'>
                <div className='flex items-center justify-between text-xs sm:text-sm font-semibold text-foreground/90'>
                  <span className='flex items-center gap-1.5'>
                    <Tag className='size-3.5 text-primary' />
                    <span>کد تخفیف دارید؟</span>
                  </span>
                </div>

                {appliedCoupon ? (
                  <div className='flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <Check className='size-4 text-emerald-600 dark:text-emerald-400 shrink-0' />
                      <span className='font-mono font-bold text-foreground'>{appliedCoupon.code}</span>
                      <span className='text-emerald-700 dark:text-emerald-400 font-medium truncate'>
                        ({formatPrice(appliedCoupon.discountAmount)} تخفیف اعمال شد)
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={handleRemoveCoupon}
                      className='h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive shrink-0'
                      title='حذف کد تخفیف'
                    >
                      <X className='size-3.5' />
                    </Button>
                  </div>
                ) : (
                  <div className='flex items-center gap-2'>
                    <Input
                      placeholder='کد تخفیف را وارد کنید...'
                      aria-label='کد تخفیف'
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleApplyCoupon()
                        }
                      }}
                      className='h-10 text-xs sm:text-sm font-mono uppercase bg-background/90 placeholder:text-xs sm:placeholder:text-sm'
                      disabled={validatingCoupon || buying}
                      dir='rtl'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponInput.trim() || buying}
                      aria-busy={validatingCoupon}
                      className='h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold shrink-0 cursor-pointer'
                    >
                      {validatingCoupon ? (
                        <>
                          <Loader2 className='size-3.5 animate-spin' aria-hidden='true' />
                          <span className='sr-only'>در حال بررسی کد تخفیف...</span>
                        </>
                      ) : (
                        'اعمال'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Features list */}
              <div>
                <h3 className='text-xs sm:text-sm font-semibold mb-2 text-muted-foreground'>مزایا و ضمانت‌های این اشتراک:</h3>
                <ul className='space-y-2 text-xs sm:text-sm'>
                  {(
                    Array.isArray(product.features) && product.features.length > 0
                      ? (product.features as string[])
                      : defaultFeatures
                  )
                    .slice(0, 4)
                    .map((feat, idx) => (
                      <li key={idx} className='flex items-center gap-2'>
                        <Check className='size-3.5 text-primary shrink-0' />
                        <span className='text-foreground/90'>{feat}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className='space-y-2.5 pt-2'>
                <Button
                  size='lg'
                  className='w-full h-12 sm:h-14 text-sm sm:text-base font-bold shadow-md cursor-pointer rounded-xl'
                  onClick={handleBuy}
                  disabled={buying}
                  aria-busy={buying}
                >
                  {buying ? (
                    <>
                      <Loader2 className='me-2 size-5 animate-spin' aria-hidden='true' />
                      <span className='sr-only'>در حال اتصال به درگاه پرداخت...</span>
                    </>
                  ) : (
                    <ShoppingCart className='me-2 size-5' aria-hidden='true' />
                  )}
                  اتصال به درگاه پرداخت و دریافت اشتراک
                </Button>

                <div className='flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground text-center'>
                  <Lock className='size-3.5 text-primary shrink-0' />
                  <span>
                    {isPreCreatedPlan && preCreatedMode === 'own'
                      ? 'پس از پرداخت، ادمین اشتراک را روی اکانت شما فعال خواهد کرد'
                      : 'تحویل بلافاصله پس از پرداخت با تضمین بازگشت وجه'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={() => {
          setAuthModalOpen(false)
          handleBuy()
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
