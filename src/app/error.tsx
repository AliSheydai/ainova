'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root application error captured:', error)
  }, [error])

  return (
    <div className='min-h-[70vh] flex items-center justify-center p-4' dir='rtl'>
      <div className='max-w-md w-full bg-card border border-border rounded-2xl p-6 md:p-8 text-center shadow-lg space-y-6'>
        <div className='w-16 h-16 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center'>
          <AlertTriangle className='w-8 h-8' />
        </div>

        <div className='space-y-2'>
          <h2 className='text-xl font-bold text-foreground'>
            خطایی در بارگذاری صفحه رخ داد
          </h2>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            متأسفانه هنگام پردازش این بخش مشکلی پیش آمده است. می‌توانید دوباره تلاش کنید یا به صفحه اصلی بازگردید.
          </p>
        </div>

        {error?.digest && (
          <div className='p-2.5 rounded-lg bg-muted/60 text-xs font-mono text-muted-foreground break-all'>
            کد رهگیری خطا: {error.digest}
          </div>
        )}

        <div className='flex flex-col sm:flex-row gap-3 pt-2 justify-center'>
          <Button
            onClick={() => reset()}
            className='gap-2 w-full sm:w-auto font-medium'
          >
            <RefreshCw className='w-4 h-4' />
            تلاش مجدد
          </Button>
          <Button
            variant='outline'
            asChild
            className='gap-2 w-full sm:w-auto'
          >
            <Link href='/'>
              <Home className='w-4 h-4' />
              صفحه اصلی
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
