import React, { useState } from 'react'
import {
  Zap,
  Sliders,
  Eye,
  Loader2,
  Tag,
  Clock,
  Check,
  Package,
  Layers,
  Settings2,
  Plus,
  Minus,
  Coins,
  ArrowUpDown,
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
import { Switch } from '@/components/ui/switch'
import { type CheckoutFieldDefinition, type FulfillmentType } from '@/lib/fulfillment/types'
import { DynamicCheckoutForm } from '@/components/checkout/dynamic-checkout-form'
import { CheckoutFieldEditor } from './checkout-field-editor'
import {
  toEnglishDigits,
  toPersianDigits,
  formatNumberWithCommas,
  numberToWordsPersian,
  formatPlanDurationLabel,
} from '@/lib/persian-utils'

interface PlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  planTargetProductTitle: string
  submitting: boolean
  // Form State
  formPlanName: string
  setFormPlanName: (v: string) => void
  formPlanDuration: string
  setFormPlanDuration: (v: string) => void
  formPlanPrice: string
  setFormPlanPrice: (v: string) => void
  formPlanFulfillmentType: FulfillmentType
  setFormPlanFulfillmentType: (v: FulfillmentType) => void
  formPlanFields: CheckoutFieldDefinition[]
  setFormPlanFields: (v: CheckoutFieldDefinition[]) => void
  formPlanActive: boolean
  setFormPlanActive: (v: boolean) => void
  formPlanSortOrder: string
  setFormPlanSortOrder: (v: string) => void
  onSave: () => void
}

