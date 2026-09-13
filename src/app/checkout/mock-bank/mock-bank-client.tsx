'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  Building2,
  AlertTriangle,
  Loader2,
  CreditCard,
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
    <div className='min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300 font-sans'>
      {/* Header */}
      <header className='w-full max-w-4xl mx-auto flex items-center justify-between py-3 border-b border-border/40'>
        <div className='flex items-center gap-2.5'>
          <div className='size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary'>
            <Building2 className='size-5' />
          </div>
          <div>
            <h1 className='text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5'>
              درگاه پرداخت شبیه‌ساز امن
              <Badge variant='outline' className='text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'>
                محیط تست (Sandbox)
              </Badge>
            </h1>
            <p className='text-[11px] text-muted-foreground'>سامانه آزمایشی پرداخت الکترونیک شاپرک</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <ThemeSwitch />
        </div>
      </header>

      {/* Main Container */}
      <main className='w-full max-w-md mx-auto my-auto py-6'>
        <div className='relative'>
          <div className='absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-blue-500/10 to-purple-500/20 blur-xl opacity-60 pointer-events-none' />

          <Card className='relative border-border/80 bg-card/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden'>
            <div className='h-1.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-amber-500' />

            <CardHeader className='text-center pb-4 pt-6'>
              <div className='mx-auto size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-inner'>
                <CreditCard className='size-6' />
              </div>
              <CardTitle className='text-lg sm:text-xl font-bold'>پرداخت تستی سفارش</CardTitle>
              <CardDescription className='text-xs sm:text-sm text-muted-foreground mt-1'>
                این درگاه برای تست فنی پیاده‌سازی شده و نیازی به کارت بانکی واقعی نیست.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4 text-xs sm:text-sm'>
              <div className='rounded-xl bg-muted/40 border border-border/60 p-3.5 space-y-2.5'>
                <div className='flex items-center justify-between text-muted-foreground'>
                  <span>مبلغ قابل پرداخت:</span>
                  <span className='font-bold text-base text-foreground font-mono'>
                    {amount.toLocaleString('fa-IR')} <span className='text-xs font-normal text-muted-foreground'>تومان</span>
                  </span>
                </div>

                <div className='flex items-center justify-between text-muted-foreground text-xs'>
                  <span>شناسه پرداخت (Authority):</span>
                  <span className='font-mono font-medium text-foreground text-[11px] truncate max-w-[200px]' title={authority}>
                    {authority}
                  </span>
                </div>

                <div className='flex items-center justify-between text-muted-foreground text-xs'>
                  <span>پذیرنده:</span>
                  <span className='font-medium text-foreground'>فروشگاه آریو اکانت (تست)</span>
                </div>
              </div>

              <div className='rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5 text-amber-700 dark:text-amber-300'>
                <AlertTriangle className='size-4 mt-0.5 shrink-0' />
                <div className='text-[11px] leading-relaxed'>
                  <strong>توجه:</strong> با کلیک روی «تأیید پرداخت موفق»، تراکنش تایید شده و اکانت تحویل داده خواهد شد.
                </div>
              </div>
            </CardContent>

            <CardFooter className='flex flex-col gap-2.5 pt-2 pb-6'>
              <Button
                onClick={handlePaySuccess}
                disabled={loading}
                className='w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 h-10 sm:h-11 text-xs sm:text-sm font-bold cursor-pointer rounded-xl'
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
                className='w-full border-border/80 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground h-10 sm:h-11 text-xs sm:text-sm cursor-pointer rounded-xl'
              >
                <XCircle className='ml-2 h-4 w-4 text-muted-foreground' />
                انصراف از پرداخت و بازگشت
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
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
