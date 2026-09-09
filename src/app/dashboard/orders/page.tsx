'use client'

import { useEffect, useState } from 'react'
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
  Eye,
  Check,
} from 'lucide-react'
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

interface AdminOrder {
  id: string
  amount: number
  status: string
  source: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    phone: string | null
    name: string | null
    telegramUsername: string | null
  }
  plan: {
    id: string
    name: string
    duration: number
    product: {
      name: string
    }
  }
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders || [])
      } else {
        toast.error(data.error || 'خطا در دریافت سفارش‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    toast.success('لینک فعال‌سازی کپی شد.')
    setTimeout(() => setCopiedLink(false), 2000)
  }

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
      toast.error('خطای سرور.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='text-base font-bold flex items-center gap-2'>
            <Package className='size-4 text-primary' />
            <span>مدیریت تمام سفارش‌ها</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchOrders}
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
        {/* Search & Filter Bar */}
        <Card className='border-border/60 shadow-xs'>
          <CardContent className='p-4'>
            <form onSubmit={handleSearchSubmit} className='flex flex-col sm:flex-row items-center gap-3'>
              <div className='relative flex-1 w-full'>
                <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                <Input
                  placeholder='جستجو با شناسه سفارش، شماره موبایل کاربر، Authority یا RefId...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='ps-9 text-xs sm:text-sm h-10'
                />
              </div>

              <div className='flex items-center gap-2 w-full sm:w-auto'>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full sm:w-44 h-10 text-xs'>
                    <SelectValue placeholder='فیلتر وضعیت سفارش' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                    <SelectItem value='PAID'>پرداخت شده (PAID)</SelectItem>
                    <SelectItem value='COMPLETED'>تکمیل شده (COMPLETED)</SelectItem>
                    <SelectItem value='PENDING_PAYMENT'>در انتظار پرداخت</SelectItem>
                    <SelectItem value='FAILED'>ناموفق (FAILED)</SelectItem>
                    <SelectItem value='CANCELLED'>لغو شده (CANCELLED)</SelectItem>
                  </SelectContent>
                </Select>

                <Button type='submit' size='sm' className='h-10 px-4 text-xs font-semibold'>
                  جستجو
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className='border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-base font-bold'>سفارش‌های سامانه</CardTitle>
                <CardDescription className='text-xs'>
                  مجموع {orders.length.toLocaleString('fa-IR')} سفارش ثبت‌شده
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='size-8 animate-spin text-primary' />
              </div>
            ) : orders.length === 0 ? (
              <div className='py-12 text-center text-xs text-muted-foreground'>
                هیچ سفارشی با این مشخصات یافت نشد.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-xs text-start'>
                  <thead>
                    <tr className='border-b border-border/50 text-muted-foreground'>
                      <th className='py-3 text-start font-medium'>شناسه</th>
                      <th className='py-3 text-start font-medium'>کاربر</th>
                      <th className='py-3 text-start font-medium'>محصول و پلن</th>
                      <th className='py-3 text-start font-medium'>مبلغ</th>
                      <th className='py-3 text-start font-medium'>وضعیت سفارش</th>
                      <th className='py-3 text-start font-medium'>وضعیت پرداخت</th>
                      <th className='py-3 text-start font-medium'>لینک فعال‌سازی</th>
                      <th className='py-3 text-start font-medium'>تاریخ ثبت</th>
                      <th className='py-3 text-end font-medium'>عملیات</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/40'>
                    {orders.map((ord) => (
                      <tr key={ord.id} className='hover:bg-muted/30 transition-colors'>
                        <td className='py-3 font-sans font-bold text-foreground'>
                          {ord.id.slice(-8)}
                        </td>
                        <td className='py-3'>
                          <span className='font-semibold block text-foreground'>
                            {ord.user?.name || ord.user?.phone || 'کاربر'}
                          </span>
                          {ord.user?.phone && ord.user?.name && (
                            <span className='text-[10px] text-muted-foreground font-sans tabular-nums'>
                              {ord.user.phone}
                            </span>
                          )}
                        </td>
                        <td className='py-3'>
                          <span className='text-foreground block font-medium'>
                            {ord.plan?.product?.name}
                          </span>
                          <span className='text-[10px] text-muted-foreground'>
                            {ord.plan?.name}
                          </span>
                        </td>
                        <td className='py-3 font-bold text-foreground'>
                          {formatPrice(ord.amount)}
                        </td>
                        <td className='py-3'>
                          {ord.status === 'COMPLETED' ? (
                            <Badge variant='outline' className='border-primary/30 bg-primary/10 text-primary text-[10px] font-medium'>
                              تکمیل شده
                            </Badge>
                          ) : ord.status === 'PAID' ? (
                            <Badge variant='outline' className='border-primary/30 bg-primary/10 text-primary text-[10px] font-medium'>
                              پرداخت شده
                            </Badge>
                          ) : ord.status === 'PENDING_PAYMENT' ? (
                            <Badge variant='outline' className='border-border/80 bg-muted/50 text-muted-foreground text-[10px] font-medium'>
                              در انتظار پرداخت
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='border-rose-500/30 bg-rose-500/10 text-rose-600 text-[10px] font-medium'>
                              {ord.status}
                            </Badge>
                          )}
                        </td>
                        <td className='py-3'>
                          {ord.payment?.status === 'SUCCESS' ? (
                            <span className='text-primary font-semibold flex items-center gap-1'>
                              <CheckCircle2 className='size-3' />
                              موفق
                            </span>
                          ) : ord.payment?.status === 'PENDING' ? (
                            <span className='text-muted-foreground font-semibold flex items-center gap-1'>
                              <Clock className='size-3' />
                              در انتظار
                            </span>
                          ) : (
                            <span className='text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1'>
                              <XCircle className='size-3' />
                              {ord.payment?.status || 'ثبت‌نشده'}
                            </span>
                          )}
                        </td>
                        <td className='py-3'>
                          {ord.activationLink ? (
                            <Badge variant='outline' className='border-primary/30 text-primary text-[10px] font-sans'>
                              تخصیص یافته
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground text-[10px]'>—</span>
                          )}
                        </td>
                        <td className='py-3 text-muted-foreground text-[11px]'>
                          {formatDate(ord.createdAt)}
                        </td>
                        <td className='py-3 text-end'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setSelectedOrder(ord)}
                            className='h-7 px-2.5 text-[11px] gap-1'
                          >
                            <Eye className='size-3' />
                            <span>بررسی</span>
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
      </Main>

      {/* Order Detail Modal */}
      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null)
        }}
      >
        <DialogContent className='max-w-xl p-6'>
          <DialogHeader>
            <DialogTitle className='text-lg font-bold flex items-center gap-2'>
              <Package className='size-5 text-primary' />
              <span>جزئیات کامل سفارش</span>
            </DialogTitle>
            <DialogDescription className='text-xs font-sans'>
              شناسه سفارش: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className='space-y-4 pt-2 text-xs'>
              {/* Info Grid */}
              <div className='grid grid-cols-2 gap-3 p-4 rounded-xl border border-border/60 bg-muted/20'>
                <div>
                  <span className='text-muted-foreground block text-[10px]'>مشتری / کاربر:</span>
                  <span className='font-bold text-foreground text-sm'>
                    {selectedOrder.user?.name || selectedOrder.user?.phone || 'کاربر'}
                  </span>
                  {selectedOrder.user?.phone && (
                    <span className='text-muted-foreground font-sans tabular-nums block text-[11px] mt-0.5'>
                      {selectedOrder.user.phone}
                    </span>
                  )}
                </div>
                <div>
                  <span className='text-muted-foreground block text-[10px]'>مبلغ پرداختی:</span>
                  <span className='font-extrabold text-foreground text-sm text-primary'>
                    {formatPrice(selectedOrder.amount)}
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[10px]'>محصول:</span>
                  <span className='font-semibold text-foreground'>
                    {selectedOrder.plan?.product?.name} ({selectedOrder.plan?.name})
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[10px]'>تاریخ ایجاد:</span>
                  <span className='font-semibold text-foreground'>
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
              </div>

              {/* Status Update Row */}
              <div className='flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card'>
                <span className='font-semibold'>وضعیت سفارش:</span>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(val) => handleUpdateOrderStatus(selectedOrder.id, val)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className='h-8 w-44 text-xs font-semibold'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PENDING_PAYMENT'>PENDING_PAYMENT</SelectItem>
                    <SelectItem value='PAID'>PAID</SelectItem>
                    <SelectItem value='COMPLETED'>COMPLETED</SelectItem>
                    <SelectItem value='FAILED'>FAILED</SelectItem>
                    <SelectItem value='CANCELLED'>CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Details */}
              <div className='p-4 rounded-xl border border-border/60 space-y-2'>
                <h4 className='font-bold text-foreground text-xs'>اطلاعات پرداخت بانکی:</h4>
                {selectedOrder.payment ? (
                  <div className='grid grid-cols-2 gap-2 text-[11px]'>
                    <div>
                      <span className='text-muted-foreground'>درگاه:</span>{' '}
                      <span className='font-semibold'>{selectedOrder.payment.gatewayName}</span>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>وضعیت:</span>{' '}
                      <span className='font-semibold'>{selectedOrder.payment.status}</span>
                    </div>
                    {selectedOrder.payment.authority && (
                      <div className='col-span-2 truncate'>
                        <span className='text-muted-foreground'>Authority:</span>{' '}
                        <span className='font-sans text-[10px]'>{selectedOrder.payment.authority}</span>
                      </div>
                    )}
                    {selectedOrder.payment.refId && (
                      <div className='col-span-2'>
                        <span className='text-muted-foreground'>کد پیگیری بانکی (RefId):</span>{' '}
                        <span className='font-sans font-bold text-primary'>
                          {selectedOrder.payment.refId}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-[11px]'>تراکنشی برای این سفارش ثبت نشده است.</p>
                )}
              </div>

              {/* Activation Link Details */}
              <div className='p-4 rounded-xl border border-border/60 space-y-2'>
                <h4 className='font-bold text-foreground text-xs'>لینک فعال‌سازی اختصاص‌یافته:</h4>
                {selectedOrder.activationLink ? (
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40'>
                      <span className='font-mono text-[11px] truncate flex-1 select-all'>
                        {selectedOrder.activationLink.url}
                      </span>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleCopyLink(selectedOrder.activationLink!.url)}
                        className='size-7 shrink-0'
                        title='کپی لینک'
                      >
                        {copiedLink ? <Check className='size-3.5 text-primary' /> : <Copy className='size-3.5' />}
                      </Button>
                    </div>
                    <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                      <span>وضعیت لینک: {selectedOrder.activationLink.status}</span>
                      {selectedOrder.activationLink.assignedAt && (
                        <span>تخصیص: {formatDate(selectedOrder.activationLink.assignedAt)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className='text-muted-foreground text-[11px]'>هنوز لینکی به این سفارش تخصیص نیافته است.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
