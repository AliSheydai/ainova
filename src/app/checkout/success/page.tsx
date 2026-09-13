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
  Eye,
  EyeOff,
  User,
  Key,
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
  fulfillmentStatus?: string
  createdAt: string
  checkoutData?: any
  product?: {
    id: string
    title: string
    name: string
  } | null
  plan?: {
    id: string
    name: string
    duration: number
    product: {
      name: string
    }
  } | null
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
  delivery?: {
    type: string
    status: string
    data: any
    deliveredAt: string | null
  } | null
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const statusParam = searchParams.get('status')

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedUser, setCopiedUser] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  // If order is still processing, poll every 2.5 seconds up to 4 times
  useEffect(() => {
    if (order && order.status === 'PENDING_PAYMENT' && pollCount < 4) {
      const timer = setTimeout(() => {
        setPollCount((p) => p + 1)
        fetchOrder()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [order, pollCount])

  const copyText = (text: string, type: 'link' | 'user' | 'pass') => {
    navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else if (type === 'user') {
      setCopiedUser(true)
      setTimeout(() => setCopiedUser(false), 2000)
    } else if (type === 'pass') {
      setCopiedPass(true)
      setTimeout(() => setCopiedPass(false), 2000)
    }
    toast.success('کپی شد.')
  }

  if (loading) {
    return (
      <div
        className='flex min-h-[60vh] flex-col items-center justify-center gap-3'
        role='status'
        aria-live='polite'
      >
        <Loader2 className='size-10 animate-spin text-primary' aria-hidden='true' />
        <p className='text-sm text-muted-foreground'>در حال دریافت اطلاعات سفارش و تحویل اشتراک...</p>
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

  const deliveryData = (order.delivery?.data as Record<string, any>) || {}
  const deliveryType = order.delivery?.type || (order.activationLink ? 'ACTIVATION_LINK' : 'MANUAL')
  const isCompleted = order.status === 'COMPLETED'
  const isManualPending = order.status === 'PAID' && (deliveryType === 'MANUAL' || statusParam === 'awaiting_manual')
  const isStockWaiting = order.status === 'PAID' && statusParam === 'stock_waiting' && !isManualPending

  const linkUrl = deliveryData.url || order.activationLink?.url

  const productName =
    order.product?.title ||
    order.product?.name ||
    order.plan?.product?.name ||
    'اشتراک هوش مصنوعی'

  const planName = order.plan?.name || ''

  return (
    <div className='container relative mx-auto max-w-2xl px-3.5 sm:px-4 py-6 sm:py-12'>
      {/* Background Ambient Glow */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-1/2 top-10 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/8 blur-3xl' />
        <div className='absolute bottom-10 right-10 h-[300px] w-[400px] rounded-full bg-primary/5 blur-3xl' />
      </div>

      <Card className='relative overflow-hidden border border-border/70 shadow-2xl backdrop-blur-xl bg-card/95 rounded-2xl'>
        {/* Glow Top Highlight Bar */}
        <div className='absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70' />

        <CardHeader className='text-center pb-4 pt-6 sm:pt-8 px-4 sm:px-6'>
          {/* Status Icon */}
          <div className='mx-auto mb-3 sm:mb-4 flex size-14 sm:size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-inner'>
            <CheckCircle2 className='size-8 sm:size-9' />
          </div>

          <div className='flex justify-center'>
            <Badge
              variant='outline'
              className='gap-1.5 border-primary/30 bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold px-3 sm:px-3.5 py-1 rounded-full'
            >
              <Sparkles className='size-3.5 text-primary' />
              پرداخت با موفقیت انجام شد
            </Badge>
          </div>

          <CardTitle className='text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-3'>
            {isCompleted ? 'سفارش شما تکمیل شد' : 'پرداخت شما تأیید شد'}
          </CardTitle>

          <CardDescription className='text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed'>
            {isCompleted
              ? 'اطلاعات فعال‌سازی و دسترسی به محصول شما آماده استفاده است.'
              : 'پرداخت با موفقیت در سیستم ثبت شد و سفارش در حال پردازش می‌باشد.'}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-5 sm:space-y-6 pt-2 px-4 sm:px-6'>
          {/* Order Brief Summary */}
          <div className='rounded-2xl border border-border/70 bg-muted/30 p-3.5 sm:p-5'>
            <div className='grid grid-cols-2 gap-3 sm:gap-3.5 text-xs sm:text-sm'>
              <div>
                <span className='text-muted-foreground block text-[11px] sm:text-xs'>محصول خریداری‌شده:</span>
                <span className='font-bold text-foreground text-xs sm:text-sm mt-0.5 block truncate'>
                  {productName} {planName ? `(${planName})` : ''}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px] sm:text-xs'>مبلغ پرداختی:</span>
                <span className='font-extrabold text-primary text-xs sm:text-sm mt-0.5 block font-sans'>
                  {new Intl.NumberFormat('fa-IR').format(order.amount)} تومان
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px] sm:text-xs'>شناسه سفارش:</span>
                <span className='font-mono font-bold text-foreground text-xs sm:text-sm mt-0.5 block select-all truncate'>
                  {order.id}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground block text-[11px] sm:text-xs'>کد پیگیری بانکی (RefId):</span>
                <span className='font-mono font-bold text-primary text-xs sm:text-sm mt-0.5 block select-all truncate'>
                  {order.payment?.refId || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* DYNAMIC DELIVERY DISPLAY BASED ON TYPE */}

          {/* 1. ACTIVATION LINK */}
          {isCompleted && (deliveryType === 'ACTIVATION_LINK' || linkUrl) && (
            <div className='rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 shadow-sm'>
              <div className='flex items-center justify-between gap-2 mb-3'>
                <div className='flex items-center gap-2 text-xs sm:text-sm font-bold text-primary'>
                  <span>لینک اختصاصی فعال‌سازی اشتراک:</span>
                </div>
                <Badge variant='outline' className='text-[10px] sm:text-[11px] bg-background/80 border-primary/30 text-primary'>
                  آماده استفاده
                </Badge>
              </div>

              <div className='relative flex flex-col gap-3'>
                <div
                  dir='ltr'
                  className='w-full overflow-x-auto rounded-xl border border-primary/30 bg-background/90 p-3 sm:p-3.5 text-xs sm:text-sm font-mono text-foreground shadow-inner select-all focus:outline-none'
                >
                  {linkUrl}
                </div>

                <div className='flex flex-col sm:flex-row items-center gap-2.5 pt-1'>
                  <Button
                    onClick={() => copyText(linkUrl!, 'link')}
                    variant='outline'
                    className='w-full sm:w-1/2 h-10 sm:h-11 text-xs sm:text-sm font-semibold gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary cursor-pointer rounded-xl transition-all'
                  >
                    {copiedLink ? (
                      <>
                        <Check className='size-4 text-primary' />
                        لینک کپی شد
                      </>
                    ) : (
                      <>
                        <Copy className='size-4' />
                        کپی لینک فعال‌سازی
                      </>
                    )}
                  </Button>

                  <a
                    href={linkUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-full sm:w-1/2'
                  >
                    <Button className='w-full h-10 sm:h-11 text-xs sm:text-sm font-bold gap-2 shadow-md shadow-primary/20 cursor-pointer rounded-xl transition-all'>
                      <ExternalLink className='size-4' />
                      فعال‌سازی مستقیم
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRE-CREATED ACCOUNT */}
          {isCompleted && deliveryType === 'PRE_CREATED_ACCOUNT' && (
            <div className='rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 shadow-sm space-y-4'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2 text-xs sm:text-sm font-bold text-primary'>
                  <span>اطلاعات ورود به اکانت اختصاصی شما:</span>
                </div>
                <Badge className='bg-primary/15 text-primary border-primary/30 text-[10px] sm:text-[11px]'>
                  تحویل داده شد
                </Badge>
              </div>

              {/* Username / Email */}
              <div className='space-y-1.5'>
                <span className='text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5'>
                  <User className='size-3.5 text-primary' />
                  <span>نام کاربری / ایمیل:</span>
                </span>
                <div className='flex items-center gap-2'>
                  <div
                    dir='ltr'
                    className='flex-1 p-2.5 sm:p-3 rounded-xl border border-border/80 bg-background font-mono text-xs sm:text-sm font-semibold select-all truncate'
                  >
                    {deliveryData.email || deliveryData.username}
                  </div>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => copyText(deliveryData.email || deliveryData.username, 'user')}
                    className='size-10 sm:size-11 shrink-0 rounded-xl'
                    title='کپی ایمیل'
                  >
                    {copiedUser ? <Check className='size-4 text-primary' /> : <Copy className='size-4' />}
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div className='space-y-1.5'>
                <span className='text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5'>
                  <Key className='size-3.5 text-primary' />
                  <span>رمز عبور:</span>
                </span>
                <div className='flex items-center gap-2'>
                  <div
                    dir='ltr'
                    className='flex-1 p-2.5 sm:p-3 rounded-xl border border-border/80 bg-background font-mono text-xs sm:text-sm font-semibold select-all truncate'
                  >
                    {showPassword ? deliveryData.password || '—' : '••••••••••••'}
                  </div>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => setShowPassword(!showPassword)}
                    className='size-10 sm:size-11 shrink-0 rounded-xl'
                    title={showPassword ? 'مخفی کردن' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                  </Button>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => copyText(deliveryData.password || '', 'pass')}
                    className='size-10 sm:size-11 shrink-0 rounded-xl'
                    title='کپی رمز عبور'
                  >
                    {copiedPass ? <Check className='size-4 text-primary' /> : <Copy className='size-4' />}
                  </Button>
                </div>
              </div>

              {deliveryData.note && (
                <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1'>
                  💡 {deliveryData.note}
                </p>
              )}
            </div>
          )}

          {/* 3. CUSTOMER PROVISIONING */}
          {isCompleted && deliveryType === 'CUSTOMER_PROVISIONING' && (
            <div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 space-y-3'>
              <div className='flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400'>
                <CheckCircle2 className='size-5 shrink-0' />
                <span>اشتراک با موفقیت روی حساب شما فعال شد</span>
              </div>
              <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                {deliveryData.provisionDetails || 'اشتراک مورد نظر بر اساس اطلاعات حساب شما فعال گردید.'}
              </p>
              {deliveryData.accountInfo && (
                <div className='p-3 rounded-xl bg-background/80 border border-emerald-500/20 text-xs sm:text-sm font-mono' dir='ltr'>
                  {deliveryData.accountInfo}
                </div>
              )}
            </div>
          )}

          {/* 4. MANUAL FULFILLMENT: COMPLETED */}
          {isCompleted && deliveryType === 'MANUAL' && (
            <div className='rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3'>
              <div className='flex items-center gap-2 text-xs sm:text-sm font-bold text-primary'>
                <CheckCircle2 className='size-5 shrink-0' />
                <span>سفارش شما توسط پشتیبانی آماده و تحویل شد</span>
              </div>
              <div className='text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line p-3 rounded-xl bg-background/90 border border-border/60'>
                {deliveryData.manualNote || 'سفارش شما با موفقیت تکمیل شد.'}
              </div>
            </div>
          )}

          {/* 5. MANUAL FULFILLMENT: AWAITING ADMIN */}
          {isManualPending && (
            <div className='rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 text-start space-y-3'>
              <div className='flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400'>
                <Clock className='size-5 shrink-0' />
                <span>پرداخت با موفقیت انجام شد — در حال آماده‌سازی و فعال‌سازی سفارش</span>
              </div>
              {(() => {
                const cdata = order.checkoutData as Record<string, any> | null
                const customerEmail =
                  cdata?.customer_email || cdata?.customer_gmail || deliveryData.email
                if (customerEmail) {
                  return (
                    <div className='p-3 sm:p-3.5 rounded-xl bg-background/80 border border-amber-500/20 text-xs sm:text-sm space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground'>آدرس جیمیل ثبت شده شما:</span>
                        <span className='font-mono font-bold text-foreground' dir='ltr'>
                          {customerEmail}
                        </span>
                      </div>
                      <p className='text-[11px] sm:text-xs text-muted-foreground leading-relaxed pt-1'>
                        سفارش شما در صف فعال‌سازی توسط کارشناسان پشتیبانی قرار گرفت. اشتراک مستقیماً روی همین حساب فعال خواهد شد و پس از تکمیل، اعلان پیامکی ارسال می‌گردد.
                      </p>
                    </div>
                  )
                }
                return (
                  <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                    سفارش شما با موفقیت ثبت شد. این محصول نیازمند آماده‌سازی و بررسی دستی توسط کارشناسان پشتیبانی است. پس از تکمیل، اطلاعات تحویل در همین صفحه و پنل کاربری شما نمایش داده خواهد شد.
                  </p>
                )
              })()}
              <Button
                variant='outline'
                size='sm'
                onClick={fetchOrder}
                className='text-xs sm:text-sm gap-1.5 border-amber-500/40 text-amber-600 rounded-xl'
              >
                <RefreshCw className='size-3.5' />
                بررسی مجدد وضعیت سفارش
              </Button>
            </div>
          )}

          {/* 6. STOCK EXHAUSTION */}
          {isStockWaiting && (
            <div className='rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 sm:p-5 text-start space-y-2.5'>
              <div className='flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400'>
                <Clock className='size-4 shrink-0' />
                <span>در حال تامین موجودی (وضعیت: PAID)</span>
              </div>
              <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                پرداخت شما با موفقیت تایید شده است. به دلیل تقاضای بالا، آیتم تحویل شما به زودی توسط سیستم تخصیص داده خواهد شد.
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchOrder}
                className='text-xs sm:text-sm gap-1.5 mt-2 border-blue-500/40 text-blue-600 rounded-xl'
              >
                <RefreshCw className='size-3.5' />
                بررسی مجدد وضعیت
              </Button>
            </div>
          )}

          {/* Navigation Links */}
          <div className='flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 pt-2'>
            <Link href='/' className='w-full sm:w-auto'>
              <Button variant='ghost' size='sm' className='w-full h-10 sm:h-9 text-xs sm:text-sm text-muted-foreground gap-1.5'>
                <ArrowRight className='size-3.5' />
                <span>بازگشت به صفحه اصلی</span>
              </Button>
            </Link>

            <Link href='/dashboard' className='w-full sm:w-auto'>
              <Button variant='outline' size='sm' className='w-full h-10 sm:h-9 text-xs sm:text-sm gap-1.5 rounded-xl'>
                <Package className='size-3.5' />
                <span>مشاهده در پنل کاربری</span>
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
    <div className='relative min-h-screen bg-background text-foreground flex flex-col font-sans' dir='rtl'>
      {/* Background Ambient Glow */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/6 blur-3xl' />
      </div>

      {/* Top Bar */}
      <header className='border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
          <Link href='/' className='flex items-center gap-2.5 select-none'>
            <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
              <Sparkles className='size-4' />
            </div>
            <span className='text-base sm:text-lg font-bold text-foreground'>فروشگاه اشتراک‌های دیجیتال</span>
          </Link>

          <div className='flex items-center gap-3'>
            <ThemeSwitch />
            <Link href='/'>
              <Button variant='ghost' size='sm' className='text-xs sm:text-sm flex items-center gap-1.5'>
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
            <div
              className='flex min-h-[60vh] items-center justify-center'
              role='status'
              aria-live='polite'
            >
              <Loader2 className='size-8 animate-spin text-primary' aria-hidden='true' />
              <span className='sr-only'>در حال بارگذاری اطلاعات پرداخت...</span>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  )
}
