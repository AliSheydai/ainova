'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Check,
  Loader2,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  Layers,
  Zap,
} from 'lucide-react'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { AuthModal } from '@/components/auth/auth-modal'
import { DynamicCheckoutForm } from '@/components/checkout/dynamic-checkout-form'
import { CheckoutFieldDefinition } from '@/lib/fulfillment/types'

interface PlanData {
  id: string
  name: string
  price: number
  duration: number
  active: boolean
  fulfillmentType: string
  checkoutFields?: CheckoutFieldDefinition[]
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
  plans?: PlanData[]
}

const defaultFeatures = [
  'فعال‌سازی رسمی و قانونی بدون ریسک قطعی',
  'تحویل فوری و خودکار بلافاصله پس از پرداخت',
  'دسترسی کامل به قابلیت‌های هوش مصنوعی',
  'پشتیبانی تخصصی در تمامی مراحل فعال‌سازی',
  'بدون نیاز به ارسال رمز عبور یا اطلاعات حساس',
]

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

function getFulfillmentLabel(type?: string) {
  switch (type) {
    case 'ACTIVATION_LINK':
      return 'لینک فعال‌سازی آنی'
    case 'PRE_CREATED_ACCOUNT':
      return 'اکانت آماده (تحویل فوری رمز)'
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
      toast.error('لطفاً اطلاعات موردنیاز فرم خرید را به درستی تکمیل فرمایید.')
      return
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
          checkoutData,
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
            <span className='text-base font-bold text-foreground'>فروشگاه اشتراک‌های دیجیتال</span>
          </Link>

          <div className='flex items-center gap-3'>
            <ThemeSwitch />
            <Link href='/'>
              <Button variant='ghost' size='sm' className='gap-1 text-xs'>
                <span>بازگشت به سایت</span>
                <ArrowRight className='size-3.5' />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Checkout Section */}
      <main className='flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-xl'>
        <div className='text-center mb-6'>
          <Badge className='mb-2 bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 text-xs font-semibold'>
            تکمیل سفارش و پرداخت آنلاین
          </Badge>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight'>
            خرید {productTitle}
          </h1>
          {selectedPlan && (
            <p className='text-xs sm:text-sm text-muted-foreground mt-1.5'>
              پلن انتخابی: <strong className='text-foreground'>{selectedPlan.name}</strong> ({getFulfillmentLabel(selectedPlan.fulfillmentType)})
            </p>
          )}
        </div>

        {loading ? (
          <div className='flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground'>
            <Loader2 className='size-8 animate-spin text-primary' />
            <span className='text-xs'>در حال آماده‌سازی اطلاعات سفارش...</span>
          </div>
        ) : !product ? (
          <Card className='p-8 text-center border-border/70'>
            <p className='text-muted-foreground mb-4 text-xs'>محصولی برای خرید در دسترس نیست.</p>
            <Link href='/'>
              <Button variant='outline' size='sm'>بازگشت به صفحه اصلی</Button>
            </Link>
          </Card>
        ) : (
          <Card className='relative overflow-hidden border border-primary/30 shadow-2xl shadow-primary/5 bg-card/95 backdrop-blur-xl rounded-2xl'>
            <div className='absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary' />

            <CardHeader className='pb-4 pt-6 text-center space-y-3'>
              <CardTitle className='text-xl sm:text-2xl font-bold'>{productTitle}</CardTitle>
              {product.shortDescription && (
                <CardDescription className='text-xs sm:text-sm'>
                  {product.shortDescription}
                </CardDescription>
              )}

              {/* Multiple Plans Selector Pills */}
              {activePlans.length > 1 && (
                <div className='pt-2'>
                  <span className='text-xs text-muted-foreground block mb-2 font-medium'>
                    انتخاب مدت و پلن اشتراک:
                  </span>
                  <div className='flex flex-wrap items-center justify-center gap-2'>
                    {activePlans.map((p) => (
                      <button
                        key={p.id}
                        type='button'
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                          selectedPlan?.id === p.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className='ms-1.5 opacity-80'>— {formatPrice(p.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Display */}
              <div className='mt-3 rounded-2xl bg-primary/5 border border-primary/15 py-4 px-4'>
                <div className='flex items-baseline justify-center gap-1.5'>
                  <span className='text-3xl sm:text-4xl font-extrabold text-foreground font-sans'>
                    {formatPrice(effectivePrice)}
                  </span>
                </div>
                <div className='mt-1.5 flex items-center justify-center gap-2'>
                  <Badge variant='outline' className='text-[10px] bg-background/80 text-primary border-primary/30'>
                    {getFulfillmentLabel(selectedPlan?.fulfillmentType)}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    پرداخت امن با شبکه شتاب شاپرک
                  </span>
                </div>
              </div>
            </CardHeader>

            <Separator className='mx-6' />

            <CardContent className='pt-5 space-y-6'>
              {/* Dynamic Checkout Form for Plan Fields */}
              {selectedPlan?.checkoutFields && selectedPlan.checkoutFields.length > 0 && (
                <div className='p-4 rounded-xl bg-muted/25 border border-border/60'>
                  <DynamicCheckoutForm
                    fields={selectedPlan.checkoutFields}
                    values={checkoutData}
                    onChange={handleFieldChange}
                    disabled={buying}
                    errors={formErrors}
                  />
                </div>
              )}

              {/* Features list */}
              <div>
                <h3 className='text-xs font-semibold mb-2 text-muted-foreground'>ضمانت‌های این اشتراک:</h3>
                <ul className='space-y-2 text-xs'>
                  {defaultFeatures.slice(0, 3).map((feat) => (
                    <li key={feat} className='flex items-center gap-2'>
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
                  className='w-full py-6 text-base font-bold shadow-md cursor-pointer'
                  onClick={handleBuy}
                  disabled={buying}
                >
                  {buying ? (
                    <Loader2 className='me-2 size-5 animate-spin' />
                  ) : (
                    <ShoppingCart className='me-2 size-5' />
                  )}
                  اتصال به درگاه پرداخت و دریافت اشتراک
                </Button>

                <div className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
                  <Lock className='size-3.5 text-primary' />
                  <span>تحویل بلافاصله پس از پرداخت با تضمین بازگشت وجه</span>
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
        <div className='min-h-screen flex items-center justify-center'>
          <Loader2 className='size-8 animate-spin text-primary' />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
