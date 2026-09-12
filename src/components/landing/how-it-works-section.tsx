'use client'

import {
  ArrowDown,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
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
    title: 'انتخاب سرویس و پلن دلخواه',
    description:
      'سرویس مدنظر خود (چت‌جی‌پی‌تی، جمینای، کلود و...) و مدت زمان اشتراک را انتخاب کرده و پرداخت را از طریق درگاه بانکی در چند ثانیه انجام دهید.',
    time: 'کمتر از ۱ دقیقه',
  },
  {
    number: '۰۲',
    stepLabel: 'گام دوم',
    icon: Zap,
    tag: '۱۰۰٪ خودکار و فوری',
    title: 'تحویل آنی مشخصات در پنل',
    description:
      'بلافاصله پس از پرداخت، مشخصات دسترسی (لینک اختصاصی فعال‌سازی، اطلاعات اکانت یا وضعیت فعال‌سازی) همراه با راهنما در تب سفارش‌های شما قرار می‌گیرد.',
    time: 'آنی و بدون معطلی',
  },
  {
    number: '۰۳',
    stepLabel: 'گام سوم',
    icon: CheckCircle2,
    tag: 'سریع و بدون دردسر',
    title: 'فعال‌سازی و استفاده نامحدود',
    description:
      'بر اساس راهنما، تنها با یک کلیک روی لینک اختصاصی یا ورود با مشخصات دریافتی، بدون تنظیمات پیچیده از تمام امکانات پرمیوم لذت ببرید.',
    time: 'کمتر از ۲ دقیقه',
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
            <span>مسیر ساده و شفاف</span>
          </div>

          <h2 className='mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl'>
            چگونه در ۳ مرحله ساده اشتراکتان فعال می‌شود؟
          </h2>
          <p className='text-sm leading-relaxed text-muted-foreground sm:text-base'>
            سریع، خودکار و بدون معطلی؛ فعال‌سازی فوری انواع اشتراک‌های هوش مصنوعی و دیجیتال
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

                      <div className='flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/70 px-2.5 py-1 text-xs font-semibold text-foreground/80'>
                        <span className='font-bold text-primary'>
                          {step.number}
                        </span>
                        <span className='text-border font-normal'>|</span>
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
            className='mt-10 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/5 via-card to-primary/5 p-5 shadow-xs sm:p-6'
            initial='hidden'
            whileInView='visible'
            viewport={viewportOnce}
            variants={fadeUp}
          >
            <div className='flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-right'>
              <div className='flex size-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20'>
                <ShieldCheck className='size-6' />
              </div>
              <div className='flex-1 space-y-1.5'>
                <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
                  <h4 className='text-base font-bold text-foreground'>
                    تضمین اصالت، پایداری و حفظ کامل حریم خصوصی
                  </h4>
                  <span className='rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary'>
                    قانونی و با ضمانت کامل
                  </span>
                </div>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  تمامی اشتراک‌ها به صورت قانونی، رسمی و اختصاصی فعال می‌شوند. نیازی به ارائه رمزهای عبور شخصی شما نبوده و اطلاعات، تاریخچه چت‌ها و پروژه‌های شما کاملاً ایزوله و محرمانه باقی می‌مانند. تمامی سفارش‌ها دارای گارانتی کامل تا آخرین روز اشتراک هستند.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
