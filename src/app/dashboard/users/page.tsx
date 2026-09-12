'use client'

import { useEffect, useState, useTransition, useRef, useCallback } from 'react'
import {
  Users,
  Search,
  Filter,
  Shield,
  User as UserIcon,
  ShoppingBag,
  ExternalLink,
  Calendar,
  Phone,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
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
  Send,
  Coins,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface AdminUserItem {
  id: string
  phone: string | null
  name: string | null
  role: 'ADMIN' | 'USER'
  telegramId?: string | null
  telegramUsername?: string | null
  createdAt: string
  totalOrders: number
  totalSpent: number
}

interface UserDetailModalData {
  id: string
  phone: string | null
  name: string | null
  role: string
  telegramUsername: string | null
  createdAt: string
  totalSpent: number
  orders: {
    id: string
    amount: number
    status: string
    createdAt: string
    plan?: {
      name: string
      product?: { title?: string; name?: string }
    } | null
    payment?: {
      status: string
      refId: string | null
    } | null
    activationLink?: {
      url: string
      status: string
    } | null
  }[]
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [orderFilter, setOrderFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('NEWEST')

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const isMobile = useIsMobile()
  const [userViewMode, setUserViewMode] = useState<'table' | 'cards' | null>(null)
  const viewMode = userViewMode ?? (isMobile ? 'cards' : 'table')
  const setViewMode = (mode: 'table' | 'cards') => setUserViewMode(mode)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [counts, setCounts] = useState({
    all: 0,
    buyers: 0,
    admins: 0,
    noOrders: 0,
  })

  // Detail Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<UserDetailModalData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)

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

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))

      if (debouncedSearch) params.set('search', debouncedSearch)
      if (roleFilter !== 'ALL') params.set('role', roleFilter)
      if (orderFilter !== 'ALL') params.set('orderFilter', orderFilter)
      if (sortBy !== 'NEWEST') params.set('sortBy', sortBy)

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        startTransition(() => {
          setUsers(data.users || [])
          setTotalUsers(data.pagination?.total || 0)
          setTotalPages(data.pagination?.totalPages || 1)
          if (data.counts) setCounts(data.counts)
        })
      } else {
        toast.error(data.error || 'خطا در دریافت لیست کاربران.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, roleFilter, orderFilter, sortBy])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setRoleFilter('ALL')
    setOrderFilter('ALL')
    setSortBy('NEWEST')
    setPage(1)
    toast.success('فیلترها بازنشانی شدند.')
  }

  const activeFiltersCount = [
    roleFilter !== 'ALL',
    orderFilter !== 'ALL',
    sortBy !== 'NEWEST',
    debouncedSearch.length > 0,
  ].filter(Boolean).length

  const handleCopyText = (text: string, id: string, label = 'کپی شد.') => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(label)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleOpenUserDetail = async (userId: string) => {
    setSelectedUserId(userId)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()
      if (data.success) {
        setUserDetail(data.user)
      } else {
        toast.error(data.error || 'خطا در بارگذاری جزئیات کاربر.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleUpdateRole = async (newRole: 'ADMIN' | 'USER') => {
    if (!selectedUserId) return
    setUpdatingRole(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, role: newRole }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'نقش کاربر به‌روزرسانی شد.')
        fetchUsers()
        if (userDetail) {
          setUserDetail({ ...userDetail, role: newRole })
        }
      } else {
        toast.error(data.error || 'خطا در تغییر نقش.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setUpdatingRole(false)
    }
  }

  return (
    <>
      <Header>
        <div className='hidden sm:flex items-center gap-2.5 min-w-0'>
          <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0'>
            <Users className='size-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-sm sm:text-base font-bold truncate text-foreground'>
                مدیریت کاربران سیستم
              </h1>
              <Badge variant='secondary' className='text-[10px] h-5 px-1.5 font-sans font-medium'>
                {counts.all.toLocaleString('fa-IR')}
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground hidden sm:block truncate'>
              لیست اعضا، میزان خرید، مدیریت نقش‌ها و تاریخچه تراکنش‌های هر مشتری
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
            onClick={fetchUsers}
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
          {/* KPI Overview Chips */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3'>
            {/* Total Users */}
            <button
              type='button'
              onClick={() => {
                setRoleFilter('ALL')
                setOrderFilter('ALL')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                roleFilter === 'ALL' && orderFilter === 'ALL'
                  ? 'bg-primary/5 border-primary/40 shadow-xs ring-1 ring-primary/20'
                  : 'bg-card border-border/70 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-muted-foreground font-medium'>کل اعضای سیستم</span>
                <Users className='size-4 text-muted-foreground' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                  {counts.all.toLocaleString('fa-IR')}
                </span>
                <span className='text-[10px] text-muted-foreground'>کاربر</span>
              </div>
            </button>

            {/* Active Buyers */}
            <button
              type='button'
              onClick={() => {
                setOrderFilter(orderFilter === 'HAS_ORDERS' ? 'ALL' : 'HAS_ORDERS')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                orderFilter === 'HAS_ORDERS'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                  : 'bg-card border-border/70 hover:border-emerald-500/30 hover:bg-emerald-500/5'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-emerald-600 dark:text-emerald-400 font-medium'>
                  خریداران فعال
                </span>
                <ShoppingBag className='size-4 text-emerald-500' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400'>
                  {counts.buyers.toLocaleString('fa-IR')}
                </span>
                <span className='text-[10px] text-emerald-600/80 dark:text-emerald-400/80'>نفر</span>
              </div>
            </button>

            {/* Admins */}
            <button
              type='button'
              onClick={() => {
                setRoleFilter(roleFilter === 'ADMIN' ? 'ALL' : 'ADMIN')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                roleFilter === 'ADMIN'
                  ? 'bg-primary/10 border-primary/50 shadow-xs ring-1 ring-primary/30'
                  : 'bg-card border-border/70 hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-primary font-medium'>مدیران (Admin)</span>
                <Shield className='size-4 text-primary' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-primary'>
                  {counts.admins.toLocaleString('fa-IR')}
                </span>
                <span className='text-[10px] text-primary/80'>مدیر</span>
              </div>
            </button>

            {/* No Orders */}
            <button
              type='button'
              onClick={() => {
                setOrderFilter(orderFilter === 'NO_ORDERS' ? 'ALL' : 'NO_ORDERS')
                setPage(1)
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                orderFilter === 'NO_ORDERS'
                  ? 'bg-muted/80 border-primary/40 shadow-xs ring-1 ring-primary/20'
                  : 'bg-card border-border/70 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-muted-foreground font-medium'>بدون سفارش</span>
                <UserIcon className='size-4 text-muted-foreground' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                  {counts.noOrders.toLocaleString('fa-IR')}
                </span>
                <span className='text-[10px] text-muted-foreground'>کاربر</span>
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
                    placeholder='جستجو با شماره موبایل، نام یا آیدی تلگرام...'
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

                {/* Role Filter */}
                <div className='flex items-center gap-2 w-full sm:w-auto shrink-0'>
                  <Select
                    value={roleFilter}
                    onValueChange={(val) => {
                      setRoleFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className='w-full sm:w-36 h-10 text-xs rounded-xl bg-background/80 border-border/80'>
                      <SelectValue placeholder='فیلتر نقش' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه نقش‌ها</SelectItem>
                      <SelectItem value='ADMIN'>مدیران (Admin)</SelectItem>
                      <SelectItem value='USER'>کاربران عادی</SelectItem>
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
                  {/* Order Activity Filter */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      سابقه خرید و سفارش:
                    </label>
                    <Select
                      value={orderFilter}
                      onValueChange={(val) => {
                        setOrderFilter(val)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                        <SelectValue placeholder='وضعیت خرید' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ALL'>همه کاربران</SelectItem>
                        <SelectItem value='HAS_ORDERS'>دارای سفارش خرید</SelectItem>
                        <SelectItem value='NO_ORDERS'>بدون سفارش</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      مرتب‌سازی کاربران:
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
                        <SelectItem value='NEWEST'>جدیدترین اعضا</SelectItem>
                        <SelectItem value='OLDEST'>قدیمی‌ترین اعضا</SelectItem>
                        <SelectItem value='MOST_ORDERS'>بیشترین تعداد سفارش</SelectItem>
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
                        <SelectItem value='10'>۱۰ کاربر</SelectItem>
                        <SelectItem value='20'>۲۰ کاربر</SelectItem>
                        <SelectItem value='50'>۵۰ کاربر</SelectItem>
                        <SelectItem value='100'>۱۰۰ کاربر</SelectItem>
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

                  {roleFilter !== 'ALL' && (
                    <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                      نقش: {roleFilter === 'ADMIN' ? 'مدیر' : 'کاربر عادی'}
                      <button onClick={() => setRoleFilter('ALL')} className='hover:text-destructive'>
                        <X className='size-3' />
                      </button>
                    </Badge>
                  )}

                  {orderFilter !== 'ALL' && (
                    <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                      خرید: {orderFilter === 'HAS_ORDERS' ? 'دارای سفارش' : 'بدون سفارش'}
                      <button onClick={() => setOrderFilter('ALL')} className='hover:text-destructive'>
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

          {/* Users Table & Cards View */}
          <Card className='border-border/70 shadow-xs overflow-hidden'>
            <CardHeader className='p-4 sm:p-5 border-b border-border/60 bg-muted/10'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <div>
                  <CardTitle className='text-sm sm:text-base font-bold flex items-center gap-2 text-foreground'>
                    <span>لیست اعضای سیستم</span>
                    <Badge variant='outline' className='text-xs font-sans'>
                      {totalUsers.toLocaleString('fa-IR')} کاربر
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
                <LoadingState message='در حال دریافت اطلاعات کاربران...' />
              ) : users.length === 0 ? (
                <div className='py-16 text-center space-y-3'>
                  <div className='size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground'>
                    <Users className='size-6' aria-hidden='true' />
                  </div>
                  <p className='text-sm font-semibold text-foreground'>کاربری با این مشخصات یافت نشد.</p>
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
                  aria-label='جدول کاربران و مشتریان'
                >
                  <table className='w-full min-w-[950px] text-xs text-start'>
                    <thead>
                      <tr className='border-b border-border/60 bg-muted/30 text-muted-foreground font-medium'>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[180px]'>کاربر</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[150px]'>شماره موبایل</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[120px]'>نقش</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[120px]'>تعداد سفارش</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[140px]'>مجموع خرید</th>
                        <th className='py-3.5 px-4 text-start whitespace-nowrap min-w-[160px]'>تاریخ عضویت</th>
                        <th className='py-3.5 px-4 text-end whitespace-nowrap min-w-[100px]'>عملیات</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/40'>
                      {users.map((u) => (
                        <tr key={u.id} className='hover:bg-muted/40 transition-colors group cursor-default'>
                          {/* User */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[180px]'>
                            <div className='flex items-center gap-2.5'>
                              <div className='size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0'>
                                {u.name?.trim() ? u.name.trim().charAt(0) : <UserIcon className='size-4' />}
                              </div>
                              <div className='min-w-0'>
                                <span className='font-bold block text-foreground'>
                                  {u.name || 'بدون نام'}
                                </span>
                                {u.telegramUsername && (
                                  <span className='text-[10px] text-sky-600 dark:text-sky-400 font-sans block truncate'>
                                    @{u.telegramUsername}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[150px] font-sans'>
                            {u.phone ? (
                              <div className='flex items-center gap-1.5 text-foreground font-medium'>
                                <span>{u.phone}</span>
                                <button
                                  type='button'
                                  onClick={() => handleCopyText(u.phone!, u.id, 'شماره همراه کپی شد.')}
                                  className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground'
                                  title='کپی شماره'
                                >
                                  {copiedId === u.id ? (
                                    <Check className='size-3 text-primary' />
                                  ) : (
                                    <Copy className='size-3' />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className='text-muted-foreground'>—</span>
                            )}
                          </td>

                          {/* Role */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[120px]'>
                            {u.role === 'ADMIN' ? (
                              <Badge className='bg-primary/15 text-primary border-primary/30 text-[10px] gap-1 font-semibold'>
                                <Shield className='size-2.5 text-primary' />
                                مدیر سیستم
                              </Badge>
                            ) : (
                              <Badge variant='outline' className='text-muted-foreground text-[10px]'>
                                کاربر عادی
                              </Badge>
                            )}
                          </td>

                          {/* Orders Count */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[120px] font-sans font-bold text-foreground'>
                            {u.totalOrders.toLocaleString('fa-IR')} سفارش
                          </td>

                          {/* Total Spent */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[140px] font-sans font-bold text-foreground'>
                            {u.totalSpent > 0 ? (
                              <span className='text-primary'>{formatPrice(u.totalSpent)}</span>
                            ) : (
                              <span className='text-muted-foreground'>۰ تومان</span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td className='py-3.5 px-4 whitespace-nowrap min-w-[160px] text-muted-foreground text-[11px]'>
                            <span className='block text-foreground font-semibold'>
                              {formatRelativeTime(u.createdAt)}
                            </span>
                            <span className='text-[10px] text-muted-foreground font-sans block mt-0.5'>
                              {formatDate(u.createdAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className='py-3.5 px-4 text-end whitespace-nowrap min-w-[100px]'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleOpenUserDetail(u.id)}
                              className='h-7 px-2.5 text-[11px] gap-1 rounded-lg border-border hover:bg-muted'
                            >
                              <Eye className='size-3' />
                              <span>جزئیات</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Mobile Cards View */
                <div className='p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className='rounded-xl border border-border/70 p-3.5 bg-card hover:border-primary/40 transition-all space-y-3'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0'>
                            {u.name?.trim() ? u.name.trim().charAt(0) : <UserIcon className='size-4' />}
                          </div>
                          <div>
                            <span className='font-bold text-xs text-foreground block'>
                              {u.name || 'کاربر بدون نام'}
                            </span>
                            {u.telegramUsername && (
                              <span className='text-[10px] text-sky-600 font-sans block'>
                                @{u.telegramUsername}
                              </span>
                            )}
                          </div>
                        </div>

                        {u.role === 'ADMIN' ? (
                          <Badge className='bg-primary/15 text-primary border-primary/30 text-[9px] gap-1'>
                            <Shield className='size-2.5' />
                            مدیر
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='text-[9px] text-muted-foreground'>
                            کاربر
                          </Badge>
                        )}
                      </div>

                      <div className='flex items-center justify-between text-xs pt-1 border-t border-border/40'>
                        <span className='text-muted-foreground'>شماره همراه:</span>
                        <span className='font-sans font-bold text-foreground'>{u.phone || '—'}</span>
                      </div>

                      <div className='flex items-center justify-between text-xs'>
                        <span className='text-muted-foreground'>مجموع خرید ({u.totalOrders} سفارش):</span>
                        <span className='font-sans font-bold text-primary'>{formatPrice(u.totalSpent)}</span>
                      </div>

                      <div className='flex items-center justify-between text-[10px] text-muted-foreground pt-1'>
                        <span>عضویت:</span>
                        <span className='font-sans'>{formatDate(u.createdAt)}</span>
                      </div>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleOpenUserDetail(u.id)}
                        className='w-full text-xs h-8 gap-1 font-semibold rounded-lg'
                      >
                        <Eye className='size-3.5' />
                        <span>مشاهده پروفایل و تاریخچه سفارش‌ها</span>
                      </Button>
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
                      {Math.min(page * limit, totalUsers).toLocaleString('fa-IR')}
                    </span>{' '}
                    از{' '}
                    <span className='font-bold font-sans text-foreground'>
                      {totalUsers.toLocaleString('fa-IR')}
                    </span>{' '}
                    کاربر
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

      {/* User Detail Dialog */}
      <Dialog
        open={Boolean(selectedUserId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserId(null)
            setUserDetail(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl'>
          <DialogHeader className='text-start pb-3 border-b border-border/60'>
            <DialogTitle className='text-base sm:text-lg font-bold flex items-center gap-2 text-foreground'>
              <UserIcon className='size-5 text-primary' />
              <span>پروفایل و تاریخچه سفارش‌های کاربر</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              بررسی کامل اطلاعات، سوابق خرید و مدیریت دسترسی کاربر
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !userDetail ? (
            <div className='flex items-center justify-center py-16'>
              <Loader2 className='size-8 animate-spin text-primary' />
            </div>
          ) : (
            <div className='space-y-4 pt-2 text-xs'>
              {/* Profile Summary Card */}
              <div className='rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div>
                    <h3 className='text-base font-bold text-foreground'>
                      {userDetail.name || 'کاربر بدون نام'}
                    </h3>
                    <div className='flex items-center gap-3 text-muted-foreground text-xs mt-1'>
                      {userDetail.phone && (
                        <span className='font-sans flex items-center gap-1'>
                          <Phone className='size-3 text-muted-foreground' />
                          {userDetail.phone}
                        </span>
                      )}
                      {userDetail.telegramUsername && (
                        <a
                          href={`https://t.me/${userDetail.telegramUsername}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sky-600 dark:text-sky-400 font-sans hover:underline flex items-center gap-0.5'
                        >
                          @{userDetail.telegramUsername}
                          <ExternalLink className='size-3' />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className='flex items-center gap-2'>
                    <span className='text-[11px] text-muted-foreground font-medium'>نقش دسترسی:</span>
                    <Select
                      value={userDetail.role}
                      onValueChange={(val: 'ADMIN' | 'USER') => handleUpdateRole(val)}
                      disabled={updatingRole}
                    >
                      <SelectTrigger className='h-8 w-28 text-xs font-semibold rounded-lg bg-background'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='USER'>کاربر عادی</SelectItem>
                        <SelectItem value='ADMIN'>مدیر سیستم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/40 text-[11px]'>
                  <div>
                    <span className='text-muted-foreground block text-[10px]'>تاریخ عضویت:</span>
                    <span className='font-semibold text-foreground'>{formatDate(userDetail.createdAt)}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[10px]'>تعداد کل سفارش‌ها:</span>
                    <span className='font-bold text-foreground font-sans'>
                      {userDetail.orders?.length || 0} سفارش
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[10px]'>مجموع خریدهای موفق:</span>
                    <span className='font-bold text-primary font-sans'>
                      {formatPrice(userDetail.totalSpent)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Orders History List */}
              <div className='space-y-2'>
                <h4 className='font-bold text-foreground text-xs flex items-center gap-1.5'>
                  <ShoppingBag className='size-3.5 text-primary' />
                  <span>تاریخچه سفارش‌های ثبت‌شده ({userDetail.orders?.length || 0}):</span>
                </h4>

                {!userDetail.orders || userDetail.orders.length === 0 ? (
                  <div className='py-8 text-center text-xs text-muted-foreground rounded-xl border border-dashed'>
                    هنوز هیچ سفارشی توسط این کاربر ثبت نشده است.
                  </div>
                ) : (
                  <div className='space-y-2 max-h-60 overflow-y-auto pr-1'>
                    {userDetail.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className='p-3 rounded-xl border border-border/60 bg-card hover:border-border transition-colors flex items-center justify-between gap-3 text-xs'
                      >
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='font-bold text-foreground'>
                              {ord.plan?.product?.title || ord.plan?.product?.name || 'محصول'}
                            </span>
                            <span className='text-muted-foreground text-[10px]'>({ord.plan?.name})</span>
                          </div>
                          <div className='flex items-center gap-3 text-[10px] text-muted-foreground mt-1'>
                            <span className='font-mono'>#{ord.id.slice(-6).toUpperCase()}</span>
                            <span>{formatDate(ord.createdAt)}</span>
                            {ord.payment?.refId && (
                              <span className='font-sans text-primary'>RefId: {ord.payment.refId}</span>
                            )}
                          </div>
                        </div>

                        <div className='text-end shrink-0'>
                          <span className='font-bold text-foreground font-sans block'>
                            {formatPrice(ord.amount)}
                          </span>
                          <Badge
                            variant='outline'
                            className={`text-[9px] mt-1 ${
                              ord.status === 'COMPLETED'
                                ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                                : ord.status === 'PAID'
                                  ? 'border-amber-500/30 text-amber-600 bg-amber-500/10'
                                  : 'border-border text-muted-foreground'
                            }`}
                          >
                            {ord.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
