'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditCard, CheckCircle2, XCircle, ShieldCheck, ArrowRight, Building2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MockBankPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const authority = searchParams.get('authority') || 'A000000000000000000000'
  const amount = parseInt(searchParams.get('amount') || '390000', 10)

  const [loading, setLoading] = useState(false)

  const handlePaySuccess = () => {
    setLoading(true)
    // Redirect to callback URL with Status=OK & Authority
    router.push(`/api/payment/callback?Authority=${authority}&Status=OK`)
  }

  const handlePayCancel = () => {
    setLoading(true)
    // Redirect to callback URL with Status=NOK & Authority
    router.push(`/api/payment/callback?Authority=${authority}&Status=NOK`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900/95 p-4 text-slate-100">
      <div className="w-full max-w-md space-y-4">
        {/* Mock Notice */}
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>درگاه شبیه‌ساز پرداخت زرین‌پال (حالت آزمایشی / Sandbox)</span>
        </div>

        <Card className="border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
          <CardHeader className="border-b border-slate-800/80 pb-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold">درگاه پرداخت اینترنتی شاپرک / زرین‌پال</CardTitle>
            <CardDescription className="text-slate-400">
              پذیرنده: فروشگاه آنلاین اشتراک Google AI Pro
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">مبلغ تراکنش:</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {amount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-300">تومان</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">شناسه پیگیری (Authority):</span>
                <span className="font-mono text-slate-300 truncate max-w-[200px]">{authority}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">کارت تستی:</span>
                <span className="font-mono text-slate-300">۵۰۲۲-۲۹**-****-۸۴۲۱</span>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>ارتباط امن رمزنگاری‌شده SSL شاپرک برقرار است.</span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-slate-800/80 pt-4">
            <Button
              onClick={handlePaySuccess}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-11 text-base shadow-lg shadow-emerald-900/30"
            >
              <CheckCircle2 className="ml-2 h-5 w-5" />
              تکمیل خرید و پرداخت موفق (تستی)
            </Button>
            <Button
              onClick={handlePayCancel}
              disabled={loading}
              variant="outline"
              className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              <XCircle className="ml-2 h-4 w-4" />
              انصراف از پرداخت و بازگشت
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
