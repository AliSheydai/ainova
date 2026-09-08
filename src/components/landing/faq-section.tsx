'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'Google AI Pro چیست؟',
    a: 'Google AI Pro یک پلن اشتراکی از Google است که دسترسی به قابلیت‌های پیشرفته Gemini و سایر سرویس‌های AI گوگل را فراهم می‌کند.',
  },
  {
    q: 'آیا روی حساب Google خودم فعال می‌شود؟',
    a: 'بله. لینک فعال‌سازی به‌گونه‌ای طراحی شده که شما مستقیماً روی حساب Google شخصی خودتان فعال‌سازی را انجام می‌دهید.',
  },
  {
    q: 'آیا باید رمز حساب Google را ارسال کنم؟',
    a: 'خیر. هیچ‌گاه رمز عبور، Cookie یا اطلاعات ورود حساب Google خود را برای ما ارسال نکنید. ما نیازی به این اطلاعات نداریم.',
  },
  {
    q: 'بعد از پرداخت لینک فعال‌سازی را چگونه دریافت می‌کنم؟',
    a: 'پس از تأیید پرداخت توسط سیستم، لینک فعال‌سازی در پنل کاربری شما (بخش سفارش‌های من) نمایش داده می‌شود.',
  },
  {
    q: 'فعال‌سازی چقدر زمان می‌برد؟',
    a: 'در اکثر موارد لینک فعال‌سازی بلافاصله پس از تأیید پرداخت در دسترس است.',
  },
  {
    q: 'اگر لینک فعال‌سازی کار نکرد چه کنم؟',
    a: 'در این صورت با پشتیبانی از طریق تلگرام یا تلفن تماس بگیرید. شماره سفارش خود را داشته باشید.',
  },
  {
    q: 'آیا می‌توانم از Gmail فعلی خودم استفاده کنم؟',
    a: 'بله، شما می‌توانید با حساب Google فعلی خود (Gmail) فعال‌سازی را انجام دهید.',
  },
  {
    q: 'آیا Region حساب Google مهم است؟',
    a: 'برخی قابلیت‌ها بر اساس منطقه حساب Google متفاوت هستند. قبل از فعال‌سازی وضعیت Region حساب خود را بررسی کنید.',
  },
  {
    q: 'در صورت مشکل چگونه با پشتیبانی تماس بگیرم؟',
    a: 'از طریق صفحه پشتیبانی در پنل کاربری، یا مستقیماً از طریق تلگرام یا تماس تلفنی با ما در ارتباط باشید.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='border-b border-border/60 last:border-0'>
      <button
        className='flex w-full items-center justify-between gap-3 py-4 text-start text-sm font-medium text-foreground transition-colors hover:text-primary'
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden text-sm text-muted-foreground transition-all duration-300',
          open ? 'max-h-40 pb-4' : 'max-h-0'
        )}
      >
        <p className='leading-relaxed'>{a}</p>
      </div>
    </div>
  )
}

export function FaqSection() {
  return (
    <section id='faq' className='bg-muted/40 py-20 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6'>
        <div className='mb-10 text-center'>
          <h2 className='mb-2 text-2xl font-bold text-foreground sm:text-3xl'>
            سوالات متداول
          </h2>
          <p className='text-sm text-muted-foreground'>
            پاسخ سوال‌های رایج درباره Google AI Pro
          </p>
        </div>
        <div className='mx-auto max-w-2xl rounded-xl border border-border/60 bg-card px-5 shadow-sm'>
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
