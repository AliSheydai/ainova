'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Phone,
  RefreshCw,
  Loader2,
  User,
  ArrowLeft,
  Check,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { cn } from '@/lib/utils'

export interface AuthUserData {
  id: string
  name: string | null
  phone: string
  createdAt?: string
}

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (user: AuthUserData) => void
}

type AuthStep = 'phone' | 'otp' | 'name'

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>('phone')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUserData | null>(null)

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      // Delay reset so animation finishes cleanly
      const t = setTimeout(() => {
        setStep('phone')
        setPhone('')
        setOtpCode('')
        setFullName('')
        setLoading(false)
        setCooldown(0)
        setDevCode(null)
        setAuthenticatedUser(null)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

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
        const loggedUser: AuthUserData = data.user || {
          id: '',
          name: null,
          phone,
        }
        setAuthenticatedUser(loggedUser)

        if (loggedUser.name && loggedUser.name.trim().length > 0) {
          toast.success(`خوش آمدید، ${loggedUser.name}!`)
          onSuccess(loggedUser)
          onOpenChange(false)
        } else {
          setStep('name')
          toast.success('کد تأیید شد. لطفاً نام خود را وارد نمایید.')
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
        toast.success(`خوش آمدید، ${fullName.trim()} عزیز!`)
        const finalUser: AuthUserData = {
          ...(authenticatedUser || { id: '', phone }),
          name: fullName.trim(),
        }
        onSuccess(finalUser)
        onOpenChange(false)
      } else {
        toast.error(data.message || 'خطا در ثبت نام.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور در ذخیره نام.')
    } finally {
      setLoading(false)
    }
  }

  // Skip name step
  const handleSkipName = () => {
    const finalUser: AuthUserData = authenticatedUser || {
      id: '',
      name: null,
      phone,
    }
    toast.success('خوش آمدید!')
    onSuccess(finalUser)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-md p-0 overflow-hidden border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-2xl"
      >
        {/* Top Decorative Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-primary" />

        {/* Stepper Progress Bar */}
        <div className="border-b border-border/50 bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Step 1: Phone */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  step === 'phone'
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm'
                    : 'bg-emerald-500 text-white'
                )}
              >
                {step !== 'phone' ? <Check className="h-3.5 w-3.5" /> : '۱'}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  step === 'phone'
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                شماره موبایل
              </span>
            </div>

            <div
              className={cn(
                'h-0.5 flex-1 mx-3 transition-colors duration-300',
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
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step === 'name' ? <Check className="h-3.5 w-3.5" /> : '۲'}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  step === 'otp'
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                کد پیامکی
              </span>
            </div>

            <div
              className={cn(
                'h-0.5 flex-1 mx-3 transition-colors duration-300',
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
                  'text-xs font-medium',
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

        <div className="p-6 pt-4">
          <DialogHeader className="text-center pb-3 space-y-1">
            <div className="flex justify-center mb-1">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
            </div>
            <DialogTitle className="text-lg font-bold">
              {step === 'phone' && 'ورود یا ثبت‌نام با موبایل'}
              {step === 'otp' && 'تأیید شماره موبایل'}
              {step === 'name' && 'تکمیل مشخصات حساب'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {step === 'phone' &&
                'برای مشاهده وضعیت سفارش‌ها و پنل اشتراک، شماره موبایل خود را وارد کنید.'}
              {step === 'otp' &&
                `کد تأیید ۵ رقمی پیامک شده به شماره ${phone} را وارد فرمایید.`}
              {step === 'name' &&
                'برای نمایش نام در رسید سفارش‌ها و پشتیبانی، نام خود را وارد کنید.'}
            </DialogDescription>
          </DialogHeader>

          {/* ================= STEP 1: PHONE ================= */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4 pt-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="modal-phone" className="text-xs font-medium">
                    شماره تلفن همراه
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    پیش‌شماره ایران (۹۸+)
                  </span>
                </div>

                <div className="relative group">
                  <Input
                    id="modal-phone"
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="text-left text-lg tracking-wider font-sans h-12 pr-11 pl-4 rounded-xl border-border/80 focus-visible:ring-primary/40 bg-background/50"
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
                className="w-full text-sm font-semibold h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
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
            <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
              {/* Phone banner */}
              <div className="flex items-center justify-between rounded-xl bg-muted/60 border border-border/60 px-3.5 py-2 text-xs">
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
                  }}
                  className="font-medium text-primary hover:underline transition-colors text-xs"
                >
                  ویرایش شماره
                </button>
              </div>

              {/* Dev Mode Banner */}
              {devCode && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-center text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-semibold">کد تستی:</span>{' '}
                  <span className="font-sans font-bold text-sm tracking-widest bg-amber-500/20 px-2 py-0.5 rounded-md text-amber-800 dark:text-amber-200">
                    {devCode}
                  </span>
                </div>
              )}

              {/* OTP Slots */}
              <div className="flex flex-col items-center justify-center space-y-2.5 py-1">
                <Label htmlFor="modal-otp" className="text-xs text-muted-foreground">
                  کد ۵ رقمی ارسال‌شده را وارد نمایید
                </Label>
                <div dir="ltr">
                  <InputOTP
                    maxLength={5}
                    value={otpCode}
                    onChange={(val) => setOtpCode(val)}
                    disabled={loading}
                    autoFocus
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot
                        index={0}
                        className="h-12 w-10 sm:w-11 text-lg font-bold font-sans rounded-xl border-border/80"
                      />
                      <InputOTPSlot
                        index={1}
                        className="h-12 w-10 sm:w-11 text-lg font-bold font-sans rounded-xl border-border/80"
                      />
                      <InputOTPSlot
                        index={2}
                        className="h-12 w-10 sm:w-11 text-lg font-bold font-sans rounded-xl border-border/80"
                      />
                      <InputOTPSlot
                        index={3}
                        className="h-12 w-10 sm:w-11 text-lg font-bold font-sans rounded-xl border-border/80"
                      />
                      <InputOTPSlot
                        index={4}
                        className="h-12 w-10 sm:w-11 text-lg font-bold font-sans rounded-xl border-border/80"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Resend Cooldown */}
              <div className="text-center">
                {cooldown > 0 ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1 rounded-full">
                    <span>ارسال مجدد کد پس از</span>
                    <span className="font-sans font-bold text-primary tabular-nums">
                      {cooldown}
                    </span>
                    <span>ثانیه</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    ارسال مجدد کد پیامکی
                  </button>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-sm font-semibold h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/25"
                disabled={loading || otpCode.length < 5}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال اعتبارسنجی...
                  </>
                ) : (
                  <>
                    تأیید و ورود
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* ================= STEP 3: NAME ONBOARDING ================= */}
          {step === 'name' && (
            <form onSubmit={handleSaveName} className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="modal-name" className="text-xs font-medium">
                  نام و نام خانوادگی
                </Label>
                <div className="relative group">
                  <Input
                    id="modal-name"
                    type="text"
                    placeholder="مثال: علی رضایی"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    className="h-12 pr-11 pl-4 rounded-xl border-border/80 focus-visible:ring-primary/40 bg-background/50 font-sans text-sm"
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
                  className="w-full text-sm font-semibold h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/25"
                  disabled={loading || !fullName.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      ثبت نام و ورود به حساب
                      <Check className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkipName}
                  disabled={loading}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  بعداً مشخص می‌کنم
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
