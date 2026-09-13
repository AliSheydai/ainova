'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fadeUp, fadeIn, staggerContainer } from '@/lib/motion'

const trustItems = [
  { icon: Zap, text: 'تحویل ۱۰۰٪ آنی و خودکار پس از پرداخت' },
  { icon: ShieldCheck, text: 'فعال‌سازی قانونی روی اکانت شخصی شما' },
  { icon: ShieldCheck, text: 'امنیت کامل بدون نیاز به رمز عبور' },
]

interface HeroSectionProps {
  productCount?: number
  price?: string
}

export function HeroSection({ productCount = 3, price }: HeroSectionProps) {
  return (
    <section id='hero' className='relative overflow-hidden py-20 md:py-28 lg:py-32'>
      {/* Background Glow */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/8 blur-3xl' />
        <div className='absolute bottom-0 right-1/4 h-[300px] w-[400px] rounded-full bg-primary/5 blur-3xl' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <motion.div
          className='mx-auto max-w-3xl text-center'
          variants={staggerContainer(0.08, 0.05)}
          initial='hidden'
          animate='visible'
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className='mb-5 sm:mb-6 flex justify-center'>
            <Badge
              variant='secondary'
              className='rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium'
            >
              <Sparkles className='me-1.5 size-3.5 text-primary' />
              مرجع تخصصی اشتراک‌های هوش مصنوعی و دیجیتال
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className='mb-4 sm:mb-5 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground'
          >
            کارهایتان را با قدرت{' '}
            <span className='text-primary'>هوش مصنوعی</span> متحول کنید
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className='mb-7 sm:mb-8 text-xs sm:text-base md:text-lg leading-relaxed text-muted-foreground'
          >
            دسترسی قانونی و بی‌واسطه به برترین سرویس‌های هوش مصنوعی جهان؛ فعال‌سازی سریع روی
            حساب شخصی شما، کاملاً امن، بدون نیاز به پسورد و با ضمانت اصالت.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className='mb-8 sm:mb-10 flex flex-col items-center gap-2.5 sm:gap-3 sm:flex-row sm:justify-center'
          >
            <Link href='/products' className='w-full sm:w-auto'>
              <Button size='lg' className='w-full sm:w-auto h-11 sm:h-12 gap-2 px-6 sm:px-8 text-sm sm:text-base font-semibold shadow-md transition-transform active:scale-[0.98] rounded-xl'>
                مشاهده و خرید محصولات
              </Button>
            </Link>
            <Link href='#how-it-works' className='w-full sm:w-auto'>
              <Button
                variant='outline'
                size='lg'
                className='w-full sm:w-auto h-11 sm:h-12 gap-2 px-5 sm:px-6 text-xs sm:text-base transition-transform active:scale-[0.98] rounded-xl'
              >
                <BookOpen className='size-4' />
                نحوه تحویل و فعال‌سازی
                <ArrowLeft className='size-4 rtl:rotate-180' />
              </Button>
            </Link>
          </motion.div>

          {/* Trust items */}
          <motion.div
            variants={staggerContainer(0.06)}
            className='flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2'
          >
            {trustItems.map((item) => (
              <motion.div
                key={item.text}
                variants={fadeIn}
                className='flex items-center gap-1.5 text-[11px] sm:text-sm text-muted-foreground'
              >
                <item.icon className='size-3.5 sm:size-4 shrink-0 text-primary' />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
