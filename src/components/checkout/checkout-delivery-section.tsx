'use client'

import React, { useState, useEffect } from 'react'
import {
  Package,
  Zap,
  Clock,
  User as UserIcon,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Warehouse,
  Check,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CheckoutDeliverySectionProps {
  availableCount: number | null | undefined
  mode: 'inventory' | 'own'
  setMode: (mode: 'inventory' | 'own') => void
  customerGmail: string
  setCustomerGmail: (v: string) => void
  customerPassword: string
  setCustomerPassword: (v: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  errors?: Record<string, string>
  onClearError?: (field: string) => void
  disabled?: boolean
}

export function CheckoutDeliverySection({
  availableCount,
  mode,
  setMode,
  customerGmail,
  setCustomerGmail,
  customerPassword,
  setCustomerPassword,
  showPassword,
  setShowPassword,
  errors = {},
  onClearError,
  disabled = false,
}: CheckoutDeliverySectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasInventory = availableCount !== null && availableCount !== undefined && availableCount > 0
  const isInventoryExhausted = availableCount !== null && availableCount !== undefined && availableCount === 0
  const inventoryUnknown = availableCount === null || availableCount === undefined

  // Auto-open if there is any validation error in personal gmail / password fields
  useEffect(() => {
    if (errors && (errors.customerGmail || errors.customerPassword)) {
      setIsOpen(true)
    }
  }, [errors])

  return (
    <div className='rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-xs space-y-4'>
      {/* Header (Collapsible Toggle) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between gap-2.5 sm:gap-3 transition-colors cursor-pointer select-none',
          isOpen ? 'pb-3 border-b border-border/60' : ''
        )}
        role='button'
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
          <div className='size-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs'>
            <Package className='size-4' />
          </div>
          <div className='min-w-0 flex-1'>
            <h2 className='text-sm sm:text-base font-bold text-foreground flex items-center gap-2'>
              <span>شیوه تحویل اشتراک</span>
              <span className='text-rose-500 font-bold'>*</span>
            </h2>
            <p className='text-[11px] sm:text-xs text-muted-foreground leading-relaxed'>
              {isOpen
                ? 'تمایل دارید اکانت آماده دریافت کنید یا روی جیمیل شخصی شما فعال شود؟'
                : mode === 'inventory'
                  ? 'انتخاب فعلی: اکانت اختصاصی آماده (تحویل آنی)'
                  : 'انتخاب فعلی: فعال‌سازی روی جیمیل شخصی شما'}
            </p>
          </div>
        </div>

        {/* Right side status & toggle button */}
        <div className='flex items-center gap-2 shrink-0'>
          {!inventoryUnknown && hasInventory && (
            <Badge
              variant='outline'
              className='text-[10.5px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-1 hidden sm:inline-flex'
            >
              <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse me-1.5' />
              <Warehouse className='size-3.5 me-1' />
              <span>{availableCount} اکانت آماده</span>
            </Badge>
          )}

          <Badge
            variant='outline'
            className='text-[10px] sm:text-xs font-semibold bg-primary/10 text-primary border-primary/20 py-1 hidden sm:inline-flex'
          >
            {mode === 'inventory' ? 'اکانت آماده' : 'اکانت شخصی'}
          </Badge>

          <span
            className='inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1 px-2 rounded-lg bg-primary/5 sm:bg-transparent sm:hover:bg-primary/5 shrink-0'
          >
            <span>{isOpen ? 'بستن' : 'تغییر'}</span>
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform duration-200',
                isOpen ? 'rotate-180 text-primary' : ''
              )}
            />
          </span>
        </div>
      </div>

      {/* Collapsible Delivery Options & Inputs */}
      {isOpen && (
        <div className='space-y-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-150'>
          {/* Two Delivery Options Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5'>
        {/* Option 1: Instant Ready Account */}
        <div
          role='radio'
          aria-checked={mode === 'inventory'}
          tabIndex={0}
          onClick={() => !disabled && setMode('inventory')}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setMode('inventory')
            }
          }}
          className={cn(
            'group relative flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-start transition-all cursor-pointer select-none',
            mode === 'inventory'
              ? 'border-primary bg-primary/8 ring-2 ring-primary/20 shadow-xs'
              : 'border-border/70 bg-card/60 hover:border-primary/40 hover:bg-muted/30'
          )}
        >
          {/* Border Badge — Positioned on the top edge of the card */}
          <div className='absolute -top-2.5 end-3 z-10'>
            <Badge
              variant='outline'
              className='bg-background px-2 py-0.5 text-[10px] font-semibold text-primary border-primary/30 shadow-2xs whitespace-nowrap flex items-center'
            >
              {hasInventory ? (
                <>
                  <Zap className='size-2.5 me-1 text-primary' />
                  تحویل آنی
                </>
              ) : (
                <>
                  <Clock className='size-2.5 me-1' />
                  طی ۱ روز کاری
                </>
              )}
            </Badge>
          </div>

          <div>
            <div className='flex items-center gap-2 mb-2'>
              <div
                className={cn(
                  'size-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  mode === 'inventory'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                )}
              >
                {mode === 'inventory' && <div className='size-1.5 rounded-full bg-white' />}
              </div>
              <span className='text-xs sm:text-sm font-bold text-foreground'>
                اکانت اختصاصی آماده
              </span>
            </div>

            <p className='text-xs text-muted-foreground leading-relaxed'>
              {hasInventory
                ? 'مشخصات ورود یک اکانت کاملاً نو و اختصاصی بلافاصله پس از پرداخت به شما تحویل داده می‌شود.'
                : 'مشخصات ورود یک اکانت اختصاصی و جدید ظرف حداکثر ۱ روز کاری به سفارش‌های شما تحویل داده می‌شود.'}
            </p>
          </div>

          <div className='mt-3 pt-2.5 border-t border-border/40 space-y-1 text-[11px] text-muted-foreground'>
            <div className='flex items-center gap-1.5'>
              <Check className='size-3.5 text-primary shrink-0' />
              <span>
                {hasInventory
                  ? 'تحویل ۱۰۰٪ خودکار بلافاصله پس از پرداخت'
                  : 'صدور اکانت جدید و ارسال ظرف ۱ روز کاری'}
              </span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Check className='size-3.5 text-primary shrink-0' />
              <span>امکان تغییر رمز عبور و افزودن شماره بازیابی</span>
            </div>
          </div>
        </div>

        {/* Option 2: Customer Personal Gmail */}
        <div
          role='radio'
          aria-checked={mode === 'own'}
          tabIndex={0}
          onClick={() => !disabled && setMode('own')}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setMode('own')
            }
          }}
          className={cn(
            'group relative flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-start transition-all cursor-pointer select-none',
            mode === 'own'
              ? 'border-primary bg-primary/8 ring-2 ring-primary/20 shadow-xs'
              : 'border-border/70 bg-card/60 hover:border-primary/40 hover:bg-muted/30'
          )}
        >
          {/* Border Badge — Positioned on the top edge of the card */}
          <div className='absolute -top-2.5 end-3 z-10'>
            <Badge
              variant='outline'
              className='bg-background px-2 py-0.5 text-[10px] font-semibold text-primary border-primary/30 shadow-2xs whitespace-nowrap flex items-center'
            >
              <UserIcon className='size-2.5 me-1 text-primary' />
              اکانت شخصی
            </Badge>
          </div>

          <div>
            <div className='flex items-center gap-2 mb-2'>
              <div
                className={cn(
                  'size-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  mode === 'own'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                )}
              >
                {mode === 'own' && <div className='size-1.5 rounded-full bg-white' />}
              </div>
              <span className='text-xs sm:text-sm font-bold text-foreground'>
                فعال‌سازی روی جیمیل شما
              </span>
            </div>

            <p className='text-xs text-muted-foreground leading-relaxed'>
              اشتراک مستقیماً روی حساب گوگل فعلی شما شارژ می‌شود و تاریخچه و چت‌هایتان حفظ می‌ماند.
            </p>
          </div>

          <div className='mt-3 pt-2.5 border-t border-border/40 space-y-1 text-[11px] text-muted-foreground'>
            <div className='flex items-center gap-1.5'>
              <Check className='size-3.5 text-primary shrink-0' />
              <span>حفظ کامل فایل‌ها و گفتگوهای قبلی</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Sparkles className='size-3 text-primary shrink-0' />
              <span>زمان فعال‌سازی: ۱ الی ۲۴ ساعت کاری</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs for personal account mode */}
      {mode === 'own' && (
        <div className='rounded-xl border border-primary/25 bg-primary/5 p-3.5 sm:p-4 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='flex items-center gap-2 text-xs sm:text-sm font-bold text-primary'>
            <Mail className='size-4 shrink-0' />
            <span>مشخصات حساب شخصی شما جهت شارژ اشتراک</span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {/* Gmail input */}
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
                <span className='flex items-center gap-1.5'>
                  <Mail className='size-3.5 text-primary shrink-0' />
                  <span>آدرس جیمیل شما</span>
                  <span className='text-rose-500 font-bold'>*</span>
                </span>
                <span className='text-[10px] text-muted-foreground font-normal'>الزامی</span>
              </label>
              <Input
                type='email'
                placeholder='example@gmail.com'
                value={customerGmail}
                onChange={(e) => {
                  setCustomerGmail(e.target.value)
                  if (errors?.customerGmail && onClearError) onClearError('customerGmail')
                }}
                disabled={disabled}
                aria-invalid={!!errors?.customerGmail}
                className={cn(
                  'h-10 text-xs sm:text-sm font-mono placeholder:text-xs bg-background transition-colors',
                  errors?.customerGmail
                    ? 'border-rose-500 focus-visible:ring-rose-500'
                    : 'border-border focus:border-primary'
                )}
                dir='ltr'
              />
              {errors?.customerGmail && (
                <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                  <AlertCircle className='size-3 shrink-0' />
                  <span>{errors.customerGmail}</span>
                </p>
              )}
            </div>

            {/* Password input */}
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
                <span className='flex items-center gap-1.5'>
                  <KeyRound className='size-3.5 text-primary shrink-0' />
                  <span>رمزعبور جیمیل</span>
                  <span className='text-rose-500 font-bold'>*</span>
                </span>
                <span className='text-[10px] text-muted-foreground font-normal'>الزامی</span>
              </label>
              <div className='relative'>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='رمزعبور اکانت گوگل'
                  value={customerPassword}
                  onChange={(e) => {
                    setCustomerPassword(e.target.value)
                    if (errors?.customerPassword && onClearError) onClearError('customerPassword')
                  }}
                  disabled={disabled}
                  aria-invalid={!!errors?.customerPassword}
                  className={cn(
                    'h-10 text-xs sm:text-sm font-mono placeholder:text-xs bg-background pe-9 transition-colors',
                    errors?.customerPassword
                      ? 'border-rose-500 focus-visible:ring-rose-500'
                      : 'border-border focus:border-primary'
                  )}
                  dir='rtl'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={disabled}
                  className='absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  aria-label={showPassword ? 'مخفی کردن رمزعبور' : 'نمایش رمزعبور'}
                >
                  {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                </button>
              </div>
              {errors?.customerPassword && (
                <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                  <AlertCircle className='size-3 shrink-0' />
                  <span>{errors.customerPassword}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  )
}