export function PlanDialog({
  open,
  onOpenChange,
  isEditing,
  planTargetProductTitle,
  submitting,
  formPlanName,
  setFormPlanName,
  formPlanDuration,
  setFormPlanDuration,
  formPlanPrice,
  setFormPlanPrice,
  formPlanFulfillmentType,
  setFormPlanFulfillmentType,
  formPlanFields,
  setFormPlanFields,
  formPlanActive,
  setFormPlanActive,
  formPlanSortOrder,
  setFormPlanSortOrder,
  onSave,
}: PlanDialogProps) {
  const [modalTab, setModalTab] = useState<'config' | 'preview'>('config')
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({})

  // Formatted display values and calculations
  const formattedPriceDisplay = toPersianDigits(formatNumberWithCommas(formPlanPrice))
  const priceInWords = numberToWordsPersian(formPlanPrice)

  const durationNum = parseInt(toEnglishDigits(formPlanDuration).replace(/[^\d]/g, ''), 10) || 1
  const durationFriendlyText = formatPlanDurationLabel(durationNum)

  const sortOrderNum = parseInt(toEnglishDigits(formPlanSortOrder).replace(/[^\d]/g, ''), 10) || 1

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = toEnglishDigits(raw).replace(/[^\d]/g, '')
    setFormPlanPrice(cleaned)
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(e.target.value).replace(/[^\d]/g, '')
    setFormPlanDuration(cleaned)
  }

  const incrementDuration = () => {
    setFormPlanDuration(String(durationNum + 1))
  }

  const decrementDuration = () => {
    if (durationNum > 1) {
      setFormPlanDuration(String(durationNum - 1))
    }
  }

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(e.target.value).replace(/[^\d]/g, '')
    setFormPlanSortOrder(cleaned)
  }

  const incrementSortOrder = () => {
    setFormPlanSortOrder(String(sortOrderNum + 1))
  }

  const decrementSortOrder = () => {
    if (sortOrderNum > 1) {
      setFormPlanSortOrder(String(sortOrderNum - 1))
    }
  }

  const fulfillmentOptions: Array<{
    type: FulfillmentType
    title: string
    desc: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    activeClass: string
  }> = [
    {
      type: 'ACTIVATION_LINK',
      title: 'لینک فعال‌سازی آنی',
      desc: 'اختصاص خودکار لینک اختصاصی آماده از انبار بلافاصله پس از پرداخت',
      icon: Zap,
      color: 'text-blue-500',
      activeClass: 'border-blue-500/70 bg-blue-500/5 ring-2 ring-blue-500/20',
    },
    {
      type: 'PRE_CREATED_ACCOUNT',
      title: 'اکانت آماده اختصاصی',
      desc: 'تحویل نام کاربری و رمزعبور حساب آماده‌شده از انبار پس از پرداخت',
      icon: Package,
      color: 'text-purple-500',
      activeClass: 'border-purple-500/70 bg-purple-500/5 ring-2 ring-purple-500/20',
    },
    {
      type: 'CUSTOMER_PROVISIONING',
      title: 'ساخت روی اکانت شخصی مشتری',
      desc: 'فعال‌سازی هوشمند یا با هوک اختصاصی روی آدرس ایمیل وارد شده توسط خریدار',
      icon: Layers,
      color: 'text-emerald-500',
      activeClass: 'border-emerald-500/70 bg-emerald-500/5 ring-2 ring-emerald-500/20',
    },
    {
      type: 'MANUAL',
      title: 'تحویل دستی (پشتیبانی)',
      desc: 'ثبت سفارش در وضعیت نیازمند بررسی جهت هماهنگی دستی توسط پشتیبانی',
      icon: Settings2,
      color: 'text-amber-500',
      activeClass: 'border-amber-500/70 bg-amber-500/5 ring-2 ring-amber-500/20',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-full max-w-full sm:max-w-3xl p-3 sm:p-6 box-border'>
        <DialogHeader className='pb-3 border-b border-border/50 min-w-0 w-full'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0 w-full'>
            <div className='flex items-center gap-2 min-w-0 flex-1 pe-7 sm:pe-0'>
              <div className='size-8 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
                <Zap className='size-4' />
              </div>
              <div className='min-w-0 text-start flex-1'>
                <DialogTitle className='text-xs sm:text-base font-bold truncate'>
                  {isEditing ? 'ویرایش مشخصات پلن فروش' : 'ایجاد پلن جدید برای محصول'}
                </DialogTitle>
                <DialogDescription className='text-[11px] sm:text-xs text-muted-foreground truncate'>
                  محصول هدف: <strong className='text-foreground'>{planTargetProductTitle}</strong>
                </DialogDescription>
              </div>
            </div>

            {/* Mode Switch Tabs */}
            <div className='grid grid-cols-2 sm:flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-[11px] sm:text-xs shrink-0 w-full sm:w-auto min-w-0'>
              <button
                type='button'
                onClick={() => setModalTab('config')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg font-medium transition-all min-w-0 truncate ${
                  modalTab === 'config'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className='size-3.5 shrink-0' />
                <span className='truncate'>تنظیمات پلن</span>
              </button>
              <button
                type='button'
                onClick={() => setModalTab('preview')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg font-medium transition-all min-w-0 truncate ${
                  modalTab === 'preview'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className='size-3.5 shrink-0' />
                <span className='truncate'>پیش‌نمایش چک‌اوت</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {modalTab === 'config' ? (
          <div className='space-y-4 sm:space-y-5 py-1 sm:py-2 min-w-0 w-full'>
            {/* Section 1: Basic Plan Information */}
            <div className='bg-card rounded-2xl border border-border/70 p-3.5 sm:p-5 shadow-xs space-y-4 min-w-0 w-full'>
              {/* Header with Title & Active Status Toggle */}
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/40 min-w-0'>
                <div className='flex items-center gap-2.5 min-w-0'>
                  <div className='size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs'>
                    <Tag className='size-4' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-xs sm:text-sm font-bold text-foreground truncate'>
                      مشخصات عمومی و مالی پلن
                    </h3>
                    <p className='text-[10.5px] text-muted-foreground truncate'>
                      نام، دوره زمانی، اولویت چیدمان و قیمت‌گذاری فروش
                    </p>
                  </div>
                </div>

                {/* Plan Active Status Switch */}
                <div className='flex items-center justify-between sm:justify-end gap-3 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 shrink-0 select-none'>
                  <span className={`text-[11px] font-semibold transition-colors ${formPlanActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    {formPlanActive ? 'پلن فعال (قابل مشاهده و خرید)' : 'پلن غیرفعال'}
                  </span>
                  <Switch
                    checked={formPlanActive}
                    onCheckedChange={setFormPlanActive}
                    className='shrink-0'
                  />
                </div>
              </div>

              {/* Row 1: Plan Display Name */}
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                  <span>نام نمایشی پلن</span>
                  <span className='text-rose-500 font-bold'>*</span>
                  <span className='text-[10.5px] text-muted-foreground font-normal'>
                    (عنوانی که خریدار در صفحه محصول و انتخاب اشتراک مشاهده می‌کند)
                  </span>
                </label>
                <Input
                  value={formPlanName}
                  onChange={(e) => setFormPlanName(e.target.value)}
                  placeholder='مثال: اشتراک ۱۲ ماهه ویژه'
                  className='text-xs sm:text-sm h-10 rounded-xl px-3'
                  dir='rtl'
                />
              </div>

              {/* Row 2: Duration & Sort Order (2 Balanced Columns) */}
              <div className='flex flex-col md:flex-row items-center gap-3.5'>
                {/* Column 1: Plan Duration */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between min-w-0'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5 truncate'>
                      <Clock className='size-3.5 text-primary shrink-0' />
                      <span className='truncate'>مدت زمان اشتراک (ماه):</span>
                      <span className='text-rose-500 font-bold'>*</span>
                    </label>
                    {durationFriendlyText && (
                      <span className='text-[10px] sm:text-[10.5px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg shrink-0'>
                        {durationFriendlyText}
                      </span>
                    )}
                  </div>

                  {/* Stepper Input */}
                  <div className='flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 transition-all'>
                    <button
                      type='button'
                      onClick={incrementDuration}
                      className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted transition-colors border-e border-input/60 shrink-0 cursor-pointer'
                      title='افزایش مدت'
                      aria-label='افزایش مدت زمان'
                    >
                      <Plus className='size-3.5' />
                    </button>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={toPersianDigits(formPlanDuration)}
                      onChange={handleDurationChange}
                      placeholder='مثال: ۱۲'
                      className='flex-1 h-9 bg-transparent text-center font-sans text-xs sm:text-sm text-foreground outline-none font-bold px-2'
                    />
                    <button
                      type='button'
                      onClick={decrementDuration}
                      disabled={durationNum <= 1}
                      className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted transition-colors border-s border-input/60 shrink-0 disabled:opacity-30 disabled:pointer-events-none cursor-pointer'
                      title='کاهش مدت'
                      aria-label='کاهش مدت زمان'
                    >
                      <Minus className='size-3.5' />
                    </button>
                  </div>

                  {/* Quick Select Preset Buttons */}
                  <div className='flex items-center gap-1.5 pt-0.5'>
                    <span className='text-[10px] text-muted-foreground shrink-0'>انتخاب سریع:</span>
                    <div className='flex items-center gap-1 flex-wrap'>
                      {[1, 3, 6, 12].map((preset) => (
                        <button
                          key={preset}
                          type='button'
                          onClick={() => setFormPlanDuration(String(preset))}
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all ${
                            durationNum === preset
                              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {toPersianDigits(preset)} ماهه
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2: Sort Order */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between min-w-0'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5 truncate'>
                      <ArrowUpDown className='size-3.5 text-primary shrink-0' />
                      <span className='truncate'>اولویت نمایش (Sort Order):</span>
                    </label>
                    <span className='text-[10px] text-muted-foreground shrink-0'>
                      ترتیب چیدمان
                    </span>
                  </div>

                  {/* Stepper Input */}
                  <div className='flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 transition-all'>
                    <button
                      type='button'
                      onClick={incrementSortOrder}
                      className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted transition-colors border-e border-input/60 shrink-0 cursor-pointer'
                      title='افزایش اولویت'
                      aria-label='افزایش اولویت'
                    >
                      <Plus className='size-3.5' />
                    </button>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={toPersianDigits(formPlanSortOrder)}
                      onChange={handleSortOrderChange}
                      placeholder='مثال: ۱'
                      className='flex-1 h-9 bg-transparent text-center font-sans text-xs sm:text-sm text-foreground outline-none font-bold px-2'
                    />
                    <button
                      type='button'
                      onClick={decrementSortOrder}
                      disabled={sortOrderNum <= 1}
                      className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted transition-colors border-s border-input/60 shrink-0 disabled:opacity-30 disabled:pointer-events-none cursor-pointer'
                      title='کاهش اولویت'
                      aria-label='کاهش اولویت'
                    >
                      <Minus className='size-3.5' />
                    </button>
                  </div>

                  <p className='text-[10px] text-muted-foreground leading-relaxed'>
                    عدد کمتر (مانند ۱) در بالای لیست و به عنوان گزینه اول نشان داده می‌شود.
                  </p>
                </div>
              </div>

              {/* Row 3: Financial Specifications (Price in Tomans) */}
              <div className='rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-background to-muted/30 p-3.5 sm:p-4 space-y-2.5 shadow-2xs'>
                <div className='flex items-center justify-between gap-2 min-w-0'>
                  <label className='text-xs font-bold text-foreground flex items-center gap-1.5 truncate'>
                    <Coins className='size-4 text-primary shrink-0' />
                    <span className='truncate'>قیمت فروش پلن (تومان):</span>
                    <span className='text-rose-500 font-bold'>*</span>
                  </label>
                  {formPlanPrice && !isNaN(parseInt(formPlanPrice, 10)) && (
                    <span className='text-[10px] sm:text-[11px] font-medium text-muted-foreground shrink-0'>
                      معادل <strong className='text-foreground font-sans'>{formattedPriceDisplay}</strong> تومان
                    </span>
                  )}
                </div>

                <div className='relative flex items-center'>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={formattedPriceDisplay}
                    onChange={handlePriceChange}
                    placeholder='مثال: ۳۹۰,۰۰۰'
                    className='w-full h-11 rounded-xl border border-input bg-background/95 pe-16 ps-3.5 text-base sm:text-lg font-extrabold font-sans text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-start placeholder:text-muted-foreground/60 placeholder:font-normal'
                    dir='rtl'
                  />
                  <div className='absolute end-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none'>
                    <span className='text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg shadow-2xs'>
                      تومان
                    </span>
                  </div>
                </div>

                {/* Real-time Persian Words Representation */}
                {priceInWords ? (
                  <div className='flex items-center gap-1.5 text-xs text-foreground bg-background/90 border border-border/80 rounded-xl px-3 py-2 shadow-2xs animate-fadeIn'>
                    <span className='text-[11px] text-muted-foreground shrink-0'>مبلغ به حروف:</span>
                    <span className='font-bold text-[11px] sm:text-xs text-primary leading-normal'>
                      {priceInWords} تومان
                    </span>
                  </div>
                ) : (
                  <p className='text-[10.5px] text-muted-foreground'>
                    مبلغ را بدون نیاز به صفرهای اضافه یا تبدیل وارد کنید؛ ارقام خودکار ۳ رقم ۳ رقم جدا می‌شوند.
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Fulfillment Type Configuration */}
            <div className='bg-card rounded-2xl border border-border/70 p-3 sm:p-5 shadow-xs space-y-3 min-w-0 w-full'>
              <div className='flex items-center justify-between pb-2 border-b border-border/40 min-w-0'>
                <div className='flex items-center gap-2 min-w-0'>
                  <Layers className='size-4 text-primary shrink-0' />
                  <span className='text-xs font-bold text-foreground break-words'>
                    موتور و مکانیزم تحویل سفارش (Fulfillment Engine)
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0 w-full'>
                {fulfillmentOptions.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = formPlanFulfillmentType === opt.type
                  return (
                    <div
                      key={opt.type}
                      onClick={() => setFormPlanFulfillmentType(opt.type)}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none relative flex flex-col justify-between gap-2 min-w-0 w-full ${
                        isSelected
                          ? opt.activeClass
                          : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-2 min-w-0'>
                        <div className='flex items-center gap-2 min-w-0 flex-1 overflow-hidden'>
                          <div
                            className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-background shadow-xs' : 'bg-muted'
                            }`}
                          >
                            <Icon className={`size-4 ${opt.color}`} />
                          </div>
                          <span className='font-bold text-xs text-foreground truncate'>
                            {opt.title}
                          </span>
                        </div>
                        {isSelected && (
                          <div className='size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs'>
                            <Check className='size-3 stroke-[3]' />
                          </div>
                        )}
                      </div>
                      <p className='text-[10px] sm:text-[10.5px] leading-relaxed text-muted-foreground break-words'>
                        {opt.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Section 3: Dynamic Checkout Fields Builder */}
            <CheckoutFieldEditor
              fields={formPlanFields}
              onChange={setFormPlanFields}
            />
          </div>
        ) : (
          /* Tab 2: Live Checkout Form Preview */
          <div className='py-2 sm:py-3 space-y-3.5 min-w-0 w-full'>
            <div className='p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start sm:items-center gap-2 min-w-0 w-full'>
              <Eye className='size-4 text-primary shrink-0 mt-0.5 sm:mt-0' />
              <span className='leading-relaxed break-words text-[11px] sm:text-xs min-w-0 flex-1'>
                پیش‌نمایش فرم نهایی که کاربر در صفحه Checkout پس از انتخاب این پلن مشاهده خواهد کرد:
              </span>
            </div>

            <div className='bg-card rounded-2xl border border-border/80 p-3 sm:p-5 shadow-xs min-w-0 w-full'>
              <DynamicCheckoutForm
                fields={formPlanFields}
                values={previewValues}
                onChange={(key, val) => setPreviewValues((prev) => ({ ...prev, [key]: val }))}
              />
            </div>
          </div>
        )}

        <DialogFooter className='pt-3 border-t border-border/50 flex flex-col-reverse sm:flex-row gap-2 min-w-0 w-full'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            className='rounded-xl text-xs w-full sm:w-auto h-9'
          >
            انصراف
          </Button>
          <Button
            type='button'
            size='sm'
            disabled={submitting}
            aria-busy={submitting}
            onClick={onSave}
            className='rounded-xl text-xs font-semibold gap-1.5 w-full sm:w-auto h-9'
          >
            {submitting && <Loader2 className='size-3.5 animate-spin' aria-hidden='true' />}
            <span>{isEditing ? 'بروزرسانی پلن' : 'ثبت و فعال‌سازی پلن'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
