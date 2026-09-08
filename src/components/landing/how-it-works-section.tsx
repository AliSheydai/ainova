'use client'

import { ArrowLeft, CheckCircle, Link2, ShoppingCart } from 'lucide-react'

const steps = [
  {
    number: '۱',
    icon: ShoppingCart,
    title: 'خرید',
    description:
      'Google AI Pro را انتخاب کنید و پرداخت آنلاین را انجام دهید.',
  },
  {
    number: '۲',
    icon: Link2,
    title: 'دریافت لینک',
    description:
      'پس از تأیید پرداخت، لینک فعال‌سازی بلافاصله در پنل کاربری شما نمایش داده می‌شود.',
  },
  {
    number: '۳',
    icon: CheckCircle,
    title: 'فعال‌سازی',
    description:
      'روی لینک کلیک کنید و با حساب Google خودتان مراحل فعال‌سازی را انجام دهید.',
  },
]

export function HowItWorksSection() {
  return (
    <section id='how-it-works' className='bg-muted/40 py-20 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6'>
        <div className='mb-12 text-center'>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            چطور کار می‌کند؟
          </h2>
          <p className='text-sm text-muted-foreground sm:text-base'>
            سه مرحله ساده — هیچ اطلاعات حساسی از شما نمی‌خواهیم
          </p>
        </div>

        <div className='mx-auto max-w-3xl'>
          <div className='relative flex flex-col gap-6 md:flex-row'>
            {/* Connector line */}
            <div
              aria-hidden
              className='absolute right-7 top-10 hidden h-[2px] w-[calc(100%-3.5rem)] bg-border md:block'
            />

            {steps.map((step, idx) => (
              <div key={step.number} className='relative flex-1'>
                {/* Step card */}
                <div className='flex flex-row items-start gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm md:flex-col md:items-center md:text-center'>
                  {/* Icon + Number */}
                  <div className='relative flex-shrink-0'>
                    <div className='flex size-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-background'>
                      <step.icon className='size-6 text-primary' />
                    </div>
                    <span className='absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
                      {step.number}
                    </span>
                  </div>

                  <div>
                    <h3 className='mb-1.5 text-base font-semibold text-foreground'>
                      {step.title}
                    </h3>
                    <p className='text-sm leading-relaxed text-muted-foreground'>
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow between steps (mobile) */}
                {idx < steps.length - 1 && (
                  <div className='flex justify-center py-1 md:hidden'>
                    <ArrowLeft className='size-4 rotate-90 text-muted-foreground' />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Important note */}
          <div className='mt-8 rounded-xl border border-border/60 bg-card px-5 py-4'>
            <p className='text-center text-sm font-medium text-foreground'>
              ⚠️ نیازی به ارسال ایمیل یا رمز عبور حساب Google خود ندارید.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
