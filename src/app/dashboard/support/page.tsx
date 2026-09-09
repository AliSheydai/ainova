'use client'

import { useEffect, useState } from 'react'
import {
  HeadphonesIcon,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  User as UserIcon,
  ShoppingBag,
  RefreshCw,
  Loader2,
  Send,
  Eye,
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

interface AdminTicket {
  id: string
  userId: string | null
  orderId: string | null
  subject: string
  message: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  contactInfo: string | null
  response: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    phone: string | null
    name: string | null
    telegramUsername: string | null
  } | null
  order?: {
    id: string
    amount: number
    status: string
    plan?: { name: string }
  } | null
}

interface TicketCounts {
  open: number
  inProgress: number
  resolved: number
  closed: number
  total: number
}

function formatDate(dateStr: string): string {
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

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [counts, setCounts] = useState<TicketCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null)
  const [responseMsg, setResponseMsg] = useState('')
  const [ticketStatus, setTicketStatus] = useState<string>('OPEN')
  const [submitting, setSubmitting] = useState(false)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/support?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setTickets(data.tickets || [])
        setCounts(data.counts || null)
      } else {
        toast.error(data.error || 'خطا در بارگذاری تیکت‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const handleOpenTicket = (ticket: AdminTicket) => {
    setSelectedTicket(ticket)
    setTicketStatus(ticket.status)
    setResponseMsg(ticket.response || '')
  }

  const handleSaveResponse = async () => {
    if (!selectedTicket) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: ticketStatus,
          response: responseMsg,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'پاسخ ذخیره و تیکت به‌روزرسانی شد.')
        setSelectedTicket(null)
        fetchTickets()
      } else {
        toast.error(data.error || 'خطا در ذخیره پاسخ.')
      }
    } catch {
      toast.error('خطای سرور.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='text-base font-bold flex items-center gap-2'>
            <HeadphonesIcon className='size-4 text-primary' />
            <span>مدیریت درخواست‌ها و پیام‌های پشتیبانی</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchTickets}
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
        {/* KPI Counts */}
        {counts && (
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <Card className='border-border/80 bg-muted/40 shadow-xs'>
              <CardContent className='p-3.5'>
                <span className='text-xs text-muted-foreground font-medium'>
                  تیکت‌های باز (OPEN)
                </span>
                <div className='text-xl font-bold text-foreground mt-1'>
                  {counts.open.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>

            <Card className='border-primary/30 bg-primary/5 shadow-xs'>
              <CardContent className='p-3.5'>
                <span className='text-xs text-primary font-medium'>
                  در حال بررسی
                </span>
                <div className='text-xl font-bold text-primary mt-1'>
                  {counts.inProgress.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>

            <Card className='border-primary/20 bg-primary/5 shadow-xs'>
              <CardContent className='p-3.5'>
                <span className='text-xs text-primary/80 font-medium'>
                  حل شده (RESOLVED)
                </span>
                <div className='text-xl font-bold text-foreground mt-1'>
                  {counts.resolved.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>

            <Card className='border-border/60 shadow-xs'>
              <CardContent className='p-3.5'>
                <span className='text-xs text-muted-foreground'>کل تیکت‌ها</span>
                <div className='text-xl font-bold text-foreground mt-1'>
                  {counts.total.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Bar */}
        <Card className='border-border/60 shadow-xs'>
          <CardContent className='p-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-44 h-9 text-xs'>
                  <SelectValue placeholder='فیلتر وضعیت' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                  <SelectItem value='OPEN'>باز (OPEN)</SelectItem>
                  <SelectItem value='IN_PROGRESS'>در حال بررسی</SelectItem>
                  <SelectItem value='RESOLVED'>پاسخ داده شده</SelectItem>
                  <SelectItem value='CLOSED'>بسته شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className='text-xs text-muted-foreground'>
              {tickets.length.toLocaleString('fa-IR')} پیام ثبت‌شده
            </span>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card className='border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-bold'>پیام‌های دریافتی از کاربران</CardTitle>
            <CardDescription className='text-xs'>
              مشاهده متن پیام، مشخصات کاربر و ثبت پاسخ
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-0'>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='size-8 animate-spin text-primary' />
              </div>
            ) : tickets.length === 0 ? (
              <div className='py-12 text-center text-xs text-muted-foreground'>
                پیام پشتیبانی جدیدی در این وضعیت وجود ندارد.
              </div>
            ) : (
              <div className='space-y-3'>
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className='p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/20 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs'
                  >
                    <div className='space-y-1 max-w-lg'>
                      <div className='flex items-center gap-2'>
                        <span className='font-bold text-sm text-foreground'>{t.subject}</span>
                        {t.status === 'OPEN' ? (
                          <Badge variant='outline' className='border-border/80 bg-muted/50 text-muted-foreground text-[10px]'>
                            باز
                          </Badge>
                        ) : t.status === 'IN_PROGRESS' ? (
                          <Badge variant='outline' className='border-primary/30 bg-primary/10 text-primary text-[10px]'>
                            در حال بررسی
                          </Badge>
                        ) : t.status === 'RESOLVED' ? (
                          <Badge variant='outline' className='border-primary/20 bg-primary/5 text-primary text-[10px]'>
                            پاسخ داده شده
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='text-muted-foreground text-[10px]'>
                            بسته
                          </Badge>
                        )}
                      </div>
                      <p className='text-muted-foreground line-clamp-1 text-xs'>{t.message}</p>
                      <div className='flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1'>
                        <span>کاربر: {t.user?.name || t.user?.phone || t.contactInfo || 'مهمان'}</span>
                        {t.orderId && <span>سفارش: {t.orderId.slice(-6)}</span>}
                        <span>{formatDate(t.createdAt)}</span>
                      </div>
                    </div>

                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleOpenTicket(t)}
                      className='h-8 text-xs gap-1.5 shrink-0'
                    >
                      <Eye className='size-3.5' />
                      <span>مشاهده و پاسخ</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Main>

      {/* Ticket Details / Response Dialog */}
      <Dialog
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null)
        }}
      >
        <DialogContent className='max-w-xl p-6'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <MessageSquare className='size-4 text-primary' />
              <span>{selectedTicket?.subject}</span>
            </DialogTitle>
            <DialogDescription className='text-xs'>
              ثبت‌شده در {selectedTicket ? formatDate(selectedTicket.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className='space-y-4 pt-2 text-xs'>
              {/* User / Order Info */}
              <div className='grid grid-cols-2 gap-2 p-3 rounded-xl border border-border/50 bg-muted/20 text-[11px]'>
                <div>
                  <span className='text-muted-foreground'>فرستنده:</span>{' '}
                  <span className='font-bold text-foreground'>
                    {selectedTicket.user?.name || selectedTicket.user?.phone || 'مهمان'}
                  </span>
                </div>
                <div>
                  <span className='text-muted-foreground'>تماس:</span>{' '}
                  <span className='font-sans font-bold text-foreground tabular-nums'>
                    {selectedTicket.contactInfo || selectedTicket.user?.phone || '—'}
                  </span>
                </div>
                {selectedTicket.order && (
                  <div className='col-span-2 pt-1 border-t border-border/40'>
                    <span className='text-muted-foreground'>سفارش مرتبط:</span>{' '}
                    <span className='font-semibold text-primary'>
                      {selectedTicket.order.plan?.name} (شناسه: {selectedTicket.order.id.slice(-6)})
                    </span>
                  </div>
                )}
              </div>

              {/* Message Box */}
              <div className='p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5'>
                <span className='font-semibold text-muted-foreground block text-[11px]'>متن پیام:</span>
                <p className='text-foreground text-xs leading-relaxed whitespace-pre-wrap'>
                  {selectedTicket.message}
                </p>
              </div>

              {/* Status Select */}
              <div className='flex items-center justify-between p-3 rounded-xl border border-border/50'>
                <span className='font-semibold'>تغییر وضعیت تیکت:</span>
                <Select value={ticketStatus} onValueChange={setTicketStatus}>
                  <SelectTrigger className='h-8 w-40 text-xs font-semibold'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='OPEN'>باز (OPEN)</SelectItem>
                    <SelectItem value='IN_PROGRESS'>در حال بررسی</SelectItem>
                    <SelectItem value='RESOLVED'>پاسخ داده شده</SelectItem>
                    <SelectItem value='CLOSED'>بسته شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Response Box */}
              <div className='space-y-1.5'>
                <label className='font-semibold text-xs block'>یادداشت و پاسخ ادمین:</label>
                <Textarea
                  rows={4}
                  placeholder='متن پاسخ یا توضیحات ادمین در رابطه با این تیکت...'
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
          )}

          <DialogFooter className='gap-2 pt-2'>
            <Button
              variant='outline'
              onClick={() => setSelectedTicket(null)}
              disabled={submitting}
              className='text-xs'
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveResponse}
              disabled={submitting}
              className='text-xs font-semibold gap-1.5'
            >
              {submitting ? <Loader2 className='size-3.5 animate-spin' /> : <Send className='size-3.5' />}
              ذخیره پاسخ و وضعیت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
