'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Loader2,
  Tag,
  Check,
  X,
  Lock,
  ChevronDown,
  ShieldCheck,
  Zap,
  PencilLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice, toPersianDigits } from '@/lib/persian-utils'
import { cn } from '@/lib/utils'

interface CheckoutOrderSummaryProps {
  productTitle: string
  productSlug?: string
  productImage?: string | null
  planName: string
  fulfillmentType?: string
  variantName?: string | null
  variantDuration?: number | null
  variantBadge?: string | null
  originalPrice?: number | null
  variantDiscountLabel?: string | null
  hasVariantDiscount?: boolean
  effectivePrice: number
  payablePrice: number
  appliedCoupon: {
    code: string
    discountAmount: number
    finalAmount: number
  } | null
  couponInput: string
  setCouponInput: (v: string) => void
  validatingCoupon: boolean
  handleApplyCoupon: () => void
  handleRemoveCoupon: () => void
  buying: boolean
  handleBuy: () => void
  deliveryPreferenceLabel?: string
}

export function CheckoutOrderSummary({
  productTitle,
  productSlug,
  productImage,
  planName,
  fulfillmentType,
  variantName,
  variantDuration,
  variantBadge,
  originalPrice,
  variantDiscountLabel,
  hasVariantDiscount = false,
  effectivePrice,
  payablePrice,
  appliedCoupon,
  couponInput,
  setCouponInput,
  validatingCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  buying,
  handleBuy,
  deliveryPreferenceLabel,
}: CheckoutOrderSummaryProps) {
  const [couponOpen, setCouponOpen] = useState(Boolean(appliedCoupon))

  return (
    <div className='relative overflow-hidden rounded-2xl border border-primary/25 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur-xl transition-all'>
      {/* Top Gradient Accent Bar */}
      <div className='h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20' />

      <div className='p-4 sm:p-5 space-y-4'>
        {/* Header: Title and Plan Info */}
        <div>
          <div className='flex items-center justify-between gap-2 mb-2'>
            <span className='text-[11px] font-bold uppercase tracking-wider text-primary'>
              پیش‌فاکتور و خلاصه سفارش
            </span>
            {fulfillmentType && (
              <Badge
                variant='outline'
                className='text-[10.5px] font-medium bg-primary/8 text-primary border-primary/20 py-0.5'
              >
                {fulfillmentType}
              </Badge>
            )}
          </div>

          <div className='flex items-start gap-3'>
            {productImage ? (
              <div className='size-12 rounded-xl overflow-hidden border border-border/70 bg-muted/30 shrink-0 p-1'>
                <img
                  src={productImage}
                  alt={productTitle}
                  className='size-full object-contain'
                />
              </div>
            ) : (
              <div className='size-12 rounded-xl border border-primary/20 bg-primary/5 text-primary flex items-center justify-center shrink-0 font-bold'>
                <Zap className='size-5' />
              </div>
            )}

            <div className='flex-1 min-w-0'>
              <h3 className='text-sm sm:text-base font-bold text-foreground leading-snug truncate'>
                {productTitle}
              </h3>

              {variantName && (
                <div className='flex items-center gap-1.5 text-xs text-muted-foreground mt-1 flex-wrap'>
                  <span>نوع:</span>
                  <span className='font-bold text-foreground'>{variantName}</span>
                  {variantDuration ? (
                    <span className='text-[11px] text-muted-foreground font-sans'>
                      ({toPersianDigits(variantDuration)} ماهه)
                    </span>
                  ) : null}
                  {variantBadge && (
                    <Badge
                      variant='outline'
                      className='text-[10px] py-0 px-1.5 bg-primary/10 border-primary/20 text-primary font-medium'
                    >
                      {variantBadge}
                    </Badge>
                  )}
                </div>
              )}

              <div className='flex items-center justify-between gap-2 mt-1'>
                <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <span>{variantName ? 'نحوه تحویل:' : 'پلن:'}</span>
                  <span className='font-bold text-foreground'>{planName}</span>
                </div>

                {productSlug && (
                  <Link
                    href={`/products/${productSlug}`}
                    className='text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5 shrink-0 transition-colors'
                    title='تغییر پلن یا انتخاب گزینه دیگر'
                  >
                    <PencilLine className='size-3' />
                    <span>تغییر</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {deliveryPreferenceLabel && (
            <div className='mt-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground'>
              <span className='size-1.5 rounded-full bg-primary shrink-0' />
              <span>شیوه تحویل:</span>
              <span className='font-medium text-foreground'>{deliveryPreferenceLabel}</span>
            </div>
          )}
        </div>

        <Separator className='bg-border/60' />

        {/* Collapsible Coupon Code Section */}
        <div className='space-y-2'>
          {!appliedCoupon ? (
            <div>
              <button
                type='button'
                onClick={() => setCouponOpen(!couponOpen)}
                className='flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1'
                aria-expanded={couponOpen}
              >
                <span className='flex items-center gap-1.5'>
                  <Tag className='size-3.5 text-primary' />
                  <span>کد تخفیف دارید؟</span>
                </span>
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform duration-200',
                    couponOpen ? 'rotate-180 text-primary' : ''
                  )}
                />
              </button>

              {couponOpen && (
                <div className='pt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150'>
                  <Input
                    placeholder='کد تخفیف را وارد کنید...'
                    aria-label='کد تخفیف'
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleApplyCoupon()
                      }
                    }}
                    className='h-9 text-xs font-mono uppercase bg-background/90 placeholder:text-xs'
                    disabled={validatingCoupon || buying}
                    dir='rtl'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponInput.trim() || buying}
                    aria-busy={validatingCoupon}
                    className='h-9 px-3 text-xs font-semibold shrink-0 cursor-pointer rounded-xl border-primary/30 hover:bg-primary/10'
                  >
                    {validatingCoupon ? (
                      <Loader2 className='size-3.5 animate-spin' aria-hidden='true' />
                    ) : (
                      'اعمال'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-xs'>
              <div className='flex items-center gap-2 min-w-0'>
                <Check className='size-3.5 text-primary shrink-0' />
                <span className='font-mono font-bold text-foreground'>{appliedCoupon.code}</span>
                <span className='text-primary font-medium text-[11px] truncate'>
                  ({formatPrice(appliedCoupon.discountAmount)} تخفیف)
                </span>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleRemoveCoupon}
                className='h-6 w-6 p-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer'
                title='حذف کد تخفیف'
              >
                <X className='size-3.5' />
              </Button>
            </div>
          )}
        </div>

        <Separator className='bg-border/60' />

        {/* Pricing Calculation Details */}
        <div className='space-y-2 text-xs sm:text-sm'>
          {variantName && (
            <div className='flex items-center justify-between text-muted-foreground'>
              <span>نوع محصول:</span>
              <span className='font-medium text-foreground flex items-center gap-1'>
                <span>{variantName}</span>
                {variantDuration ? (
                  <span className='text-xs text-muted-foreground font-sans'>
                    ({toPersianDigits(variantDuration)} ماهه)
                  </span>
                ) : null}
              </span>
            </div>
          )}

          <div className='flex items-center justify-between text-muted-foreground'>
            <span>قیمت پایه اشتراک:</span>
            <span
              className={cn(
                'font-sans font-medium',
                hasVariantDiscount
                  ? 'line-through text-muted-foreground/70'
                  : 'text-foreground'
              )}
            >
              {formatPrice(originalPrice ?? effectivePrice)}
            </span>
          </div>

          {hasVariantDiscount && originalPrice && originalPrice > effectivePrice && (
            <div className='flex items-center justify-between text-primary font-medium'>
              <span className='flex items-center gap-1.5'>
                <span>تخفیف ویژه نوع اشتراک:</span>
                {variantDiscountLabel && (
                  <Badge variant='outline' className='text-[10px] py-0 px-1.5 bg-primary/10 border-primary/20 text-primary font-medium'>
                    {variantDiscountLabel}
                  </Badge>
                )}
              </span>
              <span className='font-sans text-primary font-bold'>
                - {formatPrice(originalPrice - effectivePrice)}
              </span>
            </div>
          )}

          {appliedCoupon && (
            <div className='flex items-center justify-between text-primary font-medium'>
              <span className='flex items-center gap-1.5'>
                <span>تخفیف کوپن:</span>
                <Badge variant='outline' className='text-[10px] py-0 px-1 bg-primary/10 border-primary/20 text-primary'>
                  {appliedCoupon.code}
                </Badge>
              </span>
              <span className='font-sans text-primary font-bold'>- {formatPrice(appliedCoupon.discountAmount)}</span>
            </div>
          )}

          <div className='pt-2.5 border-t border-border/60 flex items-baseline justify-between'>
            <div>
              <span className='text-xs sm:text-sm font-bold text-foreground block'>
                مبلغ نهایی قابل پرداخت:
              </span>
              <span className='text-[10.5px] text-muted-foreground'>
                شامل کلیه خدمات و پشتیبانی
              </span>
            </div>
            <div className='text-start'>
              <span className='text-xl sm:text-2xl font-black text-foreground font-sans tracking-tight'>
                {formatPrice(payablePrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Primary CTA Button */}
        <div className='pt-1 space-y-2'>
          <Button
            size='lg'
            className='w-full h-12 sm:h-12.5 text-sm sm:text-base font-bold shadow-md shadow-primary/15 cursor-pointer rounded-xl transition-all'
            onClick={handleBuy}
            disabled={buying}
            aria-busy={buying}
          >
            {buying ? (
              <>
                <Loader2 className='me-2 size-4.5 animate-spin' aria-hidden='true' />
                <span>در حال انتقال به درگاه...</span>
              </>
            ) : (
              <>
                <ShoppingCart className='me-2 size-4.5' aria-hidden='true' />
                <span>تکمیل و پرداخت آنلاین</span>
              </>
            )}
          </Button>

          <div className='flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center pt-0.5'>
            <Lock className='size-3.5 text-primary shrink-0' />
            <span>پرداخت امن شاپرک با کلیه کارت‌های بانکی عضو شتاب</span>
          </div>
        </div>

        {/* Compact Trust Features */}
        <div className='pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-center text-[10.5px] text-muted-foreground'>
          <div className='flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-muted/25'>
            <ShieldCheck className='size-3.5 text-primary shrink-0' />
            <span>ضمانت رسمی فعال‌سازی</span>
          </div>
          <div className='flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg bg-muted/25'>
            <Zap className='size-3.5 text-primary shrink-0' />
            <span>تحویل سریع و خودکار</span>
          </div>
        </div>
      </div>
    </div>
  )
}
