'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, ShoppingCart, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
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

interface Plan {
  id: string
  name: string
  duration: number
  price: number
}

interface Product {
  id: string
  name: string
  description: string
  plans: Plan[]
}

const planFeatures = [
  'فعال‌سازی روی حساب شخصی Google',
  'اشتراک جمینای — دسترسی مطابق پلن',
  'دسترسی به Gemini و قابلیت‌های پیشرفته AI',
  'تحویل لینک فعال‌سازی بلافاصله پس از پرداخت',
  'پشتیبانی در صورت بروز مشکل',
  'بدون نیاز به ارسال رمز عبور یا اطلاعات حساس',
]

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

export default function CheckoutPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setProduct(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const plan = product?.plans?.[0]

  const handleBuy = async () => {
    if (!plan) return
    setBuying(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
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
    <div className='min-h-screen bg-background text-foreground flex flex-col'>
      {/* Header */}
      <header className='border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
          <Link href='/' className='flex items-center gap-2.5'>
            <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
              <Sparkles className='size-4' />
            </div>
            <span className='text-base font-bold text-foreground'>جمینای</span>
          </Link>

          <div className='flex items-center gap-3'>
            <ThemeSwitch />
            <Link href='/'>
              <Button variant='ghost' size='sm' className='text-xs flex items-center gap-1.5'>
                <ArrowRight className='size-4' />
                <span>بازگشت به سایت</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1 container mx-auto px-4 py-8 max-w-2xl'>
        {/* Title */}
        <div className='text-center mb-8'>
          <Badge variant='outline' className='mb-3 px-3 py-1 text-xs border-primary/30 text-primary'>
            تکمیل فرآیند خرید
          </Badge>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>
            خرید اشتراک اختصاصی Google AI Pro
          </h1>
          <p className='text-sm text-muted-foreground mt-2'>
            دسترسی سریع و آنی روی جیمیل شخصی بدون نیاز به پسورد
          </p>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='size-8 animate-spin text-primary' />
          </div>
        ) : !plan ? (
          <Card className='p-8 text-center'>
            <p className='text-muted-foreground mb-4'>محصول یا پلنی برای خرید در دسترس نیست.</p>
            <Link href='/'>
              <Button variant='outline'>بازگشت به صفحه اصلی</Button>
            </Link>
          </Card>
        ) : (
          <Card className='relative overflow-hidden border-primary/30 shadow-xl'>
            <div className='absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40' />

            <CardHeader className='pb-4 pt-7 text-center'>
              <div className='mb-2 flex justify-center'>
                <Badge className='rounded-full px-3 py-1 text-xs font-medium'>
                  <Sparkles className='me-1.5 size-3' />
                  {plan.name}
                </Badge>
              </div>
              <CardTitle className='text-2xl font-bold'>{product.name}</CardTitle>
              <CardDescription className='text-sm mt-1'>
                {product.description || 'اشتراک ویژه هوش مصنوعی جمینای'}
              </CardDescription>

              <div className='mt-6 rounded-xl bg-primary/5 border border-primary/15 py-4'>
                <span className='text-3xl sm:text-4xl font-extrabold text-foreground'>
                  {formatPrice(plan.price)}
                </span>
                <p className='mt-1 text-xs text-muted-foreground'>
                  پرداخت امن از طریق درگاه شتاب / زرین‌پال ({plan.duration} ماهه)
                </p>
              </div>
            </CardHeader>

            <Separator className='mx-6' />

            <CardContent className='pt-6'>
              <h3 className='text-sm font-semibold mb-3'>مزایای این اشتراک:</h3>
              <ul className='mb-8 space-y-3'>
                {planFeatures.map((feat) => (
                  <li key={feat} className='flex items-start gap-2.5 text-sm'>
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
                اتصال به درگاه پرداخت و خرید
              </Button>

              <div className='mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
                <ShieldCheck className='size-4 text-emerald-500' />
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
