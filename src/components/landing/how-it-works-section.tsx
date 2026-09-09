'use client'

import {
  ArrowDown,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'

const steps = [
  {
    number: '۰۱',
    stepLabel: 'گام نخست',
    icon: CreditCard,
    tag: 'پرداخت امن شتاب',
    title: 'انتخاب و خرید آنلاین',
    description:
      'اشتراک ۱۸ ماهه جمینای را انتخاب کرده و پرداخت امن را از طریق درگاه رسمی شاپرک در چند ثانیه انجام دهید.',
    time: 'کمتر از ۱ دقیقه',
  },
  {
    number: '۰۲',
    stepLabel: 'گام دوم',
    icon: Zap,
    tag: 'تحویل ۱۰۰٪ خودکار',
    title: 'دریافت آنی لینک فعال‌سازی',
    description:
      'بلافاصله پس از پرداخت موفق، لینک اختصاصی فعال‌سازی همراه با راهنمای شفاف در پنل کاربری شما قرار می‌گیرد.',
    time: 'آنی و بدون معطلی',
  },
  {
    number: '۰۳',
    stepLabel: 'گام سوم',
    icon: CheckCircle2,
    tag: 'بدون نیاز به پسورد',
    title: 'فعال‌سازی با یک کلیک',
    description:
      'روی لینک کلیک کنید و اشتراک را مستقیماً با حفظ کامل حریم خصوصی روی اکانت شخصی گوگل خودتان فعال نمایید.',
    time: 'تنها با ۱ کلیک',
  },
]

export function HowItWorksSection() {
  return (
    <section
      id='how-it-works'
      className='relative overflow-hidden bg-muted/40 py-20 md:py-24'
    >
      {/* Subtle ambient background glow */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-96 rounded-full bg-primary/5 blur-3xl'
      />

      <div className='container relative mx-auto px-4 sm:px-6'>
        {/* Section Header */}
        <motion.div
          className='mx-auto mb-14 max-w-2xl text-center'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className='mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs'>
            <Sparkles className='size-3.5' />
            <span>مسیر ساده و شفاف</span>
          </div>

          <h2 className='mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl'>
            چگونه در ۳ مرحله ساده اشتراکتان فعال می‌شود؟
          </h2>
          <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
            سریع، کاملاً خودکار و بدون نیاز به ارسال هرگونه اطلاعات حساس یا رمز
            عبور اکانت گوگل شما
          </p>
        </motion.div>

        {/* Steps Flow Grid */}
        <div className='mx-auto max-w-5xl'>
          <motion.div
            className='grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6'
            initial='hidden'
            whileInView='visible'
            viewport={viewportOnce}
            variants={staggerContainer(0.1)}
          >
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                className='relative flex flex-col'
              >
                {/* Step Card */}
                <div className='group relative flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'>
                  {/* Card Top: Icon & Step Badge */}
                  <div>
                    <div className='flex items-center justify-between'>
                      <div className='flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground'>
                        <step.icon className='size-6' />
                      </div>

                      <div className='flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground'>
                        <span className='font-bold text-primary'>
                          {step.number}
                        </span>
                        <span className='opacity-40'>|</span>
                        <span>{step.stepLabel}</span>
                      </div>
                    </div>

                    {/* Step Tag */}
                    <div className='mt-4'>
                      <span className='inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary'>
                        {step.tag}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className='mt-2.5 text-base font-bold text-foreground sm:text-lg'>
                      {step.title}
                    </h3>
                    <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                      {step.description}
                    </p>
                  </div>

                  {/* Card Bottom: Timing indicator */}
                  <div className='mt-6 flex items-center justify-between border-t border-border/50 pt-3.5 text-xs text-muted-foreground'>
                    <span>سرعت فرآیند:</span>
                    <span className='flex items-center gap-1 font-medium text-foreground'>
                      <Clock className='size-3 text-primary' />
                      {step.time}
                    </span>
                  </div>
                </div>

                {/* Desktop Connector Arrow pointing LEFT (RTL flow from Right to Left) */}
                {idx < steps.length - 1 && (
                  <div
                    aria-hidden='true'
                    className='absolute -left-3 top-1/2 z-10 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-card text-primary shadow-xs md:flex lg:-left-3.5 lg:size-8'
                  >
                    <ArrowLeft className='size-3.5 lg:size-4' />
                  </div>
                )}

                {/* Mobile Connector Arrow pointing DOWN (Vertical flow from Top to Bottom) */}
                {idx < steps.length - 1 && (
                  <div
                    aria-hidden='true'
                    className='my-1 flex flex-col items-center md:hidden'
                  >
                    <div className='h-2.5 w-0.5 bg-border' />
                    <div className='flex size-6 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-xs'>
                      <ArrowDown className='size-3' />
                    </div>
                    <div className='h-2.5 w-0.5 bg-border' />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom Security Assurance Banner */}
          <motion.div
            className='mt-10 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-card to-emerald-500/5 p-5 shadow-xs sm:p-6'
            initial='hidden'
            whileInView='visible'
            viewport={viewportOnce}
            variants={fadeUp}
          >
            <div className='flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-right'>
              <div className='flex size-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400'>
                <ShieldCheck className='size-6' />
              </div>
              <div className='flex-1 space-y-1.5'>
                <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
                  <h4 className='text-base font-bold text-foreground'>
                    تضمین ۱۰۰٪ امنیت اطلاعات و حریم خصوصی
                  </h4>
                  <span className='rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400'>
                    عدم نیاز به رمز عبور
                  </span>
                </div>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  برای فعال‌سازی اشتراک، به هیچ وجه نیازی به ارسال پسورد، کدهای
                  ورود یا دسترسی به جیمیل شما نیست. فرآیند کاملاً از طریق پیوند
                  رسمی و امن گوگل صورت می‌گیرد.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
