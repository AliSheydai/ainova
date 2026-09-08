'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingBag,
  Plus,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
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
import { toast } from 'sonner'

interface AdminPlan {
  id: string
  productId: string
  name: string
  duration: number
  price: number
  active: boolean
  availableLinks?: number
  _count?: {
    orders: number
    activationLinks: number
  }
}

interface AdminProduct {
  id: string
  name: string
  slug: string
  description: string | null
  active: boolean
  plans: AdminPlan[]
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)

  // Edit Plan Dialog
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null)
  const [planName, setPlanName] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planDuration, setPlanDuration] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)

  // New Plan Dialog
  const [newPlanOpen, setNewPlanOpen] = useState(false)
  const [targetProductId, setTargetProductId] = useState('')
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanPrice, setNewPlanPrice] = useState('')
  const [newPlanDuration, setNewPlanDuration] = useState('18')
  const [creatingPlan, setCreatingPlan] = useState(false)

  // New Product Dialog
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdSlug, setNewProdSlug] = useState('')
  const [newProdDesc, setNewProdDesc] = useState('')
  const [creatingProduct, setCreatingProduct] = useState(false)

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

  const handleTogglePlanActive = async (plan: AdminPlan) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, active: !plan.active }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`پلن ${!plan.active ? 'فعال' : 'غیرفعال'} شد.`)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در تغییر وضعیت پلن.')
      }
    } catch {
      toast.error('خطای سرور.')
    }
  }

  const handleOpenEditPlan = (plan: AdminPlan) => {
    setEditingPlan(plan)
    setPlanName(plan.name)
    setPlanPrice(String(plan.price))
    setPlanDuration(String(plan.duration))
    setEditPlanOpen(true)
  }

  const handleSavePlan = async () => {
    if (!editingPlan) return
    const priceNum = parseInt(planPrice, 10)
    const durNum = parseInt(planDuration, 10)

    if (isNaN(priceNum) || priceNum <= 0 || isNaN(durNum) || durNum <= 0) {
      toast.error('مبلغ و مدت زمان پلن باید اعداد معتبر باشند.')
      return
    }

    setSavingPlan(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: editingPlan.id,
          name: planName,
          price: priceNum,
          duration: durNum,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'پلن با موفقیت ویرایش شد.')
        setEditPlanOpen(false)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در ذخیره‌سازی پلن.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!targetProductId || !newPlanName || !newPlanPrice || !newPlanDuration) {
      toast.error('تمام فیلدها الزامی هستند.')
      return
    }

    setCreatingPlan(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-plan',
          productId: targetProductId,
          name: newPlanName,
          price: parseInt(newPlanPrice, 10),
          duration: parseInt(newPlanDuration, 10),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'پلن جدید ایجاد شد.')
        setNewPlanOpen(false)
        setNewPlanName('')
        setNewPlanPrice('')
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در ثبت پلن.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setCreatingPlan(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!newProdName || !newProdSlug) {
      toast.error('نام و نامک محصول الزامی هستند.')
      return
    }

    setCreatingProduct(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-product',
          name: newProdName,
          slug: newProdSlug,
          description: newProdDesc,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'محصول جدید ایجاد شد.')
        setNewProductOpen(false)
        setNewProdName('')
        setNewProdSlug('')
        setNewProdDesc('')
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در ایجاد محصول.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setCreatingProduct(false)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='text-base font-bold flex items-center gap-2'>
            <ShoppingBag className='size-4 text-primary' />
            <span>مدیریت محصولات و پلن‌های فروش (Data-Driven)</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <Button
            size='sm'
            onClick={() => setNewProductOpen(true)}
            variant='outline'
            className='gap-1.5 text-xs h-8 font-semibold'
          >
            <Plus className='size-3.5' />
            <span>محصول جدید</span>
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchProducts}
            disabled={loading}
            className='gap-1.5 text-xs h-8'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-col gap-6 p-4 sm:p-6'>
        {/* Info Card */}
        <div className='rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs'>
          <div>
            <span className='font-bold text-foreground block text-sm'>
              ساختار داینامیک و مبتنی بر داده (Data-Driven)
            </span>
            <p className='text-muted-foreground mt-0.5'>
              می‌توانید قیمت‌ها را در لحظه تغییر دهید، پلن‌های جدید اضافه کنید یا بدون تغییر کد سیستم محصولات آینده را تعریف نمایید.
            </p>
          </div>
        </div>

        {/* Products List */}
        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='size-8 animate-spin text-primary' />
          </div>
        ) : products.length === 0 ? (
          <Card className='p-8 text-center text-xs text-muted-foreground'>
            هیچ محصولی در دیتابیس ثبت نشده است.
          </Card>
        ) : (
          <div className='space-y-6'>
            {products.map((prod) => (
              <Card key={prod.id} className='border-border/60 shadow-xs overflow-hidden'>
                <CardHeader className='bg-muted/15 border-b border-border/50 pb-4'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='flex items-center gap-3'>
                      <div className='size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold'>
                        <Sparkles className='size-5' />
                      </div>
                      <div>
                        <div className='flex items-center gap-2'>
                          <CardTitle className='text-base font-bold'>{prod.name}</CardTitle>
                          <Badge variant='outline' className='font-mono text-[10px] text-muted-foreground'>
                            {prod.slug}
                          </Badge>
                          {prod.active ? (
                            <Badge className='bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]'>
                              فعال
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='text-rose-500 text-[10px]'>
                              غیرفعال
                            </Badge>
                          )}
                        </div>
                        {prod.description && (
                          <CardDescription className='text-xs mt-0.5'>
                            {prod.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>

                    <Button
                      size='sm'
                      onClick={() => {
                        setTargetProductId(prod.id)
                        setNewPlanOpen(true)
                      }}
                      className='h-8 text-xs gap-1.5 font-semibold'
                    >
                      <Plus className='size-3.5' />
                      <span>افزودن پلن جدید به این محصول</span>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className='p-0'>
                  {prod.plans.length === 0 ? (
                    <div className='p-6 text-center text-xs text-muted-foreground'>
                      هنوز پلنی برای این محصول تعریف نشده است.
                    </div>
                  ) : (
                    <div className='overflow-x-auto'>
                      <table className='w-full text-xs text-start'>
                        <thead>
                          <tr className='border-b border-border/40 text-muted-foreground bg-muted/5'>
                            <th className='py-3 px-4 text-start font-medium'>نام پلن</th>
                            <th className='py-3 text-start font-medium'>مدت زمان</th>
                            <th className='py-3 text-start font-medium'>قیمت فروش</th>
                            <th className='py-3 text-start font-medium'>موجودی لینک‌ها</th>
                            <th className='py-3 text-start font-medium'>کل فروش</th>
                            <th className='py-3 text-start font-medium'>وضعیت فروش</th>
                            <th className='py-3 px-4 text-end font-medium'>عملیات</th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-border/30'>
                          {prod.plans.map((plan) => (
                            <tr key={plan.id} className='hover:bg-muted/20 transition-colors'>
                              <td className='py-3 px-4 font-bold text-foreground'>
                                {plan.name}
                              </td>
                              <td className='py-3 text-muted-foreground'>
                                {plan.duration} ماهه
                              </td>
                              <td className='py-3 font-bold text-base text-primary'>
                                {formatPrice(plan.price)}
                              </td>
                              <td className='py-3'>
                                <Badge
                                  variant='outline'
                                  className={`text-[10px] font-semibold ${
                                    (plan.availableLinks || 0) > 0
                                      ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'
                                      : 'border-rose-500/30 text-rose-600 bg-rose-500/5'
                                  }`}
                                >
                                  {(plan.availableLinks || 0).toLocaleString('fa-IR')} لینک موجود
                                </Badge>
                              </td>
                              <td className='py-3 text-muted-foreground font-mono'>
                                {(plan._count?.orders || 0).toLocaleString('fa-IR')} سفارش
                              </td>
                              <td className='py-3'>
                                <div className='flex items-center gap-2'>
                                  <Switch
                                    checked={plan.active}
                                    onCheckedChange={() => handleTogglePlanActive(plan)}
                                  />
                                  <span className='text-[11px] text-muted-foreground'>
                                    {plan.active ? 'فعال' : 'غیرفعال'}
                                  </span>
                                </div>
                              </td>
                              <td className='py-3 px-4 text-end'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => handleOpenEditPlan(plan)}
                                  className='h-7 px-2.5 text-[11px] gap-1'
                                >
                                  <Edit2 className='size-3' />
                                  <span>ویرایش قیمت و پلن</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Main>

      {/* Edit Plan Dialog */}
      <Dialog open={editPlanOpen} onOpenChange={setEditPlanOpen}>
        <DialogContent className='max-w-md p-6'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold'>ویرایش پلن فروش</DialogTitle>
            <DialogDescription className='text-xs'>
              تغییر قیمت و مشخصات پلن. قیمت جدید بلافاصله در صفحه اصلی و درگاه پرداخت اعمال می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 pt-2 text-xs'>
            <div>
              <label className='font-semibold block mb-1'>نام پلن:</label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className='text-xs h-9'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>قیمت (به تومان):</label>
              <Input
                type='number'
                value={planPrice}
                onChange={(e) => setPlanPrice(e.target.value)}
                className='text-xs h-9 font-mono'
                dir='ltr'
              />
              <span className='text-[11px] text-muted-foreground mt-1 block'>
                معادل: {parseInt(planPrice, 10) ? formatPrice(parseInt(planPrice, 10)) : '۰'}
              </span>
            </div>

            <div>
              <label className='font-semibold block mb-1'>مدت زمان (تعداد ماه):</label>
              <Input
                type='number'
                value={planDuration}
                onChange={(e) => setPlanDuration(e.target.value)}
                className='text-xs h-9 font-mono'
                dir='ltr'
              />
            </div>
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              variant='outline'
              onClick={() => setEditPlanOpen(false)}
              disabled={savingPlan}
              className='text-xs'
            >
              انصراف
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={savingPlan}
              className='text-xs font-semibold'
            >
              {savingPlan ? (
                <Loader2 className='size-3.5 animate-spin me-1.5' />
              ) : (
                <Check className='size-3.5 me-1.5' />
              )}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Plan Dialog */}
      <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
        <DialogContent className='max-w-md p-6'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold'>ایجاد پلن جدید</DialogTitle>
            <DialogDescription className='text-xs'>
              افزودن یک پلن قیمتی و مدت زمان جدید برای این محصول
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 pt-2 text-xs'>
            <div>
              <label className='font-semibold block mb-1'>عنوان پلن:</label>
              <Input
                placeholder='مثلاً: اشتراک ۱۲ ماهه، ۲ ساله...'
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className='text-xs h-9'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>قیمت (تومان):</label>
              <Input
                type='number'
                placeholder='390000'
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(e.target.value)}
                className='text-xs h-9 font-mono'
                dir='ltr'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>مدت زمان (ماه):</label>
              <Input
                type='number'
                placeholder='18'
                value={newPlanDuration}
                onChange={(e) => setNewPlanDuration(e.target.value)}
                className='text-xs h-9 font-mono'
                dir='ltr'
              />
            </div>
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              variant='outline'
              onClick={() => setNewPlanOpen(false)}
              disabled={creatingPlan}
              className='text-xs'
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreatePlan}
              disabled={creatingPlan}
              className='text-xs font-semibold'
            >
              {creatingPlan ? (
                <Loader2 className='size-3.5 animate-spin me-1.5' />
              ) : (
                <Plus className='size-3.5 me-1.5' />
              )}
              ایجاد پلن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Product Dialog */}
      <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
        <DialogContent className='max-w-md p-6'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold'>ایجاد محصول جدید</DialogTitle>
            <DialogDescription className='text-xs'>
              تعریف محصول جدید در سیستم جهت فروش در آینده
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 pt-2 text-xs'>
            <div>
              <label className='font-semibold block mb-1'>نام محصول:</label>
              <Input
                placeholder='مثلاً: Claude Pro، ChatGPT Plus...'
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className='text-xs h-9'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>شناسه یکتا (Slug):</label>
              <Input
                placeholder='claude-pro'
                value={newProdSlug}
                onChange={(e) => setNewProdSlug(e.target.value)}
                className='text-xs h-9 font-mono'
                dir='ltr'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>توضیحات کوتاه:</label>
              <Input
                placeholder='توضیحات نمایش داده شده به کاربران'
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                className='text-xs h-9'
              />
            </div>
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              variant='outline'
              onClick={() => setNewProductOpen(false)}
              disabled={creatingProduct}
              className='text-xs'
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={creatingProduct}
              className='text-xs font-semibold'
            >
              {creatingProduct ? (
                <Loader2 className='size-3.5 animate-spin me-1.5' />
              ) : (
                <Plus className='size-3.5 me-1.5' />
              )}
              ایجاد محصول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
