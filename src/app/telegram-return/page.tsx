import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, MessageCircle } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]" dir="rtl">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow effect */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              پرداخت با موفقیت انجام شد
            </h1>

            {orderId && (
              <p className="text-xs text-slate-400 mb-4 bg-slate-800/60 py-1 px-3 rounded-full inline-block border border-slate-700/50">
                شماره سفارش: #{orderId.slice(-6).toUpperCase()}
              </p>
            )}

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {isStockWaiting ? (
                <>
                  پرداخت شما ثبت شد. به دلیل اتمام موقت موجودی آنی، لینک فعال‌سازی به زودی از طریق ربات تلگرام برای شما ارسال خواهد شد.
                </>
              ) : (
                <>
                  سفارش شما با موفقیت تکمیل شد! <strong>لینک اختصاصی فعال‌سازی</strong> به همراه راهنما در ربات تلگرام برای شما ارسال شده است.
                </>
              )}
            </p>

            <div className="space-y-3">
              <a
                href={botUrl}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5" />
                <span>بازگشت به ربات تلگرام و دریافت لینک</span>
              </a>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-2 transition-colors"
              >
                <span>مشاهده وب‌سایت اصلی</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <XCircle className="w-9 h-9" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              پرداخت ناموفق بود
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              تراکنش توسط شما لغو شد یا مشکلی در تایید آن از سمت درگاه پیش آمد. در صورت کسر وجه از حساب، مبلغ ظرف ۷۲ ساعت توسط بانک عودت داده می‌شود.
            </p>

            <div className="space-y-3">
              <a
                href={botUrl}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-xl border border-slate-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>بازگشت به ربات تلگرام</span>
              </a>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-2 transition-colors"
              >
                <span>مشاهده صفحه اصلی</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
