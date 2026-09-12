'use client'

import { useEffect, useState } from 'react'
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
    name: string
  } | null
  plan?: {
    id: string
    name: string
    duration: number
    fulfillmentType?: string
    product: {
      name: string
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

function getFulfillmentBadge(type?: string) {
  switch (type) {
    case 'ACTIVATION_LINK':
      return { label: 'لینک فعال‌سازی', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    case 'PRE_CREATED_ACCOUNT':
      return { label: 'اکانت آماده', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
    case 'CUSTOMER_PROVISIONING':
      return { label: 'ساخت روی اکانت مشتری', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    case 'MANUAL':
      return { label: 'تحویل دستی پشتیبانی', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    default:
      return { label: type || 'پیش‌فرض', color: 'bg-muted text-muted-foreground' }
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

  // Manual fulfillment dialog
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualNote, setManualNote] = useState('')
  const [deliveringManual, setDeliveringManual] = useState(false)

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    toast.success('کپی شد.')
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
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'سفارش با موفقیت تحویل و تکمیل شد.')
        setManualDialogOpen(false)
        setManualNote('')
        fetchOrders()
        if (selectedOrder) {
          setSelectedOrder(null)
        }
      } else {
        toast.error(data.error || 'خطا در تحویل سفارش.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setDeliveringManual(false)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='text-sm sm:text-base font-bold flex items-center gap-2 truncate'>
            <Package className='size-4 text-primary shrink-0' />
            <span className='truncate'>مدیریت تمام سفارش‌ها و تحویل (Fulfillment)</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchOrders}
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
          {/* Search & Filter Bar */}
          <Card className='border-border/60 shadow-xs'>
            <CardContent className='p-3.5 sm:p-4'>
              <form onSubmit={handleSearchSubmit} className='flex flex-col sm:flex-row items-center gap-3'>
                <div className='relative flex-1 w-full'>
                  <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                  <Input
                    placeholder='جستجو با شناسه سفارش، شماره موبایل، RefId یا نام...'
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

                  <Button type='submit' size='sm' className='h-10 px-4 text-xs font-semibold shrink-0'>
                    جستجو
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card className='border-border/60 shadow-xs'>
            <CardHeader className='p-4 sm:p-6 pb-3 sm:pb-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-sm sm:text-base font-bold'>سفارش‌های سیستم</CardTitle>
                  <CardDescription className='text-xs'>
                    مجموع {orders.length.toLocaleString('fa-IR')} سفارش
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-4 sm:p-6 pt-0 sm:pt-0'>
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
                  <table className='w-full min-w-[850px] text-xs text-start'>
                    <thead>
                      <tr className='border-b border-border/50 text-muted-foreground'>
                        <th className='py-3 text-start font-medium'>شناسه</th>
                        <th className='py-3 text-start font-medium'>کاربر</th>
                        <th className='py-3 text-start font-medium'>محصول و پلن</th>
                        <th className='py-3 text-start font-medium'>روش تحویل</th>
                        <th className='py-3 text-start font-medium'>مبلغ</th>
                        <th className='py-3 text-start font-medium'>وضعیت سفارش</th>
                        <th className='py-3 text-start font-medium'>وضعیت تحویل</th>
                        <th className='py-3 text-start font-medium'>تاریخ ثبت</th>
                        <th className='py-3 text-end font-medium'>عملیات</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/40'>
                      {orders.map((ord) => {
                        const fulfillmentType =
                          ord.delivery?.type ||
                          ord.plan?.fulfillmentType ||
                          'ACTIVATION_LINK'
                        const badge = getFulfillmentBadge(fulfillmentType)

                        return (
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
                                {ord.product?.title || ord.product?.name || ord.plan?.product?.name}
                              </span>
                              <span className='text-[10px] text-muted-foreground'>
                                {ord.plan?.name}
                              </span>
                            </td>
                            <td className='py-3'>
                              <Badge variant='outline' className={`text-[10px] ${badge.color}`}>
                                {badge.label}
                              </Badge>
                            </td>
                            <td className='py-3 font-bold text-foreground font-sans'>
                              {formatPrice(ord.amount)}
                            </td>
                            <td className='py-3'>
                              {ord.status === 'COMPLETED' ? (
                                <Badge variant='outline' className='border-primary/30 bg-primary/10 text-primary text-[10px] font-medium'>
                                  تکمیل شده
                                </Badge>
                              ) : ord.status === 'PAID' ? (
                                <Badge variant='outline' className='border-amber-500/30 bg-amber-500/10 text-amber-600 text-[10px] font-medium'>
                                  پرداخت شده (در انتظار تحویل)
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
                              {ord.delivery?.status === 'DELIVERED' || ord.status === 'COMPLETED' ? (
                                <span className='text-emerald-600 font-semibold flex items-center gap-1'>
                                  <CheckCircle2 className='size-3' />
                                  تحویل شد
                                </span>
                              ) : ord.status === 'PAID' ? (
                                <span className='text-amber-600 font-semibold flex items-center gap-1'>
                                  <Clock className='size-3' />
                                  در صف تحویل
                                </span>
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

      {/* Order Detail Modal */}
      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null)
        }}
      >
        <DialogContent className='max-w-xl p-6 max-h-[90vh] overflow-y-auto'>
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
                  <span className='text-muted-foreground block text-[10px]'>مشتری:</span>
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
                  <span className='font-extrabold text-foreground text-sm text-primary font-sans'>
                    {formatPrice(selectedOrder.amount)}
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[10px]'>محصول و پلن:</span>
                  <span className='font-semibold text-foreground'>
                    {selectedOrder.product?.title || selectedOrder.product?.name || selectedOrder.plan?.product?.name} ({selectedOrder.plan?.name})
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[10px]'>تاریخ ثبت:</span>
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

              {/* Customer Checkout Data Snapshot */}
              {selectedOrder.checkoutData && Object.keys(selectedOrder.checkoutData).length > 0 && (
                <div className='p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-2'>
                  <h4 className='font-bold text-foreground text-xs flex items-center gap-1.5'>
                    <Sparkles className='size-3.5 text-primary' />
                    اطلاعات وارد شده توسط مشتری در زمان خرید:
                  </h4>
                  <div className='grid grid-cols-1 gap-1.5 text-xs bg-background/80 p-3 rounded-lg border border-border/60 font-mono'>
                    {Object.entries(selectedOrder.checkoutData).map(([k, v]) => (
                      <div key={k} className='flex items-center justify-between'>
                        <span className='text-muted-foreground font-sans'>{k}:</span>
                        <span className='font-bold text-foreground select-all'>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Data Section */}
              <div className='p-4 rounded-xl border border-border/60 space-y-2'>
                <div className='flex items-center justify-between'>
                  <h4 className='font-bold text-foreground text-xs'>اطلاعات تحویل سفارش (Delivery):</h4>
                  {selectedOrder.delivery && (
                    <Badge variant='outline' className='text-[10px]'>
                      {selectedOrder.delivery.type}
                    </Badge>
                  )}
                </div>

                {selectedOrder.delivery?.data && Object.keys(selectedOrder.delivery.data).length > 0 ? (
                  <div className='space-y-2 pt-1'>
                    <div className='p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5 font-mono text-xs'>
                      {Object.entries(selectedOrder.delivery.data).map(([key, val]) => (
                        <div key={key} className='flex items-center justify-between'>
                          <span className='text-muted-foreground font-sans'>{key}:</span>
                          <span className='font-bold text-foreground select-all truncate max-w-[280px]'>
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedOrder.activationLink?.url ? (
                  <div className='flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40'>
                    <span className='font-mono text-[11px] truncate flex-1 select-all'>
                      {selectedOrder.activationLink.url}
                    </span>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleCopy(selectedOrder.activationLink!.url)}
                      className='size-7 shrink-0'
                      title='کپی لینک'
                    >
                      {copiedLink ? <Check className='size-3.5 text-primary' /> : <Copy className='size-3.5' />}
                    </Button>
                  </div>
                ) : (
                  <p className='text-muted-foreground text-[11px]'>
                    {selectedOrder.status === 'PAID'
                      ? 'سفارش پرداخت شده اما هنوز داده تحویلی به آن اختصاص نیافته است.'
                      : 'تحویلی برای این سفارش ثبت نشده است.'}
                  </p>
                )}

                {/* If order is PAID and needs manual fulfillment */}
                {selectedOrder.status === 'PAID' && (
                  <div className='pt-2'>
                    <Button
                      size='sm'
                      onClick={() => {
                        setManualNote(
                          selectedOrder.checkoutData?.email
                            ? `اکانت روی ایمیل ${selectedOrder.checkoutData.email} فعال گردید.`
                            : ''
                        )
                        setManualDialogOpen(true)
                      }}
                      className='w-full text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white'
                    >
                      <Send className='size-3.5' />
                      <span>تکمیل و تحویل دستی سفارش (Manual Fulfillment)</span>
                    </Button>
                  </div>
                )}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Delivery Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className='max-w-md p-6'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <Send className='size-4 text-primary' />
              <span>تحویل دستی سفارش #{selectedOrder?.id.slice(-6).toUpperCase()}</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              اطلاعات وارد شده در این فرم مستقیماً به عنوان داده Delivery ثبت شده و سفارش به وضعیت تکمیل‌شده (COMPLETED) تغییر می‌یابد.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2 text-xs'>
            <div>
              <label className='font-semibold block mb-1'>یادداشت و اطلاعات تحویل به مشتری: *</label>
              <Textarea
                rows={4}
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder='مثلاً: اشتراک با موفقیت روی ایمیل شما فعال گردید / مشخصات دسترسی: ...'
                className='text-xs'
              />
            </div>
          </div>

          <DialogFooter className='gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setManualDialogOpen(false)}
              disabled={deliveringManual}
              className='text-xs'
            >
              انصراف
            </Button>
            <Button
              size='sm'
              onClick={handleFulfillManual}
              disabled={deliveringManual}
              className='text-xs font-semibold'
            >
              {deliveringManual && <Loader2 className='size-3.5 animate-spin me-1.5' />}
              ثبت تحویل و تکمیل سفارش
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
