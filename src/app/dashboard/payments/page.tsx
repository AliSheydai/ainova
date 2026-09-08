'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  Building2,
  Hash,
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
  order: {
    id: string
    user: {
      id: string
      phone: string | null
      name: string | null
    }
    plan: {
      name: string
      product: { name: string }
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

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/payments?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setPayments(data.payments || [])
      } else {
        toast.error(data.error || 'خطا در بارگذاری تراکنش‌ها.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPayments()
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='text-base font-bold flex items-center gap-2'>
            <CreditCard className='size-4 text-primary' />
            <span>مشاهده و بررسی تراکنش‌های پرداخت</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchPayments}
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
        {/* Search & Status Filter */}
        <Card className='border-border/60 shadow-xs'>
          <CardContent className='p-4'>
            <form onSubmit={handleSearchSubmit} className='flex flex-col sm:flex-row items-center gap-3'>
              <div className='relative flex-1 w-full'>
                <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                <Input
                  placeholder='جستجو با Authority، کد پیگیری RefId، شماره موبایل یا شماره سفارش...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='ps-9 text-xs sm:text-sm h-10'
                />
              </div>

              <div className='flex items-center gap-2 w-full sm:w-auto'>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full sm:w-40 h-10 text-xs'>
                    <SelectValue placeholder='فیلتر وضعیت' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>همه پرداخت‌ها</SelectItem>
                    <SelectItem value='SUCCESS'>موفق (SUCCESS)</SelectItem>
                    <SelectItem value='PENDING'>در انتظار (PENDING)</SelectItem>
                    <SelectItem value='FAILED'>ناموفق (FAILED)</SelectItem>
                  </SelectContent>
                </Select>

                <Button type='submit' size='sm' className='h-10 px-4 text-xs font-semibold'>
                  جستجو
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className='border-border/60 shadow-xs'>
          <CardHeader className='pb-3'>
            <div>
              <CardTitle className='text-base font-bold'>تراکنش‌های درگاه پرداخت</CardTitle>
              <CardDescription className='text-xs'>
                تراکنش‌های ثبت‌شده و تاییدشده مستقیماً از سمت سرور
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='size-8 animate-spin text-primary' />
              </div>
            ) : payments.length === 0 ? (
              <div className='py-12 text-center text-xs text-muted-foreground'>
                تراکنشی با این شرایط ثبت نشده است.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-xs text-start'>
                  <thead>
                    <tr className='border-b border-border/50 text-muted-foreground'>
                      <th className='py-3 text-start font-medium'>شناسه</th>
                      <th className='py-3 text-start font-medium'>سفارش / کاربر</th>
                      <th className='py-3 text-start font-medium'>درگاه</th>
                      <th className='py-3 text-start font-medium'>مبلغ</th>
                      <th className='py-3 text-start font-medium'>وضعیت</th>
                      <th className='py-3 text-start font-medium'>Authority</th>
                      <th className='py-3 text-start font-medium'>کد پیگیری (RefId)</th>
                      <th className='py-3 text-start font-medium'>تاریخ</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/40'>
                    {payments.map((p) => (
                      <tr key={p.id} className='hover:bg-muted/30 transition-colors'>
                        <td className='py-3 font-mono font-medium text-foreground'>
                          {p.id.slice(-6)}
                        </td>
                        <td className='py-3'>
                          <span className='font-bold block text-foreground'>
                            {p.order?.user?.name || p.order?.user?.phone || 'کاربر'}
                          </span>
                          <span className='text-[10px] text-muted-foreground font-mono'>
                            سفارش: {p.orderId.slice(-6)}
                          </span>
                        </td>
                        <td className='py-3 font-mono capitalize'>
                          {p.gatewayName}
                        </td>
                        <td className='py-3 font-bold text-foreground'>
                          {formatPrice(p.amount)}
                        </td>
                        <td className='py-3'>
                          {p.status === 'SUCCESS' ? (
                            <Badge variant='outline' className='border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px] gap-1 font-medium'>
                              <CheckCircle2 className='size-2.5' />
                              موفق
                            </Badge>
                          ) : p.status === 'PENDING' ? (
                            <Badge variant='outline' className='border-amber-500/30 bg-amber-500/10 text-amber-600 text-[10px] gap-1 font-medium'>
                              <Clock className='size-2.5' />
                              در انتظار
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='border-rose-500/30 bg-rose-500/10 text-rose-600 text-[10px] gap-1 font-medium'>
                              <XCircle className='size-2.5' />
                              ناموفق
                            </Badge>
                          )}
                        </td>
                        <td className='py-3 font-mono text-[11px] text-muted-foreground max-w-[140px] truncate' title={p.authority || ''}>
                          {p.authority || '—'}
                        </td>
                        <td className='py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400'>
                          {p.refId || '—'}
                        </td>
                        <td className='py-3 text-muted-foreground text-[11px]'>
                          {formatDate(p.createdAt)}
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
    </>
  )
}
