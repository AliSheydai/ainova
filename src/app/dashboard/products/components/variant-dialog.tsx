'use client'

import React, { useState } from 'react'
import {
  Layers,
  Tag,
  Clock,
  Plus,
  Minus,
  Coins,
  ArrowUpDown,
  Sparkles,
  Check,
  X,
  Percent,
  AlertCircle,
  FileText,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  toEnglishDigits,
  toPersianDigits,
  formatNumberWithCommas,
  numberToWordsPersian,
  formatPlanDurationLabel,
} from '@/lib/persian-utils'

const COMMON_BADGES = [
  'پرفروش',
  'پیشنهاد ویژه',
  'محبوب',
  'اقتصادی',
  'تخفیف ویژه',
  'حرفه‌ای',
]

const COMMON_FEATURE_SUGGESTIONS = [
  'دسترسی نامحدود به تمام مدل‌ها',
  'پشتیبانی اولویت‌دار ۲۴/۷',
  'امکان استفاده API بدون محدودیت',
  'گارانتی تعویض و بازگشت وجه',
  'بدون قطعی با سرعت بالا',
  'پشتیبانی از پردازش ابری پرسرعت',
]

interface VariantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  variantTargetProductTitle: string
  submitting: boolean
  // Form State
  formVariantName: string
  setFormVariantName: (v: string) => void
  formVariantSlug: string
  setFormVariantSlug: (v: string) => void
  formVariantDescription: string
  setFormVariantDescription: (v: string) => void
  formVariantPrice: string
  setFormVariantPrice: (v: string) => void
  formVariantDiscountedPrice: string
  setFormVariantDiscountedPrice: (v: string) => void
  formVariantDiscountLabel: string
  setFormVariantDiscountLabel: (v: string) => void
  formVariantDuration: string
  setFormVariantDuration: (v: string) => void
  formVariantFeatures: string[]
  setFormVariantFeatures: (v: string[]) => void
  formVariantBadge: string
  setFormVariantBadge: (v: string) => void
  formVariantActive: boolean
  setFormVariantActive: (v: boolean) => void
  formVariantSortOrder: string
  setFormVariantSortOrder: (v: string) => void
  onSave: () => void
}

