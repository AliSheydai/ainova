'use client'

import React from 'react'
import { Check, Sparkles, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatPrice, toPersianDigits } from '@/lib/persian-utils'

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

        {/* Variants Grid */}
        <div
          role='radiogroup'
          aria-labelledby='variant-selector-heading'
          className='grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5'
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

            return (
              <button
                key={variant.id}
                type='button'
                role='radio'
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onSelectVariant(variant.id)}
                className={`relative flex flex-col justify-between rounded-2xl border p-3 sm:p-3.5 text-start transition-all cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 shadow-xs'
                    : 'border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:bg-card hover:text-foreground'
                }`}
              >
                {/* Optional Badge */}
                {variant.badge && (
                  <div className='absolute -top-2.5 end-2.5 z-10'>
                    <Badge
                      variant='outline'
                      className='bg-background px-1.5 py-0.5 text-[10px] font-semibold text-primary border-primary/30 shadow-2xs'
                    >
                      {variant.badge}
                    </Badge>
                  </div>
                )}

                {/* Top: Name & Duration */}
                <div className='space-y-1 mb-2.5'>
                  <div className='flex items-center justify-between gap-1'>
                    <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {variant.name}
                    </span>
                    <span className='text-[10px] text-muted-foreground font-sans'>
                      {toPersianDigits(variant.duration)} ماهه
                    </span>
                  </div>
                  {variant.description && (
                    <p className='text-[11px] text-muted-foreground line-clamp-1 leading-snug'>
                      {variant.description}
                    </p>
                  )}
                </div>

                {/* Bottom: Pricing & Discount */}
                <div className='pt-2 border-t border-border/40 space-y-1'>
                  {hasDiscount && (
                    <div className='flex items-center justify-between gap-1 text-[11px]'>
                      <span className='line-through text-muted-foreground font-sans'>
                        {formatPrice(variant.price)}
                      </span>
                      <span className='text-[10px] font-medium px-1 py-0.2 rounded-md bg-primary/15 text-primary border border-primary/20'>
                        {variant.discountLabel || (discountPercent ? `${toPersianDigits(discountPercent)}٪` : 'تخفیف')}
                      </span>
                    </div>
                  )}
                  <div className='text-xs sm:text-sm font-bold font-sans text-foreground'>
                    {formatPrice(effectivePrice)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Variant Features & Description Box */}
      {selectedVariant && (
        <div className='space-y-2.5 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-3.5 transition-colors'>
          <div className='flex items-center justify-between text-xs font-semibold text-foreground'>
            <span className='flex items-center gap-1.5'>
              <Sparkles className='size-3.5 text-primary' />
              <span>ویژگی‌های نوع «{selectedVariant.name}»:</span>
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
            <ul className='space-y-1.5 pt-1'>
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
