'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, ShoppingCart, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Checkout error captured:', error)
  }, [error])

  return (
    <div className='min-h-[70vh] flex items-center justify-center p-4' dir='rtl'>
      <div className='max-w-md w-full bg-card border border-border rounded-2xl p-6 md:p-8 text-center shadow-lg space-y-6'>
        <div className='w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center'>
          <AlertCircle className='w-8 h-8' />
        </div>

        <div className='space-y-2'>
          <h2 className='text-xl font-bold text-foreground'>
            خطا در پردازش سبد خرید
          </h2>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            مشکلی در آماده‌سازی فرم سفارش رخ داده است. می‌توانید دوباره امتحان کنید یا در صورت تکرار با پشتیبانی در ارتباط باشید.
          </p>
        </div>

        {error?.digest && (
          <div className='p-2.5 rounded-lg bg-muted/60 text-xs font-mono text-muted-foreground break-all'>
            شناسه پیگیری: {error.digest}
          </div>
        )}

        <div className='flex flex-col gap-2.5 pt-2'>
          <Button
            onClick={() => reset()}
            className='gap-2 w-full font-medium'
          >
            <RefreshCw className='w-4 h-4' />
            تلاش دوباره
          </Button>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              variant='outline'
              asChild
              className='gap-1.5'
            >
              <Link href='/'>
                <ShoppingCart className='w-4 h-4' />
                ویترین محصولات
              </Link>
            </Button>
            <Button
              variant='outline'
              asChild
              className='gap-1.5'
            >
              <Link href='https://t.me/ainova_support' target='_blank'>
                <MessageSquare className='w-4 h-4' />
                پشتیبانی تلگرام
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
