'use client'

import Link from 'next/link'
import { ExternalLink, Sparkles } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const footerLinks = [
  { label: 'صفحه اصلی', href: '/' },
  { label: 'محصولات و اشتراک‌ها', href: '#products' },
  { label: 'امکانات و مزایا', href: '#features' },
  { label: 'نحوه فعال‌سازی', href: '#how-it-works' },
  { label: 'سوالات متداول', href: '#faq' },
]

export function LandingFooter() {
  return (
    <footer className='border-t border-border/50 bg-muted/30 pt-10 pb-24 md:py-10'>
      <div className='container mx-auto px-4 sm:px-6'>
        {/* Top */}
        <div className='flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between'>
          {/* Brand */}
          <div>
            <Link href='/' className='mb-3 flex items-center gap-2.5'>
              <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
                <Sparkles className='size-4' />
              </div>
              <div className='flex flex-col text-start'>
                <span className='text-sm font-bold text-foreground leading-tight'>آریوچت</span>
                {/* <span className='text-[10px] text-muted-foreground font-medium leading-none'>ArioChat</span> */}
              </div>
            </Link>
            <p className='max-w-xs text-xs leading-relaxed text-muted-foreground'>
              مرجع تخصصی خرید و فعال‌سازی قانونی انواع اشتراک‌های هوش مصنوعی و سرویس‌های دیجیتال.
              تحویل ۱۰۰٪ خودکار، کاملاً مطمئن و بدون نیاز به ارسال رمز عبور.
            </p>
          </div>

          {/* Links */}
          <nav className='flex flex-wrap gap-x-5 gap-y-2'>
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='text-sm text-muted-foreground transition-colors hover:text-foreground'
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Contact */}
          <div className='flex flex-col gap-2 text-sm text-muted-foreground'>
            <Link
              href='https://t.me/support'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 transition-colors hover:text-foreground'
            >
              <ExternalLink className='size-3.5' />
              پشتیبانی تلگرام
            </Link>
          </div>
        </div>

        <Separator className='my-6' />

        {/* Bottom */}
        <div className='flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row'>
          <p>
            © {new Date().getFullYear()} آریوچت — تمامی حقوق محفوظ است.
          </p>
          <p className='text-center text-xs text-muted-foreground'>
            بستری امن و آسان برای دسترسی مستقیم و قانونی به ابزارهای بین‌المللی هوش مصنوعی روی حساب‌های شخصی.
          </p>
        </div>
      </div>
    </footer>
  )
}
