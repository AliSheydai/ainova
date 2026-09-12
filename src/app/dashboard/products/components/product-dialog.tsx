import React from 'react'
import { ShoppingBag, Loader2 } from 'lucide-react'
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader className='pb-3 border-b border-border/50'>
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

        <div className='space-y-4 py-2'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
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

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
            <div>
              <span className='text-xs font-medium text-foreground block mb-1'>
                قیمت پایه / شروع از (تومان):
              </span>
              <Input
                type='number'
                min='0'
                value={formProdPrice}
                onChange={(e) => setFormProdPrice(e.target.value)}
                placeholder='390000'
                className='text-xs h-9 rounded-xl font-mono'
                dir='ltr'
              />
            </div>

            <div>
              <span className='text-xs font-medium text-foreground block mb-1'>
                اولویت نمایش (Sort Order):
              </span>
              <Input
                type='number'
                value={formProdSortOrder}
                onChange={(e) => setFormProdSortOrder(e.target.value)}
                placeholder='1'
                className='text-xs h-9 rounded-xl font-mono'
                dir='ltr'
              />
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
              placeholder='اشتراک اختصاصی ۱۸ ماهه هوش مصنوعی گوگل با ۲ ترابایت فضا'
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
            onClick={onSave}
            className='rounded-xl text-xs font-semibold gap-1.5 w-full sm:w-auto h-9'
          >
            {submitting && <Loader2 className='size-3.5 animate-spin' />}
            <span>{isEditing ? 'بروزرسانی محصول' : 'ایجاد محصول'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
