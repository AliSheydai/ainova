'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, ShoppingCart, Sparkles } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
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
  'تحویل لینک فعال‌سازی پس از پرداخت',
  'پشتیبانی در صورت بروز مشکل',
  'بدون نیاز به ارسال رمز عبور',
]

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

export default function BuyPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProduct)
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
        window.location.href = '/login?redirect=/dashboard/buy'
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
    <>
      <Header>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-col gap-6 p-4 sm:p-6'>
        {/* Page title */}
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
            <ShoppingCart className='size-5 text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-foreground'>
              خرید اشتراک جمینای
            </h1>
            <p className='text-sm text-muted-foreground'>
              یک مرحله تا دسترسی به هوش مصنوعی پیشرفته Google
            </p>
          </div>
        </div>

        <Separator />

        {loading ? (
          <div className='flex items-center justify-center py-16'>
            <Loader2 className='size-6 animate-spin text-muted-foreground' />
          </div>
        ) : !plan ? (
          <div className='py-16 text-center text-sm text-muted-foreground'>
            محصول در دسترس نیست. لطفاً بعداً تلاش کنید.
          </div>
        ) : (
          <div className='mx-auto w-full max-w-md'>
            <Card className='relative overflow-hidden border-primary/25 shadow-lg'>
              {/* Top accent line */}
              <div className='absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60' />

              <CardHeader className='pb-4 pt-7 text-center'>
                <div className='mb-2 flex justify-center'>
                  <Badge className='rounded-full px-3 py-1 text-xs font-medium'>
                    <Sparkles className='me-1.5 size-3' />
                    {plan.name}
                  </Badge>
                </div>
                <CardTitle className='text-xl'>جمینای</CardTitle>
                <CardDescription className='text-sm'>
                  {product.description}
                </CardDescription>

                <div className='mt-5'>
                  <span className='text-4xl font-extrabold text-foreground'>
                    {formatPrice(plan.price)}
                  </span>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    یک‌بار پرداخت — {plan.duration} ماه دسترسی
                  </p>
                </div>
              </CardHeader>

              <Separator className='mx-6' />

              <CardContent className='pt-5'>
                <ul className='mb-6 space-y-3'>
                  {planFeatures.map((feat) => (
                    <li key={feat} className='flex items-start gap-2.5'>
                      <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                      <span className='text-sm text-foreground'>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className='w-full py-5 text-base font-semibold'
                  onClick={handleBuy}
                  disabled={buying}
                >
                  {buying ? (
                    <Loader2 className='me-2 size-4 animate-spin' />
                  ) : (
                    <ShoppingCart className='me-2 size-4' />
                  )}
                  خرید و پرداخت
                </Button>

                <p className='mt-3 text-center text-xs text-muted-foreground'>
                  پس از پرداخت موفق، لینک فعال‌سازی بلافاصله در دسترس خواهد
                  بود
                </p>
              </CardContent>
            </Card>

            <div className='mt-4 flex justify-center'>
              <Link
                href='/dashboard/activation-guide'
                className='text-xs text-primary hover:underline'
              >
                راهنمای فعال‌سازی را بخوانید
              </Link>
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
