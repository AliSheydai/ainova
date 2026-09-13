'use client'

import { Lock, ShieldCheck, UserCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'

const securityPoints = [
  {
    icon: Lock,
    title: 'بدون نیاز به رمز عبور',
    description: 'رمز عبور شما کاملاً محرمانه است و ما هیچ‌گاه آن را از شما درخواست نخواهیم کرد.',
  },
  {
    icon: UserCheck,
    title: 'فعال‌سازی روی حساب خودتان',
    description: 'اشتراک‌ها مستقیماً روی حساب شخصی خودتان فعال می‌شوند و تمامی داده‌ها و حریم خصوصی‌تان محفوظ می‌ماند.',
  },
  {
    icon: ShieldCheck,
    title: 'بدون نیاز به اطلاعات ورود',
    description: 'هیچ‌گونه نشست، اطلاعات ورود یا دسترسی به حساب شخصی شما دریافت نمی‌شود.',
  },
]

export function SecuritySection() {
  return (
    <section id='security' className='py-20 md:py-24'>
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
              <ShieldCheck className='size-6 sm:size-7 text-primary' />
            </div>
          </div>
          <h2 className='mb-3 text-xl sm:text-2xl md:text-3xl font-bold text-foreground'>
            حساب کاربری شما در امنیت کامل می‌ماند
          </h2>
          <p className='mb-8 sm:mb-10 text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground'>
            برای فعال‌سازی اشتراک‌ها نیازی به ارسال رمز عبور، اطلاعات ورود یا دسترسی به
            حسابتان ندارید. شما مستقیماً از طریق پیوندها و راهکارهای رسمی و امن، اشتراک را روی
            حساب کاربری خود فعال می‌کنید.
          </p>
        </motion.div>

        <motion.div
          className='mx-auto grid max-w-3xl gap-3 sm:gap-4 sm:grid-cols-3'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={staggerContainer(0.08)}
        >
          {securityPoints.map((point) => (
            <motion.div
              key={point.title}
              variants={fadeUp}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className='rounded-2xl border border-border/75 bg-card p-4 sm:p-5 text-center shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5'
            >
              <div className='mb-3 flex justify-center'>
                <div className='flex size-9 sm:size-10 items-center justify-center rounded-xl bg-primary/10'>
                  <point.icon className='size-4.5 sm:size-5 text-primary' />
                </div>
              </div>
              <h3 className='mb-1.5 text-xs sm:text-sm font-semibold text-foreground'>
                {point.title}
              </h3>
              <p className='text-[11px] sm:text-xs leading-relaxed text-muted-foreground'>
                {point.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
