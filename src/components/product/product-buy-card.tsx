'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Loader2,
  Lock,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { AuthModal } from '@/components/auth/auth-modal'

interface ProductBuyCardProps {
  productId: string
  productTitle: string
  slug: string
  price: number
  stock: number
  purchaseCount: number
  fulfillmentType: string
  shortDescription?: string | null
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

export function ProductBuyCard({
  productId,
  productTitle,
  slug,
  price,
  stock,
  purchaseCount,
  fulfillmentType,
  shortDescription,
}: ProductBuyCardProps) {
  const [buying, setBuying] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const router = useRouter()

  const isAvailable = stock > 0

  const handleBuy = async () => {
    if (!isAvailable) {
      toast.error('موجودی این محصول در حال حاضر به پایان رسیده است.')
      return
    }

    setBuying(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, slug }),
      })

      const data = await res.json()

      if (res.status === 401) {
        setAuthModalOpen(true)
        return
      }

      if (data.success && data.paymentUrl) {
        toast.success('سفارش شما با موفقیت ثبت شد. انتقال به درگاه پرداخت...')
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.message || 'خطا در ثبت سفارش.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور. لطفاً مجدداً تلاش فرمایید.')
    } finally {
      setBuying(false)
    }
  }

  return (
    <>
      <Card className='relative overflow-hidden border-primary/25 shadow-xl shadow-primary/5 bg-card/90 backdrop-blur-md'>
        {/* Top gradient stripe */}
        <div className='absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary' />

        <CardContent className='p-6 sm:p-7 space-y-6'>
          {/* Price Header */}
          <div className='flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-border/40'>
            <div>
              <span className='text-xs text-muted-foreground block mb-1'>قیمت نهایی اشتراک:</span>
              <div className='flex items-baseline gap-1.5'>
                <span className='text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans'>
                  {formatPrice(price)}
                </span>
              </div>
            </div>
            {isAvailable ? (
              <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 gap-1'>
                <Zap className='size-3 text-emerald-500' />
                <span>تحویل آنی و خودکار</span>
              </Badge>
            ) : (
              <Badge variant='outline' className='text-rose-500 border-rose-500/30 text-xs px-2.5 py-1'>
                اتمام موجودی موقت
              </Badge>
            )}
          </div>

          {/* Real-time stats */}
          <div className='grid grid-cols-2 gap-3 text-xs'>
            <div className='p-3 rounded-xl bg-muted/40 border border-border/40'>
              <span className='text-muted-foreground block text-[11px] mb-0.5'>موجودی فعال انبار</span>
              <strong className={`text-sm font-sans ${isAvailable ? 'text-primary' : 'text-rose-500 font-bold'}`}>
                {isAvailable ? `${stock.toLocaleString('fa-IR')} عدد موجود` : 'ناموجود'}
              </strong>
            </div>

            <div className='p-3 rounded-xl bg-muted/40 border border-border/40'>
              <span className='text-muted-foreground block text-[11px] mb-0.5'>سفارش‌های موفق</span>
              <strong className='text-sm text-foreground font-sans'>
                {purchaseCount.toLocaleString('fa-IR')} خریدار راضی
              </strong>
            </div>
          </div>

          {/* Action Button */}
          <div className='space-y-2.5 pt-1'>
            <Button
              onClick={handleBuy}
              disabled={buying || !isAvailable}
              size='lg'
              className='w-full py-6 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200'
            >
              {buying ? (
                <>
                  <Loader2 className='size-5 animate-spin me-2' />
                  <span>در حال ایجاد پیش‌فاکتور...</span>
                </>
              ) : isAvailable ? (
                <>
                  <ShoppingCart className='size-5 me-2' />
                  <span>خرید و دریافت آنی اشتراک</span>
                  <ArrowLeft className='size-4 ms-2 transition-transform group-hover:-translate-x-1' />
                </>
              ) : (
                <span>موقتاً ناموجود</span>
              )}
            </Button>

            <p className='text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5'>
              <Lock className='size-3 text-primary' />
              <span>پرداخت امن شتابی با درگاه شاپرک — تحویل بلافاصله پس از پرداخت</span>
            </p>
          </div>

          {/* Trust Guarantees */}
          <div className='pt-4 border-t border-border/40 space-y-2 text-xs text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='size-3.5 text-emerald-500 shrink-0' />
              <span>فعال‌سازی رسمی و قانونی روی اکانت شخصی شما</span>
            </div>
            <div className='flex items-center gap-2'>
              <ShieldCheck className='size-3.5 text-primary shrink-0' />
              <span>۱۰۰٪ امن و بدون نیاز به ارسال پسورد حساب کاربری</span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='size-3.5 text-amber-500 shrink-0' />
              <span>پشتیبانی همه‌روزه و راهنمای کامل گام‌به‌گام</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={() => {
          setAuthModalOpen(false)
          handleBuy()
        }}
      />
    </>
  )
}
