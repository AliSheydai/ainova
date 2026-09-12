import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  searchParams: Promise<{
    status?: string
    orderId?: string
    msg?: string
  }>
}

export default async function TelegramReturnPage({ searchParams }: PageProps) {
  const params = await searchParams
  const isSuccess = params.status === 'success' || params.status === 'stock_waiting'
  const isStockWaiting = params.status === 'stock_waiting'
  const orderId = params.orderId
  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
    'arioaccountbot'
  const botUrl = botUsername ? `https://t.me/${botUsername}?start=orders` : 'tg://'

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans" dir="rtl">
      {/* Background Ambient Glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-primary/6 blur-3xl" />
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none ${
            isSuccess ? 'bg-primary' : 'bg-rose-500'
          }`}
        />
      </div>

      <div className="max-w-md w-full bg-card/95 border border-border/70 rounded-2xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
        {/* Top Gradient Bar */}
        <div
          className={`absolute left-0 right-0 top-0 h-1.5 ${
            isSuccess
              ? 'bg-gradient-to-r from-primary/70 via-primary to-primary/70'
              : 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-500'
          }`}
        />

        {isSuccess ? (
          <>
            <div className="size-16 bg-primary/10 border border-primary/20 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="size-9" />
            </div>

            <h1 className="text-2xl font-extrabold text-foreground mb-2">
              پرداخت با موفقیت انجام شد
            </h1>

            {orderId && (
              <div className="mb-4">
                <Badge variant="outline" className="text-xs font-sans tabular-nums border-border/80 bg-muted/40 text-foreground px-3 py-1 rounded-full">
                  شماره سفارش: #{orderId.slice(-6).toUpperCase()}
                </Badge>
              </div>
            )}

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              {isStockWaiting ? (
                <>
                  پرداخت شما ثبت شد. به دلیل اتمام موقت موجودی آنی، لینک فعال‌سازی به زودی از طریق ربات تلگرام برای شما ارسال خواهد شد.
                </>
              ) : (
                <>
                  سفارش شما با موفقیت تکمیل شد! <strong className="text-foreground">لینک اختصاصی فعال‌سازی</strong> به همراه راهنما در ربات تلگرام برای شما ارسال شده است.
                </>
              )}
            </p>

            <div className="space-y-3">
              <a
                href={botUrl}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 text-sm"
              >
                <MessageCircle className="size-4.5" />
                <span>بازگشت به ربات تلگرام و دریافت لینک</span>
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
            <div className="size-16 bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <XCircle className="size-9" />
            </div>

            <h1 className="text-2xl font-extrabold text-foreground mb-2">
              پرداخت ناموفق بود
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              تراکنش توسط شما لغو شد یا مشکلی در تایید آن از سمت درگاه پیش آمد. در صورت کسر وجه از حساب، مبلغ ظرف ۷۲ ساعت توسط بانک عودت داده می‌شود.
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
