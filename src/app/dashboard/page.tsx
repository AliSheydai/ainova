'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Package,
  CreditCard,
  Link as LinkIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Shield,
  Layers,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface OverviewStats {
  totalUsers: number
  newUsers: number
  totalOrders: number
  successfulOrders: number
  pendingOrders: number
  totalRevenue: number
  availableLinks: number
  assignedLinks: number
  reservedLinks: number
  usedLinks: number
  invalidLinks: number
}

interface RecentOrder {
  id: string
  amount: number
  status: string
  createdAt: string
  user?: {
    phone?: string
    name?: string
  }
  plan?: {
    name: string
    product?: {
      name: string
    }
  }
}

interface RecentUser {
  id: string
  phone: string | null
  name: string | null
  role: string
  createdAt: string
  _count: {
    orders: number
  }
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
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

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOverview = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/overview')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setRecentOrders(data.recentOrders || [])
        setRecentUsers(data.recentUsers || [])
      } else {
        toast.error(data.error || 'خطا در دریافت اطلاعات داشبورد.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='border-primary/30 bg-primary/10 text-primary font-semibold gap-1'>
            <Shield className='size-3' />
            مدیریت سیستم
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchOverview}
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
        {/* Welcome Banner */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/15 p-5'>
          <div>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
              داشبورد مدیریت و آمار فروش
            </h1>
            <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
              نمای کلی شاخص‌های کلیدی کسب‌وکار، سفارش‌ها، کاربران و موجودی انبار لینک‌ها
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/dashboard/activation-links'>
              <Button size='sm' className='gap-1.5 text-xs font-semibold'>
                <LinkIcon className='size-3.5' />
                <span>افزودن لینک فعال‌سازی</span>
              </Button>
            </Link>
            <Link href='/dashboard/orders'>
              <Button variant='outline' size='sm' className='gap-1.5 text-xs'>
                <Package className='size-3.5' />
                <span>مشاهده سفارش‌ها</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        {loading && !stats ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='size-8 animate-spin text-primary' />
          </div>
        ) : stats ? (
          <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Revenue */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-xs font-medium text-muted-foreground'>
                  درآمد کل
                </CardTitle>
                <div className='size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center'>
                  <TrendingUp className='size-4' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
                  {formatPrice(stats.totalRevenue)}
                </div>
                <p className='text-[11px] text-muted-foreground mt-1'>
                  فروش تاییدشده و موفق
                </p>
              </CardContent>
            </Card>

            {/* Total Orders */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-xs font-medium text-muted-foreground'>
                  سفارش‌های موفق
                </CardTitle>
                <div className='size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center'>
                  <CheckCircle2 className='size-4' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
                  {stats.successfulOrders.toLocaleString('fa-IR')}{' '}
                  <span className='text-xs font-normal text-muted-foreground'>
                    از {stats.totalOrders.toLocaleString('fa-IR')} کل
                  </span>
                </div>
                <div className='flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground'>
                  <Clock className='size-3 text-primary' />
                  <span>{stats.pendingOrders.toLocaleString('fa-IR')} در انتظار پرداخت</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Users */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-xs font-medium text-muted-foreground'>
                  کل کاربران
                </CardTitle>
                <div className='size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center'>
                  <Users className='size-4' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
                  {stats.totalUsers.toLocaleString('fa-IR')}
                </div>
                <p className='text-[11px] text-muted-foreground mt-1'>
                  {stats.newUsers.toLocaleString('fa-IR')} کاربر جدید ۷ روز اخیر
                </p>
              </CardContent>
            </Card>

            {/* Available Links Inventory */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-xs font-medium text-muted-foreground'>
                  موجودی لینک‌های فعال
                </CardTitle>
                <div className='size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center'>
                  <Layers className='size-4' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-xl sm:text-2xl font-bold tracking-tight text-primary'>
                  {stats.availableLinks.toLocaleString('fa-IR')}{' '}
                  <span className='text-xs font-normal text-muted-foreground'>لینک موجود</span>
                </div>
                <p className='text-[11px] text-muted-foreground mt-1'>
                  {stats.usedLinks.toLocaleString('fa-IR')} لینک مصرف‌شده
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Link Inventory Status Bar */}
        {stats && (
          <Card className='border-border/60 shadow-xs'>
            <CardHeader className='py-4'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                  <LinkIcon className='size-4 text-primary' />
                  <span>وضعیت انبار و گردش لینک‌های فعال‌سازی</span>
                </CardTitle>
                <Link href='/dashboard/activation-links'>
                  <Button variant='ghost' size='sm' className='text-xs gap-1 h-7 text-primary'>
                    <span>مدیریت کامل لینک‌ها</span>
                    <ArrowUpRight className='size-3' />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className='pt-0 pb-4'>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                <div className='rounded-xl border border-primary/25 bg-primary/5 p-3'>
                  <span className='text-xs text-muted-foreground'>موجود (آماده تحویل)</span>
                  <div className='text-lg font-bold text-primary mt-0.5'>
                    {stats.availableLinks.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className='rounded-xl border border-primary/15 bg-primary/5 p-3'>
                  <span className='text-xs text-muted-foreground'>رزرو شده</span>
                  <div className='text-lg font-bold text-primary mt-0.5'>
                    {stats.reservedLinks.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className='rounded-xl border border-border/80 bg-muted/30 p-3'>
                  <span className='text-xs text-muted-foreground'>مصرف شده (تحویل شده)</span>
                  <div className='text-lg font-bold text-foreground mt-0.5'>
                    {stats.usedLinks.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className='rounded-xl border border-border/60 bg-muted/20 p-3'>
                  <span className='text-xs text-muted-foreground'>نامعتبر / منقضی</span>
                  <div className='text-lg font-bold text-muted-foreground mt-0.5'>
                    {stats.invalidLinks.toLocaleString('fa-IR')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Columns: Recent Orders & Recent Users */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Recent Orders (2 cols) */}
          <Card className='lg:col-span-2 border-border/60 shadow-xs'>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='text-base font-bold'>آخرین سفارش‌ها</CardTitle>
                <CardDescription className='text-xs'>
                  وضعیت سفارش‌های اخیر ثبت‌شده در سامانه
                </CardDescription>
              </div>
              <Link href='/dashboard/orders'>
                <Button variant='outline' size='sm' className='text-xs h-8'>
                  مشاهده همه
                </Button>
              </Link>
            </CardHeader>
            <CardContent className='pt-0'>
              {recentOrders.length === 0 ? (
                <div className='py-8 text-center text-xs text-muted-foreground'>
                  هنوز هیچ سفارشی ثبت نشده است.
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-xs text-start'>
                    <thead>
                      <tr className='border-b border-border/50 text-muted-foreground'>
                        <th className='py-2.5 text-start font-medium'>شناسه</th>
                        <th className='py-2.5 text-start font-medium'>کاربر</th>
                        <th className='py-2.5 text-start font-medium'>پلن</th>
                        <th className='py-2.5 text-start font-medium'>مبلغ</th>
                        <th className='py-2.5 text-start font-medium'>وضعیت</th>
                        <th className='py-2.5 text-start font-medium'>زمان</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/40'>
                      {recentOrders.map((ord) => (
                        <tr key={ord.id} className='hover:bg-muted/30 transition-colors'>
                          <td className='py-3 font-sans font-medium text-foreground/80'>
                            {ord.id.slice(-6)}
                          </td>
                          <td className='py-3 font-medium'>
                            {ord.user?.name || ord.user?.phone || 'کاربر'}
                          </td>
                          <td className='py-3 text-muted-foreground'>
                            {ord.plan?.name || 'جمینای ۱۸ ماهه'}
                          </td>
                          <td className='py-3 font-bold text-foreground'>
                            {formatPrice(ord.amount)}
                          </td>
                          <td className='py-3'>
                            {ord.status === 'COMPLETED' || ord.status === 'PAID' ? (
                              <Badge variant='outline' className='border-primary/30 bg-primary/10 text-primary text-[10px] font-medium'>
                                موفق
                              </Badge>
                            ) : ord.status === 'PENDING_PAYMENT' ? (
                              <Badge variant='outline' className='border-border/80 bg-muted/50 text-muted-foreground text-[10px] font-medium'>
                                در انتظار
                              </Badge>
                            ) : (
                              <Badge variant='outline' className='border-border/80 bg-muted/40 text-muted-foreground text-[10px] font-medium'>
                                ناموفق
                              </Badge>
                            )}
                          </td>
                          <td className='py-3 text-muted-foreground text-[11px]'>
                            {formatDate(ord.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Users (1 col) */}
          <Card className='border-border/60 shadow-xs'>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='text-base font-bold'>کاربران اخیر</CardTitle>
                <CardDescription className='text-xs'>
                  افرادی که اخیراً در سامانه ثبت‌نام کرده‌اند
                </CardDescription>
              </div>
              <Link href='/dashboard/users'>
                <Button variant='outline' size='sm' className='text-xs h-8'>
                  مشاهده همه
                </Button>
              </Link>
            </CardHeader>
            <CardContent className='pt-0'>
              {recentUsers.length === 0 ? (
                <div className='py-8 text-center text-xs text-muted-foreground'>
                  هنوز کاربری ثبت نشده است.
                </div>
              ) : (
                <div className='space-y-3'>
                  {recentUsers.map((u) => (
                    <div
                      key={u.id}
                      className='flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors'
                    >
                      <div className='flex items-center gap-2.5'>
                        <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs'>
                          {u.name?.trim() ? u.name.trim().charAt(0) : <Users className='size-3.5' />}
                        </div>
                        <div>
                          <div className='flex items-center gap-1.5'>
                            <span className='text-xs font-bold text-foreground'>
                              {u.name || u.phone || 'کاربر'}
                            </span>
                            {u.role === 'ADMIN' && (
                              <Badge className='bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0'>
                                ادمین
                              </Badge>
                            )}
                          </div>
                          <span className='text-[10px] text-muted-foreground font-sans tabular-nums'>
                            {u.phone || 'ورود تلگرام'}
                          </span>
                        </div>
                      </div>
                      <div className='text-end'>
                        <span className='text-[11px] font-semibold text-primary block'>
                          {u._count.orders.toLocaleString('fa-IR')} سفارش
                        </span>
                        <span className='text-[10px] text-muted-foreground block'>
                          {formatDate(u.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
