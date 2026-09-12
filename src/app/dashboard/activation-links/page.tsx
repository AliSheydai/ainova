'use client'

import { useEffect, useState, useTransition, useRef, useCallback } from 'react'
import {
  Link as LinkIcon,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Filter,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  X,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  Package,
  User,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { LoadingState } from '@/components/ui/loading-state'
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

interface ActivationLinkItem {
  id: string
  planId: string
  url: string
  status: 'AVAILABLE' | 'RESERVED' | 'USED' | 'INVALID'
  orderId: string | null
  createdAt: string
  assignedAt: string | null
  usedAt: string | null
  plan?: {
    id: string
    name: string
    product?: {
      title: string
    }
  }
  order?: {
    id: string
    user?: {
      phone: string | null
      name: string | null
    }
  } | null
}

interface LinkStats {
  total: number
  available: number
  reserved: number
  used: number
  invalid: number
}

interface ProductOption {
  id: string
  title: string
  name: string
  slug: string
  plans?: Array<{ id: string; name: string }>
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
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

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'آماده فروش',
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2,
      }
    case 'RESERVED':
      return {
        label: 'رزرو شده',
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        icon: Clock,
      }
    case 'USED':
      return {
        label: 'مصرف‌شده',
        className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
        icon: Check,
      }
    case 'INVALID':
      return {
        label: 'نامعتبر',
        className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        icon: XCircle,
      }
    default:
      return {
        label: status,
        className: 'bg-muted text-muted-foreground',
        icon: AlertTriangle,
      }
  }
}

