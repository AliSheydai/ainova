import React from 'react'
import { Layers, Plus, Edit3, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type PlanItem, formatPrice, getFulfillmentBadge } from '../types'
import { toPersianDigits } from '@/lib/persian-utils'

interface ProductPlansAccordionProps {
  plans: PlanItem[]
  productId: string
  onAddPlan: (productId: string) => void
  onEditPlan: (plan: PlanItem) => void
  onDeletePlan: (planId: string) => void
}

export function ProductPlansAccordion({
  plans,
  productId,
  onAddPlan,
  onEditPlan,
  onDeletePlan,
}: ProductPlansAccordionProps) {
  return (
    <div className='bg-muted/10 p-4 sm:p-5 space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
          <Layers className='size-3.5 text-primary' />
          <span>پلن‌های فروش این محصول ({plans.length} پلن):</span>
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onAddPlan(productId)}
          className='h-7 px-2 text-xs text-primary hover:text-primary gap-1 font-semibold'
        >
          <Plus className='size-3' />
          <span>پلن جدید</span>
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className='p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl'>
          هنوز پلنی برای این محصول تعریف نشده است. با کلیک بر روی «افزودن پلن جدید» اولین پلن را اضافه نمایید.
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {plans.map((plan) => {
            const fulfillment = getFulfillmentBadge(plan.fulfillmentType)
            const fieldCount = Array.isArray(plan.checkoutFields)
              ? plan.checkoutFields.length
              : 0

            return (
              <div
                key={plan.id}
                className='rounded-xl border border-border/70 bg-card p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:border-primary/40 transition-all'
              >
                <div className='space-y-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <div className='flex items-center gap-1.5 flex-wrap'>
                        <h3 className='font-bold text-foreground text-xs sm:text-sm'>
                          {plan.name}
                        </h3>
                        {!plan.active && (
                          <Badge variant='outline' className='text-[9px] px-1.5 py-0 text-amber-500 border-amber-500/30 bg-amber-500/10'>
                            غیرفعال
                          </Badge>
                        )}
                      </div>
                      <span className='text-[11px] text-muted-foreground'>
                        مدت زمان: {toPersianDigits(plan.duration)} ماهه
                      </span>
                    </div>
                    <Badge variant='outline' className={`text-[10px] font-semibold ${fulfillment.color}`}>
                      {fulfillment.label}
                    </Badge>
                  </div>

                  <div className='pt-1 flex items-baseline justify-between border-t border-border/40'>
                    <span className='text-xs text-muted-foreground'>قیمت:</span>
                    <strong className='text-sm font-bold text-primary font-sans'>
                      {formatPrice(plan.price)}
                    </strong>
                  </div>

                  <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                    <span>فیلدهای Checkout:</span>
                    <Badge variant='outline' className='text-[10px] font-sans'>
                      {toPersianDigits(fieldCount)} فیلد
                    </Badge>
                  </div>
                </div>

                <div className='flex items-center justify-end gap-1.5 pt-2 border-t border-border/40'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onEditPlan(plan)}
                    className='h-7 px-2 text-[11px] gap-1'
                  >
                    <Edit3 className='size-3' />
                    <span>پیکربندی</span>
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onDeletePlan(plan.id)}
                    className='h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600'
                    title='حذف پلن'
                  >
                    <Trash2 className='size-3' />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
