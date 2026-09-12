'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeUp, viewportOnce } from '@/lib/motion'

const faqs = [
  {
    q: 'چه نوع اشتراک‌ها و محصولاتی در فروشگاه عرضه می‌شوند؟',
    a: 'فروشگاه ما مرجع ارائه اشتراک‌های رسمی و قانونی برترین سرویس‌های هوش مصنوعی دنیا از جمله Google AI Pro (جمینای پیشرفته)، اشتراک‌های پردازش زبان، تولید تصویر و ویدیو، و لایسنس‌های دیجیتال است.',
  },
  {
    q: 'تحویل سفارش‌ها چقدر زمان می‌برد و چگونه انجام می‌شود؟',
    a: 'تحویل کلیه سفارش‌ها ۱۰۰٪ خودکار و آنی است. بلافاصله پس از پرداخت موفق در درگاه شاپرک، لینک فعال‌سازی، لایسنس یا مشخصات اشتراک به همراه راهنمای قدم‌به‌قدم در پنل کاربری شما و ربات تلگرام نمایش داده می‌شود.',
  },
  {
    q: 'آیا برای فعال‌سازی نیازی به ارسال رمز عبور اکانت است؟',
    a: 'خیر، به هیچ عنوان! حفظ امنیت و حریم خصوصی شما خط قرمز ماست. فرآیند فعال‌سازی بدون نیاز به پسورد، کدهای ورود یا هرگونه دسترسی به حساب شخصی شما انجام می‌شود.',
  },
  {
    q: 'آیا اشتراک‌ها مستقیماً روی اکانت شخصی خودم فعال می‌شوند؟',
    a: 'بله، اشتراک‌ها قانونی بوده و مستقیماً روی حساب کاربری شخصی خودتان فعال می‌گردند؛ بنابراین تمامی تاریخچه، پروژه‌ها و فایل‌های قبلی‌تان با نهایت امنیت حفظ خواهند شد.',
  },
  {
    q: 'اشتراک Google AI Pro شامل چه امکاناتی است؟',
    a: 'این اشتراک دسترسی ۱۸ ماهه به قدرتمندترین مدل Gemini 3.1 Pro، پژوهشگر خودکار Deep Research، استودیوی ساخت ویدیو Veo 3.1، تولید تصویر با Nano Banana Pro، محیط کدنویسی Canvas و ۲ ترابایت فضای ابری گوگل وان را فراهم می‌سازد.',
  },
  {
    q: 'گارانتی و پشتیبانی سرویس‌ها به چه صورت است؟',
    a: 'تمامی محصولات فروشگاه دارای ضمانت کامل کارکرد در طول مدت اشتراک و پشتیبانی اختصاصی هستند. در صورت بروز هرگونه ابهام یا مشکل، تیم فنی ما در سریع‌ترین زمان همراه شماست.',
  },
  {
    q: 'آیا برای استفاده از خدمات نیاز به تغییر کشور یا تنظیمات خاصی است؟',
    a: 'اکثر سرویس‌های بین‌المللی با ابزارهای تغییر آی‌پی استاندارد قابل استفاده هستند و راهنمای کامل تنظیمات به همراه هر سفارش به شما ارائه خواهد شد.',
  },
  {
    q: 'چطور می‌توانم با پشتیبانی در ارتباط باشم؟',
    a: 'از طریق بخش سفارش‌های من در پنل کاربری، یا از طریق پشتیبانی آنلاین در تلگرام، کارشناسان ما به صورت مستمر پاسخگوی سوالات شما هستند.',
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
    <section id='faq' className='bg-muted/50 py-20 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6'>
        <motion.div
          className='mb-10 text-center'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <h2 className='mb-2 text-2xl font-bold text-foreground sm:text-3xl'>
            سوالات متداول
          </h2>
          <p className='text-sm text-muted-foreground'>
            پاسخ به سوال‌های پرتکرار کاربران درباره اشتراک‌های هوش مصنوعی و روند سفارش
          </p>
        </motion.div>
        <motion.div
          className='mx-auto max-w-2xl rounded-xl border border-border/75 bg-card px-5 shadow-xs'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
