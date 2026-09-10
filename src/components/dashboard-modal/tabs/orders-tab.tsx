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
}

interface OrdersTabProps {
  onGoToBuy?: () => void
}

export function OrdersTab({ onGoToBuy }: OrdersTabProps) {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
    toast.success('لینک اختصاصی فعال‌سازی با موفقیت کپی شد.')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const renderStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-medium gap-1 text-[11px]">
            <CheckCircle2 className="size-3" />
            تحویل‌شده و فعال
          </Badge>
        )
      case 'PAID':
        return (
          <Badge className="bg-primary/15 text-primary border border-primary/25 font-medium gap-1 text-[11px]">
            <AlertCircle className="size-3" />
            پرداخت‌شده (در حال صدور)
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
          <h3 className="text-base font-bold text-foreground">تاریخچه سفارش‌ها</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            مشاهده وضعیت، فاکتور و لینک‌های اختصاصی فعال‌سازی
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          به‌روزرسانی
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-primary mb-2" />
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
            const hasActivationLink = Boolean(
              order.status === 'COMPLETED' && order.activationLink?.url
            )

            return (
              <motion.div
                key={order.id}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="overflow-hidden border border-border/70 shadow-xs transition-colors hover:border-primary/30"
                >
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
                          {renderStatusBadge(order.status)}
                        </div>
                      </div>

                      {/* Price & Ref info */}
                      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                        <div className="text-muted-foreground">
                          مبلغ پرداختی:{' '}
                          <span className="font-bold text-foreground tabular-nums">
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

                      {/* Activation Link Box if COMPLETED */}
                      {hasActivationLink && (
                        <div className="mt-1 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-3.5">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                              <Sparkles className="size-3.5" />
                              <span>لینک اختصاصی دعوت و فعال‌سازی اشتراک:</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              نیازمند VPN با آی‌پی پایدار
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div
                              dir="ltr"
                              className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-border/80 bg-background/80 px-3 py-2 text-xs font-sans text-foreground select-all"
                            >
                              {order.activationLink!.url}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copyToClipboard(order.activationLink!.url, order.id)
                                }
                                className="h-9 gap-1.5 text-xs flex-1 sm:flex-none border-border/80 hover:bg-primary/10 hover:text-primary"
                              >
                                {copiedId === order.id ? (
                                  <>
                                    <Check className="size-3.5 text-primary" />
                                    کپی شد
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3.5" />
                                    کپی لینک
                                  </>
                                )}
                              </Button>

                              <a
                                href={order.activationLink!.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-none"
                              >
                                <Button
                                  size="sm"
                                  className="w-full h-9 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                                >
                                  <ExternalLink className="size-3.5" />
                                  فعال‌سازی
                                </Button>
                              </a>
                            </div>
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
    </div>
  )
}
