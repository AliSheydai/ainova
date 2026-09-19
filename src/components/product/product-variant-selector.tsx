'use client'

import React from 'react'
import { Calendar, Check, Sparkles, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatPersianNumber, formatPrice, toPersianDigits } from '@/lib/persian-utils'

export interface ProductVariantItem {
  id: string
  productId: string
  name: string
  slug?: string | null
  description?: string | null
  price: number
  discountedPrice?: number | null
  discountLabel?: string | null
  duration: number
  features?: string[] | null
  badge?: string | null
  active?: boolean
  sortOrder?: number
}

interface ProductVariantSelectorProps {
  variants: ProductVariantItem[]
  selectedVariantId: string | null
  onSelectVariant: (variantId: string) => void
}

export function ProductVariantSelector({
  variants,
  selectedVariantId,
  onSelectVariant,
}: ProductVariantSelectorProps) {
  if (!variants || variants.length === 0) {
    return null
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0]

  return (
    <div className='space-y-4'>
      {/* Header & Variant Cards */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between'>
          <label
            id='variant-selector-heading'
            className='text-xs font-semibold text-muted-foreground flex items-center gap-1.5'
          >
            <Tag className='size-3.5 text-primary' />
            <span>انتخاب نوع اشتراک:</span>
          </label>
          <span className='text-[11px] text-muted-foreground font-sans'>
            {toPersianDigits(variants.length)} نوع موجود
          </span>
        </div>

        {/* Variants Grid — Balanced 2-column layout with top clearance for border badges */}
        <div
          role='radiogroup'
          aria-labelledby='variant-selector-heading'
          className='grid grid-cols-2 gap-3 pt-1.5'
        >
          {variants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id
            const hasDiscount =
              variant.discountedPrice !== null &&
              variant.discountedPrice !== undefined &&
              variant.discountedPrice > 0 &&
              variant.discountedPrice < variant.price

            const effectivePrice = hasDiscount ? variant.discountedPrice! : variant.price
            const discountPercent = hasDiscount
              ? Math.round(((variant.price - variant.discountedPrice!) / variant.price) * 100)
              : null

            const discountBadgeText =
              variant.discountLabel ||
              (discountPercent ? `${toPersianDigits(discountPercent)}٪ تخفیف` : 'تخفیف')

            return (
              <button
                key={variant.id}
                type='button'
                role='radio'
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onSelectVariant(variant.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-start transition-all cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary bg-primary/[0.08] dark:bg-primary/[0.12] text-foreground ring-2 ring-primary/25 shadow-xs'
                    : 'border-border/80 bg-card/60 text-muted-foreground hover:border-primary/50 hover:bg-card hover:text-foreground'
                }`}
              >
                {/* Border Badge — Positioned on the top edge of the card */}
                {variant.badge && (
                  <div className='absolute -top-2.5 end-3 z-10'>
                    <Badge
                      variant='outline'
                      className='bg-background px-2 py-0.5 text-[10px] font-semibold text-primary border-primary/30 shadow-2xs whitespace-nowrap'
                    >
                      {variant.badge}
                    </Badge>
                  </div>
                )}

                {/* Top Section: Radio Indicator, Variant Name & Duration */}
                <div className='space-y-1.5'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <div
                      className={`size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/35 bg-background/50 group-hover:border-primary/50'
                      }`}
                      aria-hidden='true'
                    >
                      {isSelected && <Check className='size-2.5 stroke-[3]' />}
                    </div>
                    <span
                      className={`text-sm sm:text-base font-bold leading-tight truncate transition-colors ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}
                      title={variant.name}
                    >
                      {variant.name}
                    </span>
                  </div>

                  {/* Duration sub-row */}
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground/80 font-sans pe-1'>
                    <Calendar className='size-3.5 text-muted-foreground/60 shrink-0' />
                    <span>اعتبار: {toPersianDigits(variant.duration)} ماهه</span>
                  </div>
                </div>

                {/* Bottom Section: Non-wrapping Pricing & Cohesive Discount Breakdown */}
                <div className='pt-2.5 mt-2.5 border-t border-border/50'>
                  {/* Discount row: Clean single-line layout using primary theme styling */}
                  <div className='h-5 flex items-center justify-between gap-1.5 font-sans'>
                    {hasDiscount ? (
                      <>
                        <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap leading-none'>
                          {discountBadgeText}
                        </span>
                        <span className='text-[11px] text-muted-foreground/70 line-through whitespace-nowrap font-medium'>
                          {formatPersianNumber(variant.price)} تومان
                        </span>
                      </>
                    ) : (
                      <div className='h-full' aria-hidden='true' />
                    )}
                  </div>

                  {/* Effective Final Price */}
                  <div className='flex items-baseline justify-between gap-1 mt-1'>
                    <div className='flex items-baseline gap-1 font-sans'>
                      <span className='text-base sm:text-lg font-black tracking-tight text-foreground whitespace-nowrap'>
                        {formatPersianNumber(effectivePrice)}
                      </span>
                      <span className='text-[11px] font-medium text-muted-foreground whitespace-nowrap'>
                        تومان
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Variant Features & Description Box */}
      {selectedVariant && (
        <div className='space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-3.5 sm:p-4 transition-colors'>
          <div className='flex items-center justify-between text-xs font-semibold text-foreground border-b border-border/40 pb-2.5'>
            <span className='flex items-center gap-1.5'>
              <Sparkles className='size-3.5 text-primary' />
              <span>ویژگی‌های اشتراک «{selectedVariant.name}»:</span>
            </span>
            <span className='text-[11px] text-muted-foreground font-sans'>
              مدت اعتبار: {toPersianDigits(selectedVariant.duration)} ماه
            </span>
          </div>

          {selectedVariant.description && (
            <p className='text-xs text-muted-foreground leading-relaxed'>
              {selectedVariant.description}
            </p>
          )}

          {Array.isArray(selectedVariant.features) && selectedVariant.features.length > 0 ? (
            <ul className='grid grid-cols-1 gap-2 pt-1'>
              {selectedVariant.features.map((feat, idx) => (
                <li
                  key={idx}
                  className='flex items-start gap-2 text-xs text-foreground/90 leading-relaxed'
                >
                  <Check className='size-3.5 mt-0.5 shrink-0 text-primary' />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-[11px] text-muted-foreground italic'>
              دسترسی کامل با تحویل رسمی و پشتیبانی اختصاصی.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
