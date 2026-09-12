'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global layout error captured:', error)
  }, [error])

  return (
    <html lang='fa' dir='rtl'>
      <body className='min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans'>
        <div className='max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-center shadow-xl space-y-6'>
          <div className='w-16 h-16 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center'>
            <AlertTriangle className='w-8 h-8' />
          </div>

          <div className='space-y-2'>
            <h1 className='text-xl font-bold text-white'>
              خطای بحرانی در سامانه
            </h1>
            <p className='text-sm text-slate-400 leading-relaxed'>
              متأسفانه خطایی غیرمنتظره در بارگذاری ساختار اصلی سایت رخ داده است.
            </p>
          </div>

          {error?.digest && (
            <div className='p-2.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-400 break-all'>
              کد رهگیری: {error.digest}
            </div>
          )}

          <div className='pt-2'>
            <button
              onClick={() => reset()}
              className='inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors w-full cursor-pointer'
            >
              <RefreshCw className='w-4 h-4' />
              تلاش مجدد
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
