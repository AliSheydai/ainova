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
  Sparkles,
  User,
  Key,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, scaleIn } from '@/lib/motion'

interface OrderItem {
  id: string
  amount: number
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  fulfillmentStatus?: string
  source?: string | null
  createdAt: string
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

  const toggleShowPassword = (orderId: string) => {
    setShowPasswordIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const renderStatusBadge = (status: OrderItem['status'], fulfillmentStatus?: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-medium gap-1 text-[11px]">
            <CheckCircle2 className="size-3" />
            تکمیل و تحویل شده
          </Badge>
        )
      case 'PAID':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-medium gap-1 text-[11px]">
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
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-base font-bold text-foreground">تاریخچه سفارش‌های من</h3>
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
              else window.location.href = '/#products'
            }}
            className="mt-4 gap-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-primary to-blue-600 shadow-md shadow-primary/20 transition-transform active:scale-[0.98]"
          >
            <Sparkles className="size-3.5" />
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
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Package className="size-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">
                              {order.product?.title || order.product?.name || order.plan?.product?.name || 'اشتراک ویژه'}
                              {order.plan?.name && (
                                <span className="text-muted-foreground font-normal text-xs mr-2">
                                  ({order.plan.name})
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>شماره سفارش:</span>
                              <span className="font-sans font-medium">{order.id.slice(0, 8)}</span>
                              <span>•</span>
                              <span className="tabular-nums">
                                {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.source === 'telegram' && (
                            <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px] gap-1 font-medium">
                              🤖 تلگرام
                            </Badge>
                          )}
                          {renderStatusBadge(order.status, order.fulfillmentStatus)}
                        </div>
                      </div>

                      {/* Price & Ref info */}
                      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                        <div className="text-muted-foreground">
                          مبلغ پرداختی:{' '}
                          <span className="font-bold text-foreground tabular-nums font-sans">
                            {new Intl.NumberFormat('fa-IR').format(order.amount)} تومان
                          </span>
                        </div>
                        {order.payment?.refId && (
                          <div className="text-[11px] text-muted-foreground">
                            کد پیگیری:{' '}
                            <span className="font-sans font-medium text-foreground">{order.payment.refId}</span>
                          </div>
                        )}
                      </div>

                      {/* DELIVERY RENDERING */}

                      {/* 1. ACTIVATION LINK */}
                      {order.status === 'COMPLETED' && (deliveryType === 'ACTIVATION_LINK' || linkUrl) && (
                        <div className="mt-1 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-3.5">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                              <Sparkles className="size-3.5" />
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
                        </div>
                      )}

                      {/* 2. PRE-CREATED ACCOUNT */}
                      {order.status === 'COMPLETED' && deliveryType === 'PRE_CREATED_ACCOUNT' && (
                        <div className="mt-1 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-primary">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="size-3.5" />
                              اطلاعات ورود به اکانت:
                            </span>
                            <span className="text-[10px] text-muted-foreground">تحویل فوری</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/60">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <User className="size-3 text-primary" />
                                ایمیل:
                              </span>
                              <span className="font-mono font-semibold truncate select-all" dir="ltr">
                                {deliveryData.email || deliveryData.username}
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/60">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Key className="size-3 text-primary" />
                                رمز عبور:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-semibold select-all" dir="ltr">
                                  {showPasswordIds[order.id] ? deliveryData.password || '—' : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleShowPassword(order.id)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {showPasswordIds[order.id] ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. CUSTOMER PROVISIONING */}
                      {order.status === 'COMPLETED' && deliveryType === 'CUSTOMER_PROVISIONING' && (
                        <div className="mt-1 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            <span>اشتراک روی حساب شما فعال گردید</span>
                          </div>
                          <p className="text-muted-foreground">
                            {deliveryData.provisionDetails || 'فعال‌سازی با موفقیت انجام شد.'}
                          </p>
                        </div>
                      )}

                      {/* 4. MANUAL DELIVERY */}
                      {order.status === 'COMPLETED' && deliveryType === 'MANUAL' && (
                        <div className="mt-1 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-primary">
                            <CheckCircle2 className="size-3.5" />
                            <span>تحویل پشتیبانی:</span>
                          </div>
                          <p className="text-foreground whitespace-pre-line">
                            {deliveryData.manualNote || 'سفارش شما با موفقیت انجام و تحویل داده شد.'}
                          </p>
                        </div>
                      )}

                      {/* 5. MANUAL PENDING */}
                      {order.status === 'PAID' && (
                        <div className="mt-1 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="size-3.5" />
                            <span>در حال آماده‌سازی و تحویل</span>
                          </div>
                          <p className="text-muted-foreground">
                            پرداخت شما تایید شده و سفارش در دست اقدام توسط پشتیبانی یا سیستم تامین است.
                          </p>
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
    </div>
  )
}
