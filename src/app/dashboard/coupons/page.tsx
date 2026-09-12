'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Trash2,
  Check,
  Copy,
  Calendar,
  Sparkles,
  ShoppingBag,
  Percent,
  Coins,
  AlertCircle,
  Clock,
  X,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
import { toast } from 'sonner'

interface CouponItem {
  id: string
  code: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minOrderAmount: number | null
  maxDiscountAmount: number | null
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  active: boolean
  productId: string | null
  createdAt: string
  product?: {
    id: string
    title: string
    slug: string
  } | null
  _count?: {
    orders: number
  }
}

interface ProductOption {
  id: string
  title: string
  slug: string
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Create Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDiscountType, setNewDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE')
  const [newDiscountValue, setNewDiscountValue] = useState('')
  const [newMinOrderAmount, setNewMinOrderAmount] = useState('')
  const [newMaxDiscountAmount, setNewMaxDiscountAmount] = useState('')
  const [newMaxUses, setNewMaxUses] = useState('')
  const [newExpiresAt, setNewExpiresAt] = useState('')
  const [newProductId, setNewProductId] = useState('ALL')

  // Delete Dialog States
  const [deleteTarget, setDeleteTarget] = useState<CouponItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/admin/coupons?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setCoupons(data.coupons || [])
        if (data.products) setProducts(data.products)
      } else {
        toast.error(data.error || 'خطا در بارگذاری کدهای تخفیف.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`کد «${code}» کپی شد.`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let rand = 'OFF-'
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode(rand)
  }

  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coupon.id,
          active: !coupon.active,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`کد ${coupon.code} ${!coupon.active ? 'فعال' : 'غیرفعال'} شد.`)
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
        )
      } else {
        toast.error(data.error || 'خطا در تغییر وضعیت کد تخفیف.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) {
      toast.error('کد تخفیف الزامی است.')
      return
    }

    const val = parseInt(newDiscountValue, 10)
    if (isNaN(val) || val <= 0) {
      toast.error('مقدار تخفیف باید یک عدد بزرگتر از صفر باشد.')
      return
    }

    if (newDiscountType === 'PERCENTAGE' && val > 100) {
      toast.error('درصد تخفیف نمی‌تواند بیش از ۱۰۰ باشد.')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          description: newDescription.trim() || undefined,
          discountType: newDiscountType,
          discountValue: val,
          minOrderAmount: newMinOrderAmount ? parseInt(newMinOrderAmount, 10) : undefined,
          maxDiscountAmount: newMaxDiscountAmount ? parseInt(newMaxDiscountAmount, 10) : undefined,
          maxUses: newMaxUses ? parseInt(newMaxUses, 10) : undefined,
          expiresAt: newExpiresAt ? new Date(newExpiresAt).toISOString() : undefined,
          productId: newProductId !== 'ALL' ? newProductId : undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'کد تخفیف با موفقیت ایجاد شد.')
        setCreateDialogOpen(false)
        setNewCode('')
        setNewDescription('')
        setNewDiscountValue('')
        setNewMinOrderAmount('')
        setNewMaxDiscountAmount('')
        setNewMaxUses('')
        setNewExpiresAt('')
        setNewProductId('ALL')
        fetchCoupons()
      } else {
        toast.error(data.error || 'خطا در ایجاد کد تخفیف.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCoupon = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/coupons?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'کد تخفیف حذف گردید.')
        setDeleteTarget(null)
        fetchCoupons()
      } else {
        toast.error(data.error || 'خطا در حذف کد تخفیف.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2.5 min-w-0'>
          <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0'>
            <Tag className='size-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-sm sm:text-base font-bold truncate text-foreground'>
                مدیریت کدهای تخفیف
              </h1>
              <Badge variant='secondary' className='text-[10px] h-5 px-1.5 font-sans font-medium'>
                {coupons.length.toLocaleString('fa-IR')} کد
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground hidden sm:block truncate'>
              تعریف کوپن‌های تخفیف درصدی و مبلغ ثابت، سقف تخفیف و مهلت استفاده
            </p>
          </div>
        </div>

        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            size='sm'
            onClick={() => setCreateDialogOpen(true)}
            className='gap-1.5 text-xs h-8 px-3 shadow-xs font-semibold cursor-pointer'
          >
            <Plus className='size-3.5' />
            <span>ایجاد کد جدید</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={fetchCoupons}
            disabled={loading}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3'
            title='بروزرسانی'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>بروزرسانی</span>
          </Button>

          <ThemeSwitch />
        </div>
      </Header>

      <Main className='p-3.5 sm:p-6 max-w-7xl mx-auto w-full'>
        <div className='flex flex-col gap-4 sm:gap-6 w-full min-w-0'>
          {/* Top Search Bar */}
          <Card className='border-border/70 shadow-xs bg-card/60 backdrop-blur-sm'>
            <CardContent className='p-3 sm:p-4'>
              <div className='relative w-full sm:max-w-md'>
                <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                <Input
                  placeholder='جستجوی کد تخفیف یا توضیحات...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='ps-9 pe-8 h-10 text-xs rounded-xl bg-background/80 border-border/80 font-mono'
                />
                {search && (
                  <button
                    type='button'
                    onClick={() => setSearch('')}
                    className='absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                  >
                    <X className='size-3.5' />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coupons Table */}
          <Card className='border-border/70 shadow-xs overflow-hidden'>
            <CardHeader className='p-4 sm:p-5 border-b border-border/60 bg-muted/10'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm sm:text-base font-bold flex items-center gap-2'>
                  <span>لیست کوپن‌ها و کدهای فعال</span>
                </CardTitle>
                <span className='text-xs text-muted-foreground font-sans'>
                  {coupons.length} مورد
                </span>
              </div>
            </CardHeader>

            <CardContent className='p-0'>
              {loading ? (
                <div className='py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground'>
                  <Loader2 className='size-8 animate-spin text-primary' />
                  <span className='text-xs'>در حال بارگذاری کدهای تخفیف...</span>
                </div>
              ) : coupons.length === 0 ? (
                <div className='py-16 text-center text-muted-foreground space-y-3'>
                  <Tag className='size-10 mx-auto text-muted-foreground/40' />
                  <p className='text-xs'>هیچ کد تخفیفی یافت نشد.</p>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setCreateDialogOpen(true)}
                    className='text-xs gap-1.5'
                  >
                    <Plus className='size-3.5' />
                    <span>اولین کد تخفیف را ایجاد کنید</span>
                  </Button>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-xs text-start border-collapse'>
                    <thead>
                      <tr className='border-b border-border/70 bg-muted/40 text-muted-foreground font-medium'>
                        <th className='p-3 text-start'>کد تخفیف</th>
                        <th className='p-3 text-start'>نوع و مقدار</th>
                        <th className='p-3 text-start'>محدودیت‌ها</th>
                        <th className='p-3 text-start'>دفعات استفاده</th>
                        <th className='p-3 text-start'>محصول هدف</th>
                        <th className='p-3 text-start'>مهلت انقضا</th>
                        <th className='p-3 text-center'>وضعیت</th>
                        <th className='p-3 text-center'>عملیات</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/50'>
                      {coupons.map((item) => {
                        const isExpired = item.expiresAt && new Date() > new Date(item.expiresAt)
                        const isMaxedOut = item.maxUses !== null && item.usedCount >= item.maxUses

                        return (
                          <tr key={item.id} className='hover:bg-muted/30 transition-colors'>
                            {/* Code */}
                            <td className='p-3 font-medium'>
                              <div className='flex items-center gap-2'>
                                <Badge
                                  variant='outline'
                                  className='font-mono font-bold text-xs py-1 px-2.5 bg-primary/5 text-primary border-primary/30 tracking-wider'
                                >
                                  {item.code}
                                </Badge>
                                <button
                                  type='button'
                                  onClick={() => handleCopyCode(item.code)}
                                  className='text-muted-foreground hover:text-foreground p-1 rounded-md'
                                  title='کپی کد'
                                >
                                  {copiedCode === item.code ? (
                                    <Check className='size-3.5 text-emerald-500' />
                                  ) : (
                                    <Copy className='size-3.5' />
                                  )}
                                </button>
                              </div>
                              {item.description && (
                                <p className='text-[11px] text-muted-foreground mt-1 max-w-[200px] truncate'>
                                  {item.description}
                                </p>
                              )}
                            </td>

                            {/* Type & Value */}
                            <td className='p-3'>
                              <div className='flex items-center gap-1.5 font-bold text-foreground'>
                                {item.discountType === 'PERCENTAGE' ? (
                                  <>
                                    <Percent className='size-3.5 text-primary shrink-0' />
                                    <span>%{item.discountValue} تخفیف</span>
                                  </>
                                ) : (
                                  <>
                                    <Coins className='size-3.5 text-amber-500 shrink-0' />
                                    <span>{formatPrice(item.discountValue)} تخفیف</span>
                                  </>
                                )}
                              </div>
                              {item.maxDiscountAmount && item.discountType === 'PERCENTAGE' && (
                                <span className='text-[10px] text-muted-foreground block mt-0.5'>
                                  سقف: {formatPrice(item.maxDiscountAmount)}
                                </span>
                              )}
                            </td>

                            {/* Restrictions */}
                            <td className='p-3 text-muted-foreground'>
                              {item.minOrderAmount ? (
                                <span>حداقل خرید: {formatPrice(item.minOrderAmount)}</span>
                              ) : (
                                <span className='text-[11px] text-muted-foreground/80'>بدون حداقل خرید</span>
                              )}
                            </td>

                            {/* Usage Count */}
                            <td className='p-3'>
                              <div className='flex items-center gap-1 font-sans'>
                                <span className='font-bold text-foreground'>{item.usedCount}</span>
                                <span className='text-muted-foreground'>/</span>
                                <span className='text-muted-foreground'>
                                  {item.maxUses !== null ? item.maxUses : '∞'}
                                </span>
                              </div>
                              {isMaxedOut && (
                                <Badge variant='outline' className='text-[9px] text-rose-600 border-rose-500/30 mt-0.5'>
                                  تکمیل ظرفیت
                                </Badge>
                              )}
                            </td>

                            {/* Product Target */}
                            <td className='p-3'>
                              {item.product ? (
                                <Badge variant='secondary' className='text-[10px] max-w-[140px] truncate'>
                                  {item.product.title}
                                </Badge>
                              ) : (
                                <span className='text-muted-foreground text-[11px]'>همه محصولات</span>
                              )}
                            </td>

                            {/* Expiration */}
                            <td className='p-3'>
                              {item.expiresAt ? (
                                <div>
                                  <span className={`text-[11px] ${isExpired ? 'text-rose-600 font-semibold line-through' : 'text-foreground'}`}>
                                    {formatDate(item.expiresAt)}
                                  </span>
                                  {isExpired && (
                                    <span className='text-[9px] text-rose-500 block font-bold'>منقضی شده</span>
                                  )}
                                </div>
                              ) : (
                                <span className='text-muted-foreground text-[11px]'>نامحدود</span>
                              )}
                            </td>

                            {/* Active Switch */}
                            <td className='p-3 text-center'>
                              <Switch
                                checked={item.active}
                                onCheckedChange={() => handleToggleActive(item)}
                                aria-label='فعال / غیرفعال'
                              />
                            </td>

                            {/* Actions */}
                            <td className='p-3 text-center'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => setDeleteTarget(item)}
                                className='size-8 text-muted-foreground hover:text-destructive'
                                title='حذف کد تخفیف'
                              >
                                <Trash2 className='size-3.5' />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>

      {/* Create Coupon Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='sm:max-w-lg rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <Tag className='size-4 text-primary' />
              <span>ایجاد کد تخفیف جدید</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              مشخصات و محدودیت‌های کد تخفیف را جهت اعمال در صفحه پرداخت تنظیم فرمایید.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCoupon} className='space-y-3.5 py-2 text-xs'>
            {/* Code & Random Gen */}
            <div>
              <label className='font-semibold block mb-1'>کد تخفیف: *</label>
              <div className='flex items-center gap-2'>
                <Input
                  placeholder='مثلاً: NOWRUZ1404'
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className='text-xs font-mono uppercase h-10 rounded-xl'
                  dir='ltr'
                  required
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleGenerateRandomCode}
                  className='h-10 px-3 text-xs shrink-0 gap-1 rounded-xl cursor-pointer'
                  title='تولید کد تصادفی'
                >
                  <Sparkles className='size-3.5 text-primary' />
                  <span>کد تصادفی</span>
                </Button>
              </div>
            </div>

            {/* Type & Value */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='font-semibold block mb-1'>نوع تخفیف: *</label>
                <Select
                  value={newDiscountType}
                  onValueChange={(val: any) => setNewDiscountType(val)}
                >
                  <SelectTrigger className='h-10 text-xs rounded-xl'>
                    <SelectValue placeholder='نوع تخفیف' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PERCENTAGE'>درصدی (%)</SelectItem>
                    <SelectItem value='FIXED_AMOUNT'>مبلغ ثابت (تومان)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='font-semibold block mb-1'>
                  {newDiscountType === 'PERCENTAGE' ? 'درصد تخفیف (۱ تا ۱۰۰): *' : 'مبلغ تخفیف (تومان): *'}
                </label>
                <Input
                  type='number'
                  min='1'
                  max={newDiscountType === 'PERCENTAGE' ? '100' : undefined}
                  placeholder={newDiscountType === 'PERCENTAGE' ? 'مثلاً: 20' : 'مثلاً: 50000'}
                  value={newDiscountValue}
                  onChange={(e) => setNewDiscountValue(e.target.value)}
                  className='text-xs font-mono h-10 rounded-xl'
                  dir='ltr'
                  required
                />
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='font-semibold block mb-1'>حداقل مبلغ سفارش (اختیاری - تومان):</label>
                <Input
                  type='number'
                  placeholder='مثلاً: 100000'
                  value={newMinOrderAmount}
                  onChange={(e) => setNewMinOrderAmount(e.target.value)}
                  className='text-xs font-mono h-10 rounded-xl'
                  dir='ltr'
                />
              </div>

              {newDiscountType === 'PERCENTAGE' ? (
                <div>
                  <label className='font-semibold block mb-1'>سقف مبلغ تخفیف (اختیاری - تومان):</label>
                  <Input
                    type='number'
                    placeholder='مثلاً: 150000'
                    value={newMaxDiscountAmount}
                    onChange={(e) => setNewMaxDiscountAmount(e.target.value)}
                    className='text-xs font-mono h-10 rounded-xl'
                    dir='ltr'
                  />
                </div>
              ) : (
                <div>
                  <label className='font-semibold block mb-1'>سقف کل دفعات استفاده (اختیاری):</label>
                  <Input
                    type='number'
                    placeholder='مثلاً: 50'
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(e.target.value)}
                    className='text-xs font-mono h-10 rounded-xl'
                    dir='ltr'
                  />
                </div>
              )}
            </div>

            {newDiscountType === 'PERCENTAGE' && (
              <div>
                <label className='font-semibold block mb-1'>سقف کل دفعات استفاده (اختیاری):</label>
                <Input
                  type='number'
                  placeholder='مثلاً: 50'
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  className='text-xs font-mono h-10 rounded-xl'
                  dir='ltr'
                />
              </div>
            )}

            {/* Product Limitation & Expiration */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='font-semibold block mb-1'>محدود به محصول مشخص (اختیاری):</label>
                <Select value={newProductId} onValueChange={setNewProductId}>
                  <SelectTrigger className='h-10 text-xs rounded-xl'>
                    <SelectValue placeholder='همه محصولات' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>همه محصولات (سراسری)</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='font-semibold block mb-1'>مهلت انقضا (اختیاری):</label>
                <Input
                  type='date'
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className='text-xs h-10 rounded-xl font-sans'
                  dir='ltr'
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className='font-semibold block mb-1'>توضیحات و مناسبت تخفیف (اختیاری):</label>
              <Textarea
                rows={2}
                placeholder='مثلاً: کمپین نوروزی / تخفیف افتتاحیه...'
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className='text-xs rounded-xl'
              />
            </div>

            <DialogFooter className='flex flex-col-reverse sm:flex-row gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
                className='text-xs w-full sm:w-auto h-9 rounded-xl'
              >
                انصراف
              </Button>
              <Button
                type='submit'
                size='sm'
                disabled={creating}
                className='text-xs font-semibold w-full sm:w-auto h-9 rounded-xl gap-1.5 cursor-pointer shadow-xs'
              >
                {creating && <Loader2 className='size-3.5 animate-spin' />}
                ثبت و ایجاد کد تخفیف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className='sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2 text-destructive'>
              <Trash2 className='size-4' />
              <span>حذف کد تخفیف</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              آیا از حذف یا غیرفعال‌سازی کد تخفیف «{deleteTarget?.code}» اطمینان دارید؟
              {deleteTarget?._count && deleteTarget._count.orders > 0 && (
                <span className='block text-amber-600 dark:text-amber-400 font-semibold mt-1'>
                  این کد قبلاً در {deleteTarget._count.orders} سفارش استفاده شده است و به جای حذف فیزیکی، غیرفعال خواهد شد.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className='flex flex-col-reverse sm:flex-row gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className='text-xs w-full sm:w-auto h-9 rounded-xl'
            >
              انصراف
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={handleDeleteCoupon}
              disabled={deleting}
              className='text-xs font-semibold w-full sm:w-auto h-9 rounded-xl gap-1.5 cursor-pointer'
            >
              {deleting && <Loader2 className='size-3.5 animate-spin' />}
              تأیید حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
