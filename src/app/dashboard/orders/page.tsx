'use client'

import { useEffect, useState, useTransition, useCallback, useRef } from 'react'
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
  Eye,
  Check,
  Send,
  User,
  Key,
  Sparkles,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  X,
  Globe,
  Calendar,
  ArrowUpDown,
  Tag,
  LayoutGrid,
  Table as TableIcon,
  Receipt,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

interface AdminOrder {
  id: string
  amount: number
  discountAmount?: number | null
  coupon?: {
    id?: string
    code: string
    discountType: string
    discountValue: number
  } | null
  refundAmount?: number | null
  refundReason?: string | null
  refundRefId?: string | null
  refundedAt?: string | null
  status: string
  fulfillmentStatus?: string
  source: string | null
  checkoutData?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    phone: string | null
    name: string | null
    telegramUsername: string | null
  }
  product?: {
    id: string
    title: string
    slug?: string
    name?: string
  } | null
  plan?: {
    id: string
    name: string
    duration: number
    fulfillmentType?: string
    product: {
      name?: string
      title?: string
    }
  } | null
  payment: {
    id: string
    amount: number
    status: string
    gatewayName: string
    authority: string | null
    refId: string | null
    createdAt: string
  } | null
  activationLink: {
    id: string
    url: string
    status: string
    assignedAt: string | null
    usedAt: string | null
  } | null
  delivery: {
    id: string
    type: string
    status: string
    data: any
    deliveredAt: string | null
  } | null
}

interface ProductOption {
  id: string
  title: string
  slug: string
}

