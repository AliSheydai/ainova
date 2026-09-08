'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Clock,
  Package,
  AlertCircle,
  Loader2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface OrderDetails {
  id: string
  amount: number
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  createdAt: string
  plan: {
    name: string
    duration: number
    product: {
      name: string
    }
  }
  payment?: {
    gatewayName: string
    refId: string | null
    authority: string | null
    status: string
    paidAt: string | null
  } | null
  activationLink?: {
    url: string
    status: string
    assignedAt: string | null
  } | null
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const statusParam = searchParams.get('status')

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [pollCount, setPollCount] = useState(0)

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.order) {
          setOrder(data.order)
        }
      } else if (res.status === 401) {
        toast.error('برای مشاهده جزئیات سفارش ابتدا وارد حساب شوید.')
      } else {
        toast.error('سفارش مورد نظر یافت نشد.')
      }
    } catch {
      toast.error('خطا در برقراری ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  // If order is still processing, poll every 2 seconds up to 5 times
  useEffect(() => {
    if (order && order.status === 'PENDING_PAYMENT' && pollCount < 5) {
      const timer = setTimeout(() => {
        setPollCount((p) => p + 1)
        fetchOrder()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [order, pollCount])

  const copyActivationLink = () => {
    if (!order?.activationLink?.url) return
    navigator.clipboard.writeText(order.activationLink.url)
    setCopied(true)
    toast.success('لینک فعال‌سازی با موفقیت کپی شد.')
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-3'>
        <Loader2 className='size-10 animate-spin text-primary' />
        <p className='text-sm text-muted-foreground'>در حال بارگذاری اطلاعات سفارش و دریافت لینک فعال‌سازی...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className='container mx-auto max-w-md py-16 px-4 text-center'>
        <Card className='p-8 border-border/70 shadow-lg'>
          <AlertCircle className='mx-auto size-12 text-amber-500 mb-4' />
          <h2 className='text-lg font-bold'>سفارش یافت نشد</h2>
          <p className='text-xs text-muted-foreground mt-2 mb-6'>
            شناسه سفارش معتبر نیست یا دسترسی به آن امکان‌پذیر نمی‌باشد.
          </p>
          <Link href='/'>
            <Button className='w-full'>بازگشت به صفحه اصلی</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const isCompleted = order.status === 'COMPLETED' && Boolean(order.activationLink?.url)
  const isStockWaiting = order.status === 'PAID' || statusParam === 'stock_waiting'

  return (
    <div className='container mx-auto max-w-2xl px-4 py-8 sm:py-12'>
      <Card className='relative overflow-hidden border-border/70 shadow-2xl backdrop-blur-md bg-card/95'>
        {/* Glow Top Highlight Bar */}
        <div
          className={`absolute left-0 right-0 top-0 h-1.5 ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
              : isStockWaiting
              ? 'bg-gradient-to-r from-blue-500 via-amber-400 to-blue-500'
              : 'bg-gradient-to-r from-amber-500 to-primary'
          }`}
        />

        <CardHeader className='text-center pb-4 pt-8'>
          {/* Status Icon */}
          <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-inner'>
            <CheckCircle2 className='size-9' />
          </div>

          <Badge
            variant='outline'
            className='mx-auto mb-2 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3.5 py-1'
          >
            <Sparkles className='size-3.5' />
            پرداخت با موفقیت انجام شد ✅
          </Badge>

          <CardTitle className='text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2'>
            {isCompleted ? 'سفارش شما تکمیل شد' : 'پرداخت شما تأیید شد'}
          </CardTitle>

          <CardDescription className='text-xs sm:text-sm text-muted-foreground mt-1.5'>
            {isCompleted
              ? 'لینک اختصاصی فعال‌سازی Google AI Pro برای حساب شخصی شما آماده است.'
              : 'پرداخت با موفقیت در سیستم ثبت شد و سفارش در صف صدور قرار گرفت.'}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6 pt-2'>
          {/* Order Brief Summary */}
          <div className='rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-5'>
            <div className='grid grid-cols-2 gap-3 text-xs'>
              <div>
                <span className='text-muted-foreground block text-[11px]'>محصول خریداری‌شده:</span>
                <span className='font-bold text-foreground text-sm mt-0.5 block'>
                  {order.plan?.product?.name || 'جمینای'} ({order.plan?.name || 'اشتراک ۱۸ ماهه'})
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px]'>مبلغ پرداختی:</span>
                <span className='font-extrabold text-primary text-sm mt-0.5 block'>
                  {new Intl.NumberFormat('fa-IR').format(order.amount)} تومان
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px]'>شماره پیگیری سفارش:</span>
                <span className='font-mono font-bold text-foreground text-xs mt-0.5 block select-all'>
                  {order.id}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px]'>کد پیگیری پرداخت (RefId):</span>
                <span className='font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block select-all'>
                  {order.payment?.refId || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN ACTIVATION LINK SECTION */}
          {isCompleted && order.activationLink?.url ? (
            <div className='rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent p-5 sm:p-6 shadow-sm'>
              <div className='flex items-center justify-between gap-2 mb-3'>
                <div className='flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400'>
                  <Sparkles className='size-4 text-emerald-500 animate-pulse' />
                  <span>لینک اختصاصی فعال‌سازی اشتراک شما:</span>
                </div>
                <Badge variant='outline' className='text-[10px] bg-background/70 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'>
                  آماده استفاده
                </Badge>
              </div>

              {/* URL Display Box */}
              <div className='relative flex flex-col gap-3'>
                <div
                  dir='ltr'
                  className='w-full overflow-x-auto rounded-xl border border-emerald-500/40 bg-background/90 p-3.5 text-xs font-mono text-foreground shadow-inner select-all focus:outline-none'
                >
                  {order.activationLink.url}
                </div>

                {/* Actions */}
                <div className='flex flex-col sm:flex-row items-center gap-2.5 pt-1'>
                  <Button
                    onClick={copyActivationLink}
                    variant='outline'
                    className='w-full sm:w-1/2 h-11 text-xs font-semibold gap-2 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 cursor-pointer'
                  >
                    {copied ? (
                      <>
                        <Check className='size-4 text-emerald-500' />
                        لینک با موفقیت کپی شد
                      </>
                    ) : (
                      <>
                        <Copy className='size-4' />
                        کپی لینک فعال‌سازی
                      </>
                    )}
                  </Button>

                  <a
                    href={order.activationLink.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-full sm:w-1/2'
                  >
                    <Button className='w-full h-11 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 cursor-pointer'>
                      <ExternalLink className='size-4' />
                      فعال‌سازی مستقیم در گوگل
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ) : isStockWaiting ? (
            /* Stock Waiting Box */
            <div className='rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-start space-y-2.5'>
              <div className='flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400'>
                <Clock className='size-4' />
                <span>در حال تامین لینک فعال‌سازی (وضعیت: PAID)</span>
              </div>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                پرداخت شما با موفقیت تایید شده است. به دلیل تقاضای بالا، لینک فعال‌سازی شما به زودی توسط سیستم به سفارشتان تخصیص داده خواهد شد و از طریق پنل کاربری یا پیامک در اختیارتان قرار می‌گیرد.
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchOrder}
                className='text-xs gap-1.5 mt-2 border-blue-500/40 text-blue-600'
              >
                <RefreshCw className='size-3.5' />
                بررسی مجدد وضعیت
              </Button>
            </div>
          ) : null}

          {/* Step-by-Step Instructions */}
          <div className='rounded-2xl border border-border/70 bg-card p-4 sm:p-5 space-y-3'>
            <h4 className='text-xs font-bold text-foreground flex items-center gap-2'>
              <HelpCircle className='size-4 text-primary' />
              <span>راهنمای سریع فعال‌سازی:</span>
            </h4>
            <ol className='space-y-2 text-xs text-muted-foreground list-decimal list-inside pr-1 leading-relaxed'>
              <li>ابتدا فیلترشکن خود را با IP ترجیحاً ثابت و مطمئن (آمریکا یا اروپا) روشن نمایید.</li>
              <li>لینک فعال‌سازی بالا را باز کنید یا روی دکمه «فعال‌سازی مستقیم در گوگل» کلیک نمایید.</li>
              <li>وارد حساب شخصی جیمیل (Google) خود شوید و پیشنهاد فعال‌سازی اشتراک را تایید کنید.</li>
              <li>اکنون هوش مصنوعی Google AI Pro و امکانات Gemini با موفقیت روی اکانت شما فعال است.</li>
            </ol>
          </div>

          {/* Navigation Links */}
          <div className='flex flex-col sm:flex-row items-center justify-between gap-3 pt-2'>
            <Link href='/' className='w-full sm:w-auto'>
              <Button variant='ghost' size='sm' className='w-full text-xs text-muted-foreground gap-1.5'>
                <ArrowRight className='size-3.5' />
                <span>بازگشت به صفحه اصلی</span>
              </Button>
            </Link>

            <Link href='/dashboard' className='w-full sm:w-auto'>
              <Button variant='outline' size='sm' className='w-full text-xs gap-1.5'>
                <Package className='size-3.5' />
                <span>مشاهده در تاریخچه سفارش‌ها</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className='min-h-screen bg-background text-foreground flex flex-col font-sans' dir='rtl'>
      {/* Top Bar */}
      <header className='border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
          <Link href='/' className='flex items-center gap-2.5'>
            <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
              <Sparkles className='size-4' />
            </div>
            <span className='text-base font-bold text-foreground'>جمینای</span>
          </Link>

          <div className='flex items-center gap-3'>
            <ThemeSwitch />
            <Link href='/'>
              <Button variant='ghost' size='sm' className='text-xs flex items-center gap-1.5'>
                <ArrowRight className='size-4' />
                <span>صفحه اصلی</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className='flex-1 flex items-center justify-center'>
        <Suspense
          fallback={
            <div className='flex min-h-[60vh] items-center justify-center'>
              <Loader2 className='size-8 animate-spin text-primary' />
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  )
}
