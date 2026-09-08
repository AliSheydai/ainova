import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Copy, ExternalLink, ShieldCheck, Sparkles, ArrowRight, Clock, HelpCircle, AlertCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from './copy-button'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const session = await getCurrentUser()
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const { payment: paymentParam } = await searchParams

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      plan: {
        include: { product: true },
      },
      payment: true,
      activationLink: true,
    },
  })

  if (!order || order.userId !== session.userId) {
    notFound()
  }

  const isCompleted = order.status === 'COMPLETED'
  const isJustPaid = paymentParam === 'success'

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/dashboard/orders" className="hover:text-foreground inline-flex items-center gap-1">
            <ArrowRight className="size-3.5" />
            بازگشت به سفارش‌ها
          </Link>
          <span>/</span>
          <span className="text-foreground">سفارش {order.id.slice(0, 8)}</span>
        </div>

        {/* Success Banner if just paid */}
        {isJustPaid && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                  پرداخت با موفقیت انجام شد!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  لینک اختصاصی فعال‌سازی Google AI Pro برای شما صادر گردید.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header summary */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {order.plan.product.name} ({order.plan.name})
              </h1>
              {isCompleted ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="me-1 h-3.5 w-3.5" />
                  فعال شده
                </Badge>
              ) : (
                <Badge variant="outline">{order.status}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ثبت شده در {new Date(order.createdAt).toLocaleDateString('fa-IR')} ساعت{' '}
              {new Date(order.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-start sm:text-end">
            <span className="text-2xl font-extrabold text-foreground">
              {order.amount.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-muted-foreground me-1"> تومان</span>
          </div>
        </div>

        <Separator />

        {/* ACTIVATION LINK SECTION (The Hero of this page) */}
        {isCompleted && order.activationLink?.url ? (
          <Card className="border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 to-transparent shadow-lg overflow-hidden">
            <CardHeader className="pb-3 border-b border-emerald-500/15">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-500" />
                <CardTitle className="text-lg text-emerald-800 dark:text-emerald-300">
                  لینک اختصاصی فعال‌سازی
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                این لینک یک‌بار مصرف است و مستقیماً روی اکانت شخصی جیمیل شما فعال می‌شود.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              {/* URL Box */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-border bg-background p-2.5">
                <input
                  type="text"
                  readOnly
                  value={order.activationLink.url}
                  className="flex-1 bg-transparent px-3 text-xs font-mono text-foreground outline-none truncate"
                  dir="ltr"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <CopyButton text={order.activationLink.url} />

                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs">
                    <a href={order.activationLink.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                      باز کردن و فعال‌سازی
                    </a>
                  </Button>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3 text-xs">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" />
                  مراحل فعال‌سازی اشتراک روی اکانت گوگل:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed pr-1">
                  <li>
                    <strong className="text-foreground">روشن کردن ابزار تغییر آی‌پی:</strong> حتماً VPN خود را با لوکیشن آمریکا یا اروپا متصل کنید.
                  </li>
                  <li>
                    <strong className="text-foreground">ورود به اکانت گوگل:</strong> در همان مرورگر، مطمئن شوید که با اکانت شخصی خود در Google لاگین هستید.
                  </li>
                  <li>
                    <strong className="text-foreground">باز کردن لینک:</strong> روی دکمه «باز کردن و فعال‌سازی» بالا کلیک کنید.
                  </li>
                  <li>
                    <strong className="text-foreground">تایید پیشنهاد:</strong> در صفحه باز شده، روی دکمه Agree / Accept / Continue کلیک کنید.
                  </li>
                  <li>
                    <strong className="text-foreground">پایان:</strong> اشتراک Google AI Pro با موفقیت روی حساب شما فعال شد و نیازی به هیچ اقدام دیگری نیست!
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-xs text-muted-foreground">
              {order.status === 'PENDING_PAYMENT' ? (
                <div className="space-y-3">
                  <AlertCircle className="size-8 mx-auto text-amber-500" />
                  <p>این سفارش در انتظار پرداخت است.</p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/buy">اقدام به پرداخت</Link>
                  </Button>
                </div>
              ) : (
                <p>لینک فعال‌سازی برای این وضعیت سفارش در دسترس نیست.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order & Payment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">مشخصات سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">شناسه سفارش:</span>
                <span className="font-mono text-foreground">{order.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">محصول:</span>
                <span className="font-medium text-foreground">{order.plan.product.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">پلن:</span>
                <span className="font-medium text-foreground">{order.plan.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">مدت زمان:</span>
                <span className="font-medium text-foreground">{order.plan.duration} ماه</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">اطلاعات پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">وضعیت:</span>
                <span className="font-medium text-foreground">
                  {order.payment?.status === 'SUCCESS' ? 'پرداخت موفق' : order.payment?.status || 'در انتظار'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">درگاه پرداخت:</span>
                <span className="font-medium text-foreground">
                  {order.payment?.gatewayName === 'zarinpal' ? 'زرین‌پال' : order.payment?.gatewayName || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">شناسه پیگیری (RefId):</span>
                <span className="font-mono text-foreground">{order.payment?.refId || '-'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">مبلغ پرداختی:</span>
                <span className="font-bold text-foreground">{order.amount.toLocaleString('fa-IR')} تومان</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Help */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HelpCircle className="size-4 text-primary shrink-0" />
            <span>نیاز به راهنمایی یا پشتیبانی در فعال‌سازی دارید؟</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/support">
              ارتباط با پشتیبانی
            </Link>
          </Button>
        </div>
      </Main>
    </>
  )
}
