'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Link2, Loader2, RotateCcw, Layers } from 'lucide-react'
import { toPersianDigits } from '@/lib/persian-utils'

export interface ProductOption {
  id: string
  title: string
  name: string
  slug: string
  availableCount?: number
  plans?: Array<{ id: string; name: string; availableCount?: number }>
}

interface BulkAddLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: ProductOption[]
  defaultProductId?: string
  onSuccess: () => void
}

export function BulkAddLinksDialog({
  open,
  onOpenChange,
  products,
  defaultProductId,
  onSuccess,
}: BulkAddLinksDialogProps) {
  const [productId, setProductId] = useState<string>('')
  const [planId, setPlanId] = useState<string>('ALL')
  const [text, setText] = useState<string>('')
  const [importing, setImporting] = useState<boolean>(false)

  // Sync initial product selection when dialog opens or products load
  useEffect(() => {
    if (open) {
      if (!productId && products.length > 0) {
        setProductId(defaultProductId || products[0].id)
      }
    }
  }, [open, products, defaultProductId, productId])

  // Reset plan when product changes
  const handleProductChange = (val: string) => {
    setProductId(val)
    setPlanId('ALL')
  }

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  )
  const plans = selectedProduct?.plans || []
  const selectedPlan = useMemo(
    () => plans.find((pl) => pl.id === planId),
    [plans, planId]
  )

  // Current warehouse stock for the selected product/plan
  const currentStock = useMemo(() => {
    if (!selectedProduct) return null
    if (planId !== 'ALL' && selectedPlan) {
      return selectedPlan.availableCount ?? 0
    }
    return selectedProduct.availableCount ?? 0
  }, [selectedProduct, planId, selectedPlan])

  // Parse valid lines with useMemo so typing/pasting is instantaneous and zero lag
  const validLines = useMemo(() => {
    if (!text) return []
    const lines = text.split('\n')
    const result: string[] = []
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (trimmed.length > 5) {
        result.push(trimmed)
      }
    }
    return result
  }, [text])

  const validCount = validLines.length

  const handleClose = () => {
    if (importing) return
    onOpenChange(false)
  }

  const handleResetForm = () => {
    setText('')
    setPlanId('ALL')
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!productId) {
      toast.error('لطفاً محصول مورد نظر را انتخاب کنید.')
      return
    }

    if (validCount === 0) {
      toast.error('حداقل یک لینک معتبر در کادر وارد کنید.')
      return
    }

    setImporting(true)
    try {
      const res = await fetch('/api/admin/activation-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          planId: planId && planId !== 'ALL' ? planId : undefined,
          links: validLines,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'لینک‌ها با موفقیت در انبار ذخیره شدند.')
        handleResetForm()
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.error || 'خطا در افزودن لینک‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg rounded-2xl p-4 sm:p-6'>
        {/* Header */}
        <DialogHeader className='space-y-1 text-start'>
          <div className='flex items-center gap-2'>
            <div className='size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
              <Link2 className='size-4' />
            </div>
            <div>
              <DialogTitle className='text-sm sm:text-base font-bold text-foreground'>
                افزودن دسته‌جمعی لینک‌های فعال‌سازی
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground mt-0.5'>
                لینک‌های خام را وارد کنید؛ هر خط به عنوان یک آیتم در انبار ذخیره می‌شود.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className='space-y-3.5 py-1 text-xs'>
          {/* Target Product & Optional Plan Selectors */}
          <div className='space-y-2.5'>
            <div className='flex flex-col gap-3'>
              <div>
                <label className='text-xs font-semibold text-foreground/90 block mb-1.5'>
                  محصول مقصد <span className='text-destructive'>*</span>
                </label>
                <Select value={productId} onValueChange={handleProductChange} disabled={importing}>
                  <SelectTrigger className='text-xs rounded-xl h-9 bg-background'>
                    <SelectValue placeholder='انتخاب محصول' />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className='flex items-center justify-between gap-2 w-full'>
                          <span>{p.title}</span>
                          {typeof p.availableCount === 'number' && (
                            <span className='text-[10px] text-muted-foreground font-sans'>
                              ({toPersianDigits(p.availableCount)} موجود)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {plans.length > 0 && (
                <div>
                  <label className='text-xs font-semibold text-foreground/90 block mb-1.5'>
                    پلن اختصاصی <span className='text-muted-foreground font-normal'>(اختیاری)</span>
                  </label>
                  <Select value={planId} onValueChange={setPlanId} disabled={importing}>
                    <SelectTrigger className='text-xs rounded-xl h-9 bg-background'>
                      <SelectValue placeholder='همه پلن‌های این محصول' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه پلن‌های این محصول</SelectItem>
                      {plans.map((pl) => (
                        <SelectItem key={pl.id} value={pl.id}>
                          <div className='flex items-center justify-between gap-2 w-full'>
                            <span>{pl.name}</span>
                            {typeof pl.availableCount === 'number' && (
                              <span className='text-[10px] text-muted-foreground font-sans'>
                                ({toPersianDigits(pl.availableCount)} موجود)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Current Inventory Stock Badge */}
            {selectedProduct && currentStock !== null && (
              <div className='flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/70 text-xs'>
                <div className='flex items-center gap-2 text-muted-foreground text-[11px] min-w-0'>
                  <Layers className='size-3.5 text-primary shrink-0' />
                  <span className='truncate'>
                    موجودی فعلی در انبار {planId !== 'ALL' && selectedPlan ? `(پلن ${selectedPlan.name})` : `(کل ${selectedProduct.title})`}:
                  </span>
                </div>
                <Badge
                  variant='outline'
                  className={`text-[11px] font-sans font-semibold shrink-0 gap-1.5 px-2.5 py-0.5 rounded-lg border transition-colors ${
                    currentStock > 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full shrink-0 ${currentStock > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                  />
                  <span>
                    {currentStock > 0
                      ? `${toPersianDigits(currentStock)} لینک آماده فروش`
                      : 'اتمام موجودی (۰ لینک)'}
                  </span>
                </Badge>
              </div>
            )}
          </div>

          {/* Links Input Area */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between text-xs'>
              <label className='font-semibold text-foreground/90'>
                آدرس لینک‌ها (هر خط یک لینک) <span className='text-destructive'>*</span>
              </label>

              <div className='flex items-center gap-2'>
                {text.length > 0 && (
                  <button
                    type='button'
                    onClick={handleResetForm}
                    disabled={importing}
                    className='text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer'
                  >
                    <RotateCcw className='size-3' />
                    <span>پاک کردن</span>
                  </button>
                )}

                {validCount > 0 ? (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                    {toPersianDigits(validCount)} لینک معتبر
                  </span>
                ) : (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-muted-foreground bg-muted/60'>
                    بدون لینک
                  </span>
                )}
              </div>
            </div>

            <div className='relative'>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                dir='ltr'
                style={{ resize: 'none', ...({ fieldSizing: 'normal' } as Record<string, string>) }}
                className='font-mono text-xs rounded-xl h-44 sm:h-52 w-full resize-none overflow-y-auto [field-sizing:normal] bg-muted/20 hover:bg-muted/30 focus:bg-background border-input transition-colors leading-relaxed p-3 focus-visible:ring-primary/20'
                disabled={importing}
              />
            </div>

            <p className='text-[11px] text-muted-foreground leading-normal'>
              خطوط خالی و فاصله‌های اضافی هنگام ذخیره نادیده گرفته می‌شوند.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className='flex flex-col-reverse sm:flex-row gap-2 pt-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleClose}
            disabled={importing}
            className='text-xs w-full sm:w-auto h-9 rounded-xl font-normal'
          >
            انصراف
          </Button>

          <Button
            type='button'
            size='sm'
            onClick={handleSubmit}
            disabled={importing || validCount === 0}
            aria-busy={importing}
            className='text-xs font-semibold w-full sm:w-auto h-9 rounded-xl'
          >
            {importing ? (
              <>
                <Loader2 className='size-3.5 animate-spin me-1.5' aria-hidden='true' />
                در حال ذخیره...
              </>
            ) : validCount > 0 ? (
              `ذخیره ${toPersianDigits(validCount)} لینک در انبار`
            ) : (
              'ذخیره در انبار'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
