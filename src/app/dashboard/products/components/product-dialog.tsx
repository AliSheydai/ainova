import React from 'react'
import { ShoppingBag, Loader2, Plus, Minus } from 'lucide-react'
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
import {
  toEnglishDigits,
  toPersianDigits,
  formatNumberWithCommas,
  numberToWordsPersian,
} from '@/lib/persian-utils'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  submitting: boolean
  formProdTitle: string
  setFormProdTitle: (v: string) => void
  formProdSlug: string
  setFormProdSlug: (v: string) => void
  formProdShortDesc: string
  setFormProdShortDesc: (v: string) => void
  formProdDesc: string
  setFormProdDesc: (v: string) => void
  formProdPrice: string
  setFormProdPrice: (v: string) => void
  formProdImage: string
  setFormProdImage: (v: string) => void
  formProdSortOrder: string
  setFormProdSortOrder: (v: string) => void
  onSave: () => void
}

export function ProductDialog({
  open,
  onOpenChange,
  isEditing,
  submitting,
  formProdTitle,
  setFormProdTitle,
  formProdSlug,
  setFormProdSlug,
  formProdShortDesc,
  setFormProdShortDesc,
  formProdDesc,
  setFormProdDesc,
  formProdPrice,
  setFormProdPrice,
  formProdImage,
  setFormProdImage,
  formProdSortOrder,
  setFormProdSortOrder,
  onSave,
}: ProductDialogProps) {
  const formattedPriceDisplay = toPersianDigits(formatNumberWithCommas(formProdPrice))
  const priceInWords = numberToWordsPersian(formProdPrice)
  const sortOrderNum = parseInt(toEnglishDigits(formProdSortOrder).replace(/[^\d]/g, ''), 10) || 1

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = toEnglishDigits(raw).replace(/[^\d]/g, '')
    setFormProdPrice(cleaned)
  }

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(e.target.value).replace(/[^\d]/g, '')
    setFormProdSortOrder(cleaned)
  }

  const incrementSortOrder = () => {
    setFormProdSortOrder(String(sortOrderNum + 1))
  }

  const decrementSortOrder = () => {
    if (sortOrderNum > 1) {
      setFormProdSortOrder(String(sortOrderNum - 1))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl p-4 sm:p-6'>
        <DialogHeader className='pb-3 border-b border-border/50 pe-7'>
          <div className='flex items-center gap-2.5'>
            <div className='size-8 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
              <ShoppingBag className='size-4' />
            </div>
            <div className='min-w-0 text-start'>
              <DialogTitle className='text-sm sm:text-base font-bold'>
                {isEditing ? 'ویرایش مشخصات محصول' : 'ایجاد محصول جدید'}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                مشخصات کلی محصول و دسته‌بندی فروشگاه را مشخص فرمایید.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-3.5 py-1 sm:py-2'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <span className='text-xs font-medium text-foreground block mb-1'>
                عنوان رسمی محصول: <span className='text-rose-500'>*</span>
              </span>
              <Input
                value={formProdTitle}
                onChange={(e) => setFormProdTitle(e.target.value)}
                placeholder='مثال: اکانت Google AI Pro'
                className='text-xs h-9 rounded-xl'
              />
            </div>

            <div>
              <span className='text-xs font-medium text-foreground block mb-1'>
                نامک یکتا (Slug): <span className='text-rose-500'>*</span>
              </span>
              <Input
                value={formProdSlug}
                onChange={(e) => setFormProdSlug(e.target.value)}
                placeholder='google-ai-pro'
                className='text-xs h-9 rounded-xl font-mono'
                dir='ltr'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-xs font-medium text-foreground block truncate'>
                  قیمت پایه / شروع از (تومان):
                </span>
                {formProdPrice && !isNaN(parseInt(formProdPrice, 10)) && (
                  <span className='text-[10px] text-muted-foreground shrink-0'>
                    معادل <strong className='text-foreground font-sans'>{formattedPriceDisplay}</strong> تومان
                  </span>
                )}
              </div>
              <div className='relative flex items-center'>
                <Input
                  value={formattedPriceDisplay}
                  onChange={handlePriceChange}
                  placeholder='مثال: ۳۹۰,۰۰۰'
                  className='text-xs h-9 rounded-xl font-sans font-bold pe-14'
                  dir='rtl'
                />
                <div className='absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none'>
                  <span className='text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md'>
                    تومان
                  </span>
                </div>
              </div>
              {priceInWords ? (
                <div className='mt-1 flex items-center gap-1 text-[11px] text-primary font-medium'>
                  <span>{priceInWords} تومان</span>
                </div>
              ) : null}
            </div>

            <div>
              <span className='text-xs font-medium text-foreground block mb-1'>
                اولویت نمایش (Sort Order):
              </span>
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
                  value={toPersianDigits(formProdSortOrder)}
                  onChange={handleSortOrderChange}
                  placeholder='مثال: ۱'
                  className='flex-1 h-9 bg-transparent text-center font-sans text-xs text-foreground outline-none font-bold px-2'
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
            </div>
          </div>

          <div>
            <span className='text-xs font-medium text-foreground block mb-1'>
              آدرس تصویر یا بنر محصول:
            </span>
            <Input
              value={formProdImage}
              onChange={(e) => setFormProdImage(e.target.value)}
              placeholder='https://... یا /images/product.png'
              className='text-xs h-9 rounded-xl font-mono'
              dir='ltr'
            />
          </div>

          <div>
            <span className='text-xs font-medium text-foreground block mb-1'>
              توضیح کوتاه (نمایش در کارت‌های ویترین):
            </span>
            <Input
              value={formProdShortDesc}
              onChange={(e) => setFormProdShortDesc(e.target.value)}
              placeholder='اشتراک ۱۸ ماهه هوش مصنوعی با ۲TB فضا'
              className='text-xs h-9 rounded-xl'
            />
          </div>

          <div>
            <span className='text-xs font-medium text-foreground block mb-1'>
              توضیحات تکمیلی محصول:
            </span>
            <Textarea
              rows={3}
              value={formProdDesc}
              onChange={(e) => setFormProdDesc(e.target.value)}
              placeholder='توضیحات تفصیلی، مزایا و نکات مهم برای مشتری...'
              className='text-xs rounded-xl'
            />
          </div>
        </div>

        <DialogFooter className='pt-3 border-t border-border/50 flex flex-col-reverse sm:flex-row gap-2'>
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
            <span>{isEditing ? 'بروزرسانی محصول' : 'ایجاد محصول'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
