'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Loader2,
  Lock,
  Sparkles,
  ArrowRight,
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
  const router = useRouter()

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
    <div className='relative flex min-h-screen flex-col bg-background font-sans text-foreground' dir='rtl'>
      {/* Background Ambient Glows */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/6 blur-3xl' />
        <div className='absolute bottom-0 right-1/4 h-[350px] w-[500px] rounded-full bg-primary/4 blur-3xl' />
      </div>

      {/* Header Bar */}
      <header className='sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
          <div className='flex items-center gap-3'>
            <Link href='/' className='flex items-center gap-2.5 select-none'>
              <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
                <Sparkles className='size-4' />
              </div>
              <span className='text-base font-bold text-foreground'>جمینای</span>
            </Link>
            <span className='hidden text-xs text-muted-foreground sm:inline-block'>|</span>
            <span className='hidden text-xs text-muted-foreground sm:inline-block'>درگاه پرداخت الکترونیک</span>
          </div>

          <div className='flex items-center gap-3'>
            <ThemeSwitch />
            <Button
              variant='ghost'
              size='sm'
              onClick={handlePayCancel}
              disabled={loading}
              className='text-xs text-muted-foreground gap-1.5'
            >
              <ArrowRight className='size-3.5' />
              <span>انصراف</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className='flex flex-1 items-center justify-center p-4 sm:p-6'>
        <div className='w-full max-w-md space-y-4'>
          {/* Mock Environment Banner */}
          <div className='flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs text-primary backdrop-blur-sm'>
            <AlertTriangle className='h-4 w-4 shrink-0 text-primary' />
            <span>محیط تست درگاه شبیه‌ساز پرداخت (Mock Payment Gateway)</span>
          </div>

          {/* Main Card */}
          <Card className='relative overflow-hidden border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl'>
            {/* Top Gradient Accent Line */}
            <div className='absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60' />

            <CardHeader className='border-b border-border/50 pb-5 pt-7 text-center'>
              <div className='mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner'>
                <Building2 className='h-7 w-7' />
              </div>
              <div className='flex items-center justify-center gap-2'>
                <CardTitle className='text-xl font-bold'>درگاه پرداخت الکترونیک شاپرک</CardTitle>
              </div>
              <CardDescription className='text-xs text-muted-foreground mt-1.5'>
                پذیرنده: فروشگاه رسمی اشتراک جمینای (گوگل)
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4 pt-6'>
              {/* Payment Receipt Info Box */}
              <div className='rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-5 space-y-3.5'>
                <div className='flex justify-between items-center'>
                  <span className='text-xs text-muted-foreground'>مبلغ قابل پرداخت:</span>
                  <span className='text-xl font-extrabold text-primary font-sans'>
                    {new Intl.NumberFormat('fa-IR').format(amount)}{' '}
                    <span className='text-xs font-normal text-muted-foreground'>تومان</span>
                  </span>
                </div>

                <div className='flex justify-between items-center text-xs'>
                  <span className='text-muted-foreground'>شناسه پرداخت (Authority):</span>
                  <span className='font-sans font-medium text-foreground truncate max-w-[210px] select-all bg-background/80 px-2 py-0.5 rounded-md border border-border/50' title={authority}>
                    {authority}
                  </span>
                </div>

                <div className='flex justify-between items-center text-xs'>
                  <span className='text-muted-foreground'>شماره کارت فرضی تست:</span>
                  <span className='font-sans font-medium text-foreground tracking-wider' dir='ltr'>
                    ۶۰۳۷-۹۹**-****-۲۸۱۴
                  </span>
                </div>
              </div>

              {/* Security Banner */}
              <div className='rounded-xl bg-primary/5 border border-primary/15 p-3 flex items-center gap-2.5 text-xs text-muted-foreground'>
                <ShieldCheck className='h-4 w-4 shrink-0 text-primary' />
                <span>ارتباط امن رمزنگاری‌شده بانکی (SSL 256-bit) برقرار است.</span>
              </div>
            </CardContent>

            <CardFooter className='flex flex-col gap-3 border-t border-border/50 pt-5 pb-6'>
              <Button
                onClick={handlePaySuccess}
                disabled={loading}
                className='w-full font-bold h-12 text-sm shadow-md shadow-primary/20 cursor-pointer rounded-xl transition-all'
              >
                {loading ? (
                  <Loader2 className='ml-2 h-5 w-5 animate-spin' />
                ) : (
                  <CheckCircle2 className='ml-2 h-5 w-5' />
                )}
                تکمیل خرید و پرداخت موفق (آزمایشی)
              </Button>

              <Button
                onClick={handlePayCancel}
                disabled={loading}
                variant='outline'
                className='w-full border-border/80 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground h-11 text-xs cursor-pointer rounded-xl'
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

export default function MockBankPage() {
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
