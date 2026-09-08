'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Package, CheckCircle2, XCircle, AlertCircle, ExternalLink, Copy, Check, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OrderItem {
  id: string
  amount: number
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  createdAt: string
  plan: {
    name: string
    duration: number
    product: {
      name: string
    }
  }
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

function OrdersContent() {
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')

  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (paymentStatus === 'cancelled') {
      toast.info('پرداخت لغو شد.')
    } else if (paymentStatus === 'failed') {
      toast.error('پرداخت با خطا مواجه شد.')
    }
  }, [paymentStatus])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch {
      toast.error('خطا در بارگذاری لیست سفارش‌ها.')
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
    toast.success('لینک در حافظه کپی شد.')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const renderStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
            <CheckCircle2 className="me-1 h-3.5 w-3.5" />
            تکمیل شده
          </Badge>
        )
      case 'PENDING_PAYMENT':
        return (
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
            <AlertCircle className="me-1 h-3.5 w-3.5" />
            در انتظار پرداخت
          </Badge>
        )
      case 'PAID':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">
            پرداخت شده (در حال صدور)
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="me-1 h-3.5 w-3.5" />
            ناموفق
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant="secondary">
            لغو شده
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="flex flex-col gap-6 p-4 sm:p-6">
        {/* Page Title */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">سفارش‌های من</h1>
              <p className="text-sm text-muted-foreground">
                تاریخچه خریدها، وضعیت پرداخت و لینک‌های فعال‌سازی
              </p>
            </div>
          </div>

          <Button asChild size="sm">
            <Link href="/dashboard/buy">
              <ShoppingBag className="me-2 size-4" />
              خرید اشتراک جدید
            </Link>
          </Button>
        </div>

        <Separator />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
              <Package className="size-8 text-muted-foreground/60" />
            </div>
            <p className="mb-1 text-base font-semibold text-foreground">
              هنوز سفارشی ثبت نکرده‌اید
            </p>
            <p className="mb-6 max-w-sm text-xs text-muted-foreground">
              با خرید اشتراک Google AI Pro، لینک فعال‌سازی حساب کاربری‌تان بلافاصله در اینجا قرار می‌گیرد.
            </p>
            <Button asChild>
              <Link href="/dashboard/buy">
                <ShoppingBag className="me-2 size-4" />
                مشاهده و خرید اشتراک
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden border-border/80 shadow-xs hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/20">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold">
                        {order.plan.product.name} ({order.plan.name})
                      </CardTitle>
                      {renderStatusBadge(order.status)}
                    </div>
                    <CardDescription className="text-xs">
                      شماره سفارش: <span className="font-mono text-foreground">{order.id.slice(0, 10)}...</span> •{' '}
                      {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                    </CardDescription>
                  </div>

                  <div className="text-end">
                    <div className="text-base font-bold text-foreground">
                      {order.amount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-muted-foreground">تومان</span>
                    </div>
                    {order.payment?.refId && (
                      <div className="text-[11px] text-muted-foreground font-mono">
                        کد پیگیری: {order.payment.refId}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  {/* Activation Link block if completed */}
                  {order.status === 'COMPLETED' && order.activationLink?.url ? (
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-4" />
                          لینک فعال‌سازی اختصاصی شما:
                        </div>
                        <div className="font-mono text-xs text-muted-foreground truncate max-w-md" dir="ltr">
                          {order.activationLink.url}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(order.activationLink!.url, order.id)}
                          className="h-9 gap-1 text-xs"
                        >
                          {copiedId === order.id ? (
                            <>
                              <Check className="size-3.5 text-emerald-500" />
                              کپی شد
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              کپی لینک
                            </>
                          )}
                        </Button>

                        <Button asChild size="sm" className="h-9 gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                          <a href={order.activationLink.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3.5" />
                            باز کردن لینک
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      جزئیات کامل سفارش و راهنمای فعال‌سازی
                      <ArrowLeft className="size-3" />
                    </Link>

                    {order.status === 'PENDING_PAYMENT' && (
                      <Button asChild size="sm" variant="default" className="h-8 text-xs">
                        <Link href="/dashboard/buy">
                          پرداخت مجدد
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Main>
    </>
  )
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  )
}
