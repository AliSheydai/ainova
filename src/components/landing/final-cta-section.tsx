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
          <div className='mb-3.5 sm:mb-4 flex justify-center'>
            <div className='flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-primary/10'>
              <Sparkles className='size-6 sm:size-7 text-primary' />
            </div>
          </div>
          <h2 className='mb-3 text-xl sm:text-2xl md:text-3xl font-bold text-foreground'>
            آماده‌اید سرعت و بهره‌وری کارهایتان را چند برابر کنید؟
          </h2>
          <p className='mb-6 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto'>
            دسترسی آنی و قانونی به کامل‌ترین مجموعه اشتراک‌های پیشرفته هوش مصنوعی جهان
          </p>
          <div className='flex flex-col items-center gap-3 sm:flex-row sm:justify-center w-full'>
            <Link href='/products' className='w-full sm:w-auto'>
              <Button size='lg' className='w-full sm:w-auto h-11 sm:h-12 gap-2 px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-md transition-transform active:scale-[0.98] rounded-xl'>
                مشاهده محصولات و شروع خرید
              </Button>
            </Link>
          </div>
          <div className='mt-5 flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground text-center'>
            <ShieldCheck className='size-3.5 text-primary shrink-0' />
            <span>تحویل ۱۰۰٪ آنی و خودکار • فعال‌سازی قانونی و امن • پشتیبانی دائمی</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
