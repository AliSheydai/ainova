'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Loader2,
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
    <div className='flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans' dir='rtl'>
      <div className='w-full max-w-md space-y-4'>
        {/* Mock Environment Banner */}
        <div className='flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 backdrop-blur-sm'>
          <AlertTriangle className='h-4 w-4 shrink-0 text-amber-400' />
          <span>محیط تست درگاه شبیه‌ساز پرداخت (Mock Payment Gateway)</span>
        </div>

        <Card className='border-slate-800/80 bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur-md'>
          <CardHeader className='border-b border-slate-800/80 pb-4 text-center'>
            <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 text-amber-400 border border-amber-500/30 shadow-inner'>
              <Building2 className='h-7 w-7' />
            </div>
            <CardTitle className='text-lg font-bold'>درگاه پرداخت الکترونیک شاپرک</CardTitle>
            <CardDescription className='text-slate-400 text-xs mt-1'>
              پذیرنده: فروشگاه آنلاین اشتراک هوش مصنوعی Google AI Pro
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4 pt-6'>
            <div className='rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-slate-400'>مبلغ قابل پرداخت:</span>
                <span className='text-xl font-extrabold text-amber-400 font-mono'>
                  {amount.toLocaleString('fa-IR')}{' '}
                  <span className='text-xs font-normal text-slate-300'>تومان</span>
                </span>
              </div>
              <div className='flex justify-between items-center text-xs'>
                <span className='text-slate-400'>شناسه تراکنش (Authority):</span>
                <span className='font-mono text-slate-300 truncate max-w-[210px]' title={authority}>
                  {authority}
                </span>
              </div>
              <div className='flex justify-between items-center text-xs'>
                <span className='text-slate-400'>شماره کارت فرضی تست:</span>
                <span className='font-mono text-slate-300'>۶۰۳۷-۹۹**-****-۲۸۱۴</span>
              </div>
            </div>

            <div className='rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2.5 text-xs text-emerald-400'>
              <ShieldCheck className='h-4 w-4 shrink-0' />
              <span>ارتباط امن رمزنگاری‌شده بانکی برقرار است. اطلاعات کارت شبیه‌سازی شده است.</span>
            </div>
          </CardContent>

          <CardFooter className='flex flex-col gap-3 border-t border-slate-800/80 pt-4'>
            <Button
              onClick={handlePaySuccess}
              disabled={loading}
              className='w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-lg shadow-emerald-900/30 cursor-pointer'
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
              className='w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white h-11 text-xs cursor-pointer'
            >
              <XCircle className='ml-2 h-4 w-4' />
              انصراف از پرداخت و بازگشت
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function MockBankPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-slate-950 text-white'>
          <Loader2 className='h-8 w-8 animate-spin text-amber-500' />
        </div>
      }
    >
      <MockBankContent />
    </Suspense>
  )
}
