'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  Loader2,
  CreditCard,
  Lock,
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

function MockBankContent() {
  const searchParams = useSearchParams()

  const authority = searchParams.get('authority') || 'MOCK-DEMO-TRANSACTION'
  const amount = parseInt(searchParams.get('amount') || '390000', 10)
  const rawCallbackUrl = searchParams.get('callbackUrl')

  const [loading, setLoading] = useState(false)

  const buildCallbackUrl = (status: 'OK' | 'NOK') => {
    if (rawCallbackUrl) {
      try {
        const url = new URL(rawCallbackUrl, window.location.origin)
        url.searchParams.set('Authority', authority)
        url.searchParams.set('Status', status)
        return url.pathname + url.search
      } catch {
        // fallback to standard callback
      }
    }
    return `/api/payment/callback?Authority=${encodeURIComponent(authority)}&Status=${status}`
  }

  const handlePaySuccess = () => {
    setLoading(true)
    const target = buildCallbackUrl('OK')
    window.location.href = target
  }

  const handlePayCancel = () => {
    setLoading(true)
    const target = buildCallbackUrl('NOK')
    window.location.href = target
  }

  return (
    <div
      className='relative min-h-screen bg-background text-foreground flex flex-col justify-between font-sans selection:bg-primary/20'
      dir='rtl'
    >
      {/* Background Ambient Glow */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[450px] w-[700px] rounded-full bg-primary/6 blur-3xl' />
        <div className='absolute bottom-10 right-1/4 h-[300px] w-[400px] rounded-full bg-primary/4 blur-3xl' />
      </div>

      {/* Header */}
      <header className='w-full border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50'>
        <div className='container mx-auto max-w-4xl flex h-16 items-center justify-between px-4 sm:px-6'>
          <div className='flex items-center gap-3 select-none'>
            <div className='flex size-9 items-center justify-center overflow-hidden rounded-xl bg-primary/10 border border-primary/20 p-1 shadow-xs'>
              <img
                src='/images/ario-chat.png'
                alt='آریوچت'
                className='size-full object-contain select-none pointer-events-none'
                draggable={false}
              />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-sm sm:text-base font-bold text-foreground leading-tight'>آریوچت</span>
                <Badge
                  variant='outline'
                  className='text-[10px] font-medium border-primary/30 bg-primary/10 text-primary py-0 px-2 rounded-full'
                >
                  درگاه آزمایشی (Sandbox)
                </Badge>
              </div>
              <p className='text-[11px] text-muted-foreground mt-0.5'>سامانه شبیه‌ساز پرداخت امن</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className='w-full max-w-md mx-auto my-auto px-4 py-8 sm:py-12'>
        <div className='relative'>
          {/* Card subtle back glow */}
          <div className='absolute -inset-1 rounded-3xl bg-primary/10 blur-xl opacity-60 pointer-events-none' />

          <Card className='relative border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden'>
            {/* Top Primary Line */}
            <div className='h-1.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60' />

            <CardHeader className='text-center pb-4 pt-6'>
              <div className='mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-inner shadow-primary/10'>
                <CreditCard className='size-7' />
              </div>
              <CardTitle className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
                پرداخت شبیه‌سازی‌شده سفارش
              </CardTitle>
              <CardDescription className='text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed'>
                این درگاه برای تست فنی پیاده‌سازی شده و نیازی به کارت بانکی واقعی نیست.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4 text-xs sm:text-sm pt-1'>
              {/* Order Info Details */}
              <div className='rounded-xl bg-muted/40 border border-border/60 p-4 space-y-3'>
                <div className='flex items-center justify-between text-muted-foreground pb-2.5 border-b border-border/40'>
                  <span className='text-xs font-medium'>مبلغ قابل پرداخت:</span>
                  <span className='font-bold text-lg text-foreground font-mono'>
                    {amount.toLocaleString('fa-IR')}{' '}
                    <span className='text-xs font-normal text-muted-foreground'>تومان</span>
                  </span>
                </div>

                <div className='flex items-center justify-between text-muted-foreground text-xs'>
                  <span>شناسه پرداخت (Authority):</span>
                  <span
                    className='font-mono font-medium text-foreground text-[11px] truncate max-w-[210px] bg-background/60 px-2 py-0.5 rounded border border-border/40 select-all'
                    title={authority}
                  >
                    {authority}
                  </span>
                </div>

                <div className='flex items-center justify-between text-muted-foreground text-xs'>
                  <span>پذیرنده:</span>
                  <span className='font-medium text-foreground'>آریوچت (درگاه تست)</span>
                </div>
              </div>

              {/* Notice Box in Primary Blue Theme */}
              <div className='rounded-xl bg-primary/5 border border-primary/20 p-3.5 flex items-start gap-2.5 text-foreground'>
                <ShieldCheck className='size-4 text-primary mt-0.5 shrink-0' />
                <div className='text-xs leading-relaxed text-muted-foreground'>
                  <span className='font-semibold text-foreground'>توجه: </span>
                  با کلیک روی «تأیید پرداخت موفق»، تراکنش در سیستم تایید شده و فرایند تحویل آنی آغاز خواهد شد.
                </div>
              </div>
            </CardContent>

            <CardFooter className='flex flex-col gap-3 pt-2 pb-6 px-6'>
              <Button
                onClick={handlePaySuccess}
                disabled={loading}
                className='w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11 text-xs sm:text-sm font-bold cursor-pointer rounded-xl transition-all duration-200 active:scale-[0.99]'
              >
                {loading ? (
                  <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                ) : (
                  <CheckCircle2 className='ml-2 h-4 w-4' />
                )}
                تأیید پرداخت موفق (شبیه‌سازی کارت معتبر)
              </Button>

              <Button
                onClick={handlePayCancel}
                disabled={loading}
                variant='outline'
                className='w-full border-border/80 bg-background/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground h-11 text-xs sm:text-sm cursor-pointer rounded-xl transition-all duration-200'
              >
                <XCircle className='ml-2 h-4 w-4 text-muted-foreground' />
                انصراف از پرداخت و بازگشت
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className='w-full max-w-4xl mx-auto py-4 px-4 text-center border-t border-border/40'>
        <div className='flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground'>
          <Lock className='size-3 text-primary' />
          <span>محیط آزمایشی امن آریوچت • اطلاعات صرفاً جهت شبیه‌سازی تست پردازش می‌شوند</span>
        </div>
      </footer>
    </div>
  )
}

export default function MockBankClient() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-background text-foreground'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      }
    >
      <MockBankContent />
    </Suspense>
  )
}
