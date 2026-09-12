'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error captured:', error)
  }, [error])

  return (
    <div className='flex-1 flex items-center justify-center p-6 min-h-[50vh]' dir='rtl'>
      <div className='max-w-lg w-full bg-card border border-destructive/20 rounded-2xl p-6 md:p-8 text-center space-y-5 shadow-sm'>
        <div className='w-14 h-14 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center'>
          <AlertCircle className='w-7 h-7' />
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-bold text-foreground'>
            خطا در بارگذاری بخش مدیریت
          </h3>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            هنگام دریافت یا پردازش اطلاعات این بخش از پنل ادمین مشکلی پیش آمده است.
          </p>
        </div>

        {error?.digest && (
          <div className='p-2 rounded-lg bg-muted text-xs font-mono text-muted-foreground'>
            شناسه خطا: {error.digest}
          </div>
        )}

        <div className='flex flex-col sm:flex-row gap-3 pt-2 justify-center'>
          <Button
            onClick={() => reset()}
            variant='default'
            className='gap-2'
          >
            <RefreshCw className='w-4 h-4' />
            بارگذاری مجدد این بخش
          </Button>
          <Button
            variant='outline'
            asChild
            className='gap-2'
          >
            <Link href='/dashboard'>
              <ArrowRight className='w-4 h-4' />
              بازگشت به پیشخوان ادمین
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