export default function AdminActivationLinksPage() {
  const [links, setLinks] = useState<ActivationLinkItem[]>([])
  const [stats, setStats] = useState<LinkStats | null>(null)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLinks, setTotalLinks] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [productFilter, setProductFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST')

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const isMobile = useIsMobile()
  const [userViewMode, setUserViewMode] = useState<'table' | 'cards' | null>(null)
  const viewMode = userViewMode ?? (isMobile ? 'cards' : 'table')
  const setViewMode = (mode: 'table' | 'cards') => setUserViewMode(mode)
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Bulk Add Dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkProductId, setBulkProductId] = useState('')
  const [bulkPlanId, setBulkPlanId] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [importing, setImporting] = useState(false)

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 350)
  }

  const handleClearSearch = () => {
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
  }

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))

      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (productFilter !== 'ALL') params.set('productId', productFilter)
      if (planFilter !== 'ALL') params.set('planId', planFilter)
      if (sortBy !== 'NEWEST') params.set('sortBy', sortBy)

      const res = await fetch(`/api/admin/activation-links?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        startTransition(() => {
          setLinks(data.links || [])
          setTotalLinks(data.pagination?.total || 0)
          setTotalPages(data.pagination?.totalPages || 1)
          if (data.stats) setStats(data.stats)
          if (data.products) {
            setProducts(data.products)
            if (!bulkProductId && data.products.length > 0) {
              setBulkProductId(data.products[0].id)
            }
          }
        })
      } else {
        toast.error(data.error || 'خطا در بارگذاری لینک‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, productFilter, planFilter, sortBy, bulkProductId])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('ALL')
    setProductFilter('ALL')
    setPlanFilter('ALL')
    setSortBy('NEWEST')
    setPage(1)
    toast.success('فیلترها بازنشانی شدند.')
  }

  const activeFiltersCount = [
    statusFilter !== 'ALL',
    productFilter !== 'ALL',
    planFilter !== 'ALL',
    sortBy !== 'NEWEST',
    debouncedSearch.length > 0,
  ].filter(Boolean).length

  const handleCopyText = (text: string, id: string, label = 'لینک کپی شد.') => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(label)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDeleteLink = async (id: string) => {
    if (!confirm('آیا از حذف این لینک فعال‌سازی اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/admin/activation-links?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'لینک حذف شد.')
        fetchLinks()
      } else {
        toast.error(data.error || 'خطا در حذف لینک.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    }
  }

  const handleBulkImport = async () => {
    if (!bulkProductId) {
      toast.error('لطفاً محصول مورد نظر را انتخاب کنید.')
      return
    }

    const lines = bulkText.split('\n')
    if (lines.length === 0 || !bulkText.trim()) {
      toast.error('حداقل یک لینک معتبر وارد کنید.')
      return
    }

    setImporting(true)
    try {
      const res = await fetch('/api/admin/activation-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: bulkProductId,
          planId: bulkPlanId || undefined,
          links: lines,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'لینک‌ها با موفقیت افزوده شدند.')
        setBulkDialogOpen(false)
        setBulkText('')
        fetchLinks()
      } else {
        toast.error(data.error || 'خطا در افزودن لینک‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setImporting(false)
    }
  }

  const selectedProductPlans =
    products.find((p) => p.id === (bulkProductId || productFilter))?.plans || []

  return (
    <>
      <Header>
        <div className='hidden sm:flex items-center gap-2.5 min-w-0'>
          <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0'>
            <LinkIcon className='size-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-sm sm:text-base font-bold truncate text-foreground'>
                انبار لینک‌های فعال‌سازی (Inventory)
              </h1>
              <Badge variant='secondary' className='text-[10px] h-5 px-1.5 font-sans font-medium'>
                {stats?.total.toLocaleString('fa-IR') || '۰'}
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground hidden sm:block truncate'>
              مدیریت موجودی لینک‌های یکبارمصرف، تخصیص خودکار و وضعیت مصرف
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

          <Button
            size='sm'
            onClick={() => setBulkDialogOpen(true)}
            className='gap-1.5 text-xs h-8 px-3 font-semibold shadow-xs'
          >
            <Plus className='size-3.5' />
            <span>افزودن لینک جدید</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={fetchLinks}
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
          {/* Inventory KPI Overview Chips */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3'>
            {/* Total Stock */}
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
                <span className='text-[11px] text-muted-foreground font-medium'>کل موجودی انبار</span>
                <Layers className='size-4 text-muted-foreground' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                  {stats?.total.toLocaleString('fa-IR') || '۰'}
                </span>
                <span className='text-[10px] text-muted-foreground'>لینک</span>
              </div>
            </button>

            {/* Available */}
            <button
              type='button'
              onClick={() => {
                setStatusFilter(statusFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                  : 'bg-card border-border/70 hover:border-emerald-500/30 hover:bg-emerald-500/5'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-emerald-600 dark:text-emerald-400 font-medium'>
                  آماده فروش (موجود)
                </span>
                <CheckCircle2 className='size-4 text-emerald-500' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400'>
                  {stats?.available.toLocaleString('fa-IR') || '۰'}
                </span>
                <span className='text-[10px] text-emerald-600/80 dark:text-emerald-400/80'>لینک</span>
              </div>
            </button>

            {/* Used */}
            <button
              type='button'
              onClick={() => {
                setStatusFilter(statusFilter === 'USED' ? 'ALL' : 'USED')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                statusFilter === 'USED'
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-xs ring-1 ring-blue-500/30'
                  : 'bg-card border-border/70 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-blue-600 dark:text-blue-400 font-medium'>
                  مصرف‌شده (تحویل شده)
                </span>
                <Check className='size-4 text-blue-500' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                  {stats?.used.toLocaleString('fa-IR') || '۰'}
                </span>
                <span className='text-[10px] text-muted-foreground'>لینک</span>
              </div>
            </button>

            {/* Reserved / Invalid */}
            <button
              type='button'
              onClick={() => {
                setStatusFilter(statusFilter === 'INVALID' ? 'ALL' : 'INVALID')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                statusFilter === 'INVALID' || statusFilter === 'RESERVED'
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                  : 'bg-card border-border/70 hover:border-amber-500/30 hover:bg-amber-500/5'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-amber-600 dark:text-amber-400 font-medium'>
                  رزرو / نامعتبر
                </span>
                <Clock className='size-4 text-amber-500' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-amber-600 dark:text-amber-400'>
                  {((stats?.reserved || 0) + (stats?.invalid || 0)).toLocaleString('fa-IR')}
                </span>
                <span className='text-[10px] text-amber-600/80 dark:text-amber-400/80'>لینک</span>
              </div>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <Card className='border-border/70 shadow-xs bg-card/60 backdrop-blur-sm'>
            <CardContent className='p-3.5 sm:p-4 space-y-3'>
              <div className='flex flex-col sm:flex-row items-center gap-2.5'>
                {/* Live Search Input */}
                <div className='relative flex-1 w-full'>
                  <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
                  <Input
                    placeholder='جستجو با شناسه، شماره سفارش، تلفن یا نام خریدار...'
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className='ps-9 pe-8 text-xs sm:text-sm h-10 rounded-xl bg-background/80 border-border/80'
                  />
                  {search && (
                    <button
                      type='button'
                      onClick={handleClearSearch}
                      className='absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors'
                      title='پاک کردن جستجو'
                    >
                      <X className='size-3.5' />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className='flex items-center gap-2 w-full sm:w-auto shrink-0'>
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='w-full sm:w-40 h-10 text-xs rounded-xl bg-background/80 border-border/80'>
                      <SelectValue placeholder='وضعیت لینک' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                      <SelectItem value='AVAILABLE'>آماده فروش (موجود)</SelectItem>
                      <SelectItem value='RESERVED'>رزرو شده</SelectItem>
                      <SelectItem value='USED'>مصرف‌شده</SelectItem>
                      <SelectItem value='INVALID'>نامعتبر</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showAdvancedFilters ? 'secondary' : 'outline'}
                    size='sm'
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`h-10 px-3 text-xs gap-1.5 rounded-xl shrink-0 transition-colors ${
                      activeFiltersCount > 0 ? 'border-primary/50 text-primary' : ''
                    }`}
                  >
                    <SlidersHorizontal className='size-3.5' />
                    <span className='hidden sm:inline'>فیلترها</span>
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
                <div className='pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in-50 duration-200'>
                  {/* Product Filter */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      محصول مربوطه:
                    </label>
                    <Select
                      value={productFilter}
                      onValueChange={(val) => {
                        setProductFilter(val)
                        setPlanFilter('ALL')
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                        <SelectValue placeholder='همه محصولات' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ALL'>همه محصولات</SelectItem>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plan Filter */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      پلن فروش:
                    </label>
                    <Select
                      value={planFilter}
                      onValueChange={(val) => {
                        setPlanFilter(val)
                        setPage(1)
                      }}
                      disabled={selectedProductPlans.length === 0}
                    >
                      <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                        <SelectValue placeholder='همه پلن‌ها' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ALL'>همه پلن‌ها</SelectItem>
                        {selectedProductPlans.map((pl) => (
                          <SelectItem key={pl.id} value={pl.id}>
                            {pl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Limit per page */}
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
                        <SelectItem value='10'>۱۰ لینک</SelectItem>
                        <SelectItem value='20'>۲۰ لینک</SelectItem>
                        <SelectItem value='50'>۵۰ لینک</SelectItem>
                        <SelectItem value='100'>۱۰۰ لینک</SelectItem>
                      </SelectContent>
                    </Select>
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

                  {productFilter !== 'ALL' && (
                    <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                      محصول: {products.find((p) => p.id === productFilter)?.title || productFilter}
                      <button onClick={() => setProductFilter('ALL')} className='hover:text-destructive'>
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

          {/* Links Table & Cards View */}
          <Card className='border-border/70 shadow-xs overflow-hidden'>
            <CardHeader className='p-4 sm:p-5 border-b border-border/60 bg-muted/10'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <div>
                  <CardTitle className='text-sm sm:text-base font-bold flex items-center gap-2 text-foreground'>
                    <span>لیست لینک‌های فعال‌سازی</span>
                    <Badge variant='outline' className='text-xs font-sans'>
                      {totalLinks.toLocaleString('fa-IR')} لینک
                    </Badge>
                  </CardTitle>
                  <CardDescription className='text-xs mt-0.5'>
                    صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
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
                <LoadingState message='در حال بارگذاری لینک‌های انبار...' />
              ) : links.length === 0 ? (
                <div className='py-16 text-center space-y-3'>
                  <div className='size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground'>
                    <LinkIcon className='size-6' aria-hidden='true' />
                  </div>
                  <p className='text-sm font-semibold text-foreground'>لینکی با این مشخصات یافت نشد.</p>
                  {activeFiltersCount > 0 && (
                    <Button variant='outline' size='sm' onClick={handleResetFilters} className='text-xs'>
                      بازنشانی تمام فیلترها
                    </Button>
                  )}
                </div>
              ) : viewMode === 'table' ? (
                /* Desktop Table View */
                <div
                  className='overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
                  tabIndex={0}
                  role='region'
                  aria-label='جدول لینک‌های فعال‌سازی'
                >
                  <table className='w-full min-w-[1100px] text-xs text-start'>
                    <thead>
                      <tr className='border-b border-border/60 bg-muted/30 text-muted-foreground font-medium'>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[110px]'>شناسه</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[200px]'>محصول و پلن</th>
                        <th className='py-3.5 px-4 text-start min-w-[300px]'>لینک اختصاصی فعال‌سازی</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[120px]'>وضعیت</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[170px]'>سفارش / مشتری</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[160px]'>تاریخ ثبت</th>
                        <th className='py-3.5 px-4 text-end whitespace-nowrap min-w-[90px]'>عملیات</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/40'>
                      {links.map((link) => {
                        const status = getStatusBadge(link.status)
                        const StatusIcon = status.icon
                        const isRevealed = revealedIds[link.id]

                        return (
                          <tr key={link.id} className='hover:bg-muted/40 transition-colors group cursor-default'>
                            {/* ID */}
                            <td className='py-3.5 px-4 whitespace-nowrap min-w-[110px] font-mono font-bold text-foreground'>
                              #{link.id.slice(-6).toUpperCase()}
                            </td>

                            {/* Product & Plan */}
                            <td className='py-3.5 px-4 whitespace-nowrap min-w-[200px]'>
                              <span className='font-bold block text-foreground'>
                                {link.plan?.product?.title || 'محصول سیستم'}
                              </span>
                              <span className='text-[10px] text-muted-foreground block mt-0.5'>
                                پلن: {link.plan?.name || 'پیش‌فرض'}
                              </span>
                            </td>

                            {/* URL Box */}
                            <td className='py-3.5 px-4 min-w-[300px]'>
                              <div className='flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/40 border border-border/50 max-w-[380px]'>
                                <span className='font-mono text-[11px] truncate flex-1 select-all' dir='ltr'>
                                  {isRevealed
                                    ? link.url
                                    : link.url.length > 20
                                      ? `${link.url.slice(0, 12)}••••••••${link.url.slice(-6)}`
                                      : '••••••••••••'}
                                </span>

                                <button
                                  type='button'
                                  onClick={() => toggleReveal(link.id)}
                                  className='text-muted-foreground hover:text-foreground p-1'
                                  title={isRevealed ? 'مخفی کردن' : 'نمایش کامل'}
                                >
                                  {isRevealed ? <EyeOff className='size-3.5' /> : <Eye className='size-3.5' />}
                                </button>

                                <button
                                  type='button'
                                  onClick={() => handleCopyText(link.url, link.id)}
                                  className='text-muted-foreground hover:text-foreground p-1'
                                  title='کپی لینک'
                                >
                                  {copiedId === link.id ? <Check className='size-3.5 text-primary' /> : <Copy className='size-3.5' />}
                                </button>

                                <a
                                  href={link.url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-muted-foreground hover:text-foreground p-1'
                                  title='تست باز کردن لینک'
                                >
                                  <ExternalLink className='size-3.5' />
                                </a>
                              </div>
                            </td>

                            {/* Status */}
                            <td className='py-3.5 px-4 whitespace-nowrap min-w-[120px]'>
                              <Badge className={`text-[10px] gap-1 font-semibold border ${status.className}`}>
                                <StatusIcon className='size-2.5' />
                                <span>{status.label}</span>
                              </Badge>
                            </td>

                            {/* Order & User */}
                            <td className='py-3.5 px-4 whitespace-nowrap min-w-[170px]'>
                              {link.order ? (
                                <div>
                                  <span className='font-bold block text-foreground'>
                                    {link.order.user?.name || link.order.user?.phone || 'کاربر'}
                                  </span>
                                  <span className='text-[10px] text-muted-foreground font-mono block mt-0.5'>
                                    سفارش: #{link.order.id.slice(-6).toUpperCase()}
                                  </span>
                                </div>
                              ) : (
                                <span className='text-muted-foreground'>—</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className='py-3.5 px-4 whitespace-nowrap min-w-[160px] text-muted-foreground text-[11px]'>
                              <span className='block text-foreground font-semibold'>
                                {formatRelativeTime(link.createdAt)}
                              </span>
                              <span className='text-[10px] text-muted-foreground font-sans block mt-0.5'>
                                {formatDate(link.createdAt)}
                              </span>
                            </td>

                            {/* Delete Action */}
                            <td className='py-3.5 px-4 text-end whitespace-nowrap min-w-[90px]'>
                              {link.status !== 'USED' && !link.orderId && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleDeleteLink(link.id)}
                                  className='size-7 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10'
                                  title='حذف لینک'
                                >
                                  <Trash2 className='size-3.5' />
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Mobile Cards View */
                <div className='p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {links.map((link) => {
                    const status = getStatusBadge(link.status)
                    const StatusIcon = status.icon
                    const isRevealed = revealedIds[link.id]

                    return (
                      <div
                        key={link.id}
                        className='rounded-xl border border-border/70 p-3.5 bg-card hover:border-primary/40 transition-all space-y-2.5'
                      >
                        <div className='flex items-center justify-between'>
                          <span className='font-mono font-bold text-xs text-foreground'>
                            #{link.id.slice(-6).toUpperCase()}
                          </span>
                          <Badge className={`text-[9px] gap-1 border ${status.className}`}>
                            <StatusIcon className='size-2.5' />
                            <span>{status.label}</span>
                          </Badge>
                        </div>

                        <div>
                          <h4 className='font-bold text-xs text-foreground'>
                            {link.plan?.product?.title || 'محصول'}
                          </h4>
                          <span className='text-[11px] text-muted-foreground'>
                            پلن: {link.plan?.name || 'پیش‌فرض'}
                          </span>
                        </div>

                        {/* URL snippet */}
                        <div className='flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/40 border border-border/50'>
                          <span className='font-mono text-[10px] truncate flex-1 select-all' dir='ltr'>
                            {isRevealed
                              ? link.url
                              : `${link.url.slice(0, 14)}••••••••`}
                          </span>
                          <button
                            type='button'
                            onClick={() => toggleReveal(link.id)}
                            className='text-muted-foreground hover:text-foreground p-0.5'
                          >
                            {isRevealed ? <EyeOff className='size-3' /> : <Eye className='size-3' />}
                          </button>
                          <button
                            type='button'
                            onClick={() => handleCopyText(link.url, link.id)}
                            className='text-muted-foreground hover:text-foreground p-0.5'
                          >
                            {copiedId === link.id ? <Check className='size-3 text-primary' /> : <Copy className='size-3' />}
                          </button>
                        </div>

                        <div className='flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40'>
                          <span>ثبت: {formatDate(link.createdAt)}</span>
                          {link.status !== 'USED' && !link.orderId && (
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              className='text-rose-600 hover:underline'
                            >
                              حذف
                            </button>
                          )}
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
                      {Math.min(page * limit, totalLinks).toLocaleString('fa-IR')}
                    </span>{' '}
                    از{' '}
                    <span className='font-bold font-sans text-foreground'>
                      {totalLinks.toLocaleString('fa-IR')}
                    </span>{' '}
                    لینک
                  </div>

                  <div className='flex items-center gap-1'>
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

      {/* Bulk Add Links Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className='sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <Plus className='size-4 text-primary' />
              <span>افزودن دسته‌جمعی لینک‌های فعال‌سازی</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              لینک‌های خام را در کادر زیر وارد کنید (هر لینک در یک خط).
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2 text-xs'>
            <div>
              <label className='font-semibold block mb-1'>محصول مقصد: *</label>
              <Select value={bulkProductId} onValueChange={(val) => {
                setBulkProductId(val)
                setBulkPlanId('')
              }}>
                <SelectTrigger className='text-xs rounded-xl h-9'>
                  <SelectValue placeholder='انتخاب محصول' />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductPlans.length > 0 && (
              <div>
                <label className='font-semibold block mb-1'>پلن اختصاصی (اختیاری):</label>
                <Select value={bulkPlanId} onValueChange={setBulkPlanId}>
                  <SelectTrigger className='text-xs rounded-xl h-9'>
                    <SelectValue placeholder='همه پلن‌های این محصول' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>همه پلن‌ها</SelectItem>
                    {selectedProductPlans.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className='font-semibold block mb-1'>آدرس‌های لینک فعال‌سازی (هر خط یک لینک): *</label>
              <Textarea
                rows={5}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'https://one.google.com/promo/offer/xyz-1\nhttps://one.google.com/promo/offer/xyz-2'}
                className='font-mono text-xs rounded-xl'
                dir='ltr'
              />
              <span className='text-[10px] text-muted-foreground mt-1 block'>
                تعداد خطوط واردشده: {bulkText.split('\n').filter((l) => l.trim().length > 5).length} لینک
              </span>
            </div>
          </div>

          <DialogFooter className='flex flex-col-reverse sm:flex-row gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setBulkDialogOpen(false)}
              disabled={importing}
              className='text-xs w-full sm:w-auto h-9 rounded-xl'
            >
              انصراف
            </Button>
            <Button
              size='sm'
              onClick={handleBulkImport}
              disabled={importing}
              aria-busy={importing}
              className='text-xs font-semibold w-full sm:w-auto h-9 rounded-xl'
            >
              {importing && <Loader2 className='size-3.5 animate-spin me-1.5' aria-hidden='true' />}
              ذخیره در انبار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
