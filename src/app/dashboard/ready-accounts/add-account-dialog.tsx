'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Archive,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  Sparkles,
  Layers,
  UserPlus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Package,
} from 'lucide-react'
import { toPersianDigits } from '@/lib/persian-utils'

export interface ProductOption {
  id: string
  title: string
  slug: string
  stock?: number
  plans?: Array<{ id: string; name: string; fulfillmentType?: string; stock?: number }>
}

export interface PlanOption {
  id: string
  name: string
  productId?: string
  fulfillmentType?: string
  stock?: number
}

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: ProductOption[]
  onSuccess: () => void
}

interface ParsedAccountItem {
  email: string
  password: string
  recoveryEmail?: string
  note?: string
  isValid: boolean
  error?: string
}

export function AddAccountDialog({
  open,
  onOpenChange,
  products,
  onSuccess,
}: AddAccountDialogProps) {
  const [mode, setMode] = useState<'SINGLE' | 'BULK'>('SINGLE')

  // Product & Plan
  const [selectedProductId, setSelectedProductId] = useState<string>(() => products[0]?.id || '')
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('NONE')
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false)

  // Single form fields
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [recoveryEmail, setRecoveryEmail] = useState<string>('')
  const [note, setNote] = useState<string>('')

  // Bulk form fields
  const [bulkText, setBulkText] = useState<string>('')

  const [submitting, setSubmitting] = useState<boolean>(false)

  // Handle product switch
  const handleProductChange = useCallback((newProductId: string) => {
    setSelectedProductId(newProductId)
    setSelectedPlanId('NONE')
    if (!newProductId) {
      setPlans([])
      return
    }
    setLoadingPlans(true)
    fetch(`/api/admin/plans?productId=${newProductId}`)
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d.plans || []).filter(
          (p: PlanOption) => !p.fulfillmentType || p.fulfillmentType === 'PRE_CREATED_ACCOUNT'
        )
        setPlans(filtered)
        if (filtered.length === 1) {
          setSelectedPlanId(filtered[0].id)
        }
      })
      .catch(() => {
        toast.error('خطا در دریافت لیست پلن‌های محصول')
      })
      .finally(() => setLoadingPlans(false))
  }, [])

  // Load plans when product selection changes or dialog opens with initial product
  useEffect(() => {
    const targetId = selectedProductId || products[0]?.id
    if (!targetId) return

    let active = true
    const timer = setTimeout(() => {
      if (active) setLoadingPlans(true)
    }, 0)

    fetch(`/api/admin/plans?productId=${targetId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        const filtered = (d.plans || []).filter(
          (p: PlanOption) => !p.fulfillmentType || p.fulfillmentType === 'PRE_CREATED_ACCOUNT'
        )
        setPlans(filtered)
        if (filtered.length === 1) {
          setSelectedPlanId(filtered[0].id)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingPlans(false)
      })

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [selectedProductId, products])

  // Selected product object
  const currentProduct = useMemo(
    () => products.find((p) => p.id === (selectedProductId || products[0]?.id)),
    [products, selectedProductId]
  )

  // Selected plan object
  const currentPlan = useMemo(
    () => plans.find((pl) => pl.id === selectedPlanId),
    [plans, selectedPlanId]
  )

  // Generator for strong password
  const generateStrongPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*'
    let pwd = ''
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pwd)
    setShowPassword(true)
    toast.success('رمز عبور قوی تصادفی تولید شد.')
  }

  // Live parser for bulk text
  const parsedBulkAccounts = useMemo<ParsedAccountItem[]>(() => {
    if (!bulkText.trim()) return []

    const lines = bulkText.split(/\r?\n/)
    const results: ParsedAccountItem[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Support separators: colon (:), tab (\t), comma (,), pipe (|)
      let parts: string[]
      if (line.includes('\t')) {
        parts = line.split('\t')
      } else if (line.includes('|')) {
        parts = line.split('|')
      } else if (line.includes(':')) {
        parts = line.split(':')
      } else if (line.includes(',')) {
        parts = line.split(',')
      } else {
        parts = [line]
      }

      parts = parts.map((p) => p.trim())

      const mail = parts[0] || ''
      const pass = parts[1] || ''
      const rec = parts[2] || ''
      const remNote = parts.slice(3).join(' ') || ''

      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)
      const isPassValid = pass.length > 0

      if (!isEmailValid) {
        results.push({
          email: mail,
          password: pass,
          isValid: false,
          error: 'ایمیل نامعتبر',
        })
      } else if (!isPassValid) {
        results.push({
          email: mail,
          password: '',
          isValid: false,
          error: 'رمز عبور خالی است',
        })
      } else {
        results.push({
          email: mail,
          password: pass,
          recoveryEmail: rec || undefined,
          note: remNote || undefined,
          isValid: true,
        })
      }
    }

    return results
  }, [bulkText])

  const validBulkAccounts = useMemo(
    () => parsedBulkAccounts.filter((a) => a.isValid),
    [parsedBulkAccounts]
  )

  const invalidBulkAccounts = useMemo(
    () => parsedBulkAccounts.filter((a) => !a.isValid),
    [parsedBulkAccounts]
  )

  const handleResetForm = () => {
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setRecoveryEmail('')
    setNote('')
    setBulkText('')
  }

  const handleClose = () => {
    if (submitting) return
    onOpenChange(false)
  }

  // Insert sample text for bulk mode
  const handleInsertSample = () => {
    const sample = [
      'user1@gmail.com:PassSecure#2026:recovery1@gmail.com:اکانت ساخته‌شده با آی‌پی تمیز',
      'user2@gmail.com:GeminiPass@987:recovery2@gmail.com',
      'user3@gmail.com:SafeKey!4321',
    ].join('\n')
    setBulkText(sample)
    toast.info('نمونه داده‌ها در کادر قرار گرفت.')
  }

  // Submit handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!selectedProductId) {
      toast.error('لطفاً محصول مورد نظر را انتخاب کنید.')
      return
    }

    const finalPlanId = selectedPlanId && selectedPlanId !== 'NONE' ? selectedPlanId : null

    let body: Record<string, unknown>

    if (mode === 'SINGLE') {
      const trimmedEmail = email.trim()
      const trimmedPassword = password.trim()

      if (!trimmedEmail) {
        toast.error('لطفاً آدرس ایمیل اکانت را وارد کنید.')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        toast.error('فرمت آدرس ایمیل نامعتبر است.')
        return
      }
      if (!trimmedPassword) {
        toast.error('لطفاً رمزعبور اکانت را وارد کنید.')
        return
      }

      body = {
        productId: selectedProductId,
        planId: finalPlanId,
        type: 'PRE_CREATED_ACCOUNT',
        items: [
          {
            email: trimmedEmail,
            password: trimmedPassword,
            recoveryEmail: recoveryEmail.trim() || null,
            note: note.trim() || null,
          },
        ],
      }
    } else {
      if (validBulkAccounts.length === 0) {
        toast.error('هیچ اکانت معتبری در متن وارد نشده است.')
        return
      }

      body = {
        productId: selectedProductId,
        planId: finalPlanId,
        type: 'PRE_CREATED_ACCOUNT',
        items: validBulkAccounts.map((a) => ({
          email: a.email,
          password: a.password,
          recoveryEmail: a.recoveryEmail || null,
          note: a.note || null,
        })),
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(
          data.message ||
            (mode === 'SINGLE'
              ? 'اکانت با موفقیت در انبار ذخیره شد.'
              : `${toPersianDigits(validBulkAccounts.length)} اکانت با موفقیت در انبار ثبت شدند.`)
        )
        handleResetForm()
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.error || 'خطا در ثبت اکانت در انبار.')
      }
    } catch {
      toast.error('خطای برقراری ارتباط با سرور.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className='w-full inset-x-0 bottom-0 rounded-t-3xl rounded-b-none border-t border-x-0 border-b-0 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] sm:top-[50%] sm:bottom-auto sm:inset-x-auto sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-xl sm:rounded-2xl sm:border sm:border-border/80 sm:max-h-[85vh]'
        dir='rtl'
      >
        {/* Header */}
        <DialogHeader className='p-4 sm:p-5 border-b border-border/60 bg-muted/20 text-start'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs'>
              <Archive className='size-5' />
            </div>
            <div className='min-w-0'>
              <DialogTitle className='text-sm sm:text-base font-bold text-foreground flex items-center gap-2'>
                <span>افزودن اکانت آماده به انبار</span>
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground mt-0.5 leading-relaxed'>
                ذخیره حساب‌های ساخته‌شده (جیمیل و رمزعبور) جهت تحویل آنی به خریداران
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <div className='p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1'>
          {/* Mode Switcher */}
          <div className='grid grid-cols-2 p-1 rounded-xl bg-muted/50 border border-border/60 gap-1'>
            <button
              type='button'
              onClick={() => setMode('SINGLE')}
              disabled={submitting}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                mode === 'SINGLE'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className='size-3.5' />
              <span>افزودن تکی</span>
            </button>
            <button
              type='button'
              onClick={() => setMode('BULK')}
              disabled={submitting}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                mode === 'BULK'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className='size-3.5' />
              <span>افزودن دسته‌جمعی</span>
              {validBulkAccounts.length > 0 && (
                <span className='size-4 rounded-full bg-primary/20 text-primary text-[10px] font-sans flex items-center justify-center font-bold'>
                  {validBulkAccounts.length}
                </span>
              )}
            </button>
          </div>

          {/* Product & Plan Selectors */}
          <div className='space-y-3 p-3 sm:p-3.5 rounded-xl border border-border/60 bg-muted/20'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {/* Product */}
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                  <Package className='size-3.5 text-primary' />
                  <span>محصول مقصد</span>
                  <span className='text-rose-500'>*</span>
                </label>
                <Select
                  value={selectedProductId}
                  onValueChange={handleProductChange}
                  disabled={submitting}
                >
                  <SelectTrigger className='h-9 text-xs rounded-xl bg-background'>
                    <SelectValue placeholder='انتخاب محصول...' />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan */}
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
                  <span className='flex items-center gap-1.5'>
                    <FileText className='size-3.5 text-primary' />
                    <span>پلن اختصاصی</span>
                  </span>
                  <span className='text-[10.5px] text-muted-foreground font-normal'>اختیاری</span>
                </label>
                <Select
                  value={selectedPlanId}
                  onValueChange={setSelectedPlanId}
                  disabled={!selectedProductId || loadingPlans || submitting}
                >
                  <SelectTrigger className='h-9 text-xs rounded-xl bg-background'>
                    <SelectValue
                      placeholder={loadingPlans ? 'در حال بارگذاری پلن‌ها...' : 'بدون پلن خاص'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='NONE'>بدون پلن خاص (سطح کل محصول)</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Product/Plan stock badge */}
            {currentProduct && (
              <div className='flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground'>
                <span className='truncate'>
                  موجودی فعلی در انبار:{' '}
                  <span className='font-medium text-foreground'>
                    {currentPlan ? currentPlan.name : currentProduct.title}
                  </span>
                </span>
                <span className='inline-flex items-center gap-1 font-sans font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-md'>
                  <CheckCircle2 className='size-3 text-primary' />
                  <span>انبار فعال</span>
                </span>
              </div>
            )}
          </div>

          {/* Mode 1: Single Account */}
          {mode === 'SINGLE' && (
            <div className='space-y-3.5'>
              {/* Email & Password in 2 columns on desktop, 1 column on mobile */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {/* Email */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                    <Mail className='size-3.5 text-primary' />
                    <span>آدرس ایمیل (جیمیل)</span>
                    <span className='text-rose-500'>*</span>
                  </label>
                  <Input
                    type='email'
                    placeholder='example@gmail.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='h-9 font-mono text-xs'
                    dir='ltr'
                    disabled={submitting}
                  />
                </div>

                {/* Password with Generator & Visibility */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <KeyRound className='size-3.5 text-primary' />
                      <span>رمز عبور</span>
                      <span className='text-rose-500'>*</span>
                    </label>
                    <button
                      type='button'
                      onClick={generateStrongPassword}
                      className='text-[10.5px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium'
                      title='تولید خودکار رمز عبور قدرتمند'
                    >
                      <Sparkles className='size-3 text-primary' />
                      <span>تولید خودکار رمز</span>
                    </button>
                  </div>
                  <div className='relative'>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder='رمز عبور حساب...'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className='h-9 font-mono text-xs pe-9'
                      dir='ltr'
                      disabled={submitting}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className='size-3.5' /> : <Eye className='size-3.5' />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recovery Email & Note in 2 columns on desktop */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {/* Recovery Email */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                    <ShieldCheck className='size-3.5 text-muted-foreground' />
                    <span>ایمیل ریکاوری</span>
                    <span className='text-[10px] text-muted-foreground font-normal'>(اختیاری)</span>
                  </label>
                  <Input
                    type='email'
                    placeholder='recovery@domain.com'
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className='h-9 font-mono text-xs'
                    dir='ltr'
                    disabled={submitting}
                  />
                </div>

                {/* Note */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                    <FileText className='size-3.5 text-muted-foreground' />
                    <span>یادداشت یا بکاپ کدها</span>
                    <span className='text-[10px] text-muted-foreground font-normal'>(اختیاری)</span>
                  </label>
                  <Input
                    type='text'
                    placeholder='مثلاً: دارای ۲ کد بکاپ، ساخته‌شده با IP آمریکا'
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className='h-9 text-xs'
                    dir='rtl'
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Bulk Accounts */}
          {mode === 'BULK' && (
            <div className='space-y-2.5'>
              {/* Bulk Header Controls */}
              <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
                <div className='flex items-center gap-2'>
                  <label className='font-semibold text-foreground'>
                    داده‌های اکانت‌ها (هر خط یک اکانت) <span className='text-rose-500'>*</span>
                  </label>
                </div>

                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={handleInsertSample}
                    disabled={submitting}
                    className='text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium'
                  >
                    <Sparkles className='size-3 text-primary' />
                    <span>درج نمونه</span>
                  </button>

                  {bulkText.length > 0 && (
                    <button
                      type='button'
                      onClick={() => setBulkText('')}
                      disabled={submitting}
                      className='text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer'
                    >
                      <RotateCcw className='size-3' />
                      <span>پاک کردن</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <div className='relative'>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  dir='ltr'
                  placeholder={
                    'user1@gmail.com:Password123\nuser2@gmail.com:Pass456:recovery@gmail.com\nuser3@gmail.com:Secret789:rec@gmail.com:یادداشت دلخواه'
                  }
                  className='w-full min-h-[140px] sm:min-h-[160px] text-xs font-mono rounded-xl border border-input bg-background/90 p-3 resize-none outline-none focus-visible:ring-2 focus-visible:ring-primary/30 leading-relaxed'
                  disabled={submitting}
                />
              </div>

              {/* Helper badge & format guide */}
              <div className='flex flex-wrap items-center justify-between gap-2 pt-1'>
                <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
                  <span>فرمت قابل قبول:</span>
                  <code className='bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] text-foreground'>
                    email:password[:recovery][:note]
                  </code>
                </div>

                {/* Status Pills */}
                <div className='flex items-center gap-2'>
                  {invalidBulkAccounts.length > 0 && (
                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'>
                      <AlertCircle className='size-3' />
                      <span>{toPersianDigits(invalidBulkAccounts.length)} خط نامعتبر</span>
                    </span>
                  )}

                  {validBulkAccounts.length > 0 ? (
                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                      <CheckCircle2 className='size-3' />
                      <span>{toPersianDigits(validBulkAccounts.length)} اکانت معتبر</span>
                    </span>
                  ) : (
                    <span className='text-[11px] text-muted-foreground'>
                      هنوز اکانتی شناسایی نشده است
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Preview of Parsed Accounts */}
              {validBulkAccounts.length > 0 && (
                <div className='p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-1.5'>
                  <div className='text-[11px] font-semibold text-foreground flex items-center justify-between'>
                    <span>پیش‌نمایش اکانت‌های آماده ثبت ({toPersianDigits(validBulkAccounts.length)}):</span>
                  </div>
                  <div className='max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[10.5px]'>
                    {validBulkAccounts.slice(0, 4).map((acc, idx) => (
                      <div
                        key={idx}
                        className='flex items-center justify-between bg-background/80 px-2 py-1 rounded-lg border border-border/40'
                        dir='ltr'
                      >
                        <span className='text-foreground truncate max-w-[200px]'>{acc.email}</span>
                        <span className='text-muted-foreground text-[9.5px]'>
                          {acc.password ? '••••••••' : ''}
                          {acc.recoveryEmail ? ` | rec: ${acc.recoveryEmail}` : ''}
                        </span>
                      </div>
                    ))}
                    {validBulkAccounts.length > 4 && (
                      <div className='text-center text-[10.5px] text-muted-foreground font-sans pt-0.5'>
                        + {toPersianDigits(validBulkAccounts.length - 4)} اکانت دیگر...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className='p-4 sm:p-5 border-t border-border/60 bg-muted/10 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleClose}
            disabled={submitting}
            className='w-full sm:w-auto h-9 text-xs rounded-xl font-normal'
          >
            انصراف
          </Button>

          <Button
            type='button'
            size='sm'
            onClick={handleSubmit}
            disabled={
              submitting ||
              (mode === 'SINGLE' ? !email.trim() || !password.trim() : validBulkAccounts.length === 0)
            }
            className='w-full sm:w-auto h-9 text-xs font-semibold rounded-xl gap-1.5'
          >
            {submitting ? (
              <>
                <Loader2 className='size-3.5 animate-spin' />
                <span>در حال ذخیره...</span>
              </>
            ) : mode === 'SINGLE' ? (
              <>
                <Plus className='size-3.5' />
                <span>افزودن به انبار</span>
              </>
            ) : (
              <>
                <Plus className='size-3.5' />
                <span>
                  {validBulkAccounts.length > 0
                    ? `افزودن ${toPersianDigits(validBulkAccounts.length)} اکانت به انبار`
                    : 'افزودن به انبار'}
                </span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
