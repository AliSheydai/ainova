'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingBag,
  Plus,
  Edit3,
  Trash2,
  Archive,
  RefreshCw,
  Loader2,
  ExternalLink,
  Tag,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProductItem {
  id: string
  title: string
  name: string
  slug: string
  shortDescription: string | null
  description: string | null
  image: string | null
  price: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  active: boolean
  stock: number
  purchaseCount: number
  sortOrder: number
  fulfillmentType: 'ACTIVATION_LINK' | 'ACTIVATION_CODE' | 'DOWNLOAD' | 'MANUAL'
  createdAt: string
  _count?: {
    orders: number
    activationLinks: number
  }
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

function getFulfillmentBadge(type: string) {
  switch (type) {
    case 'ACTIVATION_LINK':
      return { label: 'لینک فعال‌سازی آنی', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    case 'ACTIVATION_CODE':
      return { label: 'کد دیجیتال / سریال', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
    case 'DOWNLOAD':
      return { label: 'لینک دانلود فایل', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    case 'MANUAL':
      return { label: 'تحویل دستی', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    default:
      return { label: type, color: 'bg-muted text-muted-foreground' }
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog State: Create / Edit
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formShortDesc, setFormShortDesc] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formFulfillmentType, setFormFulfillmentType] = useState<
    'ACTIVATION_LINK' | 'ACTIVATION_CODE' | 'DOWNLOAD' | 'MANUAL'
  >('ACTIVATION_LINK')
  const [formSortOrder, setFormSortOrder] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  // Delete / Archive Alert Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      if (data.success) {
        setProducts(data.products || [])
      } else {
        toast.error(data.error || 'خطا در بارگذاری اطلاعات محصولات.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const openCreateDialog = () => {
    setIsEditing(false)
    setCurrentId(null)
    setFormTitle('')
    setFormSlug('')
    setFormShortDesc('')
    setFormDesc('')
    setFormPrice('')
    setFormImage('')
    setFormFulfillmentType('ACTIVATION_LINK')
    setFormSortOrder(String(products.length + 1))
    setDialogOpen(true)
  }

  const openEditDialog = (prod: ProductItem) => {
    setIsEditing(true)
    setCurrentId(prod.id)
    setFormTitle(prod.title || prod.name || '')
    setFormSlug(prod.slug)
    setFormShortDesc(prod.shortDescription || '')
    setFormDesc(prod.description || '')
    setFormPrice(String(prod.price))
    setFormImage(prod.image || '')
    setFormFulfillmentType(prod.fulfillmentType || 'ACTIVATION_LINK')
    setFormSortOrder(String(prod.sortOrder || 1))
    setDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!formTitle.trim() || !formSlug.trim()) {
      toast.error('عنوان و نامک (Slug) محصول الزامی هستند.')
      return
    }

    const priceNum = parseInt(formPrice, 10)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('مبلغ معتبری برای محصول وارد کنید.')
      return
    }

    setSubmitting(true)
    try {
      if (isEditing && currentId) {
        const res = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentId,
            title: formTitle.trim(),
            slug: formSlug.trim(),
            shortDescription: formShortDesc.trim(),
            description: formDesc.trim(),
            price: priceNum,
            image: formImage.trim(),
            fulfillmentType: formFulfillmentType,
            sortOrder: parseInt(formSortOrder, 10) || 0,
          }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success(data.message || 'محصول با موفقیت ویرایش شد.')
          setDialogOpen(false)
          fetchProducts()
        } else {
          toast.error(data.error || 'خطا در ویرایش محصول.')
        }
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            slug: formSlug.trim(),
            shortDescription: formShortDesc.trim(),
            description: formDesc.trim(),
            price: priceNum,
            image: formImage.trim(),
            fulfillmentType: formFulfillmentType,
            sortOrder: parseInt(formSortOrder, 10) || 0,
          }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success(data.message || 'محصول جدید با موفقیت اضافه شد.')
          setDialogOpen(false)
          fetchProducts()
        } else {
          toast.error(data.error || 'خطا در ثبت محصول.')
        }
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (prod: ProductItem) => {
    const nextStatus = prod.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prod.id,
          status: nextStatus,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`وضعیت «${prod.title || prod.name}» به ${nextStatus === 'ACTIVE' ? 'فعال' : 'غیرفعال'} تغییر یافت.`)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در تغییر وضعیت محصول.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products?id=${productToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setDeleteDialogOpen(false)
        setProductToDelete(null)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در حذف یا بایگانی محصول.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setDeleting(false)
    }
  }

  const autoGenerateSlug = () => {
    const s = formTitle
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]+/g, '')
    setFormSlug(s)
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2 overflow-hidden'>
          <h1 className='text-sm sm:text-base font-bold flex items-center gap-2 truncate'>
            <ShoppingBag className='size-4 text-primary shrink-0' />
            <span className='truncate'>مدیریت محصولات فروشگاه (Product-Based Store)</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            size='sm'
            onClick={openCreateDialog}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3 font-semibold shadow-sm'
          >
            <Plus className='size-3.5' />
            <span>محصول جدید</span>
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchProducts}
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

      <Main className='p-3.5 sm:p-6'>
        <div className='flex flex-col gap-5 sm:gap-6 w-full min-w-0'>
          {/* Architecture Banner */}
          <div className='rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs'>
            <div>
              <span className='font-bold text-foreground block text-sm flex items-center gap-1.5'>
                <Sparkles className='size-4 text-primary' />
                معماری فروشگاه مبتنی بر محصول (Product-Based Entity)
              </span>
              <p className='text-muted-foreground mt-1'>
                هر محصول دارای لینک اختصاصی در آدرس <code className='text-primary font-mono text-[11px]'>/products/[slug]</code> است، قیمت در زمان خرید اسنپ‌شات می‌شود و موجودی آن بر اساس لینک‌های فعال‌سازی واقعی به صورت بلادرنگ همگام‌سازی می‌گردد.
              </p>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <Badge variant='outline' className='bg-background text-primary border-primary/30 font-mono'>
                {products.filter((p) => p.status === 'ACTIVE').length} محصول فعال
              </Badge>
              <Badge variant='outline' className='bg-background text-muted-foreground'>
                {products.length} محصول در سیستم
              </Badge>
            </div>
          </div>

          {/* Product Cards List */}
          {loading ? (
            <div className='flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground'>
              <Loader2 className='size-8 animate-spin text-primary' />
              <span className='text-xs'>در حال بارگذاری محصولات...</span>
            </div>
          ) : products.length === 0 ? (
            <Card className='p-12 text-center text-xs text-muted-foreground border-dashed'>
              هنوز هیچ محصولی ثبت نشده است. با کلیک بر روی دکمه «محصول جدید» اولین محصول خود را تعریف کنید.
            </Card>
          ) : (
            <div className='grid grid-cols-1 gap-4'>
              {products.map((prod) => {
                const fulfillment = getFulfillmentBadge(prod.fulfillmentType)
                return (
                  <Card
                    key={prod.id}
                    className={`border-border/60 shadow-xs overflow-hidden transition-all duration-200 ${
                      prod.status === 'ACTIVE' ? 'hover:border-primary/40' : 'opacity-75 bg-muted/20'
                    }`}
                  >
                    <div className='p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
                      {/* Product Info */}
                      <div className='flex items-start gap-3.5 min-w-0 flex-1'>
                        <div className='size-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 font-bold'>
                          <Package className='size-6' />
                        </div>
                        <div className='min-w-0 flex-1 space-y-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h2 className='text-sm sm:text-base font-bold text-foreground truncate'>
                              {prod.title || prod.name}
                            </h2>
                            <Link
                              href={`/products/${prod.slug}`}
                              target='_blank'
                              className='text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono text-xs'
                              title='مشاهده صفحه فروش اختصاصی محصول'
                            >
                              <span>/{prod.slug}</span>
                              <ExternalLink className='size-3' />
                            </Link>
                            <Badge variant='outline' className={`text-[10px] font-semibold ${fulfillment.color}`}>
                              {fulfillment.label}
                            </Badge>
                            {prod.status === 'ACTIVE' ? (
                              <Badge className='bg-primary/15 text-primary border-primary/30 text-[10px]'>
                                فعال برای فروش
                              </Badge>
                            ) : (
                              <Badge variant='outline' className='text-rose-500 border-rose-500/30 text-[10px]'>
                                غیرفعال
                              </Badge>
                            )}
                          </div>
                          {prod.shortDescription && (
                            <p className='text-xs text-muted-foreground line-clamp-1'>
                              {prod.shortDescription}
                            </p>
                          )}
                          <div className='flex flex-wrap items-center gap-4 text-xs pt-1 text-muted-foreground'>
                            <span className='flex items-center gap-1'>
                              <Tag className='size-3 text-primary' />
                              <strong className='text-foreground font-bold font-sans'>
                                {formatPrice(prod.price)}
                              </strong>
                            </span>
                            <span className='flex items-center gap-1'>
                              <Zap className='size-3 text-amber-500' />
                              <span>موجودی آنی:</span>
                              <strong className={`font-sans ${prod.stock > 0 ? 'text-primary' : 'text-rose-500 font-bold'}`}>
                                {prod.stock.toLocaleString('fa-IR')} عدد
                              </strong>
                            </span>
                            <span className='flex items-center gap-1'>
                              <CheckCircle2 className='size-3 text-emerald-500' />
                              <span>فروش موفق:</span>
                              <strong className='text-foreground font-sans'>
                                {prod.purchaseCount.toLocaleString('fa-IR')} سفارش
                              </strong>
                            </span>
                            <span className='text-[11px] text-muted-foreground'>
                              اولویت: {prod.sortOrder}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex items-center gap-2.5 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 w-full md:w-auto justify-between md:justify-end'>
                        <div className='flex items-center gap-2'>
                          <Switch
                            checked={prod.status === 'ACTIVE'}
                            onCheckedChange={() => handleToggleActive(prod)}
                            id={`switch-${prod.id}`}
                          />
                          <label
                            htmlFor={`switch-${prod.id}`}
                            className='text-xs cursor-pointer text-muted-foreground select-none'
                          >
                            {prod.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}
                          </label>
                        </div>

                        <div className='flex items-center gap-1.5'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => openEditDialog(prod)}
                            className='h-8 px-2.5 text-xs gap-1'
                          >
                            <Edit3 className='size-3.5' />
                            <span>ویرایش</span>
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setProductToDelete(prod)
                              setDeleteDialogOpen(true)
                            }}
                            className='h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10'
                            title='حذف یا بایگانی محصول'
                          >
                            <Trash2 className='size-3.5' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </Main>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-xl p-6 max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold'>
              {isEditing ? 'ویرایش مشخصات محصول' : 'تعریف محصول جدید'}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              اطلاعات محصول به صورت آنی در صفحه اختصاصی و ربات تلگرام منعکس خواهد شد.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2 text-xs'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='font-semibold block mb-1'>عنوان فارسی محصول: *</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder='مثال: اشتراک ChatGPT Plus یک‌ماهه'
                  className='text-xs h-9'
                />
              </div>

              <div>
                <div className='flex items-center justify-between mb-1'>
                  <label className='font-semibold block'>شناسه یکتا (Slug): *</label>
                  <button
                    type='button'
                    onClick={autoGenerateSlug}
                    className='text-[10px] text-primary hover:underline'
                  >
                    ساخت خودکار
                  </button>
                </div>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder='chatgpt-plus'
                  className='text-xs h-9 font-mono'
                  dir='ltr'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='font-semibold block mb-1'>قیمت فروش (تومان): *</label>
                <Input
                  type='number'
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder='390000'
                  className='text-xs h-9 font-mono'
                  dir='ltr'
                />
                <span className='text-[11px] text-muted-foreground mt-1 block'>
                  معادل: {parseInt(formPrice, 10) ? formatPrice(parseInt(formPrice, 10)) : '۰'}
                </span>
              </div>

              <div>
                <label className='font-semibold block mb-1'>نوع تحویل سفارش (Fulfillment):</label>
                <select
                  value={formFulfillmentType}
                  onChange={(e) => setFormFulfillmentType(e.target.value as any)}
                  className='w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                >
                  <option value='ACTIVATION_LINK'>لینک فعال‌سازی آنی (Activation Link)</option>
                  <option value='ACTIVATION_CODE'>کد فعال‌سازی / سریال دیجیتال (Activation Code)</option>
                  <option value='DOWNLOAD'>لینک دانلود فایل (Download)</option>
                  <option value='MANUAL'>تحویل دستی توسط پشتیبانی (Manual)</option>
                </select>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='font-semibold block mb-1'>آدرس تصویر محصول (Image URL):</label>
                <Input
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder='/images/gemini-banner.png'
                  className='text-xs h-9 font-mono'
                  dir='ltr'
                />
              </div>

              <div>
                <label className='font-semibold block mb-1'>ترتیب نمایش (Sort Order):</label>
                <Input
                  type='number'
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                  placeholder='1'
                  className='text-xs h-9 font-mono'
                  dir='ltr'
                />
              </div>
            </div>

            <div>
              <label className='font-semibold block mb-1'>توضیح کوتاه (نمایش در کارت‌ها):</label>
              <Input
                value={formShortDesc}
                onChange={(e) => setFormShortDesc(e.target.value)}
                placeholder='خلاصه و ویژگی کلیدی در یک جمله'
                className='text-xs h-9'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>توضیحات کامل محصول (نمایش در صفحه اختصاصی):</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={4}
                placeholder='توضیحات جامع محصول، مزایا، شرایط و مراحل استفاده...'
                className='w-full rounded-md border border-input bg-background p-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              />
            </div>
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              variant='outline'
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              className='text-xs'
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={submitting}
              className='text-xs font-semibold'
            >
              {submitting && <Loader2 className='size-3.5 animate-spin me-1.5' />}
              {isEditing ? 'ذخیره تغییرات محصول' : 'ایجاد و انتشار محصول'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / Archive Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-bold'>
              حذف یا بایگانی «{productToDelete?.title || productToDelete?.name}»
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs leading-relaxed'>
              در صورتی که این محصول سابقه فروش یا سفارش ثبت‌شده داشته باشد، جهت حفظ سلامت مالی و دیتابیس، به صورت خودکار بایگانی (Archive) می‌شود تا گزارش‌های قبلی تخریب نشوند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2'>
            <AlertDialogCancel disabled={deleting} className='text-xs'>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={deleting}
              className='text-xs bg-rose-600 hover:bg-rose-700 text-white'
            >
              {deleting ? <Loader2 className='size-3.5 animate-spin me-1.5' /> : <Trash2 className='size-3.5 me-1.5' />}
              تأیید حذف / بایگانی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
