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
  price?: string
}

export function HeroSection({ price }: HeroSectionProps) {
  return (
    <section className='relative overflow-hidden py-20 md:py-28 lg:py-36'>
      {/* Background glow with subtle breathing fade */}
      <motion.div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/6 blur-3xl' />
      </motion.div>

      <div className='container mx-auto px-4 sm:px-6'>
        <motion.div
          className='mx-auto max-w-3xl text-center'
          variants={staggerContainer(0.08, 0.05)}
          initial='hidden'
          animate='visible'
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className='mb-6 flex justify-center'>
            <Badge
              variant='secondary'
              className='rounded-full px-4 py-1.5 text-sm font-medium'
            >
              <Sparkles className='me-1.5 size-3.5 text-primary' />
              مرجع تخصصی اشتراک‌های هوش مصنوعی و دیجیتال
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className='mb-5 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl'
          >
            کارهایتان را با قدرت{' '}
            <span className='text-primary'>هوش مصنوعی</span> متحول کنید
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className='mb-8 text-base leading-relaxed text-muted-foreground sm:text-lg'
          >
            دسترسی قانونی و بی‌واسطه به برترین سرویس‌های هوش مصنوعی جهان؛ فعال‌سازی سریع روی
            حساب شخصی شما، کاملاً امن، بدون نیاز به پسورد و با ضمانت اصالت.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className='mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'
          >
            <Link href='#products'>
              <Button size='lg' className='h-12 gap-2 px-8 text-base font-semibold shadow-md transition-transform active:scale-[0.98]'>
                <Sparkles className='size-4' />
                مشاهده و خرید محصولات
              </Button>
            </Link>
            <Link href='#how-it-works'>
              <Button
                variant='outline'
                size='lg'
                className='h-12 gap-2 px-6 text-base transition-transform active:scale-[0.98]'
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
            className='flex flex-wrap items-center justify-center gap-x-6 gap-y-2'
          >
            {trustItems.map((item) => (
              <motion.div
                key={item.text}
                variants={fadeIn}
                className='flex items-center gap-1.5 text-sm text-muted-foreground'
              >
                <item.icon className='size-4 shrink-0 text-primary' />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
