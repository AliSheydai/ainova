'use client'

import Link from 'next/link'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { fadeUp, viewportOnce } from '@/lib/motion'

interface FinalCtaSectionProps {
  price?: string
}

export function FinalCtaSection({ price }: FinalCtaSectionProps) {
  return (
    <section className='py-20 md:py-28'>
      <div className='container mx-auto px-4 sm:px-6'>
        <motion.div
          className='mx-auto max-w-2xl text-center'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className='mb-4 flex justify-center'>
            <div className='flex size-14 items-center justify-center rounded-2xl bg-primary/10'>
              <Sparkles className='size-7 text-primary' />
            </div>
          </div>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            آماده‌اید سرعت و بهره‌وری کارهایتان را چند برابر کنید؟
          </h2>
          <p className='mb-6 text-sm text-muted-foreground sm:text-base'>
            دسترسی آنی و قانونی به کامل‌ترین مجموعه اشتراک‌های پیشرفته هوش مصنوعی جهان
          </p>
          <div className='flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
            <Link href='#products'>
              <Button size='lg' className='h-12 gap-2 px-8 text-base font-semibold shadow-md transition-transform active:scale-[0.98]'>
                <Sparkles className='size-4' />
                مشاهده محصولات و شروع خرید
              </Button>
            </Link>
          </div>
          <div className='mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
            <ShieldCheck className='size-3.5 text-primary' />
            <span>تحویل ۱۰۰٪ آنی و خودکار • فعال‌سازی قانونی و امن • پشتیبانی دائمی</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
