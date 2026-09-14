'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ExternalLink,
  Star,
  Trash2,
  Eye,
  Table as TableIcon,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  X,
  User as UserIcon,
  Sparkles,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { formatPersianDate, toPersianDigits } from '@/lib/persian-utils'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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

interface AdminReviewItem {
  id: string
  productId: string
  userId: string | null
  userName: string
  rating: number
  comment: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  isFeatured: boolean
  adminNote: string | null
  createdAt: string
  updatedAt: string
  product: {
    id: string
    title: string
    slug: string
    image: string | null
  }
  user?: {
    id: string
    name: string | null
    phone: string | null
    telegramUsername: string | null
  } | null
}

interface ReviewCounts {
  pending: number
  approved: number
  rejected: number
  featured?: number
  total: number
}

function formatDate(dateStr: string): string {
  return formatPersianDate(dateStr, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([])
  const [counts, setCounts] = useState<ReviewCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  // Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // UI state
  const isMobile = useIsMobile()
  const [userViewMode, setUserViewMode] = useState<'table' | 'cards' | null>(null)
  const viewMode = userViewMode ?? (isMobile ? 'cards' : 'table')
  const [selectedReview, setSelectedReview] = useState<AdminReviewItem | null>(null)
  const [adminNoteInput, setAdminNoteInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (search.trim()) params.set('search', search.trim())
      params.set('page', page.toString())
      params.set('limit', limit.toString())

      const res = await fetch(`/api/admin/reviews?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setReviews(data.reviews || [])
        setCounts(data.counts || null)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalReviews(data.pagination?.total || 0)
      } else {
        toast.error(data.error || 'خطا در بارگذاری نظرات.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page, limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews()
  }, [fetchReviews])

  const handleOpenReview = (review: AdminReviewItem) => {
    setSelectedReview(review)
    setAdminNoteInput(review.adminNote || '')
  }

  const handleUpdateStatus = async (reviewId: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING', note?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          status: newStatus,
          adminNote: note !== undefined ? note : adminNoteInput,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setSelectedReview(null)
        fetchReviews()
      } else {
        toast.error(data.error || 'خطا در به‌روزرسانی نظر.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleFeatured = async (reviewId: string, currentFeatured: boolean, currentStatus?: string) => {
    if (!currentFeatured && currentStatus && currentStatus !== 'APPROVED') {
      toast.error('تنها نظرات تاییدشده می‌توانند به عنوان نظر برتر انتخاب شوند. لطفاً ابتدا نظر را تایید کنید.')
      return
    }

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          isFeatured: !currentFeatured,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, isFeatured: !currentFeatured } : r))
        )
        if (selectedReview?.id === reviewId) {
          setSelectedReview((prev) => (prev ? { ...prev, isFeatured: !currentFeatured } : null))
        }
        fetchReviews()
      } else {
        toast.error(data.error || 'خطا در تغییر وضعیت نظر برتر.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?id=${deleteTargetId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setDeleteTargetId(null)
        if (selectedReview?.id === deleteTargetId) {
          setSelectedReview(null)
        }
        fetchReviews()
      } else {
        toast.error(data.error || 'خطا در حذف نظر.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setActionLoading(false)
    }
  }

  const renderStatusBadge = (status: AdminReviewItem['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant='outline' className='gap-1 border-primary/30 bg-primary/10 text-primary text-[11px] font-medium'>
            <Clock className='size-3 shrink-0' />
            در انتظار بررسی
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant='outline' className='gap-1 border-border/80 bg-muted/60 text-foreground text-[11px] font-medium'>
            <CheckCircle2 className='size-3 shrink-0 text-primary' />
            تایید شده
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant='outline' className='gap-1 border-destructive/30 bg-destructive/10 text-destructive text-[11px] font-medium'>
            <XCircle className='size-3 shrink-0' />
            رد شده
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2 min-w-0'>
          <h1 className='text-sm sm:text-base font-bold flex items-center gap-2 truncate'>
            <MessageSquare className='size-4 text-primary shrink-0' />
            <span className='truncate'>مدیریت نظرات کاربران</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchReviews}
            disabled={loading}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-col gap-5 sm:gap-6 p-3 sm:p-6'>
        <div className='flex flex-col gap-5 sm:gap-6 w-full min-w-0'>

          {/* Metric KPI Cards */}
          {counts && (
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5'>
              {/* Pending */}
              <Card
                className={`cursor-pointer transition-all border shadow-xs ${
                  statusFilter === 'PENDING'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-primary/20 bg-primary/5 hover:border-primary/40'
                }`}
                onClick={() => {
                  startTransition(() => {
                    setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')
                    setPage(1)
                  })
                }}
              >
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex items-center justify-between text-[11px] sm:text-xs text-primary font-medium'>
                    <span className='truncate'>در انتظار بررسی</span>
                    <Clock className='size-3.5 shrink-0 opacity-80' />
                  </div>
                  <div className='text-xl sm:text-2xl font-bold text-primary mt-1.5 font-sans'>
                    {toPersianDigits(counts.pending)}
                  </div>
                  <p className='text-[10px] text-muted-foreground mt-0.5'>نیازمند تصمیم ادمین</p>
                </CardContent>
              </Card>

              {/* Approved */}
              <Card
                className={`cursor-pointer transition-all border shadow-xs ${
                  statusFilter === 'APPROVED'
                    ? 'border-primary ring-2 ring-primary/20 bg-muted/30'
                    : 'border-border/70 hover:border-border bg-card'
                }`}
                onClick={() => {
                  startTransition(() => {
                    setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')
                    setPage(1)
                  })
                }}
              >
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground font-medium'>
                    <span className='truncate'>تایید شده</span>
                    <CheckCircle2 className='size-3.5 shrink-0 text-primary' />
                  </div>
                  <div className='text-xl sm:text-2xl font-bold text-foreground mt-1.5 font-sans'>
                    {toPersianDigits(counts.approved)}
                  </div>
                  <p className='text-[10px] text-muted-foreground mt-0.5'>نمایش در صفحه محصول</p>
                </CardContent>
              </Card>

              {/* Featured (Top Reviews) */}
              <Card
                className={`cursor-pointer transition-all border shadow-xs ${
                  statusFilter === 'FEATURED'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10'
                    : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                }`}
                onClick={() => {
                  startTransition(() => {
                    setStatusFilter(statusFilter === 'FEATURED' ? 'ALL' : 'FEATURED')
                    setPage(1)
                  })
                }}
              >
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex items-center justify-between text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium'>
                    <span className='truncate'>نظرات برتر (لندینگ)</span>
                    <Sparkles className='size-3.5 shrink-0 text-amber-500' />
                  </div>
                  <div className='text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5 font-sans'>
                    {toPersianDigits(counts.featured ?? 0)}
                    <span className='text-xs font-normal text-muted-foreground ms-1'>/ ۱۲</span>
                  </div>
                  <p className='text-[10px] text-muted-foreground mt-0.5'>نمایش در انتهای لندینگ</p>
                </CardContent>
              </Card>

              {/* Rejected */}
              <Card
                className={`cursor-pointer transition-all border shadow-xs ${
                  statusFilter === 'REJECTED'
                    ? 'border-destructive ring-2 ring-destructive/20 bg-destructive/5'
                    : 'border-border/60 hover:border-destructive/30 bg-card'
                }`}
                onClick={() => {
                  startTransition(() => {
                    setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')
                    setPage(1)
                  })
                }}
              >
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex items-center justify-between text-[11px] sm:text-xs text-destructive font-medium'>
                    <span className='truncate'>رد شده</span>
                    <XCircle className='size-3.5 shrink-0 opacity-80' />
                  </div>
                  <div className='text-xl sm:text-2xl font-bold text-destructive mt-1.5 font-sans'>
                    {toPersianDigits(counts.rejected)}
                  </div>
                  <p className='text-[10px] text-muted-foreground mt-0.5'>مخفی از کاربران</p>
                </CardContent>
              </Card>

              {/* Total */}
              <Card
                className={`cursor-pointer transition-all border shadow-xs col-span-2 sm:col-span-1 ${
                  statusFilter === 'ALL'
                    ? 'border-primary ring-2 ring-primary/20 bg-muted/40'
                    : 'border-border/60 hover:border-border bg-card'
                }`}
                onClick={() => {
                  startTransition(() => {
                    setStatusFilter('ALL')
                    setPage(1)
                  })
                }}
              >
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground font-medium'>
                    <span className='truncate'>کل نظرات</span>
                    <MessageSquare className='size-3.5 shrink-0 text-muted-foreground' />
                  </div>
                  <div className='text-xl sm:text-2xl font-bold text-foreground mt-1.5 font-sans'>
                    {toPersianDigits(counts.total)}
                  </div>
                  <p className='text-[10px] text-muted-foreground mt-0.5'>تمام بازخوردها</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filter and Search Bar */}
          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3'>
              {/* Search & Status Filter */}
              <div className='flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0'>
                <div className='relative flex-1 min-w-[200px]'>
                  <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none' />
                  <Input
                    placeholder='جستجو در متن نظر، کاربر یا محصول...'
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className='ps-9 pe-8 h-9 text-xs'
                  />
                  {search && (
                    <button
                      onClick={() => {
                        setSearch('')
                        setPage(1)
                      }}
                      className='absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                      aria-label='پاک کردن جستجو'
                    >
                      <X className='size-3.5' />
                    </button>
                  )}
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className='w-full sm:w-48 h-9 text-xs'>
                    <SelectValue placeholder='وضعیت نظر' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                    <SelectItem value='FEATURED'>نظرات برتر (لندینگ)</SelectItem>
                    <SelectItem value='PENDING'>در انتظار بررسی</SelectItem>
                    <SelectItem value='APPROVED'>تایید شده</SelectItem>
                    <SelectItem value='REJECTED'>رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Switcher & Result Count */}
              <div className='flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40'>
                <span className='text-xs text-muted-foreground font-sans'>
                  {toPersianDigits(totalReviews)} نظر
                </span>
                <div className='flex items-center gap-1 border border-border/60 rounded-lg p-0.5 bg-muted/20'>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size='sm'
                    className='h-7 w-7 p-0'
                    onClick={() => setUserViewMode('table')}
                    title='نمای جدول'
                  >
                    <TableIcon className='size-3.5' />
                  </Button>
                  <Button
                    variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                    size='sm'
                    className='h-7 w-7 p-0'
                    onClick={() => setUserViewMode('cards')}
                    title='نمای کارتی'
                  >
                    <LayoutGrid className='size-3.5' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Content */}
          <Card className='border-border/60 shadow-xs overflow-hidden'>
            <CardHeader className='p-4 sm:p-5 pb-2 sm:pb-3'>
              <CardTitle className='text-sm sm:text-base font-bold'>لیست نظرات</CardTitle>
              <CardDescription className='text-xs'>
                بررسی متن نظر و تصمیم‌گیری جهت نمایش یا عدم نمایش در صفحه اختصاصی محصول
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              {loading ? (
                <div className='flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground'>
                  <Loader2 className='size-7 animate-spin text-primary' />
                  <span className='text-xs'>در حال بارگذاری نظرات...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className='py-16 text-center text-xs text-muted-foreground'>
                  هیچ نظری در این بخش یافت نشد.
                </div>
              ) : viewMode === 'table' ? (
                /* Desktop Table View */
                <div className='overflow-x-auto min-w-full'>
                  <table className='w-full text-xs text-start border-collapse'>
                    <thead>
                      <tr className='border-y border-border/60 bg-muted/30 text-muted-foreground'>
                        <th className='p-3 sm:px-4 text-start font-medium'>کاربر</th>
                        <th className='p-3 sm:px-4 text-start font-medium'>محصول</th>
                        <th className='p-3 sm:px-4 text-start font-medium'>امتیاز</th>
                        <th className='p-3 sm:px-4 text-start font-medium min-w-[200px]'>متن نظر</th>
                        <th className='p-3 sm:px-4 text-start font-medium'>وضعیت</th>
                        <th className='p-3 sm:px-4 text-center font-medium whitespace-nowrap'>نظر برتر (لندینگ)</th>
                        <th className='p-3 sm:px-4 text-start font-medium whitespace-nowrap'>تاریخ ثبت</th>
                        <th className='p-3 sm:px-4 text-center font-medium'>عملیات</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/40'>
                      {reviews.map((r) => (
                        <tr key={r.id} className='hover:bg-muted/20 transition-colors'>
                          {/* User */}
                          <td className='p-3 sm:px-4 align-top'>
                            <div className='flex items-center gap-2'>
                              <div className='size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0'>
                                {r.userName.slice(0, 1) || <UserIcon className='size-3.5' />}
                              </div>
                              <div className='min-w-0'>
                                <div className='font-medium text-foreground truncate max-w-[130px]'>
                                  {r.userName}
                                </div>
                                {r.user?.phone && (
                                  <div className='text-[10px] text-muted-foreground font-sans'>
                                    {toPersianDigits(r.user.phone)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Product */}
                          <td className='p-3 sm:px-4 align-top'>
                            <Link
                              href={`/products/${r.product.slug}`}
                              target='_blank'
                              className='group inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors max-w-[150px] truncate'
                            >
                              <span className='truncate'>{r.product.title}</span>
                              <ExternalLink className='size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity' />
                            </Link>
                          </td>

                          {/* Rating */}
                          <td className='p-3 sm:px-4 align-top whitespace-nowrap'>
                            <div className='flex items-center gap-1'>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3 ${
                                    i < r.rating
                                      ? 'text-primary fill-primary'
                                      : 'text-muted-foreground/30 fill-muted-foreground/10'
                                  }`}
                                />
                              ))}
                              <span className='text-[10px] text-muted-foreground font-sans ms-0.5'>
                                ({toPersianDigits(r.rating)})
                              </span>
                            </div>
                          </td>

                          {/* Comment */}
                          <td className='p-3 sm:px-4 align-top'>
                            <p className='text-xs text-foreground/90 line-clamp-2 leading-relaxed max-w-sm break-words'>
                              {r.comment}
                            </p>
                            {r.adminNote && (
                              <div className='mt-1 text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded border border-border/40'>
                                <span className='font-medium'>یادداشت ادمین: </span>
                                <span>{r.adminNote}</span>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className='p-3 sm:px-4 align-top whitespace-nowrap'>
                            {renderStatusBadge(r.status)}
                          </td>

                          {/* Top Review Toggle (Featured) */}
                          <td className='p-3 sm:px-4 align-top text-center whitespace-nowrap'>
                            <button
                              type='button'
                              onClick={() => handleToggleFeatured(r.id, r.isFeatured, r.status)}
                              disabled={actionLoading}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shadow-2xs ${
                                r.isFeatured
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/25 ring-1 ring-amber-500/20'
                                  : 'bg-muted/40 text-muted-foreground border border-border/60 hover:text-foreground hover:bg-muted/80'
                              }`}
                              title={
                                r.isFeatured
                                  ? 'برای حذف از نظرات برتر کلیک کنید'
                                  : r.status === 'APPROVED'
                                    ? 'برای انتخاب به عنوان نظر برتر در صفحه اصلی کلیک کنید'
                                    : 'تنها پس از تایید، می‌توان نظر را برگزیده کرد'
                              }
                            >
                              <Star
                                className={`size-3.5 transition-transform ${
                                  r.isFeatured ? 'fill-amber-500 text-amber-500 scale-110' : 'text-muted-foreground/50'
                                }`}
                              />
                              <span>{r.isFeatured ? 'برگزیده' : 'افزودن به برتر'}</span>
                            </button>
                          </td>

                          {/* Date */}
                          <td className='p-3 sm:px-4 align-top whitespace-nowrap text-[11px] text-muted-foreground font-sans'>
                            {formatDate(r.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className='p-3 sm:px-4 align-top text-center'>
                            <div className='flex items-center justify-center gap-1'>
                              {r.status !== 'APPROVED' && (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='h-7 px-2 text-[11px] text-primary border-primary/30 hover:bg-primary/10'
                                  onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                                  title='تایید نظر'
                                >
                                  <CheckCircle2 className='size-3.5 me-1' />
                                  تایید
                                </Button>
                              )}
                              {r.status !== 'REJECTED' && (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='h-7 px-2 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10'
                                  onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                                  title='رد نظر'
                                >
                                  <XCircle className='size-3.5 me-1' />
                                  رد
                                </Button>
                              )}
                              <Button
                                variant='ghost'
                                size='sm'
                                className={`h-7 w-7 p-0 ${r.isFeatured ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => handleToggleFeatured(r.id, r.isFeatured)}
                                title={r.isFeatured ? 'حذف از برگزیده‌ها' : 'علامت‌گذاری به عنوان برگزیده'}
                              >
                                <Star className={`size-3.5 ${r.isFeatured ? 'fill-primary' : ''}`} />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0 text-muted-foreground hover:text-foreground'
                                onClick={() => handleOpenReview(r)}
                                title='مشاهده جزئیات'
                              >
                                <Eye className='size-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0 text-muted-foreground hover:text-destructive'
                                onClick={() => setDeleteTargetId(r.id)}
                                title='حذف نظر'
                              >
                                <Trash2 className='size-3.5' />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Mobile Card View */
                <div className='p-3 sm:p-4 space-y-3'>
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className='p-3.5 rounded-xl border border-border/60 bg-card space-y-3 text-xs'
                    >
                      {/* Top Row: User + Status */}
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <div className='size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0'>
                            {r.userName.slice(0, 1) || <UserIcon className='size-4' />}
                          </div>
                          <div>
                            <div className='font-medium text-foreground'>{r.userName}</div>
                            <div className='text-[10px] text-muted-foreground font-sans'>
                              {formatDate(r.createdAt)}
                            </div>
                          </div>
                        </div>
                        {renderStatusBadge(r.status)}
                      </div>

                      {/* Product & Rating */}
                      <div className='flex items-center justify-between gap-2 pt-1 border-t border-border/30 text-[11px]'>
                        <Link
                          href={`/products/${r.product.slug}`}
                          target='_blank'
                          className='text-foreground hover:text-primary font-medium truncate flex items-center gap-1'
                        >
                          <span className='truncate'>{r.product.title}</span>
                          <ExternalLink className='size-3 shrink-0' />
                        </Link>
                        <div className='flex items-center gap-0.5 shrink-0'>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3 ${
                                i < r.rating
                                  ? 'text-primary fill-primary'
                                  : 'text-muted-foreground/30 fill-muted-foreground/10'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <div className='bg-muted/20 p-2.5 rounded-lg border border-border/40 text-foreground/90 leading-relaxed break-words'>
                        {r.comment}
                      </div>

                      {r.adminNote && (
                        <div className='text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/40'>
                          <span className='font-medium'>یادداشت ادمین: </span>
                          <span>{r.adminNote}</span>
                        </div>
                      )}

                      {/* Featured Top Review Toggle for mobile */}
                      <div className='flex items-center justify-between p-2 rounded-lg border border-border/40 bg-muted/20 text-[11px]'>
                        <span className='flex items-center gap-1.5 text-muted-foreground'>
                          <Star className={`size-3.5 ${r.isFeatured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/60'}`} />
                          <span>نظر برتر (لندینگ):</span>
                        </span>
                        <button
                          type='button'
                          onClick={() => handleToggleFeatured(r.id, r.isFeatured, r.status)}
                          disabled={actionLoading}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                            r.isFeatured
                              ? 'bg-amber-500 text-white shadow-2xs hover:bg-amber-600'
                              : 'bg-background border border-border/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span>{r.isFeatured ? 'برگزیده (فعال)' : 'افزودن به برتر'}</span>
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className='flex items-center justify-end gap-2 pt-1 border-t border-border/30'>
                        {r.status !== 'APPROVED' && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-7 px-2.5 text-[11px] text-primary border-primary/30 hover:bg-primary/10'
                            onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                          >
                            <CheckCircle2 className='size-3.5 me-1' />
                            تایید
                          </Button>
                        )}
                        {r.status !== 'REJECTED' && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-7 px-2.5 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10'
                            onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                          >
                            <XCircle className='size-3.5 me-1' />
                            رد
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 w-7 p-0 text-muted-foreground hover:text-foreground'
                          onClick={() => handleOpenReview(r)}
                        >
                          <Eye className='size-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 w-7 p-0 text-muted-foreground hover:text-destructive'
                          onClick={() => setDeleteTargetId(r.id)}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className='p-3 sm:p-4 border-t border-border/40 flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground font-sans'>
                    صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
                  </span>
                  <div className='flex items-center gap-1.5'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 w-8 p-0'
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronRight className='size-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 w-8 p-0'
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronLeft className='size-4' />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>

      {/* Review Detail & Action Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <MessageSquare className='size-4 text-primary shrink-0' />
              بررسی و تعیین وضعیت نظر
            </DialogTitle>
            <DialogDescription className='text-xs'>
              مشاهده متن کامل نظر، مشخصات کاربر و ثبت وضعیت تایید یا رد
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className='space-y-4 text-xs py-2'>
              {/* Product Info */}
              <div className='p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5'>
                <div className='text-muted-foreground text-[11px]'>محصول مربوطه:</div>
                <div className='font-bold text-foreground flex items-center justify-between'>
                  <span>{selectedReview.product.title}</span>
                  <Link
                    href={`/products/${selectedReview.product.slug}`}
                    target='_blank'
                    className='text-primary hover:underline inline-flex items-center gap-1 text-[11px]'
                  >
                    <span>صفحه محصول</span>
                    <ExternalLink className='size-3' />
                  </Link>
                </div>
              </div>

              {/* Author & Rating */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='p-3 rounded-lg border border-border/50 bg-card'>
                  <div className='text-muted-foreground text-[11px]'>نویسنده نظر:</div>
                  <div className='font-medium text-foreground mt-1'>{selectedReview.userName}</div>
                  {selectedReview.user?.phone && (
                    <div className='text-[10px] text-muted-foreground font-sans mt-0.5'>
                      شماره: {toPersianDigits(selectedReview.user.phone)}
                    </div>
                  )}
                </div>

                <div className='p-3 rounded-lg border border-border/50 bg-card'>
                  <div className='text-muted-foreground text-[11px]'>امتیاز ثبت‌شده:</div>
                  <div className='flex items-center gap-1 mt-1'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${
                          i < selectedReview.rating
                            ? 'text-primary fill-primary'
                            : 'text-muted-foreground/30 fill-muted-foreground/10'
                        }`}
                      />
                    ))}
                    <span className='font-bold text-foreground ms-1 font-sans'>
                      {toPersianDigits(selectedReview.rating)} از ۵
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Comment */}
              <div className='space-y-1.5'>
                <div className='font-medium text-foreground'>متن نظر کاربر:</div>
                <div className='p-3 rounded-lg border border-border/60 bg-muted/10 leading-relaxed text-foreground whitespace-pre-wrap break-words'>
                  {selectedReview.comment}
                </div>
              </div>

              {/* Featured Review Toggle Card in Modal */}
              <div className={`p-3 rounded-lg border transition-all ${
                selectedReview.isFeatured
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-border/60 bg-muted/20'
              }`}>
                <div className='flex items-center justify-between gap-3'>
                  <div className='space-y-0.5'>
                    <div className='font-medium text-foreground flex items-center gap-1.5 text-xs'>
                      <Star className={`size-4 ${selectedReview.isFeatured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                      <span>نمایش به عنوان نظر برتر در لندینگ‌پیج</span>
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      {selectedReview.status !== 'APPROVED'
                        ? 'تنها پس از تایید نظر، می‌توانید آن را به عنوان نظر برتر انتخاب کنید.'
                        : 'با فعال‌سازی، این نظر در لیست متحرک نظرات برتر انتهای لندینگ نمایش داده می‌شود.'}
                    </p>
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    variant={selectedReview.isFeatured ? 'default' : 'outline'}
                    disabled={actionLoading || selectedReview.status !== 'APPROVED'}
                    className={`h-8 px-3 text-xs shrink-0 ${
                      selectedReview.isFeatured
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-none shadow-2xs'
                        : 'border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                    }`}
                    onClick={() => handleToggleFeatured(selectedReview.id, selectedReview.isFeatured, selectedReview.status)}
                  >
                    {selectedReview.isFeatured ? 'خروج از نظرات برتر' : 'تیک نظر برتر'}
                  </Button>
                </div>
              </div>

              {/* Admin Note Input */}
              <div className='space-y-1.5'>
                <label className='font-medium text-foreground block'>یادداشت مدیر (اختیاری):</label>
                <Textarea
                  placeholder='یادداشت داخلی یا دلیل رد/تایید...'
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  className='h-20 text-xs'
                />
              </div>

              {/* Current Status */}
              <div className='flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20'>
                <span className='text-muted-foreground'>وضعیت فعلی:</span>
                {renderStatusBadge(selectedReview.status)}
              </div>
            </div>
          )}

          <DialogFooter className='flex-col sm:flex-row gap-2 pt-2'>
            <div className='flex-1 flex items-center justify-start'>
              {selectedReview && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-destructive hover:bg-destructive/10 text-xs h-8'
                  onClick={() => setDeleteTargetId(selectedReview.id)}
                  disabled={actionLoading}
                >
                  <Trash2 className='size-3.5 me-1' />
                  حذف نظر
                </Button>
              )}
            </div>
            <div className='flex items-center gap-2'>
              {selectedReview?.status !== 'REJECTED' && (
                <Button
                  variant='outline'
                  size='sm'
                  className='text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-8'
                  onClick={() => selectedReview && handleUpdateStatus(selectedReview.id, 'REJECTED')}
                  disabled={actionLoading}
                >
                  <XCircle className='size-3.5 me-1' />
                  رد نظر
                </Button>
              )}
              {selectedReview?.status !== 'APPROVED' && (
                <Button
                  size='sm'
                  className='text-xs h-8'
                  onClick={() => selectedReview && handleUpdateStatus(selectedReview.id, 'APPROVED')}
                  disabled={actionLoading}
                >
                  <CheckCircle2 className='size-3.5 me-1' />
                  تایید و انتشار
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-sm sm:text-base font-bold'>
              آیا از حذف این نظر اطمینان دارید؟
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              این عملیات غیرقابل بازگشت است و نظر به صورت کامل از پایگاه داده حذف خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='text-xs h-8'>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8'
              onClick={handleDelete}
            >
              حذف قطعی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
