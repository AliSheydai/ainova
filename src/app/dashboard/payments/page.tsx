'use client'

import { useEffect, useState, useTransition, useRef, useCallback } from 'react'
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  Building2,
  SlidersHorizontal,
  X,
  Copy,
  Check,
  LayoutGrid,
  Table as TableIcon,
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  Coins,
  ShieldCheck,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { LoadingState } from '@/components/ui/loading-state'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface AdminPaymentItem {
  id: string
  orderId: string
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  gatewayName: string
  authority: string | null
  refId: string | null
  createdAt: string
  paidAt?: string | null
  order: {
    id: string
    user: {
      id: string
      phone: string | null
      name: string | null
      telegramUsername?: string | null
    }
    product?: {
      title?: string
      name?: string
    } | null
    plan: {
      name: string
      duration?: number
      product?: { title?: string; name?: string }
    }
  }
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

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPayments, setTotalPayments] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [gatewayFilter, setGatewayFilter] = useState('ALL')
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST')

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const isMobile = useIsMobile()
  const [userViewMode, setUserViewMode] = useState<'table' | 'cards' | null>(null)
  const viewMode = userViewMode ?? (isMobile ? 'cards' : 'table')
  const setViewMode = (mode: 'table' | 'cards') => setUserViewMode(mode)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [availableGateways, setAvailableGateways] = useState<string[]>([])
  const [counts, setCounts] = useState({
    all: 0,
    success: 0,
    pending: 0,
    failed: 0,
    totalRevenue: 0,
  })

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

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))

      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (gatewayFilter !== 'ALL') params.set('gateway', gatewayFilter)
      if (dateRangeFilter !== 'ALL') params.set('dateRange', dateRangeFilter)
      if (sortBy !== 'NEWEST') params.set('sortBy', sortBy)

      const res = await fetch(`/api/admin/payments?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        startTransition(() => {
          setPayments(data.payments || [])
          setTotalPayments(data.pagination?.total || 0)
          setTotalPages(data.pagination?.totalPages || 1)
          if (data.counts) setCounts(data.counts)
          if (data.gateways) setAvailableGateways(data.gateways)
        })
      } else {
        toast.error(data.error || 'خطا در بارگذاری تراکنش‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, gatewayFilter, dateRangeFilter, sortBy])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('ALL')
    setGatewayFilter('ALL')
    setDateRangeFilter('ALL')
    setSortBy('NEWEST')
    setPage(1)
    toast.success('فیلترها بازنشانی شدند.')
  }

  const activeFiltersCount = [
    statusFilter !== 'ALL',
    gatewayFilter !== 'ALL',
    dateRangeFilter !== 'ALL',
    sortBy !== 'NEWEST',
    debouncedSearch.length > 0,
  ].filter(Boolean).length

  const handleCopyText = (text: string, id: string, label = 'کپی شد.') => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(label)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      <Header>
        <div className='hidden sm:flex items-center gap-2.5 min-w-0'>
          <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0'>
            <CreditCard className='size-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-sm sm:text-base font-bold truncate text-foreground'>
                تراکنش‌های درگاه پرداخت
              </h1>
              <Badge variant='secondary' className='text-[10px] h-5 px-1.5 font-sans font-medium'>
                {counts.all.toLocaleString('fa-IR')}
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground hidden sm:block truncate'>
              گزارش کلیه پرداخت‌های بانکی، کدهای پیگیری RefId و درآمد وصول‌شده
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
            variant='outline'
            size='sm'
            onClick={fetchPayments}
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
          {/* Financial KPI Overview Chips */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3'>
            {/* Total Revenue */}
            <div className='p-3 sm:p-3.5 rounded-xl border border-primary/30 bg-primary/5 shadow-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-primary font-medium'>درآمد وصول‌شده موفق</span>
                <Coins className='size-4 text-primary' />
              </div>
              <div className='mt-2 flex items-baseline gap-1'>
                <span className='text-base sm:text-lg font-black font-sans text-primary'>
                  {formatPrice(counts.totalRevenue)}
                </span>
              </div>
            </div>

            {/* Successful Payments */}
            <button
              type='button'
              onClick={() => {
                setStatusFilter(statusFilter === 'SUCCESS' ? 'ALL' : 'SUCCESS')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                statusFilter === 'SUCCESS'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                  : 'bg-card border-border/70 hover:border-emerald-500/30 hover:bg-emerald-500/5'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-emerald-600 dark:text-emerald-400 font-medium'>
                  تراکنش‌های موفق
                </span>
                <CheckCircle2 className='size-4 text-emerald-500' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400'>
                  {counts.success.toLocaleString('fa-IR')}
                </span>
                <span className='text-[10px] text-emerald-600/80 dark:text-emerald-400/80'>تراکنش</span>
              </div>
            </button>

            {/* Pending Payments */}
            <button
              type='button'
              onClick={() => {
                setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                  : 'bg-card border-border/70 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-amber-600 dark:text-amber-400 font-medium'>
                  در انتظار پرداخت
                </span>
                <Clock className='size-4 text-amber-500' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                  {counts.pending.toLocaleString('fa-IR')}
                </span>
                <span className='text-[10px] text-muted-foreground'>تراکنش</span>
              </div>
            </button>

            {/* Failed Payments */}
            <button
              type='button'
              onClick={() => {
                setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-500/10 border-rose-500/50 shadow-xs ring-1 ring-rose-500/30'
                  : 'bg-card border-border/70 hover:border-rose-500/30 hover:bg-rose-500/5'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-rose-600 dark:text-rose-400 font-medium'>
                  تراکنش‌های ناموفق
                </span>
                <XCircle className='size-4 text-rose-500' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-rose-600 dark:text-rose-400'>
                  {counts.failed.toLocaleString('fa-IR')}
                </span>
                <span className='text-[10px] text-rose-600/80 dark:text-rose-400/80'>تراکنش</span>
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
                    placeholder='جستجو با کد پیگیری (RefId)، شناسه سفارش، Authority یا موبایل خریدار...'
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
                      <SelectValue placeholder='وضعیت تراکنش' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                      <SelectItem value='SUCCESS'>پرداخت موفق</SelectItem>
                      <SelectItem value='PENDING'>در انتظار پرداخت</SelectItem>
                      <SelectItem value='FAILED'>ناموفق</SelectItem>
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
                <div className='pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs animate-in fade-in-50 duration-200'>
                  {/* Gateway Filter */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      درگاه پرداخت بانکی:
                    </label>
                    <Select
                      value={gatewayFilter}
                      onValueChange={(val) => {
                        setGatewayFilter(val)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                        <SelectValue placeholder='درگاه بانکی' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ALL'>همه درگاه‌ها</SelectItem>
                        {availableGateways.map((gw) => (
                          <SelectItem key={gw} value={gw}>
                            {gw === 'zarinpal' ? 'زرین‌پال' : gw === 'mock' ? 'درگاه تستی (Mock)' : gw}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      بازه زمانی ثبت:
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
                        <SelectItem value='HIGHEST_AMOUNT'>بیشترین مبلغ</SelectItem>
                        <SelectItem value='LOWEST_AMOUNT'>کمترین مبلغ</SelectItem>
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
                        <SelectItem value='10'>۱۰ تراکنش</SelectItem>
                        <SelectItem value='20'>۲۰ تراکنش</SelectItem>
                        <SelectItem value='50'>۵۰ تراکنش</SelectItem>
                        <SelectItem value='100'>۱۰۰ تراکنش</SelectItem>
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

                  {gatewayFilter !== 'ALL' && (
                    <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                      درگاه: {gatewayFilter}
                      <button onClick={() => setGatewayFilter('ALL')} className='hover:text-destructive'>
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

          {/* Payments Table & Cards View */}
          <Card className='border-border/70 shadow-xs overflow-hidden'>
            <CardHeader className='p-4 sm:p-5 border-b border-border/60 bg-muted/10'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <div>
                  <CardTitle className='text-sm sm:text-base font-bold flex items-center gap-2 text-foreground'>
                    <span>سوابق تراکنش‌های پرداخت</span>
                    <Badge variant='outline' className='text-xs font-sans'>
                      {totalPayments.toLocaleString('fa-IR')} تراکنش
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
                <LoadingState message='در حال دریافت تراکنش‌ها...' />
              ) : payments.length === 0 ? (
                <div className='py-16 text-center space-y-3'>
                  <div className='size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground'>
                    <CreditCard className='size-6' aria-hidden='true' />
                  </div>
                  <p className='text-sm font-semibold text-foreground'>تراکنشی با این مشخصات یافت نشد.</p>
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
                  aria-label='جدول تراکنش‌های بانکی'
                >
                  <table className='w-full min-w-[1150px] text-xs text-start'>
                    <thead>
                      <tr className='border-b border-border/60 bg-muted/30 text-muted-foreground font-medium'>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[120px]'>شناسه تراکنش</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[160px]'>کد پیگیری (RefId)</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[170px]'>مشتری</th>
                        <th className='py-3.5 px-4 text-start min-w-[220px]'>محصول و سفارش</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[110px]'>درگاه</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[120px]'>مبلغ</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[120px]'>وضعیت</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[170px]'>تاریخ و زمان</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/40'>
                      {payments.map((p) => (
                        <tr key={p.id} className='hover:bg-muted/40 transition-colors group cursor-default'>
                          {/* Payment ID */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[120px]'>
                            <div className='flex items-center gap-1.5'>
                              <span className='font-mono font-bold text-foreground'>
                                #{p.id.slice(-8).toUpperCase()}
                              </span>
                              <button
                                type='button'
                                onClick={() => handleCopyText(p.id, p.id, 'شناسه تراکنش کپی شد.')}
                                className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground'
                                title='کپی شناسه'
                              >
                                {copiedId === p.id ? <Check className='size-3 text-primary' /> : <Copy className='size-3' />}
                              </button>
                            </div>
                          </td>

                          {/* RefId & Authority */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[160px] font-sans'>
                            {p.refId ? (
                              <div className='flex items-center gap-1.5 font-bold text-primary'>
                                <span>{p.refId}</span>
                                <button
                                  type='button'
                                  onClick={() => handleCopyText(p.refId!, `ref-${p.id}`, 'کد پیگیری کپی شد.')}
                                  className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground'
                                  title='کپی RefId'
                                >
                                  {copiedId === `ref-${p.id}` ? <Check className='size-3 text-primary' /> : <Copy className='size-3' />}
                                </button>
                              </div>
                            ) : p.authority ? (
                              <span className='text-muted-foreground text-[10px] font-mono truncate max-w-[140px] block' title={p.authority}>
                                {p.authority.slice(0, 14)}...
                              </span>
                            ) : (
                              <span className='text-muted-foreground'>—</span>
                            )}
                          </td>

                          {/* Customer */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[170px]'>
                            <div>
                              <span className='font-bold block text-foreground'>
                                {p.order?.user?.name || p.order?.user?.phone || 'کاربر سیستم'}
                              </span>
                              {p.order?.user?.phone && p.order?.user?.name && (
                                <span className='text-[10px] text-muted-foreground font-sans tabular-nums block'>
                                  {p.order.user.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Product & Order */}
                          <td className='py-3.5 px-4 min-w-[220px]'>
                            <div className='min-w-0 max-w-[300px]'>
                              <span className='text-foreground font-bold block leading-relaxed break-words'>
                                {p.order?.product?.title || p.order?.plan?.product?.title || p.order?.plan?.name || 'سفارش'}
                              </span>
                              <span className='text-[10px] text-muted-foreground font-mono block mt-0.5'>
                                سفارش: #{p.orderId.slice(-8).toUpperCase()}
                              </span>
                            </div>
                          </td>

                          {/* Gateway */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[110px]'>
                            <Badge variant='outline' className='text-[10px] font-medium gap-1 px-2 py-0.5 border-border'>
                              <Building2 className='size-2.5 text-muted-foreground' />
                              <span>{p.gatewayName === 'zarinpal' ? 'زرین‌پال' : p.gatewayName === 'mock' ? 'تستی (Mock)' : p.gatewayName}</span>
                            </Badge>
                          </td>

                          {/* Amount */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[120px] font-sans font-black text-foreground'>
                            {formatPrice(p.amount)}
                          </td>

                          {/* Status */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[120px]'>
                            {p.status === 'SUCCESS' ? (
                              <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 font-semibold'>
                                <CheckCircle2 className='size-3' />
                                پرداخت موفق
                              </Badge>
                            ) : p.status === 'PENDING' ? (
                              <Badge variant='outline' className='bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1 font-semibold'>
                                <Clock className='size-3' />
                                در انتظار
                              </Badge>
                            ) : (
                              <Badge variant='destructive' className='bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] gap-1 font-semibold'>
                                <XCircle className='size-3' />
                                ناموفق
                              </Badge>
                            )}
                          </td>

                          {/* Date */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[170px] text-muted-foreground text-[11px]'>
                            <span className='block text-foreground font-semibold'>
                              {formatRelativeTime(p.createdAt)}
                            </span>
                            <span className='text-[10px] text-muted-foreground font-sans block mt-0.5'>
                              {formatDate(p.createdAt)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Mobile Cards View */
                <div className='p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className='rounded-xl border border-border/70 p-3.5 bg-card hover:border-primary/40 transition-all space-y-2.5'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='font-mono font-bold text-xs text-foreground'>
                          #{p.id.slice(-8).toUpperCase()}
                        </span>
                        {p.status === 'SUCCESS' ? (
                          <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[9px] gap-1'>
                            <CheckCircle2 className='size-2.5' />
                            موفق
                          </Badge>
                        ) : p.status === 'PENDING' ? (
                          <Badge variant='outline' className='bg-amber-500/15 text-amber-700 border-amber-500/30 text-[9px] gap-1'>
                            <Clock className='size-2.5' />
                            در انتظار
                          </Badge>
                        ) : (
                          <Badge variant='destructive' className='text-[9px] gap-1'>
                            <XCircle className='size-2.5' />
                            ناموفق
                          </Badge>
                        )}
                      </div>

                      <div className='flex items-start justify-between gap-2 pt-1 border-t border-border/40'>
                        <div>
                          <h4 className='font-bold text-xs text-foreground'>
                            {p.order?.product?.title || p.order?.plan?.product?.title || 'سفارش'}
                          </h4>
                          <span className='text-[11px] text-muted-foreground'>
                            {p.order?.user?.name || p.order?.user?.phone || 'کاربر'}
                          </span>
                        </div>
                        <span className='font-bold text-xs text-primary font-sans shrink-0'>
                          {formatPrice(p.amount)}
                        </span>
                      </div>

                      {p.refId && (
                        <div className='flex items-center justify-between text-xs font-sans'>
                          <span className='text-muted-foreground text-[11px] font-medium'>کد پیگیری:</span>
                          <span className='font-bold text-primary'>{p.refId}</span>
                        </div>
                      )}

                      <div className='flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40'>
                        <span>درگاه: {p.gatewayName}</span>
                        <span className='font-sans'>{formatDate(p.createdAt)}</span>
                      </div>
                    </div>
                  ))}
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
                      {Math.min(page * limit, totalPayments).toLocaleString('fa-IR')}
                    </span>{' '}
                    از{' '}
                    <span className='font-bold font-sans text-foreground'>
                      {totalPayments.toLocaleString('fa-IR')}
                    </span>{' '}
                    تراکنش
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
    </>
  )
}
