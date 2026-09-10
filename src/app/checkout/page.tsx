'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check, Loader2, ShoppingCart, Sparkles, ArrowRight, ShieldCheck, Lock } from 'lucide-react'
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
  plans?: Array<{ id: string; name: string; price: number; duration: number }>
}

const defaultFeatures = [
  'فعال‌سازی روی حساب شخصی شما',
  'تحویل آنی و خودکار پس از پرداخت',
  'دسترسی به قابلیت‌های پیشرفته هوش مصنوعی',
  'پشتیبانی در تمامی مراحل فعال‌سازی',
  'بدون نیاز به ارسال رمز عبور یا اطلاعات حساس',
]

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const slugParam = searchParams.get('slug') || searchParams.get('product')
  const productIdParam = searchParams.get('productId')

  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      try {
        if (slugParam) {
          const res = await fetch(`/api/products/${slugParam}`)
          const data = await res.json()
          if (data.product) {
            setProduct(data.product)
            return
          }
        }

        // Fallback to first active product
        const res = await fetch('/api/products')
        const data = await res.json()
        if (data.products && data.products.length > 0) {
          if (productIdParam) {
            const found = data.products.find((p: any) => p.id === productIdParam)
            if (found) {
              setProduct(found)
              return
            }
          }
          setProduct(data.products[0])
        } else if (data && !data.error) {
          setProduct(data)
        }
      } catch (err) {
        console.error('Failed to load product for checkout:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slugParam, productIdParam])

  const effectivePrice = product?.price || product?.plans?.[0]?.price || 0
  const productTitle = product?.title || product?.name || 'اشتراک ویژه'

  const handleBuy = async () => {
    if (!product) return
    setBuying(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          slug: product.slug,
          planId: product.plans?.[0]?.id,
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
      <main className='flex-1 container mx-auto px-4 sm:px-6 py-10 sm:py-14 max-w-xl'>
        <div className='text-center mb-8'>
          <Badge className='mb-3 bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 text-xs font-semibold'>
            تکمیل سفارش و پرداخت آنلاین
          </Badge>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight'>
            خرید {productTitle}
          </h1>
          <p className='text-xs sm:text-sm text-muted-foreground mt-2'>
            دسترسی سریع و آنی بلافاصله پس از پرداخت بدون نیاز به پسورد
          </p>
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

            <CardHeader className='pb-4 pt-7 text-center'>
              <CardTitle className='text-2xl font-bold'>{productTitle}</CardTitle>
              {product.shortDescription && (
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  {product.shortDescription}
                </CardDescription>
              )}

              <div className='mt-6 rounded-2xl bg-primary/5 border border-primary/15 py-5 px-4'>
                <span className='text-3xl sm:text-4xl font-extrabold text-foreground font-sans'>
                  {formatPrice(effectivePrice)}
                </span>
                <p className='mt-1.5 text-xs text-muted-foreground'>
                  پرداخت امن از طریق درگاه شتاب / شاپرک با تحویل آنی
                </p>
              </div>
            </CardHeader>

            <Separator className='mx-6' />

            <CardContent className='pt-6'>
              <h3 className='text-xs font-semibold mb-3 text-muted-foreground'>مزایای این اشتراک:</h3>
              <ul className='mb-8 space-y-3'>
                {defaultFeatures.map((feat) => (
                  <li key={feat} className='flex items-start gap-2.5 text-xs sm:text-sm'>
                    <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                    <span className='text-foreground/90'>{feat}</span>
                  </li>
                ))}
              </ul>

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
                اتصال به درگاه پرداخت و دریافت آنی
              </Button>

              <div className='mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
                <Lock className='size-3.5 text-primary' />
                <span>ضمانت فعال‌سازی کامل و تحویل آنی پس از پرداخت</span>
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
