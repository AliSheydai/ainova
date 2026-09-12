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
            <div className='bg-card rounded-2xl border border-border/70 p-3 sm:p-5 shadow-xs space-y-3.5 min-w-0 w-full'>
              <div className='flex items-center gap-2 pb-2 border-b border-border/40 min-w-0'>
                <Tag className='size-4 text-primary shrink-0' />
                <span className='text-xs font-bold text-foreground'>مشخصات عمومی و مالی پلن</span>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div>
                  <span className='text-xs font-medium text-foreground block mb-1'>
                    نام نمایشی پلن: <span className='text-rose-500'>*</span>
                  </span>
                  <Input
                    value={formPlanName}
                    onChange={(e) => setFormPlanName(e.target.value)}
                    placeholder='مثال: ۱۲ ماهه (ویژه)'
                    className='text-xs h-9 rounded-xl'
                  />
                </div>

                <div>
                  <span className='text-xs font-medium text-foreground block mb-1'>
                    مدت زمان اشتراک (ماه):
                  </span>
                  <div className='relative'>
                    <Input
                      type='number'
                      min='1'
                      value={formPlanDuration}
                      onChange={(e) => setFormPlanDuration(e.target.value)}
                      placeholder='12'
                      className='text-xs h-9 rounded-xl pe-8 font-mono'
                      dir='ltr'
                    />
                    <Clock className='size-3.5 text-muted-foreground absolute end-2.5 top-3' />
                  </div>
                </div>

                <div>
                  <span className='text-xs font-medium text-foreground block mb-1'>
                    قیمت فروش (تومان): <span className='text-rose-500'>*</span>
                  </span>
                  <Input
                    type='number'
                    min='0'
                    value={formPlanPrice}
                    onChange={(e) => setFormPlanPrice(e.target.value)}
                    placeholder='390000'
                    className='text-xs h-9 rounded-xl font-mono'
                    dir='ltr'
                  />
                  {formPlanPrice && !isNaN(parseInt(formPlanPrice, 10)) && (
                    <span className='text-[10px] text-muted-foreground block mt-1'>
                      معادل {parseInt(formPlanPrice, 10).toLocaleString('fa-IR')} تومان
                    </span>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
                <div>
                  <span className='text-xs font-medium text-foreground block mb-1'>
                    اولویت نمایش (Sort Order):
                  </span>
                  <Input
                    type='number'
                    value={formPlanSortOrder}
                    onChange={(e) => setFormPlanSortOrder(e.target.value)}
                    placeholder='1'
                    className='text-xs h-9 rounded-xl font-mono'
                    dir='ltr'
                  />
                </div>

                <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border/50 self-end gap-2'>
                  <div className='min-w-0'>
                    <span className='text-xs font-bold text-foreground block truncate'>
                      وضعیت فعال‌بودن پلن
                    </span>
                    <span className='text-[10px] sm:text-[10.5px] text-muted-foreground block truncate'>
                      قابل مشاهده و خرید توسط مشتریان
                    </span>
                  </div>
                  <Switch checked={formPlanActive} onCheckedChange={setFormPlanActive} className='shrink-0' />
                </div>
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
