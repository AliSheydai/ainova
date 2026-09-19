'use client'

import React from 'react'
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type VariantItem, type PlanItem, formatPrice } from '../types'
import { toPersianDigits, formatPlanDurationLabel } from '@/lib/persian-utils'

interface ProductVariantsAccordionProps {
  variants: VariantItem[]
  plans?: PlanItem[]
  productId: string
  onAddVariant: (productId: string) => void
  onEditVariant: (variant: VariantItem) => void
  onDeleteVariant: (variantId: string) => void
  onAddPlanForVariant?: (productId: string, variantId: string) => void
}

export function ProductVariantsAccordion({
  variants,
  plans = [],
  productId,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
  onAddPlanForVariant,
}: ProductVariantsAccordionProps) {
  return (
    <div className='bg-muted/15 p-4 sm:p-5 space-y-3 border-b border-border/40'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
          <Layers className='size-3.5 text-primary' />
          <span>انواع محصول / اشتراک ({toPersianDigits(variants.length)} نوع):</span>
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onAddVariant(productId)}
          className='h-7 px-2.5 text-xs text-primary hover:text-primary gap-1 font-semibold rounded-lg'
        >
          <Plus className='size-3' />
          <span>نوع محصول جدید</span>
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className='p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-background/50 space-y-1.5'>
          <p className='font-medium'>هنوز نوع محصولی (Variant) برای این محصول تعریف نشده است.</p>
          <p className='text-[11px] text-muted-foreground/80'>
            می‌توانید با ایجاد انواع مختلف (مانند پرو، پلاس، دانشجویی و...)، سطوح و امکانات مختلف را با قیمت‌های مجزا به مشتریان پیشنهاد دهید.
          </p>
          <div className='pt-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onAddVariant(productId)}
              className='h-7 px-3 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 rounded-lg'
            >
              <Plus className='size-3' />
              <span>ایجاد اولین نوع محصول</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {variants.map((variant) => {
            const hasDiscount =
              variant.discountedPrice !== null &&
              variant.discountedPrice !== undefined &&
              variant.discountedPrice > 0 &&
              variant.discountedPrice < variant.price

            const discountPercent = hasDiscount
              ? Math.round(((variant.price - variant.discountedPrice!) / variant.price) * 100)
              : 0

            // Count plans associated with this variant
            const linkedPlans = plans.filter((p) => p.variantId === variant.id)
            const plansCount = linkedPlans.length > 0 ? linkedPlans.length : variant._count?.plans || 0

            const features = Array.isArray(variant.features) ? variant.features : []

            return (
              <div
                key={variant.id}
                className='rounded-xl border border-border/70 bg-card p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:border-primary/40 transition-all'
              >
                <div className='space-y-2.5'>
                  {/* Header: Name, Badge, Active status */}
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 space-y-1'>
                      <div className='flex items-center gap-1.5 flex-wrap'>
                        <h3 className='font-bold text-foreground text-xs sm:text-sm truncate'>
                          {variant.name}
                        </h3>
                        {variant.badge && (
                          <Badge
                            variant='outline'
                            className='text-[9.5px] px-1.5 py-0 text-primary border-primary/30 bg-primary/10 font-bold gap-0.5'
                          >
                            <Sparkles className='size-2.5' />
                            <span>{variant.badge}</span>
                          </Badge>
                        )}
                        {!variant.active && (
                          <Badge
                            variant='outline'
                            className='text-[9px] px-1.5 py-0 text-muted-foreground border-border bg-muted/40'
                          >
                            غیرفعال
                          </Badge>
                        )}
                      </div>

                      <div className='flex items-center gap-2 text-[11px] text-muted-foreground'>
                        <span className='flex items-center gap-1'>
                          <Clock className='size-3 text-primary shrink-0' />
                          <span>{formatPlanDurationLabel(variant.duration)}</span>
                        </span>
                        {variant.slug && (
                          <span className='font-mono text-[10px] text-muted-foreground/70'>
                            /{variant.slug}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge variant='outline' className='text-[10px] font-sans shrink-0'>
                      ترتیب #{toPersianDigits(variant.sortOrder)}
                    </Badge>
                  </div>

                  {/* Description if any */}
                  {variant.description && (
                    <p className='text-[11px] text-muted-foreground line-clamp-2 leading-relaxed'>
                      {variant.description}
                    </p>
                  )}

                  {/* Price Section */}
                  <div className='pt-2 flex items-baseline justify-between border-t border-border/40'>
                    <span className='text-xs text-muted-foreground'>قیمت:</span>
                    <div className='text-end'>
                      {hasDiscount ? (
                        <div className='flex items-center gap-1.5'>
                          <span className='text-[11px] text-muted-foreground line-through font-sans'>
                            {formatPrice(variant.price)}
                          </span>
                          <strong className='text-sm font-bold text-primary font-sans'>
                            {formatPrice(variant.discountedPrice!)}
                          </strong>
                          <span className='text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.2 rounded'>
                            {variant.discountLabel || `${toPersianDigits(discountPercent)}٪`}
                          </span>
                        </div>
                      ) : (
                        <strong className='text-sm font-bold text-primary font-sans'>
                          {formatPrice(variant.price)}
                        </strong>
                      )}
                    </div>
                  </div>

                  {/* Features preview */}
                  {features.length > 0 && (
                    <div className='space-y-1 pt-1 border-t border-border/40'>
                      <div className='flex flex-wrap gap-1'>
                        {features.slice(0, 2).map((feat, idx) => (
                          <span
                            key={idx}
                            className='inline-flex items-center gap-1 text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded'
                          >
                            <Check className='size-2.5 text-primary shrink-0' />
                            <span className='truncate max-w-[140px]'>{feat}</span>
                          </span>
                        ))}
                        {features.length > 2 && (
                          <span className='text-[9.5px] text-muted-foreground self-center'>
                            +{toPersianDigits(features.length - 2)} مورد دیگر
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Associated Plans Metric */}
                  <div className='flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40'>
                    <span>پلن‌های متصل (نحوه تحویل):</span>
                    <div className='flex items-center gap-1.5'>
                      <Badge variant='outline' className='text-[10px] font-sans'>
                        {toPersianDigits(plansCount)} پلن
                      </Badge>
                      {onAddPlanForVariant && (
                        <button
                          type='button'
                          onClick={() => onAddPlanForVariant(productId, variant.id)}
                          className='text-[10px] text-primary hover:underline'
                          title='افزودن پلن جدید برای این نوع محصول'
                        >
                          + پلن
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className='flex items-center justify-end gap-1.5 pt-2 border-t border-border/40'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onEditVariant(variant)}
                    className='h-7 px-2 text-[11px] gap-1 rounded-lg'
                  >
                    <Edit3 className='size-3' />
                    <span>ویرایش</span>
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onDeleteVariant(variant.id)}
                    className='h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg'
                    title='حذف یا غیرفعال‌سازی این نوع محصول'
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
