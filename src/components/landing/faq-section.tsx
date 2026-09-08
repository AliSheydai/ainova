'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'جمینای چیست و چه امکاناتی دارد؟',
    a: 'جمینای پیشرفته‌ترین مدل هوش مصنوعی گوگل است که قابلیت‌هایی مثل مکالمه هوشمند، کدنویسی، تحلیل عمیق مقالات، تولید محتوا در ابزارهای اداری گوگل و ۲ ترابایت فضای ابری گوگل وان را در اختیارتان می‌گذارد.',
  },
  {
    q: 'آیا اشتراک روی جیمیل یا حساب شخصی خودم فعال می‌شود؟',
    a: 'بله، دقیقاً. لینک اختصاصی فعال‌سازی به گونه‌ای است که اشتراک مستقیماً روی حساب اصلی گوگل خودتان فعال می‌شود و نیازی به حساب جدید ندارید.',
  },
  {
    q: 'آیا نیازی به ارسال رمز عبور حساب گوگل دارم؟',
    a: 'خیر، به هیچ وجه! امنیت شما اولویت ماست؛ شما هیچ‌گاه نیازی به ارسال رمز عبور، اطلاعات ورود یا کدهای امنیتی حسابتان ندارید.',
  },
  {
    q: 'لینک فعال‌سازی را چگونه و چه زمانی تحویل می‌گیرم؟',
    a: 'بلافاصله پس از پرداخت موفق، لینک اختصاصی فعال‌سازی در پنل کاربری شما (بخش سفارش‌های من) قرار می‌گیرد و می‌توانید استفاده کنید.',
  },
  {
    q: 'فعال‌سازی چقدر زمان می‌برد؟',
    a: 'کل فرآیند کمتر از چند دقیقه طول می‌کشد و اشتراک بلافاصله برای مدت ۱۸ ماه روی حسابتان فعال خواهد شد.',
  },
  {
    q: 'اگر در فعال‌سازی با سوال یا مشکلی مواجه شدم چه کنم؟',
    a: 'تیم پشتیبانی ما همیشه همراه شماست؛ در هر مرحله می‌توانید از طریق تلگرام یا بخش پشتیبانی پیام دهید تا سریعاً راهنمایی‌تان کنیم.',
  },
  {
    q: 'آیا اطلاعات و ایمیل‌های قبلی جیمیل من حفظ می‌شود؟',
    a: 'بله، تمامی فایل‌ها، ایمیل‌ها و داده‌های قبلی شما کاملاً دست‌نخورده باقی می‌مانند و این اشتراک فقط امکانات جدید و ۲ ترابایت فضا را به حسابتان اضافه می‌کند.',
  },
  {
    q: 'آیا کشور یا منطقه حساب گوگل مهم است؟',
    a: 'پیشنهاد می‌شود برای دسترسی به تمامی امکانات به‌روز، منطقه حساب گوگل شما روی کشوری به جز ایران تنظیم شده باشد.',
  },
  {
    q: 'چطور با پشتیبانی در ارتباط باشم؟',
    a: 'از طریق بخش پشتیبانی در پنل کاربری یا به صورت مستقیم از طریق تلگرام، پاسخگوی شما هستیم.',
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
            پاسخ به سوال‌های پرتکرار درباره اشتراک ۱۸ ماهه جمینای
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
