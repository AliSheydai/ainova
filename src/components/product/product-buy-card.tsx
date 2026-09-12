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
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { AuthModal } from '@/components/auth/auth-modal'

interface PlanItem {
  id: string
  name: string
  price: number
  duration: number
  fulfillmentType?: string
  stock?: number
}

interface ProductBuyCardProps {
  productId: string
  productTitle: string
  slug: string
  price: number
  stock: number
  purchaseCount: number
  fulfillmentType?: string
  shortDescription?: string | null
  plans?: PlanItem[]
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

function getFulfillmentLabel(type?: string) {
  switch (type) {
    case 'ACTIVATION_LINK':
      return 'لینک فعال‌سازی آنی'
    case 'PRE_CREATED_ACCOUNT':
      return 'اکانت آماده (تحویل فوری)'
    case 'CUSTOMER_PROVISIONING':
      return 'فعال‌سازی روی اکانت شما'
    case 'MANUAL':
      return 'تحویل توسط پشتیبانی'
    default:
      return 'تحویل خودکار'
  }
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
  plans = [],
}: ProductBuyCardProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    plans.length > 0 ? plans[0].id : null
  )
  const [buying, setBuying] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const router = useRouter()

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0]
  const effectivePrice = selectedPlan ? selectedPlan.price : price
  const effectiveFulfillmentType = selectedPlan?.fulfillmentType || fulfillmentType
  const isAvailable = (selectedPlan?.stock !== undefined ? selectedPlan.stock : stock) > 0

  const handleBuy = async () => {
    if (!isAvailable) {
      toast.error('موجودی این پلن در حال حاضر به پایان رسیده است.')
      return
    }

    // Always navigate to checkout page so user can fill in required fields or confirm plan
    const checkoutUrl = selectedPlanId
      ? `/checkout?slug=${slug}&planId=${selectedPlanId}`
      : `/checkout?slug=${slug}`

    router.push(checkoutUrl)
  }

  return (
    <>
      <Card className='relative overflow-hidden border-primary/25 shadow-xl shadow-primary/5 bg-card/90 backdrop-blur-md'>
        {/* Top gradient stripe */}
        <div className='absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary' />

        <CardContent className='p-6 sm:p-7 space-y-6'>
          {/* Plan Selection if multiple plans available */}
          {plans.length > 1 && (
            <div className='space-y-2 pb-2'>
              <span className='text-xs text-muted-foreground block font-medium'>
                پلن‌های قابل سفارش:
              </span>
              <div className='grid grid-cols-1 gap-2'>
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type='button'
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedPlan?.id === p.id
                        ? 'border-primary bg-primary/10 text-foreground font-bold shadow-xs'
                        : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className='flex items-center gap-2'>
                      <div className={`size-3.5 rounded-full border flex items-center justify-center ${selectedPlan?.id === p.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                        {selectedPlan?.id === p.id && <div className='size-1.5 rounded-full bg-background' />}
                      </div>
                      <span>{p.name}</span>
                    </div>
                    <strong className='font-sans text-primary'>
                      {formatPrice(p.price)}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Header */}
          <div className='flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-border/40'>
            <div>
              <span className='text-xs text-muted-foreground block mb-1'>قیمت نهایی اشتراک:</span>
              <div className='flex items-baseline gap-1.5'>
                <span className='text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-sans'>
                  {formatPrice(effectivePrice)}
                </span>
              </div>
            </div>
            {isAvailable ? (
              <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 gap-1'>
                <Zap className='size-3 text-emerald-500' />
                <span>{getFulfillmentLabel(effectiveFulfillmentType)}</span>
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
              <span className='text-muted-foreground block text-[11px] mb-0.5'>وضعیت دسترسی</span>
              <strong className={`text-sm font-sans ${isAvailable ? 'text-primary' : 'text-rose-500 font-bold'}`}>
                {isAvailable ? 'آماده تحویل' : 'ناموجود'}
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
              className='w-full py-6 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 cursor-pointer'
            >
              {buying ? (
                <>
                  <Loader2 className='size-5 animate-spin me-2' />
                  <span>در حال انتقال...</span>
                </>
              ) : isAvailable ? (
                <>
                  <ShoppingCart className='size-5 me-2' />
                  <span>ثبت سفارش و ادامه خرید</span>
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
              <span>فعال‌سازی رسمی و قانونی</span>
            </div>
            <div className='flex items-center gap-2'>
              <ShieldCheck className='size-3.5 text-primary shrink-0' />
              <span>۱۰۰٪ امن و با ضمانت بازگشت وجه</span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='size-3.5 text-amber-500 shrink-0' />
              <span>پشتیبانی همه‌روزه و راهنمای کامل گام‌به‌گام</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
