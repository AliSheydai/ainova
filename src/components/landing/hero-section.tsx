'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fadeUp, fadeIn, staggerContainer } from '@/lib/motion'
import { AnimatedIconNetwork } from '@/components/landing/animated-icon-network'

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
    <section
      id='hero'
      className='relative h-[calc(100svh-4rem)] min-h-[560px] overflow-hidden flex flex-col justify-between'
    >
      {/* Background Glow */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/8 blur-3xl' />
        <div className='absolute bottom-0 right-1/4 h-[300px] w-[400px] rounded-full bg-primary/5 blur-3xl' />
      </div>

      {/* Hero Content Wrapper — shifted upwards closer to header while maintaining full-screen height */}
      <div className='relative z-10 flex flex-col justify-between flex-1 -translate-y-6 sm:-translate-y-9 lg:-translate-y-12'>
        {/* Main Hero Content — positioned elegantly in upper area */}
        <div className='flex-1 flex items-center justify-center px-4 sm:px-6 pt-1 sm:pt-2 pb-0'>
        <motion.div
          className='mx-auto max-w-3xl w-full text-center'
          variants={staggerContainer(0.08, 0.05)}
          initial='hidden'
          animate='visible'
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className='mb-2.5 sm:mb-3 flex justify-center'>
            <Badge
              variant='secondary'
              className='rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium'
            >
              <Sparkles className='me-1.5 size-3.5 text-primary' />
              مرجع تخصصی اشتراک‌های هوش مصنوعی و دیجیتال
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className='mb-2 sm:mb-2.5 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground'
          >
            کارهایتان را با قدرت{' '}
            <span className='text-primary'>هوش مصنوعی</span> متحول کنید
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className='mb-3 sm:mb-3.5 text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto'
          >
            دسترسی قانونی و بی‌واسطه به برترین سرویس‌های هوش مصنوعی جهان؛ فعال‌سازی سریع روی
            حساب شخصی شما، کاملاً امن، بدون نیاز به پسورد و با ضمانت اصالت.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className='mb-3 sm:mb-3.5 flex flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3.5'
          >
            <Link href='/products'>
              <Button size='lg' className='h-10 sm:h-11 gap-2 px-5 sm:px-7 text-xs sm:text-sm font-semibold shadow-md transition-transform active:scale-[0.98] rounded-xl'>
                مشاهده و خرید محصولات
              </Button>
            </Link>
            <Link href='#how-it-works'>
              <Button
                variant='outline'
                size='lg'
                className='h-10 sm:h-11 gap-2 px-4 sm:px-6 text-xs sm:text-sm transition-transform active:scale-[0.98] rounded-xl'
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
            className='flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1'
          >
            {trustItems.map((item) => (
              <motion.div
                key={item.text}
                variants={fadeIn}
                className='flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground'
              >
                <item.icon className='size-3.5 shrink-0 text-primary' />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Animated Icon Network — precisely aligned with header content width */}
      <div className='w-full container mx-auto px-3 sm:px-4 md:px-6 shrink-0'>
        <div className='w-full px-0 sm:px-2'>
          <AnimatedIconNetwork className='h-[280px] sm:h-[320px] md:h-[360px] lg:h-[400px] -mt-4 sm:-mt-6 lg:-mt-10' />
        </div>
      </div>
      </div>
    </section>
  )
}