export function VariantDialog({
  open,
  onOpenChange,
  isEditing,
  variantTargetProductTitle,
  submitting,
  formVariantName,
  setFormVariantName,
  formVariantSlug,
  setFormVariantSlug,
  formVariantDescription,
  setFormVariantDescription,
  formVariantPrice,
  setFormVariantPrice,
  formVariantDiscountedPrice,
  setFormVariantDiscountedPrice,
  formVariantDiscountLabel,
  setFormVariantDiscountLabel,
  formVariantDuration,
  setFormVariantDuration,
  formVariantFeatures,
  setFormVariantFeatures,
  formVariantBadge,
  setFormVariantBadge,
  formVariantActive,
  setFormVariantActive,
  formVariantSortOrder,
  setFormVariantSortOrder,
  onSave,
}: VariantDialogProps) {
  const [newFeatureInput, setNewFeatureInput] = useState('')

  // Formatted display values
  const formattedPriceDisplay = toPersianDigits(formatNumberWithCommas(formVariantPrice))
  const priceInWords = numberToWordsPersian(formVariantPrice)

  const formattedDiscountedPriceDisplay = toPersianDigits(
    formatNumberWithCommas(formVariantDiscountedPrice)
  )
  const discountedPriceInWords = numberToWordsPersian(formVariantDiscountedPrice)

  const rawPriceNum = parseInt(toEnglishDigits(formVariantPrice).replace(/[^\d]/g, ''), 10) || 0
  const rawDiscountedPriceNum =
    parseInt(toEnglishDigits(formVariantDiscountedPrice).replace(/[^\d]/g, ''), 10) || 0

  const hasValidDiscount =
    rawDiscountedPriceNum > 0 && rawPriceNum > 0 && rawDiscountedPriceNum < rawPriceNum

  const discountPercent = hasValidDiscount
    ? Math.round(((rawPriceNum - rawDiscountedPriceNum) / rawPriceNum) * 100)
    : 0

  const durationNum =
    parseInt(toEnglishDigits(formVariantDuration).replace(/[^\d]/g, ''), 10) || 1
  const durationFriendlyText = formatPlanDurationLabel(durationNum)

  const sortOrderNum =
    parseInt(toEnglishDigits(formVariantSortOrder).replace(/[^\d]/g, ''), 10) || 1

  // Price handlers
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = toEnglishDigits(raw).replace(/[^\d]/g, '')
    setFormVariantPrice(cleaned)
  }

  const handleDiscountedPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = toEnglishDigits(raw).replace(/[^\d]/g, '')
    setFormVariantDiscountedPrice(cleaned)
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(e.target.value).replace(/[^\d]/g, '')
    setFormVariantDuration(cleaned)
  }

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(e.target.value).replace(/[^\d]/g, '')
    setFormVariantSortOrder(cleaned)
  }

  const incrementDuration = () => {
    setFormVariantDuration(String(durationNum + 1))
  }

  const decrementDuration = () => {
    if (durationNum > 1) {
      setFormVariantDuration(String(durationNum - 1))
    }
  }

  const incrementSortOrder = () => {
    setFormVariantSortOrder(String(sortOrderNum + 1))
  }

  const decrementSortOrder = () => {
    if (sortOrderNum > 1) {
      setFormVariantSortOrder(String(sortOrderNum - 1))
    }
  }

  // Feature list handlers
  const handleAddFeature = () => {
    const trimmed = newFeatureInput.trim()
    if (!trimmed) return
    if (formVariantFeatures.includes(trimmed)) {
      setNewFeatureInput('')
      return
    }
    setFormVariantFeatures([...formVariantFeatures, trimmed])
    setNewFeatureInput('')
  }

  const handleRemoveFeature = (indexToRemove: number) => {
    setFormVariantFeatures(formVariantFeatures.filter((_, idx) => idx !== indexToRemove))
  }

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddFeature()
    }
  }

  const handleSelectSuggestedFeature = (feat: string) => {
    if (!formVariantFeatures.includes(feat)) {
      setFormVariantFeatures([...formVariantFeatures, feat])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-full max-w-full sm:max-w-2xl p-3.5 sm:p-6 box-border max-h-[90vh] flex flex-col'>
        <DialogHeader className='pb-3 border-b border-border/50 min-w-0 w-full shrink-0'>
          <div className='flex items-center gap-2.5 min-w-0'>
            <div className='size-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs'>
              <Layers className='size-4' />
            </div>
            <div className='min-w-0 text-start flex-1'>
              <DialogTitle className='text-sm sm:text-base font-bold truncate'>
                {isEditing ? 'ویرایش مشخصات نوع محصول (Product Variant)' : 'ایجاد نوع جدید محصول'}
              </DialogTitle>
              <DialogDescription className='text-[11px] sm:text-xs text-muted-foreground truncate'>
                محصول هدف: <strong className='text-foreground'>{variantTargetProductTitle}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className='space-y-4 sm:space-y-5 py-2 overflow-y-auto flex-1 pe-1'>
          {/* Section 1: Basic Information */}
          <div className='bg-card rounded-2xl border border-border/70 p-3.5 sm:p-5 shadow-xs space-y-4'>
            {/* Header & Status Toggle */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/40'>
              <div className='flex items-center gap-2'>
                <Tag className='size-4 text-primary shrink-0' />
                <div>
                  <h3 className='text-xs sm:text-sm font-bold text-foreground'>
                    مشخصات عمومی نوع محصول
                  </h3>
                  <p className='text-[10.5px] text-muted-foreground'>
                    نام، اسلاگ، توضیحات و برچسب معرف
                  </p>
                </div>
              </div>

              {/* Active Status Switch */}
              <div className='flex items-center justify-between sm:justify-end gap-2.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 shrink-0 select-none'>
                <span
                  className={`text-[11px] font-semibold transition-colors ${
                    formVariantActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {formVariantActive ? 'نوع فعال' : 'نوع غیرفعال'}
                </span>
                <Switch
                  checked={formVariantActive}
                  onCheckedChange={setFormVariantActive}
                  className='shrink-0'
                />
              </div>
            </div>

            {/* Row 1: Name & Slug */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                  <span>نام نوع محصول</span>
                  <span className='text-destructive font-bold'>*</span>
                  <span className='text-[10px] text-muted-foreground font-normal'>
                    (مثلاً: پرو، پلاس، دانشجویی)
                  </span>
                </label>
                <Input
                  value={formVariantName}
                  onChange={(e) => setFormVariantName(e.target.value)}
                  placeholder='مثال: پرو (Pro)'
                  className='text-xs sm:text-sm h-10 rounded-xl px-3'
                  dir='rtl'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                  <span>اسلاگ انگلیسی (Slug)</span>
                  <span className='text-[10px] text-muted-foreground font-normal'>
                    (اختیاری)
                  </span>
                </label>
                <Input
                  value={formVariantSlug}
                  onChange={(e) => setFormVariantSlug(e.target.value)}
                  placeholder='pro-plan'
                  className='text-xs sm:text-sm h-10 rounded-xl px-3 font-mono'
                  dir='ltr'
                />
              </div>
            </div>

            {/* Row 2: Badge & Description */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                  <Sparkles className='size-3 text-primary' />
                  <span>برچسب نمایشی (Badge)</span>
                  <span className='text-[10px] text-muted-foreground font-normal'>
                    (اختیاری)
                  </span>
                </label>
                {formVariantBadge.trim() && (
                  <Badge variant='outline' className='text-[10px] text-primary border-primary/30 bg-primary/10'>
                    {formVariantBadge.trim()}
                  </Badge>
                )}
              </div>
              <Input
                value={formVariantBadge}
                onChange={(e) => setFormVariantBadge(e.target.value)}
                placeholder='مثال: پرفروش یا پیشنهاد ویژه'
                className='text-xs sm:text-sm h-9 rounded-xl px-3'
                dir='rtl'
              />
              {/* Quick Badge Chips */}
              <div className='flex items-center gap-1.5 pt-1 flex-wrap'>
                <span className='text-[10px] text-muted-foreground shrink-0'>پیشنهاد:</span>
                {COMMON_BADGES.map((b) => {
                  const isSelected = formVariantBadge.trim() === b
                  return (
                    <button
                      key={b}
                      type='button'
                      onClick={() => setFormVariantBadge(isSelected ? '' : b)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {b}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                <FileText className='size-3 text-muted-foreground' />
                <span>توضیح کوتاه این نوع محصول</span>
                <span className='text-[10px] text-muted-foreground font-normal'>
                  (اختیاری)
                </span>
              </label>
              <Textarea
                value={formVariantDescription}
                onChange={(e) => setFormVariantDescription(e.target.value)}
                placeholder='توضیح مختصری درباره مزایا و دسترسی‌های این نوع اشتراک...'
                className='text-xs rounded-xl min-h-[60px]'
                dir='rtl'
              />
            </div>
          </div>

          {/* Section 2: Financial & Pricing */}
          <div className='bg-card rounded-2xl border border-border/70 p-3.5 sm:p-5 shadow-xs space-y-4'>
            <div className='flex items-center gap-2 pb-3 border-b border-border/40'>
              <Coins className='size-4 text-primary shrink-0' />
              <div>
                <h3 className='text-xs sm:text-sm font-bold text-foreground'>
                  قیمت‌گذاری و تخفیف
                </h3>
                <p className='text-[10.5px] text-muted-foreground'>
                  تعیین قیمت اصلی، قیمت باتخفیف و برچسب تخفیف
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
              {/* Original Price */}
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                  <span>قیمت اصلی (تومان)</span>
                  <span className='text-destructive font-bold'>*</span>
                </label>
                <div className='relative'>
                  <Input
                    value={formVariantPrice}
                    onChange={handlePriceChange}
                    placeholder='مثال: ۱۲۰۰۰۰۰'
                    className='text-xs sm:text-sm h-10 rounded-xl px-3 font-sans'
                    dir='ltr'
                  />
                  <div className='absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none'>
                    تومان
                  </div>
                </div>

                {formattedPriceDisplay && (
                  <div className='text-[11px] text-muted-foreground flex items-center justify-between gap-1 pt-0.5'>
                    <span>رقم: <strong className='text-foreground'>{formattedPriceDisplay}</strong> تومان</span>
                    {priceInWords && (
                      <span className='text-[10px] text-primary truncate'>({priceInWords} تومان)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Discounted Price */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                    <Percent className='size-3 text-primary' />
                    <span>قیمت با تخفیف (تومان)</span>
                    <span className='text-[10px] text-muted-foreground font-normal'>(اختیاری)</span>
                  </label>
                  {hasValidDiscount && (
                    <Badge variant='outline' className='text-[10px] text-primary border-primary/30 bg-primary/10 font-bold'>
                      {toPersianDigits(discountPercent)}٪ تخفیف
                    </Badge>
                  )}
                </div>

                <div className='relative'>
                  <Input
                    value={formVariantDiscountedPrice}
                    onChange={handleDiscountedPriceChange}
                    placeholder='مثال: ۸۹۰۰۰۰'
                    className='text-xs sm:text-sm h-10 rounded-xl px-3 font-sans'
                    dir='ltr'
                  />
                  <div className='absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none'>
                    تومان
                  </div>
                </div>

                {formattedDiscountedPriceDisplay && (
                  <div className='text-[11px] text-muted-foreground flex items-center justify-between gap-1 pt-0.5'>
                    <span>رقم: <strong className='text-foreground'>{formattedDiscountedPriceDisplay}</strong> تومان</span>
                    {discountedPriceInWords && (
                      <span className='text-[10px] text-primary truncate'>({discountedPriceInWords} تومان)</span>
                    )}
                  </div>
                )}

                {rawDiscountedPriceNum >= rawPriceNum && rawPriceNum > 0 && rawDiscountedPriceNum > 0 && (
                  <p className='text-[10.5px] text-destructive flex items-center gap-1 pt-0.5'>
                    <AlertCircle className='size-3 shrink-0' />
                    <span>قیمت تخفیف‌خورده باید کمتر از قیمت اصلی باشد.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Discount Label */}
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                <span>برچسب تخفیف (Discount Label)</span>
                <span className='text-[10px] text-muted-foreground font-normal'>
                  (اختیاری — مثلاً: ۳۰٪ تخفیف، ویژه جشنواره، قیمت ویژه)
                </span>
              </label>
              <Input
                value={formVariantDiscountLabel}
                onChange={(e) => setFormVariantDiscountLabel(e.target.value)}
                placeholder='مثال: ۳۰٪ تخفیف یا قیمت افتتاحیه'
                className='text-xs sm:text-sm h-9 rounded-xl px-3'
                dir='rtl'
              />
            </div>
          </div>

          {/* Section 3: Duration & Ordering */}
          <div className='bg-card rounded-2xl border border-border/70 p-3.5 sm:p-5 shadow-xs space-y-4'>
            <div className='flex items-center gap-2 pb-3 border-b border-border/40'>
              <Clock className='size-4 text-primary shrink-0' />
              <div>
                <h3 className='text-xs sm:text-sm font-bold text-foreground'>
                  دوره زمانی و ترتیب چیدمان
                </h3>
                <p className='text-[10.5px] text-muted-foreground'>
                  طول دوره اشتراک و اولویت نمایش در کارت محصول
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
              {/* Duration Stepper */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                    <span>مدت زمان اشتراک (ماه):</span>
                    <span className='text-destructive font-bold'>*</span>
                  </label>
                  {durationFriendlyText && (
                    <span className='text-[10.5px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg'>
                      {durationFriendlyText}
                    </span>
                  )}
                </div>

                <div className='flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 transition-all'>
                  <button
                    type='button'
                    onClick={incrementDuration}
                    className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted transition-colors border-e border-input/60 shrink-0 cursor-pointer'
                  >
                    <Plus className='size-3.5' />
                  </button>
                  <Input
                    value={formVariantDuration}
                    onChange={handleDurationChange}
                    className='h-9 text-center border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-xs sm:text-sm'
                    dir='ltr'
                  />
                  <button
                    type='button'
                    onClick={decrementDuration}
                    disabled={durationNum <= 1}
                    className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors border-s border-input/60 shrink-0 cursor-pointer'
                  >
                    <Minus className='size-3.5' />
                  </button>
                </div>
              </div>

              {/* Sort Order Stepper */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <label className='text-xs font-semibold text-foreground flex items-center gap-1'>
                    <ArrowUpDown className='size-3.5 text-primary' />
                    <span>ترتیب نمایش (Sort Order):</span>
                  </label>
                  <span className='text-[10.5px] text-muted-foreground font-mono'>
                    #{toPersianDigits(sortOrderNum)}
                  </span>
                </div>

                <div className='flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 transition-all'>
                  <button
                    type='button'
                    onClick={incrementSortOrder}
                    className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted transition-colors border-e border-input/60 shrink-0 cursor-pointer'
                  >
                    <Plus className='size-3.5' />
                  </button>
                  <Input
                    value={formVariantSortOrder}
                    onChange={handleSortOrderChange}
                    className='h-9 text-center border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-sans text-xs sm:text-sm'
                    dir='ltr'
                  />
                  <button
                    type='button'
                    onClick={decrementSortOrder}
                    disabled={sortOrderNum <= 1}
                    className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors border-s border-input/60 shrink-0 cursor-pointer'
                  >
                    <Minus className='size-3.5' />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Features List */}
          <div className='bg-card rounded-2xl border border-border/70 p-3.5 sm:p-5 shadow-xs space-y-3.5'>
            <div className='flex items-center justify-between pb-3 border-b border-border/40'>
              <div className='flex items-center gap-2'>
                <Sparkles className='size-4 text-primary shrink-0' />
                <div>
                  <h3 className='text-xs sm:text-sm font-bold text-foreground'>
                    ویژگی‌ها و مزایای اختصاصی این نوع
                  </h3>
                  <p className='text-[10.5px] text-muted-foreground'>
                    آیتم‌هایی که در باکس انتخاب نوع اشتراک با تیک سبز نمایش داده می‌شوند
                  </p>
                </div>
              </div>
              <Badge variant='outline' className='text-[10px] font-sans'>
                {toPersianDigits(formVariantFeatures.length)} ویژگی
              </Badge>
            </div>

            {/* Input to add feature */}
            <div className='flex items-center gap-2'>
              <Input
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                onKeyDown={handleFeatureKeyDown}
                placeholder='عنوان ویژگی (مثال: دسترسی به مدل GPT-4o)...'
                className='text-xs sm:text-sm h-9 rounded-xl px-3 flex-1'
                dir='rtl'
              />
              <Button
                type='button'
                size='sm'
                onClick={handleAddFeature}
                disabled={!newFeatureInput.trim()}
                className='h-9 px-3 text-xs gap-1 rounded-xl shrink-0'
              >
                <Plus className='size-3.5' />
                <span>افزودن</span>
              </Button>
            </div>

            {/* Rendered Features Chips */}
            {formVariantFeatures.length > 0 ? (
              <div className='flex flex-wrap gap-2 pt-1'>
                {formVariantFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className='inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border/70 text-xs shadow-2xs transition-colors'
                  >
                    <Check className='size-3 text-primary shrink-0' />
                    <span>{feat}</span>
                    <button
                      type='button'
                      onClick={() => handleRemoveFeature(idx)}
                      className='size-4 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors ms-1 cursor-pointer'
                      title='حذف ویژگی'
                    >
                      <X className='size-3' />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='p-3 text-center text-[11px] text-muted-foreground border border-dashed rounded-xl bg-muted/20'>
                هنوز ویژگی خاصی افزوده نشده است. می‌توانید با تایپ متن بالا یا انتخاب از پیشنهادات زیر ویژگی اضافه کنید.
              </div>
            )}

            {/* Feature Suggestions */}
            <div className='space-y-1.5 pt-1'>
              <span className='text-[10.5px] text-muted-foreground font-medium block'>
                پیشنهادات سریع:
              </span>
              <div className='flex flex-wrap gap-1.5'>
                {COMMON_FEATURE_SUGGESTIONS.map((feat) => {
                  const alreadyAdded = formVariantFeatures.includes(feat)
                  return (
                    <button
                      key={feat}
                      type='button'
                      onClick={() => handleSelectSuggestedFeature(feat)}
                      disabled={alreadyAdded}
                      className={`text-[10px] px-2 py-1 rounded-md border text-start transition-all ${
                        alreadyAdded
                          ? 'bg-muted/40 text-muted-foreground border-border/40 opacity-50 cursor-not-allowed'
                          : 'bg-background hover:bg-muted/80 text-foreground border-border/60 hover:border-primary/40 cursor-pointer'
                      }`}
                    >
                      + {feat}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className='pt-3 border-t border-border/50 flex-col-reverse sm:flex-row gap-2 shrink-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className='text-xs h-9 rounded-xl'
          >
            انصراف
          </Button>
          <Button
            type='button'
            onClick={onSave}
            disabled={submitting}
            className='text-xs h-9 rounded-xl gap-1.5 font-bold shadow-xs'
          >
            {submitting ? (
              <>
                <span className='size-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin' />
                <span>در حال ثبت...</span>
              </>
            ) : (
              <>
                <Check className='size-4' />
                <span>{isEditing ? 'ذخیره تغییرات نوع محصول' : 'ایجاد و ثبت نوع محصول'}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
