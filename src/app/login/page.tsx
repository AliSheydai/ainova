'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowRight, ShieldCheck, Phone, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [devCode, setDevCode] = useState<string | null>(null)

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!phone.trim()) {
      toast.error('لطفاً شماره موبایل خود را وارد کنید.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message || 'کد تأیید ارسال شد.')
        setStep('otp')
        setCooldown(data.cooldownRemaining || 60)
        if (data.devCode) {
          setDevCode(data.devCode)
        }
      } else {
        toast.error(data.message || 'خطا در ارسال کد.')
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining)
        }
      }
    } catch {
      toast.error('خطای شبکه. لطفاً اتصال اینترنت خود را بررسی کنید.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (otpCode.length < 5) {
      toast.error('لطفاً کد ۵ رقمی را کامل وارد کنید.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('خوش آمدید! در حال انتقال...')
        router.push(redirectUrl)
        router.refresh()
      } else {
        toast.error(data.message || 'کد تأیید نادرست است.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-l from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Google AI Pro
            </span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            سامانه رسمی فعال‌سازی اشتراک قانونی هوش مصنوعی گوگل
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-border/60 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {step === 'phone' ? 'ورود یا ثبت‌نام با شماره موبایل' : 'تأیید شماره موبایل'}
            </CardTitle>
            <CardDescription>
              {step === 'phone'
                ? 'برای ورود یا خرید اشتراک، شماره موبایل خود را وارد نمایید.'
                : `کد پیامک‌شده به شماره ${phone} را وارد کنید.`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره همراه</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      className="text-left text-lg tracking-wider font-mono pr-10"
                      autoFocus
                    />
                    <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    کد تأیید از طریق پیامک برای این شماره ارسال خواهد شد.
                  </p>
                </div>

                <Button type="submit" className="w-full text-base h-11" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال ارسال کد...
                    </>
                  ) : (
                    'دریافت کد تأیید'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* Change Phone Option */}
                <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">شماره: {phone}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      setOtpCode('')
                      setDevCode(null)
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    ویرایش شماره
                  </button>
                </div>

                {/* Dev Mode Banner */}
                {devCode && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-center text-xs text-amber-600 dark:text-amber-400">
                    حالت توسعه فعال است. کد تأیید: <span className="font-mono font-bold text-sm tracking-widest">{devCode}</span>
                  </div>
                )}

                {/* OTP Input */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Label htmlFor="otp">کد ۵ رقمی ارسال‌شده</Label>
                  <div dir="ltr">
                    <InputOTP
                      maxLength={5}
                      value={otpCode}
                      onChange={(val) => setOtpCode(val)}
                      disabled={loading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-12 w-12 text-lg font-mono" />
                        <InputOTPSlot index={1} className="h-12 w-12 text-lg font-mono" />
                        <InputOTPSlot index={2} className="h-12 w-12 text-lg font-mono" />
                        <InputOTPSlot index={3} className="h-12 w-12 text-lg font-mono" />
                        <InputOTPSlot index={4} className="h-12 w-12 text-lg font-mono" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {/* Resend Cooldown */}
                <div className="text-center">
                  {cooldown > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      ارسال مجدد کد پس از <span className="font-mono font-medium text-foreground">{cooldown}</span> ثانیه
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      ارسال مجدد کد پیامکی
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full text-base h-11"
                  disabled={loading || otpCode.length < 5}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال اعتبارسنجی...
                    </>
                  ) : (
                    'ورود به پنل کاربری'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 px-6 py-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>بدون نیاز به پسورد — ورود امن با پیامک یک‌بارمصرف</span>
            </div>
          </CardFooter>
        </Card>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  )
}
