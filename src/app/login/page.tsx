'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  CheckCircle2,
  RefreshCw,
  Loader2,
  User,
  ArrowLeft,
  KeyRound,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { cn } from '@/lib/utils'
import { toPersianDigits } from '@/lib/persian-utils'

type AuthStep = 'phone' | 'otp' | 'name'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<AuthStep>('phone')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const phoneInputRef = React.useRef<HTMLInputElement>(null)
  const nameInputRef = React.useRef<HTMLInputElement>(null)

  // Manage programmatic focus when transitioning between steps
  useEffect(() => {
    if (step === 'phone') {
      const timer = setTimeout(() => phoneInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    } else if (step === 'name') {
      const timer = setTimeout(() => nameInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [step])

  const getDestination = (role?: string | null) => {
    const custom = searchParams.get('redirect')
    if (role === 'ADMIN') {
      return custom || '/dashboard'
    }
    if (custom && !custom.startsWith('/dashboard')) {
      return custom
    }
    return '/'
  }

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
        const role = data.user?.role
        setUserRole(role)

        // If user already has a name registered, proceed directly
        if (data.user?.name && data.user.name.trim().length > 0) {
          toast.success(`خوش آمدید، ${data.user.name}! در حال انتقال...`)
          router.push(getDestination(role))
          router.refresh()
        } else {
          // Otherwise prompt for first and last name
          setStep('name')
          toast.success('کد تأیید شد. لطفاً نام و نام خانوادگی خود را مشخص کنید.')
        }
      } else {
        toast.error(data.message || 'کد تأیید نادرست است.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Save Name and Complete Onboarding
  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!fullName.trim()) {
      toast.error('لطفاً نام و نام خانوادگی خود را وارد کنید.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName.trim() }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`خوش آمدید، ${fullName.trim()} عزیز! در حال ورود...`)
        router.push(getDestination(userRole))
        router.refresh()
      } else {
        toast.error(data.message || 'خطا در ثبت نام.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور در ذخیره نام.')
    } finally {
      setLoading(false)
    }
  }

  // Skip name step if user chooses
  const handleSkipName = () => {
    toast.success('خوش آمدید! در حال انتقال...')
    router.push(getDestination(userRole))
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 selection:bg-primary/20">
      {/* Background Decorative Ambient Glows */}
      <div className="pointer-events-none absolute -top-44 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-32 -z-10 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 -z-10 h-[450px] w-[450px] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-foreground">
                  آریوچت
                </span>
                <span className="text-xs font-semibold text-primary">ArioChat</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>فروشگاه رسمی و قانونی اشتراک‌های هوش مصنوعی</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Auth Card */}
        <Card className="relative overflow-hidden border border-border/70 bg-card/85 shadow-2xl backdrop-blur-xl transition-all duration-300">
          {/* Top Subtle Gradient Accent Line */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          {/* Stepper Progress Bar */}
          <div className="border-b border-border/50 bg-muted/30 px-6 py-3.5">
            <div className="flex items-center justify-between">
              {/* Step 1: Phone */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                    step === 'phone'
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {step !== 'phone' ? <Check className="h-3.5 w-3.5" /> : '۱'}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:inline',
                    step === 'phone'
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground'
                  )}
                >
                  شماره موبایل
                </span>
              </div>

              {/* Connecting Line 1 */}
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 sm:mx-3 transition-colors duration-300',
                  step === 'otp' || step === 'name' ? 'bg-primary' : 'bg-border'
                )}
              />

              {/* Step 2: OTP */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                    step === 'otp'
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm'
                      : step === 'name'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step === 'name' ? <Check className="h-3.5 w-3.5" /> : '۲'}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:inline',
                    step === 'otp'
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground'
                  )}
                >
                  کد پیامکی
                </span>
              </div>

              {/* Connecting Line 2 */}
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 sm:mx-3 transition-colors duration-300',
                  step === 'name' ? 'bg-primary' : 'bg-border'
                )}
              />

              {/* Step 3: Name */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                    step === 'name'
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  ۳
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:inline',
                    step === 'name'
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground'
                  )}
                >
                  نام شما
                </span>
              </div>
            </div>
          </div>

          <CardHeader className="text-center pb-3 pt-6">
            <CardTitle className="text-xl font-bold tracking-tight">
              {step === 'phone' && 'ورود یا ثبت‌نام با موبایل'}
              {step === 'otp' && 'تأیید شماره موبایل'}
              {step === 'name' && 'تکمیل نام و نام خانوادگی'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1 leading-relaxed">
              {step === 'phone' &&
                'برای ورود یا فعال‌سازی اشتراک، شماره تلفن همراه خود را وارد کنید.'}
              {step === 'otp' &&
                `کد تأیید ۵ رقمی پیامک شده به شماره ${phone} را وارد فرمایید.`}
              {step === 'name' &&
                'برای نمایش نام در پنل کاربری و صدور فاکتور، لطفاً نام خود را وارد کنید.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {/* Live Region for Screen Readers */}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {step === 'phone' && 'مرحله ۱ از ۳: لطفاً شماره تلفن همراه خود را وارد نمایید.'}
              {step === 'otp' && `مرحله ۲ از ۳: کد تأیید ۵ رقمی ارسال‌شده به شماره ${phone} را وارد نمایید.`}
              {step === 'name' && 'مرحله ۳ از ۳: لطفاً نام و نام خانوادگی خود را برای تکمیل حساب کاربری وارد نمایید.'}
            </div>

            {/* ================= STEP 1: PHONE ================= */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phone" className="text-xs font-medium">
                      شماره تلفن همراه
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      پیش‌شماره ایران (۹۸+)
                    </span>
                  </div>

                  <div className="relative group">
                    <Input
                      ref={phoneInputRef}
                      id="phone"
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      aria-required="true"
                      className="text-left text-lg tracking-wider font-sans h-12 pr-11 pl-4 rounded-xl border-border/80 focus-visible:ring-primary/40 bg-background/50 transition-all placeholder:text-sm placeholder:tracking-normal placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Phone className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    کد یک‌بارمصرف امن فوراً به این شماره پیامک خواهد شد.
                  </p>
                </div>

                <Button
                  type="submit"
                  aria-busy={loading}
                  className="w-full text-sm font-semibold h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/25 transition-all active:scale-[0.99] cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      در حال ارسال کد تأیید...
                    </>
                  ) : (
                    <>
                      دریافت کد تأیید پیامکی
                      <ArrowLeft className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* ================= STEP 2: OTP ================= */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* Phone banner with edit option */}
                <div className="flex items-center justify-between rounded-xl bg-muted/60 border border-border/60 px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span className="font-sans font-medium text-foreground" dir="ltr">
                      {phone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      setOtpCode('')
                      setDevCode(null)
                      setTimeout(() => phoneInputRef.current?.focus(), 50)
                    }}
                    className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors text-xs cursor-pointer"
                    aria-label="ویرایش شماره تلفن وارد شده"
                  >
                    ویرایش شماره
                  </button>
                </div>

                {/* Dev Mode Banner */}
                {devCode && (
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-center text-xs text-primary">
                    <span className="font-semibold">حالت تستی:</span> کد تأیید شما{' '}
                    <span className="font-sans font-bold text-sm tracking-widest bg-primary/10 px-2 py-0.5 rounded-md text-primary">
                      {toPersianDigits(devCode)}
                    </span>{' '}
                    است.
                  </div>
                )}

                {/* OTP Input Fields */}
                <div className="flex flex-col items-center justify-center space-y-3 py-1">
                  <Label htmlFor="otp" className="text-xs text-muted-foreground">
                    کد ۵ رقمی ارسال‌شده را وارد نمایید
                  </Label>
                  <div dir="ltr" className="focus-within:scale-[1.02] transition-transform">
                    <InputOTP
                      id="otp"
                      aria-label="کد ۵ رقمی تأیید پیامک‌شده"
                      maxLength={5}
                      value={otpCode}
                      onChange={(val) => setOtpCode(val)}
                      disabled={loading}
                      autoFocus
                    >
                      <InputOTPGroup className="gap-2 sm:gap-2.5">
                        <InputOTPSlot
                          index={0}
                          className="h-13 w-11 sm:w-12 text-xl font-bold font-sans rounded-xl border-border/80 shadow-xs focus-visible:ring-primary"
                        />
                        <InputOTPSlot
                          index={1}
                          className="h-13 w-11 sm:w-12 text-xl font-bold font-sans rounded-xl border-border/80 shadow-xs focus-visible:ring-primary"
                        />
                        <InputOTPSlot
                          index={2}
                          className="h-13 w-11 sm:w-12 text-xl font-bold font-sans rounded-xl border-border/80 shadow-xs focus-visible:ring-primary"
                        />
                        <InputOTPSlot
                          index={3}
                          className="h-13 w-11 sm:w-12 text-xl font-bold font-sans rounded-xl border-border/80 shadow-xs focus-visible:ring-primary"
                        />
                        <InputOTPSlot
                          index={4}
                          className="h-13 w-11 sm:w-12 text-xl font-bold font-sans rounded-xl border-border/80 shadow-xs focus-visible:ring-primary"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {/* Resend Cooldown */}
                <div className="text-center pt-1">
                  {cooldown > 0 ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
                      <span>ارسال مجدد کد پس از</span>
                      <span className="font-sans font-bold text-primary">
                        {toPersianDigits(cooldown)}
                      </span>
                      <span>ثانیه</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      ارسال مجدد کد پیامکی
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  aria-busy={loading}
                  className="w-full text-sm font-semibold h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/25 transition-all active:scale-[0.99] cursor-pointer"
                  disabled={loading || otpCode.length < 5}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      در حال اعتبارسنجی کد...
                    </>
                  ) : (
                    <>
                      تأیید و ادامه
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* ================= STEP 3: NAME ONBOARDING ================= */}
            {step === 'name' && (
              <form onSubmit={handleSaveName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-medium">
                    نام و نام خانوادگی
                  </Label>
                  <div className="relative group">
                    <Input
                      ref={nameInputRef}
                      id="fullName"
                      type="text"
                      placeholder="مثال: علی رضایی"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      aria-required="true"
                      className="h-12 pr-11 pl-4 rounded-xl border-border/80 focus-visible:ring-primary/40 bg-background/50 text-base transition-all font-sans placeholder:text-xs sm:placeholder:text-sm placeholder:text-muted-foreground/80"
                      autoFocus
                    />
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    این نام در بالای داشبورد و در رسید سفارش‌های شما نمایش داده می‌شود.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    aria-busy={loading}
                    className="w-full text-sm font-semibold h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/25 transition-all active:scale-[0.99] cursor-pointer"
                    disabled={loading || !fullName.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        در حال ذخیره و ورود...
                      </>
                    ) : (
                      <>
                        ثبت نام و ورود به داشبورد
                        <Check className="mr-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipName}
                    disabled={loading}
                    className="w-full text-xs text-muted-foreground hover:text-foreground h-9"
                  >
                    بعداً وارد می‌کنم (ورود مستقیم به داشبورد)
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

          {/* Card Footer Security Guarantee */}
          <CardFooter className="flex flex-col gap-2 border-t border-border/50 bg-muted/20 px-6 py-4 text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>ورود فوق‌العاده امن بدون نیاز به ذخیره پسورد</span>
            </div>
          </CardFooter>
        </Card>

        {/* Back Link to Landing */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            بازگشت به صفحه اصلی سایت
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
