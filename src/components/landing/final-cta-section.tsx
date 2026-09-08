'use client'

import Link from 'next/link'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FinalCtaSectionProps {
  price?: string
}

export function FinalCtaSection({ price }: FinalCtaSectionProps) {
  return (
    <section className='py-20 md:py-28'>
      <div className='container mx-auto px-4 sm:px-6'>
        <div className='mx-auto max-w-2xl text-center'>
          <div className='mb-4 flex justify-center'>
            <div className='flex size-14 items-center justify-center rounded-2xl bg-primary/10'>
              <Sparkles className='size-7 text-primary' />
            </div>
          </div>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            آماده‌اید سرعت کارهایتان را چند برابر کنید؟
          </h2>
          <p className='mb-2 text-sm text-muted-foreground sm:text-base'>
            دسترسی کامل ۱۸ ماهه به هوش مصنوعی جمینای
          </p>
          {price && (
            <p className='mb-8 text-2xl font-bold text-primary'>{price}</p>
          )}
          <div className='flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
            <Link href='/dashboard/buy'>
              <Button size='lg' className='h-12 gap-2 px-8 text-base font-semibold shadow-md'>
                خرید و شروع با جمینای
              </Button>
            </Link>
          </div>
          <div className='mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
            <ShieldCheck className='size-3.5 text-primary' />
            <span>فعال‌سازی آنی • کاملاً امن و بدون نیاز به رمز عبور</span>
          </div>
        </div>
      </div>
    </section>
  )
}
