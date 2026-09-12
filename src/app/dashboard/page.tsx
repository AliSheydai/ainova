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
import { motion } from 'framer-motion'
import { fadeUp, fadeIn, staggerContainer } from '@/lib/motion'

interface OverviewStats {
  totalProducts?: number
  activeProducts?: number
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
  product?: {
    id: string
    title: string
    name: string
    slug: string
  } | null
  plan?: {
    name: string
    product?: {
      name: string
    }
  } | null
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

  const fetchOverview = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const url = forceRefresh ? '/api/admin/overview?refresh=true' : '/api/admin/overview'
      const res = await fetch(url)
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
        <div className='hidden sm:flex items-center gap-2 min-w-0'>
          <Badge variant='outline' className='border-primary/30 bg-primary/10 text-primary font-semibold gap-1 text-[11px] sm:text-xs py-0.5 sm:py-1 shrink-0'>
            <Shield className='size-3' />
            <span>مدیریت سیستم</span>
          </Badge>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchOverview(true)}
            disabled={loading}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3'
            title='بروزرسانی داده‌ها'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='p-3.5 sm:p-6'>
        <div className='flex flex-col gap-5 sm:gap-6 w-full min-w-0'>
          {/* Welcome Banner */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/15 p-4 sm:p-5'>
            <div className='min-w-0'>
              <h1 className='text-lg sm:text-2xl font-bold tracking-tight text-foreground'>
                داشبورد مدیریت و آمار فروش
              </h1>
              <p className='text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed'>
                نمای کلی شاخص‌های کلیدی کسب‌وکار، سفارش‌ها، کاربران و موجودی انبار لینک‌ها
              </p>
            </div>
            <div className='flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0'>
              <Link href='/dashboard/activation-links' className='w-full sm:w-auto'>
                <Button size='sm' className='w-full sm:w-auto gap-1.5 text-xs font-semibold justify-center'>
                  <LinkIcon className='size-3.5' />
                  <span>افزودن لینک فعال‌سازی</span>
                </Button>
              </Link>
              <Link href='/dashboard/orders' className='w-full sm:w-auto'>
                <Button variant='outline' size='sm' className='w-full sm:w-auto gap-1.5 text-xs justify-center'>
                  <Package className='size-3.5' />
                  <span>مشاهده سفارش‌ها</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* KPI Cards Grid */}
          {loading && !stats ? (
            <div
              className='flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground'
              role='status'
              aria-live='polite'
            >
              <Loader2 className='size-8 animate-spin text-primary' aria-hidden='true' />
              <span className='text-xs'>در حال بارگذاری آمار و اطلاعات داشبورد...</span>
            </div>
          ) : stats ? (
            <motion.div
              className='grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'
              variants={staggerContainer(0.05)}
              initial='hidden'
              animate='visible'
            >
              {/* Revenue */}
              <motion.div variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className='border-border/60 shadow-xs h-full flex flex-col justify-between'>
                  <CardHeader className='flex flex-row items-center justify-between p-3.5 sm:p-5 pb-1 sm:pb-2'>
                    <CardTitle className='text-xs font-medium text-muted-foreground'>
                      درآمد کل
                    </CardTitle>
                    <div className='size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                      <TrendingUp className='size-3.5 sm:size-4' />
                    </div>
                  </CardHeader>
                  <CardContent className='p-3.5 sm:p-5 pt-0 sm:pt-0'>
                    <div className='text-lg xs:text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate' title={formatPrice(stats.totalRevenue)}>
                      {formatPrice(stats.totalRevenue)}
                    </div>
                    <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate'>
                      فروش تاییدشده و موفق
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Total Orders */}
              <motion.div variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className='border-border/60 shadow-xs h-full flex flex-col justify-between'>
                  <CardHeader className='flex flex-row items-center justify-between p-3.5 sm:p-5 pb-1 sm:pb-2'>
                    <CardTitle className='text-xs font-medium text-muted-foreground'>
                      سفارش‌های موفق
                    </CardTitle>
                    <div className='size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                      <CheckCircle2 className='size-3.5 sm:size-4' />
                    </div>
                  </CardHeader>
                  <CardContent className='p-3.5 sm:p-5 pt-0 sm:pt-0'>
                    <div className='text-lg xs:text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
                      {stats.successfulOrders.toLocaleString('fa-IR')}{' '}
                      <span className='text-xs font-normal text-muted-foreground'>
                        از {stats.totalOrders.toLocaleString('fa-IR')} کل
                      </span>
                    </div>
                    <div className='flex items-center gap-1.5 mt-1 text-[10px] sm:text-[11px] text-muted-foreground truncate'>
                      <Clock className='size-3 text-primary shrink-0' />
                      <span className='truncate'>{stats.pendingOrders.toLocaleString('fa-IR')} در انتظار پرداخت</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Total Users */}
              <motion.div variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className='border-border/60 shadow-xs h-full flex flex-col justify-between'>
                  <CardHeader className='flex flex-row items-center justify-between p-3.5 sm:p-5 pb-1 sm:pb-2'>
                    <CardTitle className='text-xs font-medium text-muted-foreground'>
                      کل کاربران
                    </CardTitle>
                    <div className='size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                      <Users className='size-3.5 sm:size-4' />
                    </div>
                  </CardHeader>
                  <CardContent className='p-3.5 sm:p-5 pt-0 sm:pt-0'>
                    <div className='text-lg xs:text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
                      {stats.totalUsers.toLocaleString('fa-IR')}
                    </div>
                    <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate'>
                      {stats.newUsers.toLocaleString('fa-IR')} کاربر جدید ۷ روز اخیر
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Available Links Inventory */}
              <motion.div variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Card className='border-border/60 shadow-xs h-full flex flex-col justify-between'>
                  <CardHeader className='flex flex-row items-center justify-between p-3.5 sm:p-5 pb-1 sm:pb-2'>
                    <CardTitle className='text-xs font-medium text-muted-foreground'>
                      موجودی لینک‌های فعال
                    </CardTitle>
                    <div className='size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                      <Layers className='size-3.5 sm:size-4' />
                    </div>
                  </CardHeader>
                  <CardContent className='p-3.5 sm:p-5 pt-0 sm:pt-0'>
                    <div className='text-lg xs:text-xl sm:text-2xl font-bold tracking-tight text-primary'>
                      {stats.availableLinks.toLocaleString('fa-IR')}{' '}
                      <span className='text-xs font-normal text-muted-foreground'>لینک موجود</span>
                    </div>
                    <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate'>
                      {stats.usedLinks.toLocaleString('fa-IR')} لینک مصرف‌شده
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ) : null}

          {/* Link Inventory Status Bar */}
          {stats && (
            <motion.div variants={fadeUp} initial='hidden' animate='visible'>
              <Card className='border-border/60 shadow-xs'>
                <CardHeader className='p-3.5 sm:p-5 pb-3 sm:pb-4'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5'>
                    <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                      <LinkIcon className='size-4 text-primary shrink-0' />
                      <span>وضعیت انبار و گردش لینک‌های فعال‌سازی</span>
                    </CardTitle>
                    <Link href='/dashboard/activation-links' className='self-start sm:self-auto'>
                      <Button variant='ghost' size='sm' className='text-xs gap-1 h-7 text-primary p-0 sm:px-2'>
                        <span>مدیریت کامل لینک‌ها</span>
                        <ArrowUpRight className='size-3 rtl:rotate-180' />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className='p-3.5 sm:p-5 pt-0'>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3'>
                    <div className='rounded-xl border border-primary/25 bg-primary/5 p-2.5 sm:p-3'>
                      <span className='text-[11px] sm:text-xs text-muted-foreground line-clamp-1'>موجود (آماده تحویل)</span>
                      <div className='text-base sm:text-lg font-bold text-primary mt-0.5 tabular-nums'>
                        {stats.availableLinks.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className='rounded-xl border border-primary/15 bg-primary/5 p-2.5 sm:p-3'>
                      <span className='text-[11px] sm:text-xs text-muted-foreground line-clamp-1'>رزرو شده</span>
                      <div className='text-base sm:text-lg font-bold text-primary mt-0.5 tabular-nums'>
                        {stats.reservedLinks.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className='rounded-xl border border-border/80 bg-muted/30 p-2.5 sm:p-3'>
                      <span className='text-[11px] sm:text-xs text-muted-foreground line-clamp-1'>مصرف شده</span>
                      <div className='text-base sm:text-lg font-bold text-foreground mt-0.5 tabular-nums'>
                        {stats.usedLinks.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className='rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3'>
                      <span className='text-[11px] sm:text-xs text-muted-foreground line-clamp-1'>نامعتبر / منقضی</span>
                      <div className='text-base sm:text-lg font-bold text-muted-foreground mt-0.5 tabular-nums'>
                        {stats.invalidLinks.toLocaleString('fa-IR')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Two Columns: Recent Orders & Recent Users */}
          <motion.div
            className='grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6'
            variants={fadeUp}
            initial='hidden'
            animate='visible'
          >
            {/* Recent Orders (2 cols) */}
            <Card className='lg:col-span-2 border-border/60 shadow-xs'>
              <CardHeader className='flex flex-row items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4'>
                <div>
                  <CardTitle className='text-sm sm:text-base font-bold'>آخرین سفارش‌ها</CardTitle>
                  <CardDescription className='text-xs'>
                    وضعیت سفارش‌های اخیر ثبت‌شده در سامانه
                  </CardDescription>
                </div>
                <Link href='/dashboard/orders'>
                  <Button variant='outline' size='sm' className='text-xs h-7 sm:h-8 px-2.5 sm:px-3'>
                    مشاهده همه
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className='p-4 sm:p-6 pt-0 sm:pt-0'>
                {recentOrders.length === 0 ? (
                  <div className='py-8 text-center text-xs text-muted-foreground'>
                    هنوز هیچ سفارشی ثبت نشده است.
                  </div>
                ) : (
                  <>
                    {/* Mobile Order Cards (block md:hidden) */}
                    <div className='space-y-2.5 md:hidden'>
                      {recentOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className='rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2'
                        >
                          <div className='flex items-center justify-between text-xs'>
                            <div className='flex items-center gap-1.5'>
                              <span className='font-mono font-bold text-foreground/90 bg-muted px-1.5 py-0.5 rounded text-[11px]'>
                                #{ord.id.slice(-6)}
                              </span>
                              <span className='text-[11px] text-muted-foreground truncate max-w-[120px]'>
                                {ord.plan?.name || 'جمینای ۱۸ ماهه'}
                              </span>
                            </div>
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
                          </div>
                          <div className='flex items-center justify-between text-xs pt-1 border-t border-border/30'>
                            <span className='font-medium text-foreground truncate max-w-[140px]'>
                              {ord.user?.name || ord.user?.phone || 'کاربر'}
                            </span>
                            <span className='font-bold text-primary tabular-nums'>
                              {formatPrice(ord.amount)}
                            </span>
                          </div>
                          <div className='flex items-center justify-between text-[10px] text-muted-foreground'>
                            <span className='flex items-center gap-1'>
                              <Clock className='size-2.5' />
                              {formatDate(ord.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop / Tablet Table (hidden md:block) */}
                    <div className='hidden md:block overflow-x-auto'>
                      <table className='w-full min-w-[550px] text-xs text-start'>
                        <thead>
                          <tr className='border-b border-border/50 text-muted-foreground'>
                            <th className='py-2.5 text-start font-medium'>شناسه</th>
                            <th className='py-2.5 text-start font-medium'>کاربر</th>
                            <th className='py-2.5 text-start font-medium'>محصول</th>
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
                              <td className='py-3 font-medium text-foreground'>
                                {ord.product?.title || ord.product?.name || ord.plan?.name || 'محصول'}
                              </td>
                              <td className='py-3 font-bold text-foreground tabular-nums'>
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
                              <td className='py-3 text-muted-foreground text-[11px] tabular-nums'>
                                {formatDate(ord.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Users (1 col) */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='flex flex-row items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4'>
                <div>
                  <CardTitle className='text-sm sm:text-base font-bold'>کاربران اخیر</CardTitle>
                  <CardDescription className='text-xs'>
                    افرادی که اخیراً در سامانه ثبت‌نام کرده‌اند
                  </CardDescription>
                </div>
                <Link href='/dashboard/users'>
                  <Button variant='outline' size='sm' className='text-xs h-7 sm:h-8 px-2.5 sm:px-3'>
                    مشاهده همه
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className='p-4 sm:p-6 pt-0 sm:pt-0'>
                {recentUsers.length === 0 ? (
                  <div className='py-8 text-center text-xs text-muted-foreground'>
                    هنوز کاربری ثبت نشده است.
                  </div>
                ) : (
                  <div className='space-y-2.5 sm:space-y-3'>
                    {recentUsers.map((u) => (
                      <div
                        key={u.id}
                        className='flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors gap-2'
                      >
                        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                          <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs'>
                            {u.name?.trim() ? u.name.trim().charAt(0) : <Users className='size-3.5' />}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-1.5'>
                              <span className='text-xs font-bold text-foreground truncate'>
                                {u.name || u.phone || 'کاربر'}
                              </span>
                              {u.role === 'ADMIN' && (
                                <Badge className='bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0 shrink-0'>
                                  ادمین
                                </Badge>
                              )}
                            </div>
                            <span className='text-[10px] text-muted-foreground font-sans tabular-nums block truncate'>
                              {u.phone || 'ورود تلگرام'}
                            </span>
                          </div>
                        </div>
                        <div className='text-end shrink-0'>
                          <span className='text-[11px] font-semibold text-primary block'>
                            {u._count.orders.toLocaleString('fa-IR')} سفارش
                          </span>
                          <span className='text-[10px] text-muted-foreground block tabular-nums'>
                            {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Main>
    </>
  )
}
