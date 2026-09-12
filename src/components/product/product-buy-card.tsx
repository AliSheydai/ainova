'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatPrice, toPersianDigits } from '@/lib/persian-utils'

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
  const router = useRouter()

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0]
  const effectivePrice = selectedPlan ? selectedPlan.price : price
  const isAvailable = (selectedPlan?.stock !== undefined ? selectedPlan.stock : stock) > 0

  const handleBuy = async () => {
    if (!isAvailable) {
      toast.error('موجودی این پلن در حال حاضر به پایان رسیده است.')
      return
    }
    const checkoutUrl = selectedPlanId
      ? `/checkout?slug=${slug}&planId=${selectedPlanId}`
      : `/checkout?slug=${slug}`
    router.push(checkoutUrl)
  }

  return (
    <div className='space-y-5'>
      {/* Plan Selector */}
      {plans.length > 1 && (
        <div className='space-y-2'>
          <span id='plan-label' className='text-xs font-medium text-muted-foreground'>
            انتخاب پلن:
          </span>
          <div className='flex flex-wrap gap-2' role='radiogroup' aria-labelledby='plan-label'>
            {plans.map((p) => {
              const isSelected = selectedPlan?.id === p.id
              const planAvailable = (p.stock !== undefined ? p.stock : stock) > 0
              return (
                <button
                  key={p.id}
                  type='button'
                  role='radio'
                  aria-checked={isSelected}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/8 text-foreground font-semibold'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  } ${!planAvailable ? 'opacity-50' : ''}`}
                >
                  <span>{p.name}</span>
                  <span
                    className={`text-xs font-medium font-sans ${isSelected ? 'text-primary' : ''}`}
                  >
                    {formatPrice(p.price)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price + Status */}
      <div className='flex items-end justify-between gap-3 border-t border-border/50 pt-5'>
        <div>
          <span className='mb-1 block text-xs text-muted-foreground'>قیمت نهایی:</span>
          <span className='text-2xl font-bold text-foreground'>{formatPrice(effectivePrice)}</span>
        </div>
        {isAvailable ? (
          <Badge className='bg-primary/8 text-primary border-primary/20 text-xs'>
            آماده تحویل
          </Badge>
        ) : (
          <Badge variant='outline' className='text-destructive/80 border-destructive/20 text-xs'>
            ناموجود
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
          onClick={handleBuy}
          disabled={buying || !isAvailable}
          aria-busy={buying}
          size='lg'
          className='h-12 w-full text-sm font-semibold'
        >
          {buying ? (
            <>
              <Loader2 className='size-4 animate-spin me-2' aria-hidden='true' />
              <span>در حال انتقال...</span>
            </>
          ) : isAvailable ? (
            <>
              <ShoppingCart className='size-4 me-2' aria-hidden='true' />
              <span>ادامه و ثبت سفارش</span>
            </>
          ) : (
            <span>موقتاً ناموجود</span>
          )}
        </Button>

        <p className='text-center text-xs text-muted-foreground'>
          <Lock className='me-1 inline size-3' aria-hidden='true' />
          پرداخت امن — تحویل بلافاصله پس از پرداخت
        </p>
      </div>
    </div>
  )
}
