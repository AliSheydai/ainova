'use client'

import { Lock, ShieldCheck, UserCheck } from 'lucide-react'

const securityPoints = [
  {
    icon: Lock,
    title: 'بدون دریافت رمز عبور',
    description: 'هیچ‌گاه رمز عبور حساب Google شما را درخواست نمی‌کنیم.',
  },
  {
    icon: UserCheck,
    title: 'فعال‌سازی روی حساب خودتان',
    description: 'شما مستقیماً روی حساب شخصی Google خود مراحل فعال‌سازی را انجام می‌دهید.',
  },
  {
    icon: ShieldCheck,
    title: 'عدم نیاز به اطلاعات ورود',
    description: 'برای فعال‌سازی نیازی به ارسال Cookie یا Session Token نیست.',
  },
]

export function SecuritySection() {
  return (
    <section id='security' className='py-20 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6'>
        <div className='mx-auto max-w-2xl text-center'>
          <div className='mb-4 flex justify-center'>
            <div className='flex size-14 items-center justify-center rounded-2xl bg-primary/10'>
              <ShieldCheck className='size-7 text-primary' />
            </div>
          </div>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            حساب Google شما، نزد خودتان می‌ماند
          </h2>
          <p className='mb-10 text-sm leading-relaxed text-muted-foreground sm:text-base'>
            برای فعال‌سازی Google AI Pro نیازی به ارسال رمز عبور، Cookie یا
            اطلاعات ورود حساب Google خود ندارید. شما مستقیماً از طریق لینک
            فعال‌سازی وارد فرآیند Google می‌شوید.
          </p>
        </div>

        <div className='mx-auto grid max-w-3xl gap-4 sm:grid-cols-3'>
          {securityPoints.map((point) => (
            <div
              key={point.title}
              className='rounded-xl border border-border/60 bg-card p-5 text-center shadow-sm'
            >
              <div className='mb-3 flex justify-center'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
                  <point.icon className='size-5 text-primary' />
                </div>
              </div>
              <h3 className='mb-1.5 text-sm font-semibold text-foreground'>
                {point.title}
              </h3>
              <p className='text-xs leading-relaxed text-muted-foreground'>
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
