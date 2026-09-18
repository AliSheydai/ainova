'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Loader2,
  Lock,
  Clock,
  Info,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeSwitch } from '@/components/theme-switch'

function JibitGatewayContent() {
  const searchParams = useSearchParams()

  const purchaseId = searchParams.get('purchaseId') || '10849204'
  const orderId = searchParams.get('orderId') || 'ORDER-TEST-001'
  const amountToman = parseInt(searchParams.get('amount') || '390000', 10)
  const amountRials = parseInt(
    searchParams.get('amountRials') || String(amountToman * 10),
    10
  )
  const mobile = searchParams.get('mobile') || ''
  const description = searchParams.get('description') || 'خرید اشتراک آریوچت'
  const rawCallbackUrl = searchParams.get('callbackUrl')

  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<'success' | 'failed' | null>(
    null
  )
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes expiration timer per Jibit doc

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Build target callback URL according to Jibit PPG specs
  const buildCallbackUrl = (status: 'SUCCESSFUL' | 'FAILED') => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000'

    if (rawCallbackUrl) {
      try {
        const url = new URL(rawCallbackUrl, origin)
        // Jibit standard callback parameters
        url.searchParams.set('purchaseId', purchaseId)
        url.searchParams.set('status', status)
        // Compatibility fallbacks for existing consumers
        url.searchParams.set('Authority', purchaseId)
        url.searchParams.set('Status', status === 'SUCCESSFUL' ? 'OK' : 'NOK')
        url.searchParams.set('orderId', orderId)
        return `${origin}${url.pathname}${url.search}`
      } catch {
        // Fallback below
      }
    }

    return `${origin}/api/payment/callback?purchaseId=${encodeURIComponent(
      purchaseId
    )}&status=${status}&Authority=${encodeURIComponent(
      purchaseId
    )}&Status=${status === 'SUCCESSFUL' ? 'OK' : 'NOK'}&orderId=${encodeURIComponent(
      orderId
    )}`
  }

  const handleAction = (status: 'SUCCESSFUL' | 'FAILED') => {
    if (loading) return
    setLoading(true)
    setActiveAction(status === 'SUCCESSFUL' ? 'success' : 'failed')

    try {
      const targetUrl = buildCallbackUrl(status)
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.assign(targetUrl)
        }, 300)
      }
    } catch (err) {
      console.error('Redirect error:', err)
      setLoading(false)
      setActiveAction(null)
    }
  }

  return (
    <div
      className='relative min-h-screen bg-background text-foreground flex flex-col justify-between font-sans selection:bg-primary/20'
      dir='rtl'
    >
      {/* Background Ambient Glow (Harmonized Blue Theme) */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/8 blur-3xl' />
        <div className='absolute bottom-10 right-1/4 h-[320px] w-[450px] rounded-full bg-blue-600/5 blur-3xl' />
      </div>

      {/* Header */}
      <header className='w-full border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50'>
        <div className='container mx-auto max-w-4xl flex h-16 items-center justify-between px-4 sm:px-6'>
          <div className='flex items-center gap-3 select-none'>
            {/* Ariochat Logo */}
            <div className='flex size-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 border border-primary/20 p-1.5 shadow-xs'>
              <img
                src='/images/ario-chat.png'
                alt='آریوچت'
                className='size-full object-contain select-none pointer-events-none'
                draggable={false}
              />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-sm sm:text-base font-bold text-foreground leading-tight'>
                  درگاه پرداخت جیبیت
                </span>
                <Badge
                  variant='outline'
                  className='text-[10px] font-medium border-primary/30 bg-primary/10 text-primary py-0 px-2 rounded-full'
                >
                  حالت آزمایشی (Sandbox)
                </Badge>
              </div>
              <p className='text-[11px] text-muted-foreground mt-0.5'>
                سامانه پرداخت امن شاپرک • پروتکل PPG v3
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {/* Session Expiration Timer */}
            <div className='hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border/70 px-2.5 py-1 rounded-full'>
              <Clock className='size-3.5 text-primary' />
              <span>زمان باقی‌مانده:</span>
              <span className='font-mono font-bold text-foreground'>
                {formattedTime}
              </span>
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className='w-full max-w-lg mx-auto my-auto px-4 py-8 sm:py-10'>
        <Card className='border-border/60 shadow-xl bg-card/90 backdrop-blur-sm relative overflow-hidden'>
          {/* Top Blue Accent Strip */}
          <div className='h-1.5 w-full bg-gradient-to-r from-blue-600 via-primary to-indigo-600' />

          <CardHeader className='pb-4 pt-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <CardTitle className='text-xl font-bold flex items-center gap-2 text-foreground'>
                  <span>شبیه‌ساز درگاه جیبیت</span>
                </CardTitle>
                <CardDescription className='mt-1 text-xs text-muted-foreground leading-relaxed'>
                  این درگاه آزمایشی جهت اعتبارسنجی فرآیند خرید طبق مستندات فنی جیبیت (document.json) آماده شده است.
                </CardDescription>
              </div>
              <div className='p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20'>
                <ShieldCheck className='size-6' />
              </div>
            </div>

            {/* Mobile Timer Badge */}
            <div className='sm:hidden mt-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg'>
              <span className='flex items-center gap-1.5'>
                <Clock className='size-3.5 text-primary' />
                زمان انقضای نشست:
              </span>
              <span className='font-mono font-bold text-foreground'>
                {formattedTime}
              </span>
            </div>
          </CardHeader>

          <CardContent className='space-y-4 text-sm'>
            {/* Order & Payment Details Box */}
            <div className='rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5'>
              <div className='flex justify-between items-center text-xs'>
                <span className='text-muted-foreground'>شناسه خرید جیبیت (Purchase ID):</span>
                <span className='font-mono font-semibold text-foreground dir-ltr'>
                  {purchaseId}
                </span>
              </div>

              <div className='flex justify-between items-center text-xs'>
                <span className='text-muted-foreground'>شماره سفارش:</span>
                <span className='font-mono text-foreground font-semibold dir-ltr'>
                  #{orderId.slice(-8).toUpperCase()}
                </span>
              </div>

              {description && (
                <div className='flex justify-between items-center text-xs'>
                  <span className='text-muted-foreground'>بابت:</span>
                  <span className='text-foreground font-medium truncate max-w-[200px]'>
                    {description}
                  </span>
                </div>
              )}

              {mobile && (
                <div className='flex justify-between items-center text-xs'>
                  <span className='text-muted-foreground'>شماره موبایل خریدار:</span>
                  <span className='font-mono text-foreground dir-ltr'>
                    {mobile}
                  </span>
                </div>
              )}

              <div className='pt-2.5 border-t border-border/60 flex justify-between items-baseline'>
                <span className='text-xs text-muted-foreground font-medium'>
                  مبلغ قابل پرداخت:
                </span>
                <div className='text-left'>
                  <div className='text-xl font-bold text-primary'>
                    {amountToman.toLocaleString('fa-IR')}{' '}
                    <span className='text-xs font-normal text-muted-foreground'>
                      تومان
                    </span>
                  </div>
                  <div className='text-[11px] text-muted-foreground font-mono'>
                    ({amountRials.toLocaleString('en-US')} IRR)
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox Notice Box (Blue Theme) */}
            <div className='flex items-start gap-2.5 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground/90'>
              <Info className='size-4 shrink-0 mt-0.5 text-primary' />
              <p className='leading-relaxed'>
                <strong>محیط آزمایشی جیبیت:</strong> عملکرد سیستم را با دو دکمه زیر بررسی نمایید.
                با زدن <b>خرید موفق</b>، تراکنش به عنوان پرداخت‌شده تایید شده و تحویل سفارش انجام خواهد شد.
                با زدن <b>خرید ناموفق</b>، سناریوی انصراف یا خطای درگاه بررسی می‌شود.
              </p>
            </div>
          </CardContent>

          {/* Action Buttons: The Two Required Buttons (Blue Theme) */}
          <CardFooter className='flex flex-col gap-2.5 pt-2 pb-6'>
            {/* 1. خرید موفق (آبی اصلی سایت) */}
            <Button
              id='btn-jibit-success'
              type='button'
              disabled={loading}
              onClick={() => handleAction('SUCCESSFUL')}
              className='w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer'
            >
              {loading && activeAction === 'success' ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  <span>در حال تایید پرداخت و اتصال...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className='size-4.5' />
                  <span>خرید موفق (پرداخت موفقیت‌آمیز)</span>
                </>
              )}
            </Button>

            {/* 2. خرید ناموفق (خنثی / بدون رنگ سبز) */}
            <Button
              id='btn-jibit-failed'
              type='button'
              variant='outline'
              disabled={loading}
              onClick={() => handleAction('FAILED')}
              className='w-full h-10 text-xs font-medium border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all flex items-center justify-center gap-2 cursor-pointer'
            >
              {loading && activeAction === 'failed' ? (
                <>
                  <Loader2 className='size-3.5 animate-spin' />
                  <span>در حال ثبت انصراف و بازگشت...</span>
                </>
              ) : (
                <>
                  <XCircle className='size-4' />
                  <span>خرید ناموفق (انصراف / خطای درگاه)</span>
                </>
              )}
            </Button>

            {/* Security Footer Note */}
            <div className='flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mt-2'>
              <Lock className='size-3 text-muted-foreground' />
              <span>اتصال رمزنگاری‌شده امن SSL ۲۵۶ بیتی • جیبیت</span>
            </div>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className='w-full border-t border-border/40 py-4 text-center text-xs text-muted-foreground bg-background/50'>
        <div className='container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]'>
          <span>توسعه‌یافته بر اساس مستندات رسمی درگاه پرداخت جیبیت (document.json)</span>
          <span className='font-mono'>Jibit PPG API v3 Sandbox</span>
        </div>
      </footer>
    </div>
  )
}

export default function JibitGatewayClient() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground'>
          <Loader2 className='size-8 animate-spin text-primary' />
          <p className='text-sm font-medium'>در حال بارگذاری درگاه پرداخت جیبیت...</p>
        </div>
      }
    >
      <JibitGatewayContent />
    </Suspense>
  )
}
