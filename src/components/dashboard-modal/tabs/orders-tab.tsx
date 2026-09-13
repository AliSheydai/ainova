'use client'

import React, { useEffect, useState } from 'react'
import {
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  ShoppingBag,
  Loader2,
  RefreshCw,
  User,
  Key,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  Receipt,
  Send,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, scaleIn } from '@/lib/motion'
import { formatPrice, formatPersianDate, toPersianDigits } from '@/lib/persian-utils'
import { cn } from '@/lib/utils'

interface OrderItem {
  id: string
  amount: number
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED'
  fulfillmentStatus?: string
  source?: string | null
  createdAt: string
  adminNote?: string | null
  customerActionRequired?: boolean | null
  actionRequiredReason?: string | null
  credentialsUpdatedAt?: string | null
  refundAmount?: number | null
  refundReason?: string | null
  refundRefId?: string | null
  refundedAt?: string | null
  checkoutData?: Record<string, any> | null
  product?: {
    title: string
    name: string
    fulfillmentType?: string
  } | null
  plan?: {
    name: string
    duration: number
    product: {
      name: string
    }
  } | null
  payment?: {
    refId: string | null
    gatewayName: string
    status: string
  } | null
  activationLink?: {
    url: string
    status: string
  } | null
  delivery?: {
    type: string
    status: string
    data: any
    deliveredAt: string | null
  } | null
}

interface OrdersTabProps {
  onGoToBuy?: () => void
}

