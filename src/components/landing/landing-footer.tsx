'use client'

import Link from 'next/link'
import { ExternalLink, Sparkles } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const footerLinks = [
  { label: 'صفحه اصلی', href: '/' },
  { label: 'نحوه فعال‌سازی', href: '#how-it-works' },
  { label: 'سوالات متداول', href: '#faq' },
]

export function LandingFooter() {
  return (
    <footer className='border-t border-border/50 bg-muted/30 py-10'>
      <div className='container mx-auto px-4 sm:px-6'>
        {/* Top */}
        <div className='flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between'>
          {/* Brand */}
          <div>
            <Link href='/' className='mb-3 flex items-center gap-2.5'>
              <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
                <Sparkles className='size-4' />
              </div>
              <span className='text-sm font-bold text-foreground'>جمینای</span>
            </Link>
            <p className='max-w-xs text-xs leading-relaxed text-muted-foreground'>
              فعال‌سازی سریع و امن اشتراک ۱۸ ماهه هوش مصنوعی جمینای روی حساب شخصی گوگل شما،
              کاملاً مطمئن و بدون نیاز به ارسال رمز عبور.
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
            © {new Date().getFullYear()} جمینای — تمامی حقوق محفوظ است
          </p>
          <p className='text-center text-xs text-muted-foreground'>
            این سرویس بستری امن و آسان برای فعال‌سازی اشتراک رسمی هوش مصنوعی روی حساب‌های کاربری گوگل است.
          </p>
        </div>
      </div>
    </footer>
  )
}
