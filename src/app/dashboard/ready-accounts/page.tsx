'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Archive,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Trash2,
  X,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatPersianDate, toPersianDigits } from '@/lib/persian-utils'
import { AddAccountDialog, type ProductOption } from './add-account-dialog'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface InventoryAccount {
  id: string
  type: 'PRE_CREATED_ACCOUNT'
  status: 'AVAILABLE' | 'RESERVED' | 'USED' | 'INVALID'
  data: {
    email?: string
    username?: string
    password?: string
    recoveryEmail?: string
    note?: string
  }
  productId?: string | null
  planId?: string | null
  orderId?: string | null
  assignedAt?: string | null
  usedAt?: string | null
  createdAt: string
  product?: { id: string; title: string; slug: string } | null
  plan?: { id: string; name: string } | null
  order?: { id: string; user?: { phone?: string | null; name?: string | null } } | null
}

interface InventoryResponse {
  success: boolean
  items: InventoryAccount[]
  stats: { total: number; available: number; used: number }
}

// ─── Status Badge Helper ────────────────────────────────────────────────────────
function getStatusBadge(status: string) {
  switch (status) {
    case 'AVAILABLE':
      return { label: 'آزاد', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 }
    case 'RESERVED':
      return { label: 'رزرو شده', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', icon: Clock }
    case 'USED':
      return { label: 'استفاده شده', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30', icon: Check }
    default:
      return { label: 'نامعتبر', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30', icon: XCircle }
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReadyAccountsPage() {
  const [accounts, setAccounts] = useState<InventoryAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, available: 0, used: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [productFilter, setProductFilter] = useState('ALL')

  // Products & Plans
  const [products, setProducts] = useState<ProductOption[]>([])

  // Modal
  const [addOpen, setAddOpen] = useState(false)

  // Copy
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Password visibility per row
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = (v: string) => {
    setSearch(v)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(v), 350)
  }

  // Fetch products for add modal
  useEffect(() => {
    fetch('/api/admin/products?limit=100')
      .then(r => r.json())
      .then(d => { if (d.products) setProducts(d.products) })
      .catch(() => {})
  }, [])

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'PRE_CREATED_ACCOUNT' })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (productFilter !== 'ALL') params.set('productId', productFilter)

      const res = await fetch(`/api/admin/inventory?${params}`)
      const data: InventoryResponse = await res.json()
      if (data.success) {
        setAccounts(data.items || [])
        setStats(data.stats || { total: 0, available: 0, used: 0 })
      } else {
        toast.error('خطا در دریافت اطلاعات انبار.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, productFilter])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  // Client-side search filter
  const filteredAccounts = accounts.filter(acc => {
    if (!debouncedSearch) return true
    const email = acc.data?.email || acc.data?.username || ''
    return email.toLowerCase().includes(debouncedSearch.toLowerCase())
  })

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این اکانت از انبار اطمینان دارید؟')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('اکانت از انبار حذف شد.')
        fetchAccounts()
      } else {
        toast.error(data.error || 'خطا در حذف.')
      }
    } catch { toast.error('خطای ارتباط با سرور.') }
    finally { setDeletingId(null) }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('کپی شد.')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const activeFilters = [statusFilter !== 'ALL', productFilter !== 'ALL', debouncedSearch.length > 0].filter(Boolean).length



  return (
    <>
      <Header>
        <div className='hidden sm:flex items-center gap-2.5 min-w-0'>
          <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0'>
            <Archive className='size-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-sm sm:text-base font-bold truncate text-foreground'>انبار اکانت‌های آماده</h1>
              <Badge variant='secondary' className='text-[10px] h-5 px-1.5 font-sans font-medium'>
                {toPersianDigits(stats.total)}
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground hidden sm:block truncate'>
              مدیریت اکانت‌های از پیش ساخته‌شده برای تحویل فوری به خریداران
            </p>
          </div>
        </div>

        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            size='sm'
            onClick={() => setAddOpen(true)}
            className='gap-1.5 text-xs h-8 px-3 rounded-xl font-semibold'
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>افزودن اکانت</span>
            <span className='sm:hidden'>افزودن</span>
          </Button>
          <Button variant='outline' size='sm' onClick={fetchAccounts} disabled={loading} className='gap-1.5 text-xs h-8 px-2.5'>
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='p-3.5 sm:p-6 max-w-7xl mx-auto w-full'>
        <div className='flex flex-col gap-4 sm:gap-5 w-full'>

          {/* Stats Row */}
          <div className='grid grid-cols-3 gap-2.5 sm:gap-3'>
            <div className='p-3 sm:p-4 rounded-xl border border-border/70 bg-card text-center'>
              <div className='text-lg sm:text-2xl font-black text-foreground font-sans'>{toPersianDigits(stats.total)}</div>
              <div className='text-[10.5px] text-muted-foreground mt-0.5'>کل اکانت‌ها</div>
            </div>
            <div className='p-3 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center'>
              <div className='text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sans'>{toPersianDigits(stats.available)}</div>
              <div className='text-[10.5px] text-emerald-700 dark:text-emerald-400 mt-0.5'>آزاد (موجود)</div>
            </div>
            <div className='p-3 sm:p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 text-center'>
              <div className='text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-sans'>{toPersianDigits(stats.used)}</div>
              <div className='text-[10.5px] text-blue-700 dark:text-blue-400 mt-0.5'>استفاده‌شده</div>
            </div>
          </div>

          {/* Search & Filter */}
          <Card className='border-border/70 shadow-xs bg-card/60'>
            <CardContent className='p-3.5 sm:p-4'>
              <div className='flex flex-col sm:flex-row items-center gap-2.5'>
                {/* Search */}
                <div className='relative flex-1 w-full'>
                  <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                  <Input
                    placeholder='جستجوی ایمیل...'
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                    className='ps-9 pe-8 h-10 text-xs rounded-xl bg-background/80'
                    dir='ltr'
                  />
                  {search && (
                    <button type='button' onClick={() => { setSearch(''); setDebouncedSearch('') }} className='absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'>
                      <X className='size-3.5' />
                    </button>
                  )}
                </div>

                {/* Status filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='h-10 w-full sm:w-40 text-xs rounded-xl bg-background'>
                    <SelectValue placeholder='وضعیت' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                    <SelectItem value='AVAILABLE'>آزاد</SelectItem>
                    <SelectItem value='RESERVED'>رزرو شده</SelectItem>
                    <SelectItem value='USED'>استفاده شده</SelectItem>
                    <SelectItem value='INVALID'>نامعتبر</SelectItem>
                  </SelectContent>
                </Select>

                {/* Product filter */}
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className='h-10 w-full sm:w-44 text-xs rounded-xl bg-background'>
                    <SelectValue placeholder='همه محصولات' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>همه محصولات</SelectItem>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>

                {activeFilters > 0 && (
                  <Button variant='ghost' size='sm' onClick={() => { setStatusFilter('ALL'); setProductFilter('ALL'); setSearch(''); setDebouncedSearch('') }} className='h-10 px-3 text-xs text-muted-foreground whitespace-nowrap'>
                    <X className='size-3.5 me-1' />
                    پاک کردن
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className='border-border/70 shadow-xs overflow-hidden'>
            <CardHeader className='p-4 sm:p-5 border-b border-border/60 bg-muted/10'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-sm font-bold flex items-center gap-2'>
                    اکانت‌های آماده
                    <Badge variant='outline' className='text-xs font-sans'>{toPersianDigits(filteredAccounts.length)} مورد</Badge>
                  </CardTitle>
                  <CardDescription className='text-xs mt-0.5'>
                    {stats.available > 0
                      ? `${toPersianDigits(stats.available)} اکانت آزاد در انبار موجود است.`
                      : 'انبار اکانت آماده خالی است. لطفاً اکانت جدید اضافه کنید.'}
                  </CardDescription>
                </div>
                {stats.available === 0 && (
                  <Badge variant='outline' className='text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1'>
                    <AlertCircle className='size-3' />
                    انبار خالی
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {loading ? (
                <div className='py-16 flex items-center justify-center gap-2 text-muted-foreground text-xs'>
                  <Loader2 className='size-4 animate-spin' />
                  در حال بارگذاری...
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className='py-16 text-center space-y-3'>
                  <div className='size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground'>
                    <Archive className='size-6' />
                  </div>
                  <p className='text-sm font-semibold text-foreground'>
                    {debouncedSearch || activeFilters > 0 ? 'نتیجه‌ای یافت نشد.' : 'انبار خالی است.'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {debouncedSearch || activeFilters > 0 ? 'فیلترها را تغییر دهید.' : 'اولین اکانت را از دکمه «افزودن اکانت» اضافه کنید.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className='hidden sm:block overflow-x-auto'>
                    <table className='w-full text-xs'>
                      <thead>
                        <tr className='border-b border-border/60 bg-muted/30'>
                          <th className='text-start px-4 py-3 font-semibold text-muted-foreground'>ایمیل</th>
                          <th className='text-start px-4 py-3 font-semibold text-muted-foreground'>رمزعبور</th>
                          <th className='text-start px-4 py-3 font-semibold text-muted-foreground'>وضعیت</th>
                          <th className='text-start px-4 py-3 font-semibold text-muted-foreground'>محصول / پلن</th>
                          <th className='text-start px-4 py-3 font-semibold text-muted-foreground'>تاریخ افزودن</th>
                          <th className='text-start px-4 py-3 font-semibold text-muted-foreground'>اقدامات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccounts.map((acc, idx) => {
                          const statusBadge = getStatusBadge(acc.status)
                          const StatusIcon = statusBadge.icon
                          const email = acc.data?.email || acc.data?.username || '—'
                          const isPassVisible = visiblePasswords[acc.id]
                          return (
                            <tr key={acc.id} className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                              {/* Email */}
                              <td className='px-4 py-3'>
                                <div className='flex items-center gap-1.5'>
                                  <span className='font-mono text-foreground select-all' dir='ltr'>{email}</span>
                                  <button type='button' onClick={() => handleCopy(email, `email-${acc.id}`)} className='text-muted-foreground hover:text-primary transition-colors' title='کپی ایمیل'>
                                    {copiedId === `email-${acc.id}` ? <Check className='size-3 text-primary' /> : <Copy className='size-3' />}
                                  </button>
                                </div>
                              </td>
                              {/* Password */}
                              <td className='px-4 py-3'>
                                {acc.data?.password ? (
                                  <div className='flex items-center gap-1.5'>
                                    <span className='font-mono text-foreground select-all' dir='ltr'>
                                      {isPassVisible ? '(رمزگذاری‌شده)' : '••••••••'}
                                    </span>
                                    <button type='button' onClick={() => togglePasswordVisibility(acc.id)} className='text-muted-foreground hover:text-foreground'>
                                      {isPassVisible ? <EyeOff className='size-3' /> : <Eye className='size-3' />}
                                    </button>
                                  </div>
                                ) : (
                                  <span className='text-muted-foreground'>—</span>
                                )}
                              </td>
                              {/* Status */}
                              <td className='px-4 py-3'>
                                <Badge variant='outline' className={`text-[10px] gap-1 font-medium ${statusBadge.className}`}>
                                  <StatusIcon className='size-3' />
                                  {statusBadge.label}
                                </Badge>
                              </td>
                              {/* Product/Plan */}
                              <td className='px-4 py-3'>
                                <div className='flex flex-col gap-0.5'>
                                  <span className='font-medium text-foreground'>{acc.product?.title || '—'}</span>
                                  {acc.plan?.name && <span className='text-muted-foreground text-[10.5px]'>{acc.plan.name}</span>}
                                </div>
                              </td>
                              {/* Date */}
                              <td className='px-4 py-3 text-muted-foreground whitespace-nowrap'>
                                {formatPersianDate(acc.createdAt, { month: 'short', day: 'numeric' })}
                              </td>
                              {/* Actions */}
                              <td className='px-4 py-3'>
                                {acc.status === 'AVAILABLE' && (
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    onClick={() => handleDelete(acc.id)}
                                    disabled={deletingId === acc.id}
                                    className='size-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
                                    title='حذف از انبار'
                                  >
                                    {deletingId === acc.id ? <Loader2 className='size-3.5 animate-spin' /> : <Trash2 className='size-3.5' />}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className='sm:hidden divide-y divide-border/40'>
                    {filteredAccounts.map(acc => {
                      const statusBadge = getStatusBadge(acc.status)
                      const StatusIcon = statusBadge.icon
                      const email = acc.data?.email || acc.data?.username || '—'
                      return (
                        <div key={acc.id} className='p-4 space-y-2.5 bg-card hover:bg-muted/20 transition-colors'>
                          <div className='flex items-start justify-between gap-2'>
                            <div className='flex items-center gap-1.5 min-w-0 flex-1'>
                              <Mail className='size-3.5 text-primary shrink-0' />
                              <span className='font-mono text-xs text-foreground truncate select-all' dir='ltr'>{email}</span>
                              <button type='button' onClick={() => handleCopy(email, `m-email-${acc.id}`)} className='text-muted-foreground hover:text-primary shrink-0'>
                                {copiedId === `m-email-${acc.id}` ? <Check className='size-3 text-primary' /> : <Copy className='size-3' />}
                              </button>
                            </div>
                            <Badge variant='outline' className={`text-[10px] gap-1 font-medium shrink-0 ${statusBadge.className}`}>
                              <StatusIcon className='size-3' />
                              {statusBadge.label}
                            </Badge>
                          </div>

                          <div className='flex items-center justify-between text-[10.5px] text-muted-foreground'>
                            <span>{acc.product?.title || '—'}{acc.plan?.name ? ` / ${acc.plan.name}` : ''}</span>
                            <span>{formatPersianDate(acc.createdAt, { month: 'short', day: 'numeric' })}</span>
                          </div>

                          {acc.status === 'AVAILABLE' && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDelete(acc.id)}
                              disabled={deletingId === acc.id}
                              className='w-full h-8 text-xs gap-1.5 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10'
                            >
                              {deletingId === acc.id ? <Loader2 className='size-3.5 animate-spin' /> : <Trash2 className='size-3.5' />}
                              حذف از انبار
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>

      {/* Add Account Modal */}
      <AddAccountDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        products={products}
        onSuccess={fetchAccounts}
      />
    </>
  )
}