export function OrdersTab({ onGoToBuy }: OrdersTabProps) {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null)
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null)
  const [showPasswordIds, setShowPasswordIds] = useState<Record<string, boolean>>({})

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      } else {
        toast.error('خطا در دریافت لیست سفارش‌ها.')
      }
    } catch {
      toast.error('خطا در برقراری ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('کپی شد.')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const copyRefToClipboard = (refId: string, orderId: string) => {
    navigator.clipboard.writeText(refId)
    setCopiedRefId(orderId)
    toast.success('کد پیگیری با موفقیت کپی شد.')
    setTimeout(() => setCopiedRefId(null), 2500)
  }

  const copyOrderNumberToClipboard = (orderId: string) => {
    navigator.clipboard.writeText(orderId)
    setCopiedOrderId(orderId)
    toast.success('شماره سفارش با موفقیت کپی شد.')
    setTimeout(() => setCopiedOrderId(null), 2500)
  }

  const toggleShowPassword = (orderId: string) => {
    setShowPasswordIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const [selectedCorrectionOrder, setSelectedCorrectionOrder] = useState<OrderItem | null>(null)
  const [correctionPassword, setCorrectionPassword] = useState('')
  const [correctionEmail, setCorrectionEmail] = useState('')
  const [correctionNote, setCorrectionNote] = useState('')
  const [submittingCorrection, setSubmittingCorrection] = useState(false)

  const handleOpenCorrection = (order: OrderItem) => {
    setSelectedCorrectionOrder(order)
    const cdata = (order.checkoutData as Record<string, any>) || {}
    setCorrectionEmail(cdata.customer_email || cdata.customer_gmail || '')
    setCorrectionPassword('')
    setCorrectionNote('')
  }

  const handleSubmitCorrection = async () => {
    if (!selectedCorrectionOrder) return
    if (!correctionPassword.trim()) {
      toast.error('لطفاً رمز عبور صحیح اکانت را وارد فرمایید.')
      return
    }

    setSubmittingCorrection(true)
    try {
      const res = await fetch(`/api/orders/${selectedCorrectionOrder.id}/update-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: correctionPassword.trim(),
          email: correctionEmail.trim() || undefined,
          customerNote: correctionNote.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'اطلاعات با موفقیت ثبت شد.')
        setSelectedCorrectionOrder(null)
        setCorrectionPassword('')
        setCorrectionEmail('')
        setCorrectionNote('')
        fetchOrders()
      } else {
        toast.error(data.message || 'خطا در ثبت اطلاعات.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSubmittingCorrection(false)
    }
  }

  const renderStatusBadge = (order: OrderItem) => {
    if (order.customerActionRequired) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-medium gap-1 text-[11px] animate-pulse">
          <AlertTriangle className="size-3" />
          نیازمند اقدام شما (رمز اشتباه)
        </Badge>
      )
    }

    if (order.credentialsUpdatedAt && !order.customerActionRequired && order.status === 'PAID') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium gap-1 text-[11px]">
          <RefreshCw className="size-3" />
          اطلاعات ارسال شد (در حال بررسی)
        </Badge>
      )
    }

    switch (order.status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-medium gap-1 text-[11px]">
            <CheckCircle2 className="size-3" />
            تکمیل و تحویل شده
          </Badge>
        )
      case 'PAID':
        return (
          <Badge className="bg-primary/10 text-primary border border-primary/25 font-medium gap-1 text-[11px]">
            <Clock className="size-3" />
            پرداخت‌شده (در حال آماده‌سازی)
          </Badge>
        )
      case 'PENDING_PAYMENT':
        return (
          <Badge className="bg-muted/60 text-muted-foreground border border-border/80 font-medium gap-1 text-[11px]">
            <AlertCircle className="size-3" />
            در انتظار پرداخت
          </Badge>
        )
      case 'FAILED':
      case 'CANCELLED':
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium gap-1 text-[11px]">
            <XCircle className="size-3" />
            ناموفق / لغو شده
          </Badge>
        )
      case 'REFUNDED':
        return (
          <Badge className="bg-muted text-muted-foreground border border-border/80 font-medium gap-1 text-[11px]">
            <Receipt className="size-3" />
            استرداد شده
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 justify-between pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">تاریخچه سفارش‌های من</h3>
            {!loading && orders.length > 0 && (
              <Badge variant="secondary" className="font-sans text-[11px] px-2 py-0.5 rounded-full font-bold">
                {toPersianDigits(orders.length)} سفارش
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            مشاهده وضعیت، فاکتورها و اطلاعات تحویل اشتراک
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          aria-busy={loading}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          به‌روزرسانی
        </Button>
      </div>

      {loading ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-7 animate-spin text-primary mb-2" aria-hidden="true" />
          <p className="text-xs">در حال بارگذاری سفارش‌ها...</p>
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center py-14 text-center rounded-2xl border border-dashed border-border/70 p-6 bg-muted/20"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <ShoppingBag className="size-7" />
          </div>
          <h4 className="text-sm font-bold text-foreground">هنوز سفارشی ثبت نکرده‌اید</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            برای مشاهده و فعال‌سازی اشتراک‌های هوش مصنوعی و دیجیتال، از فروشگاه اقدام نمایید.
          </p>
          <Button
            onClick={() => {
              if (onGoToBuy) onGoToBuy()
              else window.location.href = '/products'
            }}
            className="mt-4 gap-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-primary to-blue-600 shadow-md shadow-primary/20 transition-transform active:scale-[0.98]"
          >
            مشاهده محصولات و خرید
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="visible"
        >
          {orders.map((order) => {
            const delivery = order.delivery
            const deliveryType = delivery?.type || (order.activationLink ? 'ACTIVATION_LINK' : 'MANUAL')
            const deliveryData = (delivery?.data as Record<string, any>) || {}
            const linkUrl = deliveryData.url || order.activationLink?.url

            return (
              <motion.div
                key={order.id}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden border border-border/70 shadow-xs transition-colors hover:border-primary/30">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3">
                      {/* Top Row: Product info + status */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                            <Package className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1.5">
                            {/* Title & Plan Tag (No broken parentheses, fully responsive) */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h4 className="text-sm font-bold text-foreground leading-snug break-words">
                                {order.product?.title || order.product?.name || order.plan?.product?.name || 'اشتراک ویژه'}
                              </h4>
                              {order.plan?.name && (
                                <Badge
                                  variant="outline"
                                  className="text-[11px] font-medium bg-primary/5 text-primary border-primary/25 px-2 py-0.5 rounded-md shrink-0 shadow-2xs whitespace-normal text-start"
                                >
                                  {order.plan.name}
                                </Badge>
                              )}
                            </div>

                            {/* Date Chip */}
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 hover:bg-muted/60 border border-border/50 px-2.5 py-0.5 rounded-md w-fit transition-colors">
                              <Calendar className="size-3 text-muted-foreground/70 shrink-0" />
                              <span>ثبت سفارش:</span>
                              <span className="font-sans font-medium">{formatPersianDate(order.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Source badges */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1.5 shrink-0 self-start">
                          {order.source === 'telegram' && (
                            <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px] gap-1 font-medium">
                              🤖 تلگرام
                            </Badge>
                          )}
                          {renderStatusBadge(order)}
                        </div>
                      </div>

                      {/* Order Details Badges: Order ID, Tracking Code, Amount Paid */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 border-t border-border/40 pt-3 text-[11px] sm:text-xs">
                        {/* 1. شماره سفارش (Copyable Badge) */}
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <span className="text-muted-foreground text-[11px] sm:text-xs">شماره سفارش:</span>
                          <button
                            type="button"
                            onClick={() => copyOrderNumberToClipboard(order.id)}
                            className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg cursor-pointer"
                            title={copiedOrderId === order.id ? 'کپی شد!' : 'برای کپی شماره سفارش کلیک کنید'}
                            aria-label={`کپی شماره سفارش ${order.id.slice(0, 8)}`}
                          >
                            <Badge
                              variant="outline"
                              className={cn(
                                'cursor-pointer select-none font-sans text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-lg transition-all duration-200 gap-1 sm:gap-1.5 active:scale-95 border',
                                copiedOrderId === order.id
                                  ? 'bg-primary/15 text-primary border-primary/30 ring-1 ring-primary/20'
                                  : 'bg-muted/50 hover:bg-primary/10 text-foreground hover:text-primary border-border/70 hover:border-primary/40 shadow-2xs'
                              )}
                            >
                              {copiedOrderId === order.id ? (
                                <>
                                  <Check className="size-3 text-primary animate-in zoom-in-75" />
                                  <span className="font-medium font-sans">{toPersianDigits(order.id.slice(0, 8))}</span>
                                  <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-primary/20 text-primary">
                                    کپی شد
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium font-sans">{toPersianDigits(order.id.slice(0, 8))}</span>
                                  <Copy className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                </>
                              )}
                            </Badge>
                          </button>
                        </div>

                        {/* 2. کد پیگیری (Copyable Badge) */}
                        {order.payment?.refId && (
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <span className="text-muted-foreground text-[11px] sm:text-xs">کد پیگیری:</span>
                            <button
                              type="button"
                              onClick={() => copyRefToClipboard(order.payment!.refId!, order.id)}
                              className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg cursor-pointer"
                              title={copiedRefId === order.id ? 'کپی شد!' : 'برای کپی کد پیگیری کلیک کنید'}
                              aria-label={`کپی کد پیگیری ${order.payment.refId}`}
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  'cursor-pointer select-none font-sans text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-lg transition-all duration-200 gap-1 sm:gap-1.5 active:scale-95 border',
                                  copiedRefId === order.id
                                    ? 'bg-primary/15 text-primary border-primary/30 ring-1 ring-primary/20'
                                    : 'bg-muted/50 hover:bg-primary/10 text-foreground hover:text-primary border-border/70 hover:border-primary/40 shadow-2xs'
                                )}
                              >
                                {copiedRefId === order.id ? (
                                  <>
                                    <Check className="size-3 text-primary animate-in zoom-in-75" />
                                    <span className="font-medium font-sans">{toPersianDigits(order.payment.refId)}</span>
                                    <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-primary/20 text-primary">
                                      کپی شد
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium font-sans">{toPersianDigits(order.payment.refId)}</span>
                                    <Copy className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </>
                                )}
                              </Badge>
                            </button>
                          </div>
                        )}

                        {/* 3. مبلغ پرداختی */}
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <span className="text-muted-foreground text-[11px] sm:text-xs">مبلغ پرداختی:</span>
                          <Badge
                            variant="secondary"
                            className="bg-secondary/70 hover:bg-secondary/70 text-foreground border border-border/60 font-sans font-bold text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-lg shadow-2xs"
                          >
                            {formatPrice(order.amount)}
                          </Badge>
                        </div>
                      </div>

                      {/* DELIVERY RENDERING */}

                      {/* 1. ACTIVATION LINK */}
                      {order.status === 'COMPLETED' && (deliveryType === 'ACTIVATION_LINK' || linkUrl) && (
                        <div className="mt-1 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-3.5">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                              <span>لینک اختصاصی فعال‌سازی:</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">تحویل آنی</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              dir="ltr"
                              className="flex-1 overflow-x-auto rounded-lg border border-primary/20 bg-background/80 p-2 text-xs font-mono select-all truncate"
                            >
                              {linkUrl}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(linkUrl!, order.id)}
                              className="size-8 shrink-0 rounded-lg"
                              title="کپی لینک"
                            >
                              {copiedId === order.id ? (
                                <Check className="size-3.5 text-primary" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="icon" className="size-8 shrink-0 rounded-lg" title="فعال‌سازی در گوگل">
                                <ExternalLink className="size-3.5" />
                              </Button>
                            </a>
                          </div>
                          {deliveryData.instructions && (
                            <div className="mt-2.5 p-2.5 rounded-lg bg-background/80 border border-primary/15 text-xs font-sans text-muted-foreground leading-relaxed break-words whitespace-pre-wrap select-all">
                              <span className="font-semibold text-foreground block mb-1">راهنمای فعال‌سازی:</span>
                              {deliveryData.instructions}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. PRE-CREATED ACCOUNT */}
                      {order.status === 'COMPLETED' && deliveryType === 'PRE_CREATED_ACCOUNT' && (
                        <div className="mt-1 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-primary">
                            <span>اطلاعات ورود به اکانت:</span>
                            <span className="text-[10px] text-muted-foreground">تحویل فوری</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/60 gap-2">
                              <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                                <User className="size-3 text-primary" />
                                ایمیل:
                              </span>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono font-semibold truncate select-all" dir="ltr">
                                  {deliveryData.email || deliveryData.username}
                                </span>
                                {(deliveryData.email || deliveryData.username) && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(deliveryData.email || deliveryData.username, `email-${order.id}`)}
                                    className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded hover:bg-muted shrink-0"
                                    title="کپی ایمیل"
                                  >
                                    {copiedId === `email-${order.id}` ? (
                                      <Check className="size-3 text-primary animate-in zoom-in-75" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/60 gap-2">
                              <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                                <Key className="size-3 text-primary" />
                                رمز عبور:
                              </span>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono font-semibold select-all truncate" dir="ltr">
                                  {showPasswordIds[order.id] ? deliveryData.password || '—' : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleShowPassword(order.id)}
                                  className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded hover:bg-muted shrink-0"
                                  title={showPasswordIds[order.id] ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                                >
                                  {showPasswordIds[order.id] ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                                </button>
                                {deliveryData.password && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(deliveryData.password, `pass-${order.id}`)}
                                    className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded hover:bg-muted shrink-0"
                                    title="کپی رمز عبور"
                                  >
                                    {copiedId === `pass-${order.id}` ? (
                                      <Check className="size-3 text-primary animate-in zoom-in-75" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          {deliveryData.instructions && (
                            <div className="p-2.5 rounded-lg bg-background/80 border border-primary/15 text-xs font-sans text-muted-foreground leading-relaxed break-words whitespace-pre-wrap select-all">
                              <span className="font-semibold text-foreground block mb-1">راهنمای فعال‌سازی:</span>
                              {deliveryData.instructions}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. CUSTOMER PROVISIONING */}
                      {order.status === 'COMPLETED' && deliveryType === 'CUSTOMER_PROVISIONING' && (
                        <div className="mt-1 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-primary">
                              <CheckCircle2 className="size-4" />
                              <span>اشتراک روی حساب شما فعال گردید</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">فعال‌سازی اختصاصی</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {deliveryData.provisionDetails || 'اشتراک با موفقیت روی اکانت شما فعال شد.'}
                          </p>
                          {(deliveryData.adminNote || order.adminNote) && (
                            <div className="p-2.5 rounded-lg bg-background/90 border border-primary/20 text-xs text-foreground leading-relaxed">
                              <span className="font-bold text-primary flex items-center gap-1 mb-1">
                                <FileText className="size-3 text-primary" />
                                یادداشت مدیر سیستم:
                              </span>
                              {deliveryData.adminNote || order.adminNote}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. MANUAL DELIVERY */}
                      {order.status === 'COMPLETED' && deliveryType === 'MANUAL' && (
                        <div className="mt-1 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-primary">
                            <CheckCircle2 className="size-4" />
                            <span>تحویل پشتیبانی:</span>
                          </div>
                          <p className="text-foreground whitespace-pre-line leading-relaxed">
                            {deliveryData.manualNote || 'سفارش شما با موفقیت انجام و تحویل داده شد.'}
                          </p>
                          {order.adminNote && !deliveryData.manualNote?.includes(order.adminNote) && (
                            <div className="p-2.5 rounded-lg bg-background/90 border border-primary/20 text-xs text-foreground leading-relaxed">
                              <span className="font-bold text-primary flex items-center gap-1 mb-1">
                                <FileText className="size-3 text-primary" />
                                توضیحات تکمیلی:
                              </span>
                              {order.adminNote}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. CUSTOMER ACTION REQUIRED (رمز اشتباه یا نقص اطلاعات) */}
                      {order.customerActionRequired && (
                        <div className="mt-1 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 sm:p-4 text-xs space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>نیاز به بررسی و اصلاح اطلاعات اکانت</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30">
                              نیاز به اقدام خریدار
                            </Badge>
                          </div>

                          <p className="text-muted-foreground leading-relaxed">
                            مدیر سیستم هنگام فعال‌سازی اشتراک با مشکل مواجه شده است:
                          </p>

                          <div className="p-2.5 rounded-lg bg-background/90 border border-amber-500/25 text-xs text-foreground font-medium leading-relaxed">
                            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">پیام مدیر:</span>
                            {order.adminNote || 'رمز عبور یا اطلاعات ورود به اکانت اشتباه است. لطفاً اطلاعات صحیح را ثبت فرمایید.'}
                          </div>

                          <div className="flex items-center justify-end pt-1">
                            <Button
                              size="sm"
                              onClick={() => handleOpenCorrection(order)}
                              className="gap-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                            >
                              <Key className="size-3.5" />
                              <span>ویرایش و ارسال رمز جدید</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 6. CORRECTION SUBMITTED AND WAITING FOR ADMIN */}
                      {order.status === 'PAID' && !order.customerActionRequired && order.credentialsUpdatedAt && (
                        <div className="mt-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs space-y-1.5">
                          <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                            <RefreshCw className="size-3.5" />
                            <span>اطلاعات اصلاح‌شده شما ثبت شد</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            اطلاعات ورود جدید شما با موفقیت به مدیر ارجاع گردید و در صف اقدام مجدد قرار دارد.
                          </p>
                        </div>
                      )}

                      {/* 7. STANDARD PAID PENDING */}
                      {order.status === 'PAID' && !order.customerActionRequired && !order.credentialsUpdatedAt && (
                        <div className="mt-1 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-primary">
                            <Clock className="size-3.5" />
                            <span>در حال آماده‌سازی و تحویل</span>
                          </div>
                          <p className="text-muted-foreground">
                            پرداخت شما تایید شده و سفارش در دست اقدام توسط پشتیبانی یا سیستم تامین است.
                          </p>
                        </div>
                      )}

                      {/* 8. CANCELLED / FAILED WITH REASON */}
                      {(order.status === 'CANCELLED' || order.status === 'FAILED') && (
                        <div className="mt-1 rounded-xl border border-rose-500/25 bg-rose-500/5 p-3.5 text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                            <XCircle className="size-4" />
                            <span>{order.status === 'CANCELLED' ? 'سفارش لغو شد' : 'سفارش ناموفق'}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {order.adminNote ? `علت: ${order.adminNote}` : 'این سفارش لغو گردید. در صورت نیاز می‌توانید با پشتیبانی ارتباط برقرار نمایید.'}
                          </p>
                        </div>
                      )}

                      {/* 9. REFUNDED */}
                      {order.status === 'REFUNDED' && (
                        <div className="mt-1 rounded-xl border border-border/70 bg-muted/40 p-3.5 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <Receipt className="size-4 text-primary" />
                            <span>مبلغ این سفارش استرداد گردید</span>
                          </div>
                          <div className="text-muted-foreground space-y-1 text-[11px]">
                            <div>مبلغ بازگشتی: <strong className="font-sans font-bold text-foreground">{formatPrice(order.refundAmount || order.amount)}</strong></div>
                            {order.refundRefId && <div>کد پیگیری بانکی / شبا: <code className="font-mono font-bold text-foreground">{order.refundRefId}</code></div>}
                            {order.refundReason && <div>علت استرداد: {order.refundReason}</div>}
                            {order.refundedAt && <div>تاریخ استرداد: {formatPersianDate(order.refundedAt)}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Credential Correction Modal for Customer */}
      <Dialog open={!!selectedCorrectionOrder} onOpenChange={(open) => !open && setSelectedCorrectionOrder(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Key className="size-4 text-primary" />
              <span>اصلاح اطلاعات اکانت #{selectedCorrectionOrder?.id.slice(-6).toUpperCase()}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              رمز عبور صحیح یا اطلاعات ورود اکانت خود را وارد نمایید تا مدیر سیستم بتواند اشتراک را برای شما فعال‌سازی کند.
            </DialogDescription>
          </DialogHeader>

          {selectedCorrectionOrder?.adminNote && (
            <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-foreground space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-400 block text-[11px]">پیام مدیر سیستم:</span>
              <p className="text-[11px] leading-relaxed">{selectedCorrectionOrder.adminNote}</p>
            </div>
          )}

          <div className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-semibold block mb-1">آدرس جیمیل:</label>
              <Input
                type="email"
                dir="ltr"
                value={correctionEmail}
                onChange={(e) => setCorrectionEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="text-xs rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">رمز عبور جدید یا صحیح: *</label>
              <Input
                type="text"
                dir="ltr"
                value={correctionPassword}
                onChange={(e) => setCorrectionPassword(e.target.value)}
                placeholder="رمز عبور اکانت..."
                className="text-xs rounded-xl font-mono"
              />
              <span className="text-[10px] text-muted-foreground block mt-1">
                اگر تایید دو مرحله‌ای (2FA) فعال است، لطفاً آن را موقتاً خاموش کنید یا کدهای بکاپ را در یادداشت بنویسید.
              </span>
            </div>

            <div>
              <label className="font-semibold block mb-1">یادداشت برای پشتیبانی (اختیاری):</label>
              <Textarea
                rows={2}
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="مثلاً: رمز رو تغییر دادم / تایید دو مرحله‌ای خاموش شد..."
                className="text-xs rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCorrectionOrder(null)}
              disabled={submittingCorrection}
              className="text-xs rounded-xl h-9 w-full sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitCorrection}
              disabled={submittingCorrection}
              aria-busy={submittingCorrection}
              className="text-xs font-bold rounded-xl h-9 w-full sm:w-auto gap-1.5"
            >
              {submittingCorrection ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              <span>ثبت و ارسال اطلاعات به مدیر</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