interface OrdersResponse {
  success: boolean
  orders: AdminOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasPrevPage: boolean
    hasNextPage: boolean
  }
  counts: {
    all: number
    needsAction: number
    paid: number
    completed: number
    pendingPayment: number
    failedOrCancelled: number
    refunded: number
    expired: number
  }
  filterOptions: {
    products: ProductOption[]
  }
  error?: string
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
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSec < 60) return 'لحظاتی پیش'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} دقیقه پیش`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ساعت پیش`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} روز پیش`
    return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getFulfillmentBadge(type?: string) {
  switch (type) {
    case 'ACTIVATION_LINK':
      return {
        label: 'لینک فعال‌سازی',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        dot: 'bg-blue-500',
      }
    case 'PRE_CREATED_ACCOUNT':
      return {
        label: 'اکانت آماده',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        dot: 'bg-purple-500',
      }
    case 'CUSTOMER_PROVISIONING':
      return {
        label: 'ساخت روی اکانت مشتری',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-500',
      }
    case 'MANUAL':
      return {
        label: 'تحویل دستی پشتیبانی',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        dot: 'bg-amber-500',
      }
    case 'ACTIVATION_CODE':
      return {
        label: 'کد فعال‌سازی',
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        dot: 'bg-indigo-500',
      }
    case 'DOWNLOAD':
      return {
        label: 'دانلودی',
        color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        dot: 'bg-cyan-500',
      }
    default:
      return {
        label: type || 'پیش‌فرض',
        color: 'bg-muted text-muted-foreground border-border',
        dot: 'bg-muted-foreground',
      }
  }
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'تکمیل شده',
        variant: 'default' as const,
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
        icon: CheckCircle2,
      }
    case 'PAID':
      return {
        label: 'پرداخت شده',
        variant: 'default' as const,
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
        icon: Clock,
      }
    case 'PENDING_PAYMENT':
      return {
        label: 'در انتظار پرداخت',
        variant: 'outline' as const,
        className: 'bg-muted/60 text-muted-foreground border-border/80',
        icon: Clock,
      }
    case 'FAILED':
      return {
        label: 'ناموفق',
        variant: 'destructive' as const,
        className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        icon: XCircle,
      }
    case 'CANCELLED':
      return {
        label: 'لغو شده',
        variant: 'outline' as const,
        className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
        icon: XCircle,
      }
    case 'REFUNDED':
      return {
        label: 'استرداد شده',
        variant: 'outline' as const,
        className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
        icon: Receipt,
      }
    case 'EXPIRED':
      return {
        label: 'منقضی شده',
        variant: 'outline' as const,
        className: 'bg-stone-500/15 text-stone-600 dark:text-stone-400 border-stone-500/30',
        icon: Clock,
      }
    default:
      return {
        label: status,
        variant: 'outline' as const,
        className: 'bg-muted text-muted-foreground',
        icon: Clock,
      }
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [, startTransition] = useTransition()

  // Pagination State
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)

  // Filter States
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('ALL')
  const [fulfillmentTypeFilter, setFulfillmentTypeFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [productIdFilter, setProductIdFilter] = useState('ALL')
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST')

  // UI States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [productsList, setProductsList] = useState<ProductOption[]>([])
  const [counts, setCounts] = useState({
    all: 0,
    needsAction: 0,
    paid: 0,
    completed: 0,
    pendingPayment: 0,
    failedOrCancelled: 0,
    refunded: 0,
    expired: 0,
  })

  // Selected Order & Modals
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualNote, setManualNote] = useState('')
  const [manualInfo, setManualInfo] = useState('')
  const [deliveringManual, setDeliveringManual] = useState(false)

  // Refund Modal States (Section 4.1)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundOrderTarget, setRefundOrderTarget] = useState<AdminOrder | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundRefId, setRefundRefId] = useState('')
  const [refunding, setRefunding] = useState(false)

  // Stale Orders Expiration State (Section 4.2)
  const [expiringStale, setExpiringStale] = useState(false)

  // Search Debounce Handler
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 350)
  }

  const handleClearSearch = () => {
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
  }

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))

      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (deliveryStatusFilter !== 'ALL') params.set('deliveryStatus', deliveryStatusFilter)
      if (fulfillmentTypeFilter !== 'ALL') params.set('fulfillmentType', fulfillmentTypeFilter)
      if (sourceFilter !== 'ALL') params.set('source', sourceFilter)
      if (productIdFilter !== 'ALL') params.set('productId', productIdFilter)
      if (dateRangeFilter !== 'ALL') params.set('dateRange', dateRangeFilter)
      if (sortBy !== 'NEWEST') params.set('sortBy', sortBy)

      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const data: OrdersResponse = await res.json()

      if (data.success) {
        startTransition(() => {
          setOrders(data.orders || [])
          setTotalOrders(data.pagination.total || 0)
          setTotalPages(data.pagination.totalPages || 1)
          if (data.counts) setCounts(data.counts)
          if (data.filterOptions?.products) setProductsList(data.filterOptions.products)
        })
      } else {
        toast.error(data.error || 'خطا در دریافت سفارش‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }, [
    page,
    limit,
    debouncedSearch,
    statusFilter,
    deliveryStatusFilter,
    fulfillmentTypeFilter,
    sourceFilter,
    productIdFilter,
    dateRangeFilter,
    sortBy,
  ])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Clear All Filters
  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('ALL')
    setDeliveryStatusFilter('ALL')
    setFulfillmentTypeFilter('ALL')
    setSourceFilter('ALL')
    setProductIdFilter('ALL')
    setDateRangeFilter('ALL')
    setSortBy('NEWEST')
    setPage(1)
    toast.success('فیلترها بازنشانی شدند.')
  }

  // Count Active Filters
  const activeFiltersCount = [
    statusFilter !== 'ALL',
    deliveryStatusFilter !== 'ALL',
    fulfillmentTypeFilter !== 'ALL',
    sourceFilter !== 'ALL',
    productIdFilter !== 'ALL',
    dateRangeFilter !== 'ALL',
    sortBy !== 'NEWEST',
    debouncedSearch.length > 0,
  ].filter(Boolean).length

  // Quick Copy Helper
  const handleCopyText = (text: string, id: string, label = 'کپی شد.') => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(label)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Update Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'وضعیت سفارش به‌روزرسانی شد.')
        fetchOrders()
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      } else {
        toast.error(data.error || 'خطا در تغییر وضعیت.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Fulfill Manual Order
  const handleFulfillManual = async () => {
    if (!selectedOrder) return
    if (!manualNote.trim()) {
      toast.error('لطفاً توضیحات یا اطلاعات تحویل را وارد نمایید.')
      return
    }

    setDeliveringManual(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action: 'FULFILL_MANUAL',
          manualNote: manualNote.trim(),
          deliveredInfo: manualInfo.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'سفارش با موفقیت تحویل و تکمیل شد.')
        setManualDialogOpen(false)
        setManualNote('')
        setManualInfo('')
        fetchOrders()
        setSelectedOrder(null)
      } else {
        toast.error(data.error || 'خطا در تحویل سفارش.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setDeliveringManual(false)
    }
  }

  // Open Refund Dialog (Section 4.1)
  const handleOpenRefund = (order: AdminOrder) => {
    setRefundOrderTarget(order)
    setRefundAmount(String(order.amount))
    setRefundReason('')
    setRefundRefId('')
    setRefundDialogOpen(true)
  }

  // Process Refund Action (Section 4.1)
  const handleProcessRefund = async () => {
    if (!refundOrderTarget) return
    const amt = parseInt(refundAmount, 10)
    if (isNaN(amt) || amt <= 0) {
      toast.error('لطفاً مبلغ معتبر برای استرداد وارد فرمایید.')
      return
    }

    setRefunding(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundOrderTarget.id,
          action: 'REFUND',
          refundAmount: amt,
          refundReason: refundReason.trim(),
          refundRefId: refundRefId.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'استرداد وجه با موفقیت ثبت شد.')
        setRefundDialogOpen(false)
        setRefundOrderTarget(null)
        fetchOrders()
        if (selectedOrder && selectedOrder.id === refundOrderTarget.id) {
          setSelectedOrder({ ...selectedOrder, status: 'REFUNDED', refundAmount: amt })
        }
      } else {
        toast.error(data.error || 'خطا در ثبت استرداد وجه.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور در استرداد وجه.')
    } finally {
      setRefunding(false)
    }
  }

  // Expire Stale Pending Orders Action (Section 4.2)
  const handleExpireStaleOrders = async () => {
    setExpiringStale(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXPIRE_STALE',
          olderThanMinutes: 30,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchOrders()
      } else {
        toast.error(data.error || 'خطا در انقضای سفارش‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setExpiringStale(false)
    }
  }

  // Copy Full Invoice/Message for Customer Support
  const handleCopyCustomerReceipt = (ord: AdminOrder) => {
    const productName = ord.product?.title || ord.plan?.product?.title || 'اشتراک'
    const planName = ord.plan?.name || ''
    const lines = [
      `🧾 رسید سفارش #${ord.id.slice(-8).toUpperCase()}`,
      `📦 محصول: ${productName} (${planName})`,
      `💰 مبلغ: ${formatPrice(ord.amount)}`,
      `📅 تاریخ: ${formatDate(ord.createdAt)}`,
      `👤 مشتری: ${ord.user?.name || ord.user?.phone || 'مشتری گرامی'}`,
      ord.payment?.refId ? `💳 کد پیگیری پرداخت: ${ord.payment.refId}` : null,
      ord.activationLink?.url ? `🔗 لینک فعال‌سازی:\n${ord.activationLink.url}` : null,
      `✨ با تشکر از خرید و اعتماد شما!`,
    ].filter(Boolean)

    navigator.clipboard.writeText(lines.join('\n'))
    toast.success('متن گزارش سفارش جهت ارسال به کاربر کپی شد.')
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2.5 min-w-0'>
          <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0'>
            <Package className='size-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-sm sm:text-base font-bold truncate text-foreground'>
                مدیریت سفارش‌ها و تحویل
              </h1>
              <Badge variant='secondary' className='text-[10px] h-5 px-1.5 font-sans font-medium'>
                {counts.all.toLocaleString('fa-IR')}
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground hidden sm:block truncate'>
              رهگیری سفارشات، فیلتر پیشرفته، بررسی اطلاعات تراکنش و تحویل دستی اشتراک‌ها
            </p>
          </div>
        </div>

        <div className='ms-auto flex items-center gap-2 shrink-0'>
          {/* View Toggle */}
          <div className='hidden sm:flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/30'>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title='نمای جدول'
            >
              <TableIcon className='size-3.5' />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'cards'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title='نمای کارتی'
            >
              <LayoutGrid className='size-3.5' />
            </button>
          </div>

          {/* Expire Stale Pending Orders Button (Section 4.2) */}
          <Button
            variant='outline'
            size='sm'
            onClick={handleExpireStaleOrders}
            disabled={expiringStale || loading}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3 text-stone-700 dark:text-stone-300 border-stone-500/30 hover:bg-stone-500/10 cursor-pointer'
            title='انقضا و آزادسازی خودکار سفارش‌های پرداخت‌نشده بالای ۳۰ دقیقه'
          >
            <Clock className={`size-3.5 ${expiringStale ? 'animate-spin' : ''}`} />
            <span className='hidden md:inline'>انقضای معوق‌ها</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={fetchOrders}
            disabled={loading}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3'
            title='بروزرسانی داده‌ها'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='p-3.5 sm:p-6 max-w-7xl mx-auto w-full'>
        <div className='flex flex-col gap-4 sm:gap-6 w-full min-w-0'>
          {/* KPI Quick Overview Chips */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3'>
          {/* Total Orders */}
          <button
            type='button'
            onClick={() => {
              setStatusFilter('ALL')
              setPage(1)
            }}
            className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
              statusFilter === 'ALL'
                ? 'bg-primary/5 border-primary/40 shadow-xs ring-1 ring-primary/20'
                : 'bg-card border-border/70 hover:border-border hover:bg-muted/30'
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-[11px] text-muted-foreground font-medium'>کل سفارش‌ها</span>
              <Package className='size-4 text-muted-foreground' />
            </div>
            <div className='mt-2 flex items-baseline gap-1.5'>
              <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                {counts.all.toLocaleString('fa-IR')}
              </span>
              <span className='text-[10px] text-muted-foreground'>سفارش</span>
            </div>
          </button>

          {/* Needs Action / Manual Fulfillment */}
          <button
            type='button'
            onClick={() => {
              setStatusFilter(statusFilter === 'NEEDS_ACTION' ? 'ALL' : 'NEEDS_ACTION')
              setPage(1)
            }}
            className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden ${
              statusFilter === 'NEEDS_ACTION'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                : 'bg-card border-border/70 hover:border-amber-500/30 hover:bg-amber-500/5'
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1'>
                {counts.needsAction > 0 && (
                  <span className='size-2 rounded-full bg-amber-500 animate-pulse inline-block' />
                )}
                نیازمند اقدام / تحویل
              </span>
              <AlertTriangle className='size-4 text-amber-500' />
            </div>
            <div className='mt-2 flex items-baseline gap-1.5'>
              <span className='text-lg sm:text-xl font-bold font-sans text-amber-600 dark:text-amber-400'>
                {counts.needsAction.toLocaleString('fa-IR')}
              </span>
              <span className='text-[10px] text-amber-600/80 dark:text-amber-400/80'>مورد</span>
            </div>
          </button>

          {/* Completed */}
          <button
            type='button'
            onClick={() => {
              setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')
              setPage(1)
            }}
            className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                : 'bg-card border-border/70 hover:border-emerald-500/30 hover:bg-emerald-500/5'
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-[11px] text-emerald-600 dark:text-emerald-400 font-medium'>
                تکمیل شده
              </span>
              <CheckCircle2 className='size-4 text-emerald-500' />
            </div>
            <div className='mt-2 flex items-baseline gap-1.5'>
              <span className='text-lg sm:text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400'>
                {counts.completed.toLocaleString('fa-IR')}
              </span>
              <span className='text-[10px] text-emerald-600/80 dark:text-emerald-400/80'>موفق</span>
            </div>
          </button>

          {/* Pending Payment */}
          <button
            type='button'
            onClick={() => {
              setStatusFilter(statusFilter === 'PENDING_PAYMENT' ? 'ALL' : 'PENDING_PAYMENT')
              setPage(1)
            }}
            className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
              statusFilter === 'PENDING_PAYMENT'
                ? 'bg-muted/80 border-primary/40 shadow-xs ring-1 ring-primary/20'
                : 'bg-card border-border/70 hover:border-border hover:bg-muted/30'
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-[11px] text-muted-foreground font-medium'>
                در انتظار پرداخت
              </span>
              <Clock className='size-4 text-muted-foreground' />
            </div>
            <div className='mt-2 flex items-baseline gap-1.5'>
              <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                {counts.pendingPayment.toLocaleString('fa-IR')}
              </span>
              <span className='text-[10px] text-muted-foreground'>سفارش</span>
            </div>
          </button>

          {/* Failed or Cancelled */}
          <button
            type='button'
            onClick={() => {
              setStatusFilter(statusFilter === 'CANCELLED' ? 'ALL' : 'CANCELLED')
              setPage(1)
            }}
            className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
              statusFilter === 'CANCELLED' || statusFilter === 'FAILED'
                ? 'bg-rose-500/10 border-rose-500/50 shadow-xs ring-1 ring-rose-500/30'
                : 'bg-card border-border/70 hover:border-rose-500/30 hover:bg-rose-500/5'
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-[11px] text-rose-600 dark:text-rose-400 font-medium'>
                لغو یا ناموفق
              </span>
              <XCircle className='size-4 text-rose-500' />
            </div>
            <div className='mt-2 flex items-baseline gap-1.5'>
              <span className='text-lg sm:text-xl font-bold font-sans text-rose-600 dark:text-rose-400'>
                {counts.failedOrCancelled.toLocaleString('fa-IR')}
              </span>
              <span className='text-[10px] text-rose-600/80 dark:text-rose-400/80'>مورد</span>
            </div>
          </button>

          {/* Refunded (Section 4.1) */}
          <button
            type='button'
            onClick={() => {
              setStatusFilter(statusFilter === 'REFUNDED' ? 'ALL' : 'REFUNDED')
              setPage(1)
            }}
            className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
              statusFilter === 'REFUNDED'
                ? 'bg-purple-500/10 border-purple-500/50 shadow-xs ring-1 ring-purple-500/30'
                : 'bg-card border-border/70 hover:border-purple-500/30 hover:bg-purple-500/5'
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-[11px] text-purple-600 dark:text-purple-400 font-medium'>
                استرداد شده
              </span>
              <Receipt className='size-4 text-purple-500' />
            </div>
            <div className='mt-2 flex items-baseline gap-1.5'>
              <span className='text-lg sm:text-xl font-bold font-sans text-purple-600 dark:text-purple-400'>
                {(counts.refunded || 0).toLocaleString('fa-IR')}
              </span>
              <span className='text-[10px] text-purple-600/80 dark:text-purple-400/80'>مورد</span>
            </div>
          </button>

          {/* Expired (Section 4.2) */}
          <button
            type='button'
            onClick={() => {
              setStatusFilter(statusFilter === 'EXPIRED' ? 'ALL' : 'EXPIRED')
              setPage(1)
            }}
            className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
              statusFilter === 'EXPIRED'
                ? 'bg-stone-500/10 border-stone-500/50 shadow-xs ring-1 ring-stone-500/30'
                : 'bg-card border-border/70 hover:border-stone-500/30 hover:bg-stone-500/5'
            }`}
          >
            <div className='flex items-center justify-between'>
              <span className='text-[11px] text-stone-600 dark:text-stone-400 font-medium'>
                منقضی شده
              </span>
              <Clock className='size-4 text-stone-500' />
            </div>
            <div className='mt-2 flex items-baseline gap-1.5'>
              <span className='text-lg sm:text-xl font-bold font-sans text-stone-600 dark:text-stone-400'>
                {(counts.expired || 0).toLocaleString('fa-IR')}
              </span>
              <span className='text-[10px] text-stone-600/80 dark:text-stone-400/80'>مورد</span>
            </div>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <Card className='border-border/70 shadow-xs bg-card/60 backdrop-blur-sm'>
          <CardContent className='p-3.5 sm:p-4 space-y-3'>
            <div className='flex flex-col sm:flex-row items-center gap-2.5'>
              {/* Live Search Input */}
              <div className='relative flex-1 w-full'>
                <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                <Input
                  placeholder='جستجوی شماره سفارش، شماره موبایل خریدار، کد پیگیری بانکی، نام محصول...'
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='ps-9 pe-8 h-10 text-xs rounded-xl bg-background/80 border-border/80'
                />
                {search && (
                  <button
                    type='button'
                    onClick={handleClearSearch}
                    className='absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                  >
                    <X className='size-3.5' />
                  </button>
                )}
              </div>

              {/* Status Select */}
              <div className='flex items-center gap-2 w-full sm:w-auto shrink-0'>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className='w-full sm:w-44 h-10 text-xs rounded-xl bg-background/80 border-border/80'>
                    <SelectValue placeholder='وضعیت سفارش' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                    <SelectItem value='NEEDS_ACTION'>نیازمند اقدام / تحویل</SelectItem>
                    <SelectItem value='PAID'>پرداخت شده (PAID)</SelectItem>
                    <SelectItem value='COMPLETED'>تکمیل شده (COMPLETED)</SelectItem>
                    <SelectItem value='PENDING_PAYMENT'>در انتظار پرداخت</SelectItem>
                    <SelectItem value='REFUNDED'>استرداد شده (REFUNDED)</SelectItem>
                    <SelectItem value='EXPIRED'>منقضی شده (EXPIRED)</SelectItem>
                    <SelectItem value='FAILED'>ناموفق (FAILED)</SelectItem>
                    <SelectItem value='CANCELLED'>لغو شده (CANCELLED)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Advanced Filters Button */}
                <Button
                  variant={showAdvancedFilters ? 'secondary' : 'outline'}
                  size='sm'
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`h-10 px-3 text-xs gap-1.5 rounded-xl shrink-0 transition-colors ${
                    activeFiltersCount > 0 ? 'border-primary/50 text-primary' : ''
                  }`}
                >
                  <SlidersHorizontal className='size-3.5' />
                  <span className='hidden sm:inline'>فیلترهای بیشتر</span>
                  {activeFiltersCount > 0 && (
                    <span className='size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center font-sans'>
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className='pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs animate-in fade-in-50 duration-200'>
                {/* Delivery Status */}
                <div>
                  <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                    وضعیت تحویل (Delivery):
                  </label>
                  <Select
                    value={deliveryStatusFilter}
                    onValueChange={(val) => {
                      setDeliveryStatusFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                      <SelectValue placeholder='وضعیت تحویل' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه موارد تحویل</SelectItem>
                      <SelectItem value='DELIVERED'>تحویل داده شده</SelectItem>
                      <SelectItem value='PENDING'>در صف تحویل (Pending)</SelectItem>
                      <SelectItem value='FAILED'>تحویل ناموفق</SelectItem>
                      <SelectItem value='NO_DELIVERY'>بدون رکورد تحویل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fulfillment Type */}
                <div>
                  <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                    روش تحویل سفارش:
                  </label>
                  <Select
                    value={fulfillmentTypeFilter}
                    onValueChange={(val) => {
                      setFulfillmentTypeFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                      <SelectValue placeholder='روش تحویل' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه روش‌ها</SelectItem>
                      <SelectItem value='ACTIVATION_LINK'>لینک فعال‌سازی</SelectItem>
                      <SelectItem value='PRE_CREATED_ACCOUNT'>اکانت آماده</SelectItem>
                      <SelectItem value='CUSTOMER_PROVISIONING'>ساخت روی اکانت مشتری</SelectItem>
                      <SelectItem value='MANUAL'>تحویل دستی پشتیبانی</SelectItem>
                      <SelectItem value='ACTIVATION_CODE'>کد فعال‌سازی</SelectItem>
                      <SelectItem value='DOWNLOAD'>دانلودی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Filter */}
                <div>
                  <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                    محصول خریداری‌شده:
                  </label>
                  <Select
                    value={productIdFilter}
                    onValueChange={(val) => {
                      setProductIdFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                      <SelectValue placeholder='انتخاب محصول' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه محصولات</SelectItem>
                      {productsList.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id}>
                          {prod.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source Filter */}
                <div>
                  <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                    کانال ثبت سفارش (Source):
                  </label>
                  <Select
                    value={sourceFilter}
                    onValueChange={(val) => {
                      setSourceFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                      <SelectValue placeholder='کانال سفارش' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه کانال‌ها</SelectItem>
                      <SelectItem value='web'>وب‌سایت (Web)</SelectItem>
                      <SelectItem value='telegram'>ربات تلگرام</SelectItem>
                      <SelectItem value='bale'>بله</SelectItem>
                      <SelectItem value='rubika'>روبیکا</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div>
                  <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                    بازه زمانی ایجاد:
                  </label>
                  <Select
                    value={dateRangeFilter}
                    onValueChange={(val) => {
                      setDateRangeFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                      <SelectValue placeholder='بازه زمانی' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه زمان‌ها</SelectItem>
                      <SelectItem value='TODAY'>امروز</SelectItem>
                      <SelectItem value='YESTERDAY'>دیروز</SelectItem>
                      <SelectItem value='LAST_7_DAYS'>۷ روز اخیر</SelectItem>
                      <SelectItem value='LAST_30_DAYS'>۳۰ روز اخیر</SelectItem>
                      <SelectItem value='THIS_MONTH'>ماه جاری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                    مرتب‌سازی نتایج:
                  </label>
                  <Select
                    value={sortBy}
                    onValueChange={(val) => {
                      setSortBy(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                      <SelectValue placeholder='مرتب‌سازی' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='NEWEST'>جدیدترین به قدیمی‌ترین</SelectItem>
                      <SelectItem value='OLDEST'>قدیمی‌ترین به جدیدترین</SelectItem>
                      <SelectItem value='HIGHEST_AMOUNT'>بیشترین مبلغ پرداختی</SelectItem>
                      <SelectItem value='LOWEST_AMOUNT'>کمترین مبلغ پرداختی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Items Per Page */}
                <div>
                  <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                    تعداد در هر صفحه:
                  </label>
                  <Select
                    value={String(limit)}
                    onValueChange={(val) => {
                      setLimit(Number(val))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='10'>۱۰ مورد</SelectItem>
                      <SelectItem value='20'>۲۰ مورد</SelectItem>
                      <SelectItem value='50'>۵۰ مورد</SelectItem>
                      <SelectItem value='100'>۱۰۰ مورد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Filters Action */}
                <div className='flex items-end'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleResetFilters}
                    disabled={activeFiltersCount === 0}
                    className='h-9 text-xs w-full text-muted-foreground hover:text-foreground gap-1.5'
                  >
                    <X className='size-3.5' />
                    پاک کردن همه فیلترها
                  </Button>
                </div>
              </div>
            )}

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className='flex flex-wrap items-center gap-1.5 pt-1 text-[11px]'>
                <span className='text-muted-foreground'>فیلترهای فعال:</span>

                {debouncedSearch && (
                  <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                    جستجو: {debouncedSearch}
                    <button onClick={handleClearSearch} className='hover:text-destructive'>
                      <X className='size-3' />
                    </button>
                  </Badge>
                )}

                {statusFilter !== 'ALL' && (
                  <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                    وضعیت: {statusFilter}
                    <button onClick={() => setStatusFilter('ALL')} className='hover:text-destructive'>
                      <X className='size-3' />
                    </button>
                  </Badge>
                )}

                {deliveryStatusFilter !== 'ALL' && (
                  <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                    تحویل: {deliveryStatusFilter}
                    <button
                      onClick={() => setDeliveryStatusFilter('ALL')}
                      className='hover:text-destructive'
                    >
                      <X className='size-3' />
                    </button>
                  </Badge>
                )}

                {fulfillmentTypeFilter !== 'ALL' && (
                  <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                    روش: {fulfillmentTypeFilter}
                    <button
                      onClick={() => setFulfillmentTypeFilter('ALL')}
                      className='hover:text-destructive'
                    >
                      <X className='size-3' />
                    </button>
                  </Badge>
                )}

                {productIdFilter !== 'ALL' && (
                  <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                    محصول:{' '}
                    {productsList.find((p) => p.id === productIdFilter)?.title || productIdFilter}
                    <button
                      onClick={() => setProductIdFilter('ALL')}
                      className='hover:text-destructive'
                    >
                      <X className='size-3' />
                    </button>
                  </Badge>
                )}

                {sourceFilter !== 'ALL' && (
                  <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                    کانال: {sourceFilter}
                    <button onClick={() => setSourceFilter('ALL')} className='hover:text-destructive'>
                      <X className='size-3' />
                    </button>
                  </Badge>
                )}

                {dateRangeFilter !== 'ALL' && (
                  <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                    بازه زمانی: {dateRangeFilter}
                    <button
                      onClick={() => setDateRangeFilter('ALL')}
                      className='hover:text-destructive'
                    >
                      <X className='size-3' />
                    </button>
                  </Badge>
                )}

                <button
                  type='button'
                  onClick={handleResetFilters}
                  className='text-primary hover:underline text-[11px] ms-1'
                >
                  حذف همه
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Table & Cards View */}
        <Card className='border-border/70 shadow-xs overflow-hidden'>
          <CardHeader className='p-4 sm:p-5 border-b border-border/60 bg-muted/10'>
            <div className='flex items-center justify-between flex-wrap gap-2'>
              <div>
                <CardTitle className='text-sm sm:text-base font-bold flex items-center gap-2 text-foreground'>
                  <span>سفارش‌های سیستم</span>
                  <Badge variant='outline' className='text-xs font-sans'>
                    {totalOrders.toLocaleString('fa-IR')} مورد یافت شد
                  </Badge>
                </CardTitle>
                <CardDescription className='text-xs mt-0.5'>
                  صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')} (نمایش{' '}
                  {orders.length} مورد در این صفحه)
                </CardDescription>
              </div>

              {/* Mobile View Toggle */}
              <div className='flex sm:hidden items-center rounded-lg border border-border/70 p-0.5 bg-muted/30'>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 rounded-md text-xs transition-colors ${
                    viewMode === 'table'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  جدول
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2 py-1 rounded-md text-xs transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  کارت‌ها
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            {loading ? (
              <div className='flex flex-col items-center justify-center py-20 gap-3'>
                <Loader2 className='size-8 animate-spin text-primary' />
                <span className='text-xs text-muted-foreground'>در حال بارگذاری اطلاعات سفارش‌ها...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className='py-16 text-center space-y-3'>
                <div className='size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground'>
                  <Package className='size-6' />
                </div>
                <p className='text-sm font-semibold text-foreground'>سفارشی با این مشخصات یافت نشد.</p>
                <p className='text-xs text-muted-foreground max-w-sm mx-auto'>
                  می‌توانید کلمات جستجو را تغییر دهید یا فیلترهای فعال را بازنشانی کنید.
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant='outline' size='sm' onClick={handleResetFilters} className='text-xs'>
                    بازنشانی تمام فیلترها
                  </Button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              /* Desktop & Wide Screen Table View */
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[1240px] text-xs text-start'>
                  <thead>
                    <tr className='border-b border-border/60 bg-muted/30 text-muted-foreground font-medium'>
                      <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[120px]'>شناسه</th>
                      <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[180px]'>مشتری</th>
                      <th className='py-3.5 px-4 text-start min-w-[240px]'>محصول و پلن</th>
                      <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[170px]'>روش تحویل</th>
                      <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[90px]'>کانال</th>
                      <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[120px]'>مبلغ</th>
                      <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[130px]'>وضعیت سفارش</th>
                      <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[130px]'>وضعیت تحویل</th>
                      <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[170px]'>تاریخ ثبت</th>
                      <th className='py-3.5 px-4 text-end whitespace-nowrap min-w-[110px]'>عملیات</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/40'>
                    {orders.map((ord) => {
                      const fulfillmentType =
                        ord.delivery?.type || ord.plan?.fulfillmentType || 'ACTIVATION_LINK'
                      const fulfillmentBadge = getFulfillmentBadge(fulfillmentType)
                      const statusBadge = getOrderStatusBadge(ord.status)
                      const StatusIcon = statusBadge.icon

                      return (
                        <tr
                          key={ord.id}
                          className='hover:bg-muted/40 transition-colors group cursor-default'
                        >
                          {/* Order ID */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[120px]'>
                            <div className='flex items-center gap-1.5'>
                              <span className='font-mono font-bold text-foreground'>
                                #{ord.id.slice(-8).toUpperCase()}
                              </span>
                              <button
                                onClick={() => handleCopyText(ord.id, ord.id, 'شناسه سفارش کپی شد.')}
                                className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground'
                                title='کپی شناسه کامل'
                              >
                                {copiedId === ord.id ? (
                                  <Check className='size-3 text-primary' />
                                ) : (
                                  <Copy className='size-3' />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[180px]'>
                            <div className='flex items-center gap-2'>
                              <div className='size-7 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0'>
                                {(ord.user?.name || ord.user?.phone || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <div className='min-w-0'>
                                <span className='font-semibold block text-foreground'>
                                  {ord.user?.name || ord.user?.phone || 'کاربر سیستم'}
                                </span>
                                {ord.user?.phone && ord.user?.name && (
                                  <span className='text-[10px] text-muted-foreground font-sans tabular-nums block'>
                                    {ord.user.phone}
                                  </span>
                                )}
                                {ord.user?.telegramUsername && (
                                  <span className='text-[10px] text-sky-600 dark:text-sky-400 font-sans block'>
                                    @{ord.user.telegramUsername}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Product & Plan */}
                          <td className='py-3.5 px-4 min-w-[240px]'>
                            <div className='min-w-0 max-w-[340px]'>
                              <span className='text-foreground font-bold block text-xs leading-relaxed break-words'>
                                {ord.product?.title || ord.product?.name || ord.plan?.product?.title || 'محصول'}
                              </span>
                              <div className='flex items-center flex-wrap gap-1.5 mt-1.5'>
                                <span className='text-[10px] text-muted-foreground font-medium'>
                                  {ord.plan?.name || 'پلن عمومی'}
                                </span>
                                {ord.plan?.duration ? (
                                  <span className='text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-sans font-medium border border-border/50'>
                                    {ord.plan.duration} ماهه
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {/* Fulfillment Type */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[170px]'>
                            <Badge
                              variant='outline'
                              className={`text-[10px] font-normal gap-1.5 py-0.5 px-2 ${fulfillmentBadge.color}`}
                            >
                              <span className={`size-1.5 rounded-full ${fulfillmentBadge.dot}`} />
                              <span>{fulfillmentBadge.label}</span>
                            </Badge>
                          </td>

                          {/* Channel / Source */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[90px]'>
                            {ord.source === 'telegram' ? (
                              <Badge
                                variant='outline'
                                className='text-[10px] border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 gap-1'
                              >
                                <Send className='size-2.5' />
                                <span>تلگرام</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='text-[10px] border-border text-muted-foreground gap-1'
                              >
                                <Globe className='size-2.5' />
                                <span>وب</span>
                              </Badge>
                            )}
                          </td>

                          {/* Amount */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[120px]'>
                            <span className='font-bold text-foreground font-sans block'>
                              {formatPrice(ord.amount)}
                            </span>
                          </td>

                          {/* Order Status */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[130px]'>
                            <Badge
                              variant={statusBadge.variant}
                              className={`text-[10px] gap-1 py-0.5 font-medium border ${statusBadge.className}`}
                            >
                              <StatusIcon className='size-3 shrink-0' />
                              <span>{statusBadge.label}</span>
                            </Badge>
                          </td>

                          {/* Delivery Status */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[130px]'>
                            {ord.delivery?.status === 'DELIVERED' || ord.status === 'COMPLETED' ? (
                              <span className='text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1'>
                                <CheckCircle2 className='size-3.5' />
                                <span>تحویل شده</span>
                              </span>
                            ) : ord.status === 'PAID' ? (
                              <span className='text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1'>
                                <Clock className='size-3.5 animate-spin' />
                                <span>در صف اقدام</span>
                              </span>
                            ) : (
                              <span className='text-muted-foreground text-[11px]'>—</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className='py-3.5 px-4 text-muted-foreground text-[11px] whitespace-nowrap min-w-[170px]'>
                            <span className='block text-foreground font-semibold'>
                              {formatRelativeTime(ord.createdAt)}
                            </span>
                            <span className='text-[10px] text-muted-foreground font-sans block mt-0.5'>
                              {formatDate(ord.createdAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className='py-3.5 px-4 text-end whitespace-nowrap min-w-[110px]'>
                            <div className='flex items-center justify-end gap-1.5'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setSelectedOrder(ord)}
                                className='h-7 px-2.5 text-[11px] gap-1 rounded-lg border-border hover:bg-muted'
                                title='مشاهده جزئیات سفارش'
                              >
                                <Eye className='size-3' />
                                <span>بررسی</span>
                              </Button>

                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleCopyCustomerReceipt(ord)}
                                className='size-7 rounded-lg text-muted-foreground hover:text-foreground'
                                title='کپی خلاصه سفارش'
                              >
                                <Receipt className='size-3.5' />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Mobile & Tablet Responsive Cards View */
              <div className='p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                {orders.map((ord) => {
                  const fulfillmentType =
                    ord.delivery?.type || ord.plan?.fulfillmentType || 'ACTIVATION_LINK'
                  const fulfillmentBadge = getFulfillmentBadge(fulfillmentType)
                  const statusBadge = getOrderStatusBadge(ord.status)
                  const StatusIcon = statusBadge.icon

                  return (
                    <div
                      key={ord.id}
                      className='rounded-xl border border-border/70 p-3.5 bg-card hover:border-primary/40 transition-all space-y-3'
                    >
                      {/* Card Top: ID & Status */}
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-mono font-bold text-xs text-foreground'>
                            #{ord.id.slice(-8).toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleCopyText(ord.id, ord.id, 'شناسه سفارش کپی شد.')}
                            className='text-muted-foreground hover:text-foreground'
                          >
                            {copiedId === ord.id ? (
                              <Check className='size-3 text-primary' />
                            ) : (
                              <Copy className='size-3' />
                            )}
                          </button>
                        </div>

                        <Badge
                          variant={statusBadge.variant}
                          className={`text-[10px] gap-1 py-0.5 font-medium border ${statusBadge.className}`}
                        >
                          <StatusIcon className='size-3 shrink-0' />
                          <span>{statusBadge.label}</span>
                        </Badge>
                      </div>

                      {/* Product & Plan */}
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <h4 className='font-bold text-xs text-foreground'>
                            {ord.product?.title || ord.plan?.product?.title || 'اشتراک'}
                          </h4>
                          <span className='text-[11px] text-muted-foreground'>
                            {ord.plan?.name} {ord.plan?.duration ? `(${ord.plan.duration} ماهه)` : ''}
                          </span>
                        </div>
                        <span className='font-bold text-xs text-primary font-sans shrink-0'>
                          {formatPrice(ord.amount)}
                        </span>
                      </div>

                      {/* Customer Info & Badges */}
                      <div className='flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50'>
                        <div className='flex items-center gap-1.5 truncate'>
                          <User className='size-3 shrink-0' />
                          <span className='font-medium text-foreground truncate'>
                            {ord.user?.name || ord.user?.phone || 'کاربر'}
                          </span>
                        </div>

                        <div className='flex items-center gap-1.5 shrink-0'>
                          {ord.source === 'telegram' ? (
                            <Badge
                              variant='outline'
                              className='text-[9px] border-sky-500/20 bg-sky-500/10 text-sky-600 gap-0.5 px-1.5 h-5'
                            >
                              <Send className='size-2.5' />
                              تلگرام
                            </Badge>
                          ) : (
                            <Badge
                              variant='outline'
                              className='text-[9px] border-border text-muted-foreground gap-0.5 px-1.5 h-5'
                            >
                              <Globe className='size-2.5' />
                              وب
                            </Badge>
                          )}

                          <Badge
                            variant='outline'
                            className={`text-[9px] px-1.5 h-5 ${fulfillmentBadge.color}`}
                          >
                            {fulfillmentBadge.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Delivery and Date Footer */}
                      <div className='flex items-center justify-between text-[10px] text-muted-foreground pt-1'>
                        <div>
                          {ord.delivery?.status === 'DELIVERED' || ord.status === 'COMPLETED' ? (
                            <span className='text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1'>
                              <CheckCircle2 className='size-3' />
                              تحویل شده
                            </span>
                          ) : ord.status === 'PAID' ? (
                            <span className='text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1'>
                              <Clock className='size-3 animate-spin' />
                              در انتظار اقدام
                            </span>
                          ) : (
                            <span>بدون تحویل</span>
                          )}
                        </div>

                        <span className='font-sans'>{formatDate(ord.createdAt)}</span>
                      </div>

                      {/* Card Action */}
                      <div className='pt-1 flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setSelectedOrder(ord)}
                          className='w-full text-xs h-8 gap-1.5 font-semibold'
                        >
                          <Eye className='size-3.5' />
                          <span>بررسی جزئیات سفارش</span>
                        </Button>

                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleCopyCustomerReceipt(ord)}
                          className='size-8 shrink-0 rounded-lg text-muted-foreground'
                          title='کپی خلاصه فاکتور'
                        >
                          <Receipt className='size-4' />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className='p-3 sm:p-4 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs'>
                <div className='text-muted-foreground text-center sm:text-start'>
                  نمایش{' '}
                  <span className='font-bold font-sans text-foreground'>
                    {((page - 1) * limit + 1).toLocaleString('fa-IR')}
                  </span>{' '}
                  تا{' '}
                  <span className='font-bold font-sans text-foreground'>
                    {Math.min(page * limit, totalOrders).toLocaleString('fa-IR')}
                  </span>{' '}
                  از مجموع{' '}
                  <span className='font-bold font-sans text-foreground'>
                    {totalOrders.toLocaleString('fa-IR')}
                  </span>{' '}
                  سفارش
                </div>

                <div className='flex items-center gap-1'>
                  {/* First Page */}
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => setPage(1)}
                    disabled={page === 1 || loading}
                    className='size-8 rounded-lg'
                    title='صفحه اول'
                  >
                    <ChevronsRight className='size-4' />
                  </Button>

                  {/* Prev Page */}
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className='size-8 rounded-lg'
                    title='صفحه قبل'
                  >
                    <ChevronRight className='size-4' />
                  </Button>

                  {/* Page Indicator Pills */}
                  <div className='flex items-center gap-1 px-1 font-sans text-xs'>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1

                        return (
                          <div key={p} className='flex items-center'>
                            {showEllipsis && <span className='px-1 text-muted-foreground'>...</span>}
                            <button
                              type='button'
                              onClick={() => setPage(p)}
                              className={`size-8 rounded-lg font-semibold transition-colors ${
                                page === p
                                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        )
                      })}
                  </div>

                  {/* Next Page */}
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className='size-8 rounded-lg'
                    title='صفحه بعد'
                  >
                    <ChevronLeft className='size-4' />
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages || loading}
                    className='size-8 rounded-lg'
                    title='صفحه آخر'
                  >
                    <ChevronsLeft className='size-4' />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </Main>

      {/* Redesigned Order Detail Modal */}
      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null)
        }}
      >
        <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl'>
          {selectedOrder && (
            <div className='space-y-4 text-xs'>
              {/* Modal Header */}
              <DialogHeader className='text-start pb-3 border-b border-border/60 space-y-1.5'>
                <div className='flex items-center justify-between flex-wrap gap-2'>
                  <DialogTitle className='text-base sm:text-lg font-bold flex items-center gap-2 text-foreground'>
                    <Package className='size-5 text-primary' />
                    <span>جزئیات کامل سفارش</span>
                  </DialogTitle>

                  <div className='flex items-center gap-2'>
                    {selectedOrder.source === 'telegram' ? (
                      <Badge variant='outline' className='text-[10px] border-sky-500/20 bg-sky-500/10 text-sky-600 gap-1'>
                        <Send className='size-2.5' />
                        کانال تلگرام
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-[10px] border-border text-muted-foreground gap-1'>
                        <Globe className='size-2.5' />
                        وب‌سایت
                      </Badge>
                    )}

                    <Badge
                      variant={getOrderStatusBadge(selectedOrder.status).variant}
                      className={`text-[10px] font-medium border ${getOrderStatusBadge(selectedOrder.status).className}`}
                    >
                      {getOrderStatusBadge(selectedOrder.status).label}
                    </Badge>
                  </div>
                </div>

                <div className='flex items-center gap-2 text-[11px] text-muted-foreground'>
                  <span className='font-mono select-all'>شناسه: {selectedOrder.id}</span>
                  <button
                    type='button'
                    onClick={() => handleCopyText(selectedOrder.id, 'modal-id', 'شناسه سفارش کپی شد.')}
                    className='hover:text-foreground'
                  >
                    {copiedId === 'modal-id' ? <Check className='size-3 text-primary' /> : <Copy className='size-3' />}
                  </button>
                </div>
              </DialogHeader>

              {/* Status Update Quick Bar */}
              <div className='p-3 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5'>
                <div className='flex items-center gap-2 text-xs font-semibold'>
                  <span className='text-muted-foreground'>وضعیت کنونی سفارش:</span>
                  <span className='text-foreground'>{selectedOrder.status}</span>
                </div>

                <div className='flex items-center gap-2 w-full sm:w-auto'>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(val) => handleUpdateOrderStatus(selectedOrder.id, val)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className='h-8 w-full sm:w-48 text-xs font-semibold rounded-lg bg-background'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='PENDING_PAYMENT'>PENDING_PAYMENT (در انتظار پرداخت)</SelectItem>
                      <SelectItem value='PAID'>PAID (پرداخت شده)</SelectItem>
                      <SelectItem value='COMPLETED'>COMPLETED (تکمیل شده)</SelectItem>
                      <SelectItem value='FAILED'>FAILED (ناموفق)</SelectItem>
                      <SelectItem value='CANCELLED'>CANCELLED (لغو شده)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 4-Box Key Metrics */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {/* Customer Box */}
                <div className='p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5'>
                  <span className='text-[10px] text-muted-foreground font-medium flex items-center gap-1'>
                    <User className='size-3' />
                    اطلاعات مشتری:
                  </span>
                  <div className='font-bold text-sm text-foreground'>
                    {selectedOrder.user?.name || 'کاربر بدون نام'}
                  </div>
                  {selectedOrder.user?.phone && (
                    <div className='flex items-center justify-between text-xs text-muted-foreground font-sans'>
                      <span>شماره همراه:</span>
                      <div className='flex items-center gap-1.5 font-bold text-foreground'>
                        <span>{selectedOrder.user.phone}</span>
                        <button
                          onClick={() => handleCopyText(selectedOrder.user.phone!, 'cust-phone')}
                          className='hover:text-primary'
                          title='کپی شماره'
                        >
                          <Copy className='size-3' />
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedOrder.user?.telegramUsername && (
                    <div className='flex items-center justify-between text-xs text-muted-foreground'>
                      <span>تلگرام:</span>
                      <a
                        href={`https://t.me/${selectedOrder.user.telegramUsername}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sky-600 dark:text-sky-400 font-sans hover:underline flex items-center gap-1 font-semibold'
                      >
                        @{selectedOrder.user.telegramUsername}
                        <ExternalLink className='size-3' />
                      </a>
                    </div>
                  )}
                </div>

                {/* Amount & Date Box */}
                <div className='p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5'>
                  <span className='text-[10px] text-muted-foreground font-medium flex items-center gap-1'>
                    <Receipt className='size-3' />
                    اطلاعات پرداخت و تاریخ:
                  </span>
                  <div className='text-primary font-black text-base font-sans'>
                    {formatPrice(selectedOrder.amount)}
                  </div>
                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>تاریخ ثبت سفارش:</span>
                    <span className='text-foreground font-medium'>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>آخرین بروزرسانی:</span>
                    <span className='text-foreground font-medium'>{formatRelativeTime(selectedOrder.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Product & Plan Details */}
              <div className='p-3.5 rounded-xl border border-border/70 bg-card space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-[11px] font-bold text-foreground flex items-center gap-1.5'>
                    <Tag className='size-3.5 text-primary' />
                    محصول و پلن سفارش:
                  </span>
                  <Badge variant='outline' className='text-[10px] font-normal'>
                    {getFulfillmentBadge(selectedOrder.delivery?.type || selectedOrder.plan?.fulfillmentType).label}
                  </Badge>
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs'>
                  <span className='font-bold text-foreground'>
                    {selectedOrder.product?.title || selectedOrder.product?.name || selectedOrder.plan?.product?.title || 'محصول سیستم'}
                  </span>
                  <span className='text-muted-foreground'>
                    پلن: {selectedOrder.plan?.name} {selectedOrder.plan?.duration ? `(${selectedOrder.plan.duration} ماهه)` : ''}
                  </span>
                </div>
              </div>

              {/* Checkout Form Snapshot (Customer Inputs) */}
              {selectedOrder.checkoutData && Object.keys(selectedOrder.checkoutData).length > 0 && (
                <div className='p-3.5 rounded-xl border border-primary/25 bg-primary/5 space-y-2'>
                  <h4 className='font-bold text-foreground text-xs flex items-center gap-1.5'>
                    <Sparkles className='size-3.5 text-primary' />
                    داده‌های وارد شده توسط مشتری هنگام خرید (Checkout Data):
                  </h4>
                  <div className='grid grid-cols-1 gap-1.5 text-xs bg-background/90 p-3 rounded-lg border border-border/70'>
                    {Object.entries(selectedOrder.checkoutData).map(([k, v]) => (
                      <div key={k} className='flex items-center justify-between py-1 border-b border-border/30 last:border-b-0'>
                        <span className='text-muted-foreground font-medium'>{k}:</span>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-mono font-bold text-foreground select-all'>{String(v)}</span>
                          <button
                            type='button'
                            onClick={() => handleCopyText(String(v), `checkout-${k}`)}
                            className='text-muted-foreground hover:text-foreground'
                            title='کپی'
                          >
                            <Copy className='size-3' />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery / Fulfillment Section */}
              <div className='p-3.5 rounded-xl border border-border/70 bg-card space-y-3'>
                <div className='flex items-center justify-between'>
                  <h4 className='font-bold text-foreground text-xs flex items-center gap-1.5'>
                    <Key className='size-3.5 text-primary' />
                    اطلاعات تحویل و فعال‌سازی (Delivery):
                  </h4>
                  {selectedOrder.delivery?.status && (
                    <Badge
                      variant='outline'
                      className={`text-[10px] ${
                        selectedOrder.delivery.status === 'DELIVERED'
                          ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                          : 'border-amber-500/30 text-amber-600 bg-amber-500/10'
                      }`}
                    >
                      {selectedOrder.delivery.status === 'DELIVERED' ? 'تحویل شده' : selectedOrder.delivery.status}
                    </Badge>
                  )}
                </div>

                {selectedOrder.delivery?.data && Object.keys(selectedOrder.delivery.data).length > 0 ? (
                  <div className='p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs'>
                    {Object.entries(selectedOrder.delivery.data).map(([k, v]) => (
                      <div key={k} className='flex items-center justify-between py-1 border-b border-border/40 last:border-0'>
                        <span className='text-muted-foreground font-sans'>{k}:</span>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-mono font-bold text-foreground select-all truncate max-w-[280px]'>
                            {String(v)}
                          </span>
                          <button
                            type='button'
                            onClick={() => handleCopyText(String(v), `deliv-${k}`)}
                            className='text-muted-foreground hover:text-foreground'
                            title='کپی'
                          >
                            <Copy className='size-3' />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedOrder.activationLink?.url ? (
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40'>
                      <span className='font-mono text-[11px] truncate flex-1 select-all' dir='ltr'>
                        {selectedOrder.activationLink.url}
                      </span>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleCopyText(selectedOrder.activationLink!.url, 'act-link')}
                        className='size-7 shrink-0'
                        title='کپی لینک'
                      >
                        <Copy className='size-3.5' />
                      </Button>
                      <Button
                        asChild
                        variant='ghost'
                        size='icon'
                        className='size-7 shrink-0'
                        title='باز کردن لینک'
                      >
                        <a href={selectedOrder.activationLink.url} target='_blank' rel='noopener noreferrer'>
                          <ExternalLink className='size-3.5' />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className='text-muted-foreground text-[11px] py-1'>
                    {selectedOrder.status === 'PAID'
                      ? 'سفارش پرداخت شده است اما هنوز داده تحویل اختصاص داده نشده است.'
                      : 'داده تحویلی برای این سفارش ثبت نشده است.'}
                  </p>
                )}

                {/* Action Buttons in Detail Modal */}
                <div className='flex flex-col sm:flex-row gap-2 pt-1'>
                  {/* If order is PAID, provide button for Manual Delivery */}
                  {selectedOrder.status === 'PAID' && (
                    <Button
                      size='sm'
                      onClick={() => {
                        setManualNote(
                          selectedOrder.checkoutData?.email
                            ? `اشتراک روی ایمیل ${selectedOrder.checkoutData.email} با موفقیت فعال گردید.`
                            : ''
                        )
                        setManualInfo('')
                        setManualDialogOpen(true)
                      }}
                      className='flex-1 text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-9'
                    >
                      <Send className='size-3.5' />
                      <span>تکمیل و تحویل دستی (Manual Delivery)</span>
                    </Button>
                  )}

                  {/* Refund Button for PAID or COMPLETED orders */}
                  {(selectedOrder.status === 'PAID' || selectedOrder.status === 'COMPLETED') && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleOpenRefund(selectedOrder)}
                      className='text-xs font-semibold gap-1.5 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 rounded-xl h-9'
                    >
                      <Receipt className='size-3.5' />
                      <span>استرداد وجه (Refund)</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Refund Info Banner if order is REFUNDED */}
              {selectedOrder.status === 'REFUNDED' && (
                <div className='p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-1.5 text-xs text-purple-700 dark:text-purple-300'>
                  <div className='flex items-center gap-1.5 font-bold'>
                    <Receipt className='size-4 text-purple-600 dark:text-purple-400' />
                    <span>اطلاعات استرداد وجه:</span>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1'>
                    <div>مبلغ بازگشتی: <strong className='font-mono'>{formatPrice(selectedOrder.refundAmount || selectedOrder.amount)}</strong></div>
                    {selectedOrder.refundRefId && <div>کد پیگیری شبا/بانک: <code className='font-mono font-bold'>{selectedOrder.refundRefId}</code></div>}
                    {selectedOrder.refundReason && <div className='col-span-1 sm:col-span-2'>علت: {selectedOrder.refundReason}</div>}
                    {selectedOrder.refundedAt && <div className='col-span-1 sm:col-span-2 text-muted-foreground'>زمان استرداد: {formatDate(selectedOrder.refundedAt)}</div>}
                  </div>
                </div>
              )}

              {/* Coupon / Discount Info if applied */}
              {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                <div className='p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300'>
                  <span className='flex items-center gap-1.5 font-semibold'>
                    <Tag className='size-3.5 text-emerald-600' />
                    <span>کد تخفیف اعمال‌شده: {selectedOrder.coupon?.code || 'کد اختصاصی'}</span>
                  </span>
                  <span className='font-mono font-bold'>
                    {formatPrice(selectedOrder.discountAmount)} تخفیف
                  </span>
                </div>
              )}

              {/* Payment Details */}
              <div className='p-3.5 rounded-xl border border-border/70 bg-card space-y-2'>
                <h4 className='font-bold text-foreground text-xs flex items-center gap-1.5'>
                  <Receipt className='size-3.5 text-primary' />
                  اطلاعات پرداخت بانکی:
                </h4>
                {selectedOrder.payment ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1'>
                    <div className='flex justify-between sm:justify-start sm:gap-2'>
                      <span className='text-muted-foreground'>درگاه:</span>
                      <span className='font-semibold text-foreground'>{selectedOrder.payment.gatewayName}</span>
                    </div>
                    <div className='flex justify-between sm:justify-start sm:gap-2'>
                      <span className='text-muted-foreground'>وضعیت تراکنش:</span>
                      <span className='font-semibold text-foreground'>{selectedOrder.payment.status}</span>
                    </div>
                    {selectedOrder.payment.refId && (
                      <div className='col-span-1 sm:col-span-2 flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40'>
                        <span className='text-muted-foreground'>کد پیگیری بانکی (RefId):</span>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-sans font-bold text-primary select-all'>
                            {selectedOrder.payment.refId}
                          </span>
                          <button
                            type='button'
                            onClick={() => handleCopyText(selectedOrder.payment!.refId!, 'ref-id')}
                            className='hover:text-primary'
                            title='کپی کد پیگیری'
                          >
                            <Copy className='size-3' />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-[11px]'>تراکنشی برای این سفارش ثبت نشده است.</p>
                )}
              </div>

              {/* Copy Receipt Button */}
              <div className='pt-1'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleCopyCustomerReceipt(selectedOrder)}
                  className='w-full text-xs font-semibold gap-1.5 rounded-xl h-9'
                >
                  <Receipt className='size-3.5' />
                  <span>کپی خلاصه فاکتور سفارش جهت ارسال به کاربر (تلگرام/پیامک)</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Delivery Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className='sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <Send className='size-4 text-primary' />
              <span>تحویل دستی سفارش #{selectedOrder?.id.slice(-6).toUpperCase()}</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              اطلاعات وارد شده مستقیماً در بخش تحویل (Delivery) ثبت شده و سفارش به وضعیت تکمیل‌شده (COMPLETED) تغییر خواهد یافت.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2 text-xs'>
            <div>
              <label className='font-semibold block mb-1'>یادداشت و اطلاعات تحویل به مشتری: *</label>
              <Textarea
                rows={3}
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder='مثلاً: اشتراک شما با موفقیت فعال شد / جزییات دسترسی ...'
                className='text-xs rounded-xl'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>اطلاعات محرمانه یا اکانت اضافی (اختیاری):</label>
              <Input
                value={manualInfo}
                onChange={(e) => setManualInfo(e.target.value)}
                placeholder='یوزرنیم، پسورد، یا لینک اختصاصی...'
                className='text-xs rounded-xl'
              />
            </div>
          </div>

          <DialogFooter className='flex flex-col-reverse sm:flex-row gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setManualDialogOpen(false)}
              disabled={deliveringManual}
              className='text-xs w-full sm:w-auto h-9 rounded-xl'
            >
              انصراف
            </Button>
            <Button
              size='sm'
              onClick={handleFulfillManual}
              disabled={deliveringManual}
              className='text-xs font-semibold w-full sm:w-auto h-9 rounded-xl'
            >
              {deliveringManual && <Loader2 className='size-3.5 animate-spin me-1.5' />}
              ثبت تحویل و تکمیل سفارش
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Order Dialog (Section 4.1) */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className='sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400'>
              <Receipt className='size-4' />
              <span>استرداد وجه سفارش #{refundOrderTarget?.id.slice(-6).toUpperCase()}</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              با استرداد وجه، وضعیت سفارش به REFUNDED تغییر یافته، هرگونه موجودی قفل شده آزاد گردیده و اعلان ثبت استرداد برای خریدار و ادمین ارسال خواهد شد.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2 text-xs'>
            <div>
              <label className='font-semibold block mb-1'>مبلغ قابل عودت (تومان): *</label>
              <Input
                type='number'
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder='مبلغ به تومان'
                className='text-xs font-mono h-10 rounded-xl'
                dir='ltr'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>شماره پیگیری شبا / پایا / کارت بانکی (اختیاری):</label>
              <Input
                value={refundRefId}
                onChange={(e) => setRefundRefId(e.target.value)}
                placeholder='مثلاً: IR120... یا شماره تراکنش پایا'
                className='text-xs font-mono h-10 rounded-xl'
                dir='ltr'
              />
            </div>

            <div>
              <label className='font-semibold block mb-1'>علت استرداد وجه: (اختیاری)</label>
              <Textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder='مثلاً: عدم موجودی لایسنس / انصراف مشتری طبق ضمانت بازگشت وجه'
                className='text-xs rounded-xl'
              />
            </div>
          </div>

          <DialogFooter className='flex flex-col-reverse sm:flex-row gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setRefundDialogOpen(false)}
              disabled={refunding}
              className='text-xs w-full sm:w-auto h-9 rounded-xl'
            >
              انصراف
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={handleProcessRefund}
              disabled={refunding}
              className='text-xs font-semibold w-full sm:w-auto h-9 rounded-xl gap-1.5 cursor-pointer'
            >
              {refunding && <Loader2 className='size-3.5 animate-spin' />}
              تأیید و ثبت استرداد وجه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
