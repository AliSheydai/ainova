'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
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
      name: string
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export default function AdminActivationLinksPage() {
  const [links, setLinks] = useState<ActivationLinkItem[]>([])
  const [stats, setStats] = useState<LinkStats | null>(null)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [productFilter, setProductFilter] = useState('ALL')

  // Bulk Add Dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkProductId, setBulkProductId] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [importing, setImporting] = useState(false)

  // Reveal state for masked URLs
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (productFilter !== 'ALL') params.set('productId', productFilter)

      const res = await fetch(`/api/admin/activation-links?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setLinks(data.links || [])
        setStats(data.stats || null)
        setProducts(data.products || [])
        if (!bulkProductId && data.products && data.products.length > 0) {
          setBulkProductId(data.products[0].id)
        }
      } else {
        toast.error(data.error || 'خطا در بارگذاری لینک‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [statusFilter, productFilter])

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('لینک کپی شد.')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const maskUrl = (url: string) => {
    if (url.length < 25) return '••••••••••••••••'
    return url.slice(0, 14) + '••••••••' + url.slice(-6)
  }

  const handleBulkImport = async () => {
    if (!bulkProductId) {
      toast.error('لطفاً محصول مورد نظر را انتخاب کنید.')
      return
    }

    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length === 0) {
      toast.error('لطفاً حداقل یک لینک وارد کنید.')
      return
    }

    setImporting(true)
    try {
      const res = await fetch('/api/admin/activation-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: bulkProductId, links: lines }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'لینک‌ها با موفقیت اضافه شدند.')
        setBulkDialogOpen(false)
        setBulkText('')
        fetchLinks()
      } else {
        toast.error(data.error || 'خطا در ثبت لینک‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setImporting(false)
    }
  }

  const handleStatusChange = async (linkId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/activation-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'وضعیت لینک به‌روزرسانی شد.')
        fetchLinks()
      } else {
        toast.error(data.error || 'خطا در تغییر وضعیت.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('آیا از حذف این لینک اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/admin/activation-links?id=${linkId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'لینک با موفقیت حذف شد.')
        fetchLinks()
      } else {
        toast.error(data.error || 'خطا در حذف لینک.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2 overflow-hidden'>
          <h1 className='text-sm sm:text-base font-bold flex items-center gap-2 truncate'>
            <LinkIcon className='size-4 text-primary shrink-0' />
            <span className='truncate'>انبار و مدیریت لینک‌های فعال‌سازی</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            size='sm'
            onClick={() => setBulkDialogOpen(true)}
            className='gap-1.5 text-xs font-semibold h-8 px-2.5 sm:px-3'
          >
            <Plus className='size-3.5' />
            <span className='hidden sm:inline'>افزودن دسته‌ای لینک</span>
            <span className='sm:hidden'>افزودن لینک</span>
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

      <Main className='flex flex-col gap-5 sm:gap-6 p-3 sm:p-6'>
        <div className='flex flex-col gap-5 sm:gap-6 w-full min-w-0'>
        {/* KPI Cards */}
        {stats && (
          <div className='grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3'>
            <Card className='border-border/60 shadow-xs'>
              <CardContent className='p-3 sm:p-3.5'>
                <span className='text-[11px] sm:text-xs text-muted-foreground truncate block'>کل لینک‌ها</span>
                <div className='text-lg sm:text-xl font-bold text-foreground mt-1 tabular-nums'>
                  {stats.total.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>

            <Card className='border-primary/30 bg-primary/5 shadow-xs'>
              <CardContent className='p-3.5'>
                <span className='text-xs text-primary font-medium'>
                  موجود (AVAILABLE)
                </span>
                <div className='text-xl font-bold text-primary mt-1'>
                  {stats.available.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>

            <Card className='border-border/60 bg-muted/30 shadow-xs'>
              <CardContent className='p-3.5'>
                <span className='text-xs text-muted-foreground font-medium'>
                  رزرو شده (RESERVED)
                </span>
                <div className='text-xl font-bold text-foreground mt-1'>
                  {stats.reserved.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>

            <Card className='border-border/60 shadow-xs'>
              <CardContent className='p-3.5'>
                <span className='text-xs text-muted-foreground'>
                  مصرف‌شده (USED)
                </span>
                <div className='text-xl font-bold text-foreground mt-1'>
                  {stats.used.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>

            <Card className='border-rose-500/30 bg-rose-500/5 shadow-xs col-span-2 sm:col-span-1'>
              <CardContent className='p-3.5'>
                <span className='text-xs text-rose-700 dark:text-rose-400 font-medium'>
                  نامعتبر (INVALID)
                </span>
                <div className='text-xl font-bold text-rose-600 dark:text-rose-400 mt-1'>
                  {stats.invalid.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Bar */}
        <Card className='border-border/60 shadow-xs'>
          <CardContent className='p-4 flex flex-col sm:flex-row items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-44 h-9 text-xs'>
                  <SelectValue placeholder='فیلتر وضعیت' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                  <SelectItem value='AVAILABLE'>موجود (AVAILABLE)</SelectItem>
                  <SelectItem value='RESERVED'>رزرو شده (RESERVED)</SelectItem>
                  <SelectItem value='USED'>مصرف شده (USED)</SelectItem>
                  <SelectItem value='INVALID'>نامعتبر (INVALID)</SelectItem>
                </SelectContent>
              </Select>

              {products.length > 1 && (
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className='w-full sm:w-52 h-9 text-xs'>
                    <SelectValue placeholder='فیلتر بر اساس محصول' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>همه محصولات</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title || p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <span className='text-xs text-muted-foreground'>
              نمایش {links.length.toLocaleString('fa-IR')} لینک
            </span>
          </CardContent>
        </Card>

        {/* Links Table */}
        <Card className='border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-bold'>انبار لینک‌های فعال‌سازی</CardTitle>
            <CardDescription className='text-xs'>
              آدرس‌های فعال‌سازی برای جلوگیری از دیده شدن ناخواسته به صورت Mask شده نمایش داده می‌شوند.
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-0'>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='size-8 animate-spin text-primary' />
              </div>
            ) : links.length === 0 ? (
              <div className='py-12 text-center text-xs text-muted-foreground'>
                هیچ لینکی در این وضعیت یافت نشد.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[780px] text-xs text-start'>
                  <thead>
                    <tr className='border-b border-border/50 text-muted-foreground'>
                      <th className='py-3 text-start font-medium'>محصول</th>
                      <th className='py-3 text-start font-medium'>لینک فعال‌سازی (محافظت‌شده)</th>
                      <th className='py-3 text-start font-medium'>وضعیت</th>
                      <th className='py-3 text-start font-medium'>سفارش مرتبط</th>
                      <th className='py-3 text-start font-medium'>کاربر تخصیص‌یافته</th>
                      <th className='py-3 text-start font-medium'>تاریخ ثبت</th>
                      <th className='py-3 text-end font-medium'>عملیات</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/40'>
                    {links.map((link) => {
                      const isRevealed = Boolean(revealedIds[link.id])
                      return (
                        <tr key={link.id} className='hover:bg-muted/30 transition-colors'>
                          <td className='py-3 font-semibold text-foreground whitespace-nowrap'>
                            {link.plan?.product?.name || link.plan?.name || 'محصول'}
                          </td>

                          {/* Protected / Masked URL */}
                          <td className='py-3'>
                            <div className='flex items-center gap-1.5 max-w-sm'>
                              <span className='font-mono text-[11px] bg-muted/40 px-2 py-1 rounded-md border border-border/40 truncate select-all'>
                                {isRevealed ? link.url : maskUrl(link.url)}
                              </span>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => toggleReveal(link.id)}
                                className='size-6 text-muted-foreground hover:text-foreground shrink-0'
                                title={isRevealed ? 'پنهان‌سازی' : 'نمایش لینک'}
                              >
                                {isRevealed ? <EyeOff className='size-3.5' /> : <Eye className='size-3.5' />}
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleCopy(link.id, link.url)}
                                className='size-6 text-muted-foreground hover:text-foreground shrink-0'
                                title='کپی لینک'
                              >
                                {copiedId === link.id ? (
                                  <Check className='size-3.5 text-primary' />
                                ) : (
                                  <Copy className='size-3.5' />
                                )}
                              </Button>
                            </div>
                          </td>

                          {/* Status Badge & Dropdown */}
                          <td className='py-3'>
                            <Select
                              value={link.status}
                              onValueChange={(val) => handleStatusChange(link.id, val)}
                            >
                              <SelectTrigger className='h-7 w-32 text-[11px] font-semibold border-border/50'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='AVAILABLE'>موجود (AVAILABLE)</SelectItem>
                                <SelectItem value='RESERVED'>رزرو شده</SelectItem>
                                <SelectItem value='USED'>مصرف شده</SelectItem>
                                <SelectItem value='INVALID'>نامعتبر (INVALID)</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          <td className='py-3 font-sans tabular-nums text-muted-foreground'>
                            {link.orderId ? (
                              <span className='font-bold text-foreground'>
                                {link.orderId.slice(-6)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td className='py-3 text-foreground'>
                            {link.order?.user?.name || link.order?.user?.phone || '—'}
                          </td>

                          <td className='py-3 text-muted-foreground text-[11px]'>
                            {formatDate(link.createdAt)}
                          </td>

                          <td className='py-3 text-end'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleDeleteLink(link.id)}
                              className='size-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10'
                              title='حذف لینک'
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

      {/* Bulk Add Links Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className='max-w-xl p-6'>
          <DialogHeader>
            <DialogTitle className='text-lg font-bold flex items-center gap-2'>
              <Plus className='size-5 text-primary' />
              <span>افزودن دسته‌ای لینک‌های فعال‌سازی (Bulk Import)</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              لینک‌ها را در کادر زیر وارد کنید (هر خط یک لینک). تمام لینک‌ها به انبار پلن انتخاب‌شده اضافه خواهند شد.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 pt-2'>
            <div>
              <label className='text-xs font-semibold block mb-1.5'>انتخاب محصول مربوطه:</label>
              <Select value={bulkProductId} onValueChange={setBulkProductId}>
                <SelectTrigger className='h-10 text-xs'>
                  <SelectValue placeholder='محصول را انتخاب کنید' />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title || p.name} ({p.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='text-xs font-semibold block mb-1.5'>
                لیست لینک‌ها (هر خط یک لینک):
              </label>
              <Textarea
                rows={8}
                placeholder={`https://one.google.com/promo/invite/...\nhttps://one.google.com/promo/invite/...`}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className='font-mono text-xs'
                dir='ltr'
              />
              <span className='text-[11px] text-muted-foreground mt-1 block'>
                تعداد خطوط وارد شده:{' '}
                {
                  bulkText
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean).length
                }
              </span>
            </div>
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              variant='outline'
              onClick={() => setBulkDialogOpen(false)}
              disabled={importing}
              className='text-xs'
            >
              انصراف
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={importing}
              className='text-xs font-semibold'
            >
              {importing ? (
                <Loader2 className='size-3.5 animate-spin me-1.5' />
              ) : (
                <Plus className='size-3.5 me-1.5' />
              )}
              ثبت و اضافه به انبار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
