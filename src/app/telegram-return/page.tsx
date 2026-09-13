import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'

interface PageProps {
  searchParams: Promise<{
    status?: string
    orderId?: string
    msg?: string
  }>
}

export default async function TelegramReturnPage({ searchParams }: PageProps) {
  const params = await searchParams
  const rawStatus = params.status || ''
  const orderId = params.orderId

  let order = null
  if (orderId) {
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          product: true,
          plan: {
            include: {
              product: true,
            },
          },
          payment: true,
        },
      })
    } catch (err) {
      console.error('Error fetching order in telegram return page:', err)
    }
  }

  // Determine fulfillment and payment state
  const isAwaitingManual =
    rawStatus === 'awaiting_manual' ||
    (order?.status === 'PAID' &&
      (order.plan?.fulfillmentType === 'MANUAL' ||
        order.plan?.fulfillmentType === 'CUSTOMER_PROVISIONING'))

  const isStockWaiting =
    rawStatus === 'stock_waiting' ||
    (order?.status === 'PAID' &&
      order.fulfillmentStatus === 'PENDING' &&
      !isAwaitingManual)

  const isCompleted = rawStatus === 'success' || order?.status === 'COMPLETED'

  const isSuccess =
    isCompleted || isAwaitingManual || isStockWaiting || order?.status === 'PAID'

  const isCancelled = rawStatus === 'cancelled' || order?.status === 'CANCELLED'

  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
    'arioaccountbot'
  const botUrl = botUsername ? `https://t.me/${botUsername}?start=orders` : 'tg://'

  const productTitle =
    order?.product?.title ||
    order?.plan?.product?.title ||
    order?.product?.name ||
    'محصول خریداری‌شده'
  const planName = order?.plan?.name || ''
  const displayTitle = planName ? `${productTitle} (${planName})` : productTitle
  const formattedCode = orderId ? `#${orderId.slice(-6).toUpperCase()}` : null

  return (
    <div
      className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans"
      dir="rtl"
    >
      {/* Background Ambient Glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-primary/6 blur-3xl" />
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none ${
            isSuccess
              ? 'bg-primary'
              : 'bg-destructive'
          }`}
        />
      </div>

      <div className="max-w-md w-full bg-card/95 border border-border/70 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
        {/* Top Gradient Bar */}
        <div
          className={`absolute left-0 right-0 top-0 h-1.5 ${
            isSuccess
              ? 'bg-gradient-to-r from-primary/70 via-primary to-primary/70'
              : 'bg-gradient-to-r from-destructive/80 via-destructive to-destructive/80'
          }`}
        />

        {isSuccess ? (
          <>
            {/* Status Icon */}
            <div
              className={`size-16 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner bg-primary/10 border border-primary/20 text-primary`}
            >
              {isAwaitingManual ? (
                <Clock className="size-8" />
              ) : (
                <CheckCircle2 className="size-9" />
              )}
            </div>

            {/* Status Badge */}
            <div className="flex justify-center mb-2">
              <Badge
                variant="outline"
                className="gap-1.5 text-xs font-semibold px-3 py-0.5 rounded-full border-primary/30 bg-primary/10 text-primary"
              >
                {isAwaitingManual ? (
                  <>
                    <Sparkles className="size-3" />
                    پرداخت موفق • در صف تحویل دستی
                  </>
                ) : isStockWaiting ? (
                  <>
                    <Clock className="size-3" />
                    پرداخت موفق • در انتظار تأمین موجودی
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-3" />
                    پرداخت با موفقیت انجام شد
                  </>
                )}
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mb-3">
              پرداخت با موفقیت انجام شد
            </h1>

            {/* Order Details Mini Card */}
            {orderId && (
              <div className="rounded-xl border border-border/70 bg-muted/40 p-3.5 mb-4 text-xs sm:text-sm text-right space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">شماره سفارش:</span>
                  <span className="font-mono font-bold text-foreground text-xs">
                    {formattedCode}
                  </span>
                </div>

                {displayTitle && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">محصول:</span>
                    <span className="font-semibold text-foreground text-xs truncate max-w-[200px]">
                      {displayTitle}
                    </span>
                  </div>
                )}

                {order?.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">مبلغ پرداختی:</span>
                    <span className="font-extrabold text-primary text-xs font-sans">
                      {order.amount.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                )}

                {order?.payment?.refId && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">کد پیگیری:</span>
                    <span className="font-mono font-medium text-muted-foreground text-xs">
                      {order.payment.refId}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Explanation Message */}
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              {isAwaitingManual ? (
                <>
                  پرداخت شما با موفقیت تأیید شد. این محصول نیازمند{' '}
                  <strong className="text-foreground">آماده‌سازی و تحویل دستی</strong>{' '}
                  توسط تیم پشتیبانی است. به زودی اطلاعات دسترسی برای شما در ربات تلگرام ارسال و در پنل کاربری درج خواهد شد.
                </>
              ) : isStockWaiting ? (
                <>
                  پرداخت شما ثبت شد. به دلیل اتمام موقت موجودی آنی، لینک فعال‌سازی به زودی از طریق ربات تلگرام برای شما ارسال خواهد شد.
                </>
              ) : (
                <>
                  سفارش شما با موفقیت تکمیل شد!{' '}
                  <strong className="text-foreground">اطلاعات فعال‌سازی</strong> به همراه راهنما در ربات تلگرام برای شما ارسال شده است.
                </>
              )}
            </p>

            <div className="space-y-3">
              <a
                href={botUrl}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 text-sm"
              >
                <MessageCircle className="size-4.5" />
                <span>
                  {isAwaitingManual
                    ? 'بازگشت به ربات تلگرام و پیگیری سفارش'
                    : 'بازگشت به ربات تلگرام و دریافت لینک'}
                </span>
              </a>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                <span>مشاهده وب‌سایت اصلی</span>
                <ArrowRight className="size-3.5 rotate-180" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="size-16 bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <XCircle className="size-9" />
            </div>

            <div className="flex justify-center mb-2">
              <Badge
                variant="outline"
                className="gap-1.5 text-xs font-semibold px-3 py-0.5 rounded-full border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              >
                {isCancelled ? 'تراکنش لغو شد' : 'پرداخت ناموفق'}
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mb-2">
              {isCancelled ? 'پرداخت لغو شد' : 'پرداخت ناموفق بود'}
            </h1>

            {orderId && (
              <div className="mb-3">
                <Badge
                  variant="outline"
                  className="text-xs font-sans tabular-nums border-border/80 bg-muted/40 text-foreground px-3 py-1 rounded-full"
                >
                  شماره سفارش: {formattedCode}
                </Badge>
              </div>
            )}

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              {isCancelled ? (
                <>
                  تراکنش توسط شما در درگاه پرداخت لغو گردید و مبلغی کسر نشد. در صورت تمایل می‌توانید سفارش خود را مجدداً از طریق ربات تلگرام ثبت نمایید.
                </>
              ) : (
                <>
                  تراکنش توسط شما لغو شد یا مشکلی در تایید آن از سمت درگاه پیش آمد. در صورت کسر وجه از حساب، مبلغ ظرف ۷۲ ساعت توسط بانک عودت داده می‌شود.
                </>
              )}
            </p>

            <div className="space-y-3">
              <a
                href={botUrl}
                className="w-full inline-flex items-center justify-center gap-2 border border-border/80 bg-background/50 hover:bg-muted text-foreground font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                <MessageCircle className="size-4.5" />
                <span>بازگشت به ربات تلگرام</span>
              </a>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                <span>مشاهده صفحه اصلی</span>
                <ArrowRight className="size-3.5 rotate-180" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
