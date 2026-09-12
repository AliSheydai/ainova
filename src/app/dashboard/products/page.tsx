'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingBag,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Loader2,
  ExternalLink,
  Tag,
  Package,
  CheckCircle2,
  Sparkles,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Eye,
  Settings2,
  Check,
  ArrowUp,
  ArrowDown,
  Info,
  CreditCard,
  Mail,
  Phone,
  FileText,
  HelpCircle,
  Hash,
  Clock,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { DynamicCheckoutForm } from '@/components/checkout/dynamic-checkout-form'
import { CheckoutFieldDefinition, FulfillmentType } from '@/lib/fulfillment/types'

interface PlanItem {
  id: string
  productId: string
  name: string
  duration: number
  price: number
  active: boolean
  fulfillmentType: FulfillmentType
  checkoutFields: CheckoutFieldDefinition[] | null
  sortOrder: number
  stock?: number
  _count?: {
    orders: number
  }
}

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
  fulfillmentType: FulfillmentType
  createdAt: string
  plans?: PlanItem[]
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
    case 'PRE_CREATED_ACCOUNT':
      return { label: 'اکانت آماده', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
    case 'CUSTOMER_PROVISIONING':
      return { label: 'ساخت روی اکانت مشتری', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    case 'MANUAL':
      return { label: 'تحویل دستی پشتیبانی', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    default:
      return { label: type, color: 'bg-muted text-muted-foreground' }
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({})

  // Product Dialog State
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  const [formProdTitle, setFormProdTitle] = useState('')
  const [formProdSlug, setFormProdSlug] = useState('')
  const [formProdShortDesc, setFormProdShortDesc] = useState('')
  const [formProdDesc, setFormProdDesc] = useState('')
  const [formProdPrice, setFormProdPrice] = useState('')
  const [formProdImage, setFormProdImage] = useState('')
  const [formProdFulfillmentType, setFormProdFulfillmentType] = useState<FulfillmentType>('ACTIVATION_LINK')
  const [formProdSortOrder, setFormProdSortOrder] = useState('1')
  const [submittingProduct, setSubmittingProduct] = useState(false)

  // Plan Dialog State
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [planTargetProductId, setPlanTargetProductId] = useState<string>('')
  const [formPlanName, setFormPlanName] = useState('')
  const [formPlanDuration, setFormPlanDuration] = useState('1')
  const [formPlanPrice, setFormPlanPrice] = useState('')
  const [formPlanFulfillmentType, setFormPlanFulfillmentType] = useState<FulfillmentType>('ACTIVATION_LINK')
  const [formPlanFields, setFormPlanFields] = useState<CheckoutFieldDefinition[]>([])
  const [formPlanActive, setFormPlanActive] = useState(true)
  const [formPlanSortOrder, setFormPlanSortOrder] = useState('1')
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({})
  const [submittingPlan, setSubmittingPlan] = useState(false)
  const [planModalTab, setPlanModalTab] = useState<'config' | 'preview'>('config')

  // Delete Alerts
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

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // --- Product Handlers ---
  const openCreateProductDialog = () => {
    setIsEditingProduct(false)
    setCurrentProductId(null)
    setFormProdTitle('')
    setFormProdSlug('')
    setFormProdShortDesc('')
    setFormProdDesc('')
    setFormProdPrice('')
    setFormProdImage('')
    setFormProdFulfillmentType('ACTIVATION_LINK')
    setFormProdSortOrder(String(products.length + 1))
    setProductDialogOpen(true)
  }

  const openEditProductDialog = (prod: ProductItem) => {
    setIsEditingProduct(true)
    setCurrentProductId(prod.id)
    setFormProdTitle(prod.title || prod.name || '')
    setFormProdSlug(prod.slug)
    setFormProdShortDesc(prod.shortDescription || '')
    setFormProdDesc(prod.description || '')
    setFormProdPrice(String(prod.price))
    setFormProdImage(prod.image || '')
    setFormProdFulfillmentType(prod.fulfillmentType || 'ACTIVATION_LINK')
    setFormProdSortOrder(String(prod.sortOrder || 1))
    setProductDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!formProdTitle.trim() || !formProdSlug.trim()) {
      toast.error('عنوان و نامک (Slug) محصول الزامی هستند.')
      return
    }

    setSubmittingProduct(true)
    try {
      const payload = {
        id: currentProductId,
        title: formProdTitle.trim(),
        slug: formProdSlug.trim(),
        shortDescription: formProdShortDesc.trim(),
        description: formProdDesc.trim(),
        price: parseInt(formProdPrice, 10) || 0,
        image: formProdImage.trim(),
        fulfillmentType: formProdFulfillmentType,
        sortOrder: parseInt(formProdSortOrder, 10) || 0,
      }

      const res = await fetch('/api/admin/products', {
        method: isEditingProduct ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setProductDialogOpen(false)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در ثبت مشخصات محصول.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSubmittingProduct(false)
    }
  }

  // --- Plan Handlers ---
  const openCreatePlanDialog = (productId: string) => {
    setIsEditingPlan(false)
    setCurrentPlanId(null)
    setPlanTargetProductId(productId)
    setFormPlanName('')
    setFormPlanDuration('1')
    setFormPlanPrice('')
    setFormPlanFulfillmentType('ACTIVATION_LINK')
    setFormPlanFields([])
    setFormPlanActive(true)
    const currentProd = products.find((p) => p.id === productId)
    const existingPlansCount = currentProd?.plans?.length || 0
    setFormPlanSortOrder(String(existingPlansCount + 1))
    setPreviewValues({})
    setPlanModalTab('config')
    setPlanDialogOpen(true)
  }

  const openEditPlanDialog = (plan: PlanItem) => {
    setIsEditingPlan(true)
    setCurrentPlanId(plan.id)
    setPlanTargetProductId(plan.productId)
    setFormPlanName(plan.name)
    setFormPlanDuration(String(plan.duration))
    setFormPlanPrice(String(plan.price))
    setFormPlanFulfillmentType(plan.fulfillmentType || 'ACTIVATION_LINK')
    setFormPlanFields(Array.isArray(plan.checkoutFields) ? plan.checkoutFields : [])
    setFormPlanActive(plan.active !== undefined ? plan.active : true)
    setFormPlanSortOrder(String(plan.sortOrder || 1))
    setPreviewValues({})
    setPlanModalTab('config')
    setPlanDialogOpen(true)
  }

  const handleAddField = () => {
    const nextOrder = formPlanFields.length + 1
    const newField: CheckoutFieldDefinition = {
      key: `field_${Date.now().toString().slice(-4)}`,
      label: `فیلد شماره ${nextOrder}`,
      type: 'text',
      required: true,
      placeholder: '',
      order: nextOrder,
    }
    setFormPlanFields([...formPlanFields, newField])
  }

  const handleAddPresetField = (type: 'email' | 'phone' | 'note') => {
    const presets: Record<string, CheckoutFieldDefinition> = {
      email: {
        key: 'customer_email',
        label: 'ایمیل اکانت گوگل شخصی شما',
        type: 'email',
        required: true,
        placeholder: 'example@gmail.com',
        order: formPlanFields.length + 1,
      },
      phone: {
        key: 'phone_number',
        label: 'شماره تماس جهت پیگیری سفارش',
        type: 'phone',
        required: false,
        placeholder: '0912xxxxxxx',
        order: formPlanFields.length + 1,
      },
      note: {
        key: 'order_notes',
        label: 'توضیحات و مشخصات سفارشی',
        type: 'textarea',
        required: false,
        placeholder: 'در صورت نیاز به ارسال مشخصات دلخواه، اینجا وارد نمایید...',
        order: formPlanFields.length + 1,
      },
    }

    const preset = presets[type]
    if (preset) {
      const exists = formPlanFields.some((f) => f.key === preset.key)
      const fieldToAdd: CheckoutFieldDefinition = exists
        ? { ...preset, key: `${preset.key}_${Date.now().toString().slice(-4)}` }
        : preset
      setFormPlanFields((prev) => [...prev, fieldToAdd])
    }
  }

  const handleUpdateField = (index: number, updates: Partial<CheckoutFieldDefinition>) => {
    setFormPlanFields((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  const handleRemoveField = (index: number) => {
    setFormPlanFields((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= formPlanFields.length) return
    setFormPlanFields((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next.map((item, idx) => ({ ...item, order: idx + 1 }))
    })
  }

  const handleSavePlan = async () => {
    if (!formPlanName.trim()) {
      toast.error('نام پلن الزامی است.')
      return
    }

    const priceNum = parseInt(formPlanPrice, 10)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('مبلغ معتبری برای پلن وارد فرمایید.')
      return
    }

    setSubmittingPlan(true)
    try {
      const payload = {
        id: currentPlanId,
        productId: planTargetProductId,
        name: formPlanName.trim(),
        duration: parseInt(formPlanDuration, 10) || 1,
        price: priceNum,
        fulfillmentType: formPlanFulfillmentType,
        checkoutFields: formPlanFields,
        sortOrder: parseInt(formPlanSortOrder, 10) || 1,
        active: formPlanActive,
      }

      const res = await fetch('/api/admin/plans', {
        method: isEditingPlan ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setPlanDialogOpen(false)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در ذخیره پلن.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSubmittingPlan(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('آیا از حذف یا غیرفعال‌سازی این پلن اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/admin/plans?id=${planId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در حذف پلن.')
      }
    } catch {
      toast.error('خطای سرور.')
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2 overflow-hidden'>
          <h1 className='text-sm sm:text-base font-bold flex items-center gap-2 truncate'>
            <ShoppingBag className='size-4 text-primary shrink-0' />
            <span className='truncate'>مدیریت محصولات و پلن‌های فروش (Product & Plan Engine)</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            size='sm'
            onClick={openCreateProductDialog}
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
                معماری تفکیک‌شده Product و Plan با موتور تحویل جنریک
              </span>
              <p className='text-muted-foreground mt-1'>
                هر محصول می‌تواند چند پلن با دوره‌ها، قیمت‌ها، روش‌های تحویل و فیلدهای داینامیک Checkout متفاوت داشته باشد. تغییرات به صورت بلادرنگ در وب و ربات‌ها اعمال می‌شوند.
              </p>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <Badge variant='outline' className='bg-background text-primary border-primary/30 font-mono'>
                {products.filter((p) => p.status === 'ACTIVE').length} محصول فعال
              </Badge>
            </div>
          </div>

          {/* Products List */}
          {loading ? (
            <div className='flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground'>
              <Loader2 className='size-8 animate-spin text-primary' />
              <span className='text-xs'>در حال بارگذاری اطلاعات محصولات...</span>
            </div>
          ) : products.length === 0 ? (
            <Card className='p-12 text-center text-xs text-muted-foreground border-dashed'>
              هنوز هیچ محصولی ثبت نشده است. با کلیک بر روی «محصول جدید» اولین محصول را تعریف کنید.
            </Card>
          ) : (
            <div className='grid grid-cols-1 gap-4'>
              {products.map((prod) => {
                const isExpanded = expandedProductIds[prod.id] !== false // default expanded
                const plans = prod.plans || []

                return (
                  <Card
                    key={prod.id}
                    className={`border-border/60 shadow-xs overflow-hidden transition-all duration-200 ${
                      prod.status === 'ACTIVE' ? 'hover:border-primary/40' : 'opacity-75 bg-muted/20'
                    }`}
                  >
                    <div className='p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40'>
                      {/* Product Header Info */}
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
                              title='مشاهده صفحه اختصاصی'
                            >
                              <span>/{prod.slug}</span>
                              <ExternalLink className='size-3' />
                            </Link>
                            {prod.status === 'ACTIVE' ? (
                              <Badge className='bg-primary/15 text-primary border-primary/30 text-[10px]'>
                                فعال در فروشگاه
                              </Badge>
                            ) : (
                              <Badge variant='outline' className='text-rose-500 border-rose-500/30 text-[10px]'>
                                غیرفعال
                              </Badge>
                            )}
                            <Badge variant='outline' className='text-[10px] font-sans'>
                              {plans.length} پلن تعریف‌شده
                            </Badge>
                          </div>
                          {prod.shortDescription && (
                            <p className='text-xs text-muted-foreground line-clamp-1'>
                              {prod.shortDescription}
                            </p>
                          )}
                          <div className='flex flex-wrap items-center gap-4 text-xs pt-1 text-muted-foreground'>
                            <span>مجموع فروش: {prod.purchaseCount.toLocaleString('fa-IR')} سفارش</span>
                            <span>اولویت: {prod.sortOrder}</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Actions */}
                      <div className='flex items-center gap-2 shrink-0 self-end md:self-center'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openCreatePlanDialog(prod.id)}
                          className='h-8 px-2.5 text-xs gap-1 font-semibold border-primary/30 text-primary hover:bg-primary/10'
                        >
                          <Plus className='size-3.5' />
                          <span>افزودن پلن جدید</span>
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openEditProductDialog(prod)}
                          className='h-8 px-2.5 text-xs gap-1'
                        >
                          <Edit3 className='size-3.5' />
                          <span>ویرایش محصول</span>
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleExpand(prod.id)}
                          className='h-8 px-2 text-xs'
                          title={isExpanded ? 'بستن پلن‌ها' : 'مشاهده پلن‌ها'}
                        >
                          {isExpanded ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
                        </Button>
                      </div>
                    </div>

                    {/* Associated Plans Accordion Section */}
                    {isExpanded && (
                      <div className='bg-muted/10 p-4 sm:p-5 space-y-3'>
                        <div className='flex items-center justify-between'>
                          <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                            <Layers className='size-3.5 text-primary' />
                            <span>پلن‌های فروش این محصول ({plans.length} پلن):</span>
                          </span>
                        </div>

                        {plans.length === 0 ? (
                          <div className='p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl'>
                            هنوز پلنی برای این محصول تعریف نشده است. با کلیک بر روی «افزودن پلن جدید» اولین پلن را اضافه نمایید.
                          </div>
                        ) : (
                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                            {plans.map((plan) => {
                              const fulfillment = getFulfillmentBadge(plan.fulfillmentType)
                              const fieldCount = Array.isArray(plan.checkoutFields)
                                ? plan.checkoutFields.length
                                : 0

                              return (
                                <div
                                  key={plan.id}
                                  className='rounded-xl border border-border/70 bg-card p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:border-primary/40 transition-all'
                                >
                                  <div className='space-y-2'>
                                    <div className='flex items-start justify-between gap-2'>
                                      <div>
                                        <div className='flex items-center gap-1.5 flex-wrap'>
                                          <h3 className='font-bold text-foreground text-xs sm:text-sm'>
                                            {plan.name}
                                          </h3>
                                          {!plan.active && (
                                            <Badge variant='outline' className='text-[9px] px-1.5 py-0 text-amber-500 border-amber-500/30 bg-amber-500/10'>
                                              غیرفعال
                                            </Badge>
                                          )}
                                        </div>
                                        <span className='text-[11px] text-muted-foreground'>
                                          مدت زمان: {plan.duration} ماهه
                                        </span>
                                      </div>
                                      <Badge variant='outline' className={`text-[10px] font-semibold ${fulfillment.color}`}>
                                        {fulfillment.label}
                                      </Badge>
                                    </div>

                                    <div className='pt-1 flex items-baseline justify-between border-t border-border/40'>
                                      <span className='text-xs text-muted-foreground'>قیمت:</span>
                                      <strong className='text-sm font-bold text-primary font-sans'>
                                        {formatPrice(plan.price)}
                                      </strong>
                                    </div>

                                    <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                                      <span>فیلدهای Checkout:</span>
                                      <Badge variant='outline' className='text-[10px] font-mono'>
                                        {fieldCount} فیلد
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className='flex items-center justify-end gap-1.5 pt-2 border-t border-border/40'>
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      onClick={() => openEditPlanDialog(plan)}
                                      className='h-7 px-2 text-[11px] gap-1'
                                    >
                                      <Edit3 className='size-3' />
                                      <span>پیکربندی</span>
                                    </Button>
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      onClick={() => handleDeletePlan(plan.id)}
                                      className='h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600'
                                      title='حذف پلن'
                                    >
                                      <Trash2 className='size-3' />
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </Main>

      {/* PRODUCT CREATE/EDIT DIALOG */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className='max-w-xl p-6 max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold'>
              {isEditingProduct ? 'ویرایش محصول' : 'تعریف محصول جدید'}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              اطلاعات محصول به عنوان ظرف اصلی پلن‌های فروش تعریف می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2 text-xs'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='font-semibold block mb-1'>عنوان محصول: *</label>
                <Input
                  value={formProdTitle}
                  onChange={(e) => setFormProdTitle(e.target.value)}
                  placeholder='مثال: ChatGPT Plus'
                  className='text-xs h-9'
                />
              </div>
              <div>
                <label className='font-semibold block mb-1'>شناسه یکتا (Slug): *</label>
                <Input
                  value={formProdSlug}
                  onChange={(e) => setFormProdSlug(e.target.value)}
                  placeholder='chatgpt-plus'
                  className='text-xs h-9 font-mono'
                  dir='ltr'
                />
              </div>
            </div>

            <div>
              <label className='font-semibold block mb-1'>توضیح کوتاه:</label>
              <Input
                value={formProdShortDesc}
                onChange={(e) => setFormProdShortDesc(e.target.value)}
                placeholder='خلاصه کلیدی در یک جمله'
                className='text-xs h-9'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>توضیحات جامع محصول:</label>
              <textarea
                value={formProdDesc}
                onChange={(e) => setFormProdDesc(e.target.value)}
                rows={4}
                placeholder='مزایا و توضیحات کامل محصول...'
                className='w-full rounded-md border border-input bg-background p-3 text-xs'
              />
            </div>
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              variant='outline'
              onClick={() => setProductDialogOpen(false)}
              disabled={submittingProduct}
              className='text-xs'
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={submittingProduct}
              className='text-xs font-semibold'
            >
              {submittingProduct && <Loader2 className='size-3.5 animate-spin me-1.5' />}
              ذخیره محصول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PLAN CREATE/EDIT DIALOG WITH DYNAMIC FIELD BUILDER & LIVE CHECKOUT PREVIEW */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent
          className='w-[96vw] max-w-5xl p-0 gap-0 max-h-[92vh] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 shadow-2xl'
          dir='rtl'
        >
          {/* Sticky Modal Header */}
          <div className='p-4 sm:p-5 border-b border-border/50 bg-card shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='flex items-start sm:items-center gap-3'>
              <div className='size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20'>
                <Sliders className='size-5' />
              </div>
              <div>
                <DialogTitle className='text-sm sm:text-base font-bold text-foreground flex items-center gap-2'>
                  <span>{isEditingPlan ? 'پیکربندی و ویرایش پلن فروش' : 'تعریف پلن فروش جدید'}</span>
                  {(() => {
                    const targetProd = products.find((p) => p.id === planTargetProductId)
                    return targetProd ? (
                      <Badge variant='secondary' className='text-[11px] font-normal hidden sm:inline-flex'>
                        {targetProd.title || targetProd.name}
                      </Badge>
                    ) : null
                  })()}
                </DialogTitle>
                <DialogDescription className='text-xs text-muted-foreground mt-0.5'>
                  تعیین دوره، قیمت‌گذاری، متد تحویل خودکار و تعریف فیلدهای اختصاصی فرم Checkout
                </DialogDescription>
              </div>
            </div>

            {/* Mobile / Tablet Responsive Tab Switcher */}
            <div className='lg:hidden flex items-center bg-muted/70 p-1 rounded-xl border border-border/60 self-stretch sm:self-auto'>
              <button
                type='button'
                onClick={() => setPlanModalTab('config')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  planModalTab === 'config'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className='size-3.5' />
                <span>تنظیمات پلن و فیلدها</span>
              </button>
              <button
                type='button'
                onClick={() => setPlanModalTab('preview')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  planModalTab === 'preview'
                    ? 'bg-background text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className='size-3.5' />
                <span>پیش‌نمایش زنده</span>
                {formPlanFields.length > 0 && (
                  <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
              {/* Left/Main Column: Configuration & Dynamic Form Builder */}
              <div
                className={`lg:col-span-7 space-y-5 ${
                  planModalTab === 'preview' ? 'hidden lg:block' : 'block'
                }`}
              >
                {/* Section 1: Basic Information */}
                <div className='bg-card rounded-2xl border border-border/70 p-4 sm:p-5 shadow-xs space-y-4'>
                  <div className='flex items-center justify-between pb-2 border-b border-border/40'>
                    <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                      <Tag className='size-4 text-primary' />
                      <span>مشخصات اصلی پلن</span>
                    </span>
                    <div className='flex items-center gap-2'>
                      <label htmlFor='plan-active-toggle' className='text-xs font-medium text-muted-foreground cursor-pointer select-none'>
                        {formPlanActive ? 'پلن فعال است' : 'پلن غیرفعال است'}
                      </label>
                      <Switch
                        id='plan-active-toggle'
                        checked={formPlanActive}
                        onCheckedChange={setFormPlanActive}
                      />
                    </div>
                  </div>

                  {/* Plan Name & Duration */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                    <div>
                      <label className='text-xs font-semibold text-foreground block mb-1.5'>
                        عنوان پلن: <span className='text-rose-500'>*</span>
                      </label>
                      <Input
                        value={formPlanName}
                        onChange={(e) => setFormPlanName(e.target.value)}
                        placeholder='مثلاً: اشتراک ۱۲ ماهه اختصاصی'
                        className='text-xs h-9.5 rounded-xl'
                      />
                    </div>

                    <div>
                      <label className='text-xs font-semibold text-foreground block mb-1.5'>
                        مدت زمان دوره (به ماه):
                      </label>
                      <div className='space-y-1.5'>
                        <Input
                          type='number'
                          value={formPlanDuration}
                          onChange={(e) => setFormPlanDuration(e.target.value)}
                          placeholder='12'
                          className='text-xs h-9.5 rounded-xl font-mono'
                          dir='ltr'
                          min={1}
                        />
                        {/* Quick Duration Buttons */}
                        <div className='flex items-center gap-1.5 flex-wrap pt-0.5'>
                          {['1', '3', '6', '12', '24'].map((m) => (
                            <button
                              key={m}
                              type='button'
                              onClick={() => setFormPlanDuration(m)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                                formPlanDuration === m
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                              }`}
                            >
                              {m} ماهه
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Sort Order */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1'>
                    <div>
                      <label className='text-xs font-semibold text-foreground block mb-1.5'>
                        مبلغ پلن (تومان): <span className='text-rose-500'>*</span>
                      </label>
                      <Input
                        type='number'
                        value={formPlanPrice}
                        onChange={(e) => setFormPlanPrice(e.target.value)}
                        placeholder='390000'
                        className='text-xs h-9.5 rounded-xl font-mono'
                        dir='ltr'
                        min={0}
                        step={1000}
                      />
                      <div className='flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 px-1'>
                        <span>معادل:</span>
                        <span className='font-bold text-primary'>
                          {parseInt(formPlanPrice, 10)
                            ? formatPrice(parseInt(formPlanPrice, 10))
                            : '۰ تومان'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className='text-xs font-semibold text-foreground block mb-1.5'>
                        ترتیب نمایش (اولویت):
                      </label>
                      <Input
                        type='number'
                        value={formPlanSortOrder}
                        onChange={(e) => setFormPlanSortOrder(e.target.value)}
                        placeholder='1'
                        className='text-xs h-9.5 rounded-xl font-mono'
                        dir='ltr'
                        min={1}
                      />
                      <span className='text-[10px] text-muted-foreground mt-1.5 block px-1'>
                        اعداد کوچکتر زودتر در لیست پلن‌ها نمایش داده می‌شوند.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Fulfillment Selection (Visual Interactive Cards) */}
                <div className='bg-card rounded-2xl border border-border/70 p-4 sm:p-5 shadow-xs space-y-3'>
                  <div className='flex items-center justify-between pb-2 border-b border-border/40'>
                    <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                      <Package className='size-4 text-primary' />
                      <span>نوع تحویل و پردازش سفارش (Fulfillment Engine)</span>
                    </span>
                    <Badge variant='outline' className='text-[10px] font-normal'>
                      انبارداری و تحویل خودکار
                    </Badge>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1'>
                    {[
                      {
                        type: 'ACTIVATION_LINK' as FulfillmentType,
                        title: 'لینک فعال‌سازی آنی',
                        desc: 'ارسال خودکار لینک اختصاصی از انبار لینک‌ها بلافاصله پس از پرداخت',
                        icon: Zap,
                        color: 'text-emerald-500',
                        activeClass: 'border-emerald-500/70 bg-emerald-500/5 ring-2 ring-emerald-500/20',
                      },
                      {
                        type: 'PRE_CREATED_ACCOUNT' as FulfillmentType,
                        title: 'اکانت از پیش ساخته‌شده',
                        desc: 'ارسال نام کاربری و رمز عبور از انبار اکانت‌های آماده به خریدار',
                        icon: Package,
                        color: 'text-blue-500',
                        activeClass: 'border-blue-500/70 bg-blue-500/5 ring-2 ring-blue-500/20',
                      },
                      {
                        type: 'CUSTOMER_PROVISIONING' as FulfillmentType,
                        title: 'فعال‌سازی روی ایمیل مشتری',
                        desc: 'تحویل اشتراک مستقیماً بر روی ایمیل شخصی و ارائه‌شده توسط مشتری',
                        icon: Sparkles,
                        color: 'text-purple-500',
                        activeClass: 'border-purple-500/70 bg-purple-500/5 ring-2 ring-purple-500/20',
                      },
                      {
                        type: 'MANUAL' as FulfillmentType,
                        title: 'تحویل دستی پشتیبانی',
                        desc: 'ثبت سفارش در وضعیت نیازمند بررسی جهت هماهنگی دستی توسط پشتیبانی',
                        icon: Settings2,
                        color: 'text-amber-500',
                        activeClass: 'border-amber-500/70 bg-amber-500/5 ring-2 ring-amber-500/20',
                      },
                    ].map((opt) => {
                      const Icon = opt.icon
                      const isSelected = formPlanFulfillmentType === opt.type
                      return (
                        <div
                          key={opt.type}
                          onClick={() => {
                            setFormPlanFulfillmentType(opt.type)
                            if (opt.type === 'CUSTOMER_PROVISIONING' && formPlanFields.length === 0) {
                              handleAddPresetField('email')
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer select-none relative flex flex-col justify-between gap-2 ${
                            isSelected
                              ? opt.activeClass
                              : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                          }`}
                        >
                          <div className='flex items-start justify-between gap-2'>
                            <div className='flex items-center gap-2'>
                              <div
                                className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-background shadow-xs' : 'bg-muted'
                                }`}
                              >
                                <Icon className={`size-4 ${opt.color}`} />
                              </div>
                              <span className='font-bold text-xs text-foreground'>
                                {opt.title}
                              </span>
                            </div>
                            {isSelected && (
                              <div className='size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs'>
                                <Check className='size-3 stroke-[3]' />
                              </div>
                            )}
                          </div>
                          <p className='text-[10.5px] leading-relaxed text-muted-foreground'>
                            {opt.desc}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Section 3: Dynamic Checkout Fields Builder */}
                <div className='bg-card rounded-2xl border border-border/70 p-4 sm:p-5 shadow-xs space-y-3.5'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40'>
                    <div>
                      <div className='flex items-center gap-1.5'>
                        <CreditCard className='size-4 text-primary' />
                        <span className='text-xs font-bold text-foreground'>
                          اطلاعات مورد نیاز در صفحه پرداخت (Checkout Fields)
                        </span>
                        <Badge variant='secondary' className='text-[10px] font-mono'>
                          {formPlanFields.length} فیلد
                        </Badge>
                      </div>
                      <span className='text-[11px] text-muted-foreground block mt-0.5'>
                        فیلدهایی که کاربر حین تسویه‌حساب باید پر کند (مانند ایمیل گوگل، شماره تماس و...)
                      </span>
                    </div>

                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleAddField}
                      className='h-8 px-3 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 rounded-xl font-semibold self-start sm:self-auto'
                    >
                      <Plus className='size-3.5' />
                      <span>افزودن فیلد سفارشی</span>
                    </Button>
                  </div>

                  {/* Preset Shortcuts */}
                  <div className='flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-muted/30 border border-border/40'>
                    <span className='text-[11px] font-medium text-muted-foreground flex items-center gap-1 me-1'>
                      <Sparkles className='size-3 text-primary' />
                      <span>افزودن سریع:</span>
                    </span>
                    <button
                      type='button'
                      onClick={() => handleAddPresetField('email')}
                      className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] bg-background hover:bg-muted border border-border/60 text-foreground transition-all shadow-2xs'
                    >
                      <Mail className='size-3 text-blue-500' />
                      <span>+ ایمیل گوگل</span>
                    </button>
                    <button
                      type='button'
                      onClick={() => handleAddPresetField('phone')}
                      className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] bg-background hover:bg-muted border border-border/60 text-foreground transition-all shadow-2xs'
                    >
                      <Phone className='size-3 text-emerald-500' />
                      <span>+ شماره تماس</span>
                    </button>
                    <button
                      type='button'
                      onClick={() => handleAddPresetField('note')}
                      className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] bg-background hover:bg-muted border border-border/60 text-foreground transition-all shadow-2xs'
                    >
                      <FileText className='size-3 text-purple-500' />
                      <span>+ توضیحات سفارش</span>
                    </button>
                  </div>

                  {/* Fields List */}
                  {formPlanFields.length === 0 ? (
                    <div className='p-6 rounded-xl border border-dashed border-border/80 text-center bg-muted/20 space-y-1.5'>
                      <Info className='size-5 text-muted-foreground mx-auto opacity-70' />
                      <span className='text-xs font-semibold text-foreground block'>
                        هیچ فیلد ورودی تعریف نشده است
                      </span>
                      <p className='text-[11px] text-muted-foreground max-w-sm mx-auto'>
                        سفارش به‌صورت پرداخت سریع و بدون نیاز به فرم ثبت خواهد شد. برای دریافت ایمیل اکانت یا اطلاعات مشتری، از دکمه‌های بالا فیلد اضافه فرمایید.
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-3 max-h-[360px] overflow-y-auto pe-1.5'>
                      {formPlanFields.map((field, idx) => (
                        <div
                          key={idx}
                          className='p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all space-y-3 shadow-2xs'
                        >
                          {/* Field Item Header */}
                          <div className='flex items-center justify-between pb-2 border-b border-border/40'>
                            <div className='flex items-center gap-2'>
                              <div className='size-5 rounded-md bg-muted text-foreground flex items-center justify-center font-mono text-[10px] font-bold'>
                                {idx + 1}
                              </div>
                              <span className='text-xs font-bold text-foreground'>
                                {field.label || 'فیلد بدون عنوان'}
                              </span>
                              {field.required && (
                                <Badge variant='destructive' className='text-[9px] px-1.5 py-0'>
                                  الزامی
                                </Badge>
                              )}
                            </div>

                            <div className='flex items-center gap-1'>
                              {/* Reorder Buttons */}
                              <button
                                type='button'
                                disabled={idx === 0}
                                onClick={() => handleMoveField(idx, 'up')}
                                className='p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all'
                                title='انتقال به بالا'
                              >
                                <ArrowUp className='size-3.5' />
                              </button>
                              <button
                                type='button'
                                disabled={idx === formPlanFields.length - 1}
                                onClick={() => handleMoveField(idx, 'down')}
                                className='p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all'
                                title='انتقال به پایین'
                              >
                                <ArrowDown className='size-3.5' />
                              </button>

                              <div className='h-3 w-px bg-border mx-1' />

                              {/* Delete Button */}
                              <button
                                type='button'
                                onClick={() => handleRemoveField(idx)}
                                className='p-1 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all'
                                title='حذف فیلد'
                              >
                                <Trash2 className='size-3.5' />
                              </button>
                            </div>
                          </div>

                          {/* Field Properties Grid */}
                          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5'>
                            <div>
                              <span className='text-[11px] font-medium text-muted-foreground block mb-1'>
                                عنوان فارسی: <span className='text-rose-500'>*</span>
                              </span>
                              <Input
                                value={field.label}
                                onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                                placeholder='مثال: ایمیل اکانت'
                                className='text-xs h-8.5 rounded-lg'
                              />
                            </div>

                            <div>
                              <span className='text-[11px] font-medium text-muted-foreground block mb-1'>
                                کلید سیستمی (Key): <span className='text-rose-500'>*</span>
                              </span>
                              <Input
                                value={field.key}
                                onChange={(e) => handleUpdateField(idx, { key: e.target.value })}
                                placeholder='email'
                                className='text-xs h-8.5 rounded-lg font-mono'
                                dir='ltr'
                              />
                            </div>

                            <div>
                              <span className='text-[11px] font-medium text-muted-foreground block mb-1'>
                                نوع داده ورودی:
                              </span>
                              <Select
                                value={field.type}
                                onValueChange={(val: any) => handleUpdateField(idx, { type: val })}
                              >
                                <SelectTrigger className='h-8.5 text-xs rounded-lg w-full'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='text'>متن تک خطی (Text)</SelectItem>
                                  <SelectItem value='email'>آدرس ایمیل (Email)</SelectItem>
                                  <SelectItem value='phone'>شماره تماس (Phone)</SelectItem>
                                  <SelectItem value='textarea'>متن چند خطی (Textarea)</SelectItem>
                                  <SelectItem value='number'>عدد (Number)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <span className='text-[11px] font-medium text-muted-foreground block mb-1'>
                                متن راهنما (Placeholder):
                              </span>
                              <Input
                                value={field.placeholder || ''}
                                onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                                placeholder='مثال: user@gmail.com'
                                className='text-xs h-8.5 rounded-lg'
                              />
                            </div>
                          </div>

                          {/* Field Options / Toggles */}
                          <div className='flex items-center gap-2 pt-1'>
                            <Checkbox
                              id={`field-req-${idx}`}
                              checked={field.required}
                              onCheckedChange={(checked) =>
                                handleUpdateField(idx, { required: Boolean(checked) })
                              }
                            />
                            <label
                              htmlFor={`field-req-${idx}`}
                              className='text-xs font-medium text-muted-foreground select-none cursor-pointer'
                            >
                              تکمیل این فیلد توسط مشتری در زمان پرداخت الزامی است
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Realistic Live Checkout Preview */}
              <div
                className={`lg:col-span-5 space-y-4 ${
                  planModalTab === 'config' ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className='bg-card rounded-2xl border-2 border-primary/30 p-4 sm:p-5 shadow-lg relative overflow-hidden'>
                  {/* Glowing header bar */}
                  <div className='absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary' />

                  <div className='flex items-center justify-between pb-3 border-b border-border/50'>
                    <div className='flex items-center gap-2'>
                      <div className='size-2.5 rounded-full bg-emerald-500 animate-pulse' />
                      <span className='text-xs font-bold text-foreground'>
                        پیش‌نمایش زنده صفحه پرداخت مشتری
                      </span>
                    </div>
                    <Badge variant='outline' className='text-[10px] font-normal'>
                      Real-time Preview
                    </Badge>
                  </div>

                  <div className='space-y-4 pt-3'>
                    {/* Selected Plan Summary Card */}
                    <div className='p-3.5 rounded-xl bg-gradient-to-br from-primary/5 via-muted/30 to-background border border-primary/20 space-y-2'>
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <span className='text-[10px] text-muted-foreground font-medium block'>
                            پلن انتخابی مشتری:
                          </span>
                          <h4 className='font-bold text-sm text-foreground'>
                            {formPlanName || 'نام و عنوان پلن فروش'}
                          </h4>
                        </div>
                        <Badge
                          variant='outline'
                          className={`text-[10px] font-semibold ${
                            getFulfillmentBadge(formPlanFulfillmentType).color
                          }`}
                        >
                          {getFulfillmentBadge(formPlanFulfillmentType).label}
                        </Badge>
                      </div>

                      <div className='flex items-baseline justify-between pt-1 border-t border-border/40'>
                        <span className='text-xs text-muted-foreground'>
                          مدت دوره: {formPlanDuration || '۱'} ماهه
                        </span>
                        <div className='text-end'>
                          <span className='text-base font-extrabold text-primary font-sans'>
                            {formPlanPrice
                              ? formatPrice(parseInt(formPlanPrice, 10) || 0)
                              : '۰ تومان'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Fields Live Render */}
                    <div className='space-y-3'>
                      {formPlanFields.length === 0 ? (
                        <div className='p-4 rounded-xl border border-dashed border-border/70 text-center bg-muted/20 space-y-1'>
                          <Zap className='size-4 text-emerald-500 mx-auto' />
                          <span className='text-xs font-medium text-foreground block'>
                            بدون نیاز به ثبت مشخصات
                          </span>
                          <span className='text-[11px] text-muted-foreground block'>
                            کاربر مستقیماً با یک کلیک به درگاه پرداخت هدایت خواهد شد.
                          </span>
                        </div>
                      ) : (
                        <div className='p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-3'>
                          <span className='text-xs font-bold text-muted-foreground block'>
                            فیلدهای مورد نیاز قبل از پرداخت:
                          </span>
                          <DynamicCheckoutForm
                            fields={formPlanFields}
                            values={previewValues}
                            onChange={(k, v) => setPreviewValues((p) => ({ ...p, [k]: v }))}
                          />
                        </div>
                      )}
                    </div>

                    {/* Simulated Payment Button */}
                    <div className='pt-2'>
                      <Button
                        disabled
                        className='w-full h-10 text-xs font-bold rounded-xl shadow-md pointer-events-none opacity-85'
                      >
                        <CreditCard className='size-4 me-1.5' />
                        <span>تکمیل اطلاعات و اتصال به درگاه پرداخت (پیش‌نمایش)</span>
                      </Button>
                      <span className='text-[10px] text-muted-foreground text-center block mt-1.5'>
                        این کادر دقیقاً نحوه نمایش در فرانت‌اند و فرآیند خرید خریدار را شبیه‌سازی می‌کند.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className='p-3.5 sm:p-4 border-t border-border/50 bg-card shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3'>
            <div className='text-xs text-muted-foreground flex items-center gap-2 self-start sm:self-auto'>
              <span className='size-2 rounded-full bg-primary' />
              <span>
                نوع تحویل:{' '}
                <strong className='text-foreground'>
                  {getFulfillmentBadge(formPlanFulfillmentType).label}
                </strong>
              </span>
              <span className='text-border'>|</span>
              <span>
                تعداد فیلدها:{' '}
                <strong className='text-foreground'>{formPlanFields.length} فیلد</strong>
              </span>
            </div>

            <div className='flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto'>
              <Button
                variant='outline'
                onClick={() => setPlanDialogOpen(false)}
                disabled={submittingPlan}
                className='flex-1 sm:flex-initial text-xs h-9 px-4 rounded-xl'
              >
                انصراف
              </Button>
              <Button
                onClick={handleSavePlan}
                disabled={submittingPlan}
                className='flex-1 sm:flex-initial text-xs font-bold h-9 px-5 rounded-xl shadow-sm'
              >
                {submittingPlan ? (
                  <>
                    <Loader2 className='size-3.5 animate-spin me-1.5' />
                    <span>در حال ذخیره‌سازی...</span>
                  </>
                ) : (
                  <>
                    <Check className='size-3.5 me-1.5 stroke-[2.5]' />
                    <span>{isEditingPlan ? 'ذخیره تغییرات پلن' : 'ذخیره و انتشار پلن'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
