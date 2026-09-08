'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const trustItems = [
  { icon: ShieldCheck, text: 'فعال‌سازی روی حساب شخصی گوگل شما' },
  { icon: ShieldCheck, text: 'کاملاً امن و بدون نیاز به رمز عبور' },
  { icon: Zap, text: 'تحویل فوری بلافاصله پس از پرداخت' },
]

interface HeroSectionProps {
  price?: string
}

export function HeroSection({ price }: HeroSectionProps) {
  return (
    <section className='relative overflow-hidden py-20 md:py-28 lg:py-36'>
      {/* Background glow */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10'
      >
        <div className='absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/6 blur-3xl' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <div className='mx-auto max-w-3xl text-center'>
          {/* Badge */}
          <div className='mb-6 flex justify-center'>
            <Badge
              variant='secondary'
              className='rounded-full px-4 py-1.5 text-sm font-medium'
            >
              <Sparkles className='me-1.5 size-3.5 text-primary' />
              پیشنهاد ویژه لانچ — اشتراک ۱۸ ماهه جمینای
            </Badge>
          </div>

          {/* Headline */}
          <h1 className='mb-5 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl'>
            کارهایتان را با قدرت{' '}
            <span className='text-primary'>جمینای</span> متحول کنید
          </h1>

          {/* Subtitle */}
          <p className='mb-8 text-base leading-relaxed text-muted-foreground sm:text-lg'>
            دسترسی ۱۸ ماهه به قوی‌ترین هوش مصنوعی گوگل، مستقیم روی حساب شخصی
            خودتان؛ بدون نیاز به رمز عبور، با بیشترین سرعت و تحویل آنی.
          </p>

          {/* CTAs */}
          <div className='mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
            <Link href='/checkout'>
              <Button size='lg' className='h-12 gap-2 px-8 text-base font-semibold shadow-md'>
                خرید و فعال‌سازی جمینای
                {price && (
                  <span className='opacity-80 text-sm font-normal'>
                    — {price}
                  </span>
                )}
              </Button>
            </Link>
            <Link href='#how-it-works'>
              <Button
                variant='outline'
                size='lg'
                className='h-12 gap-2 px-6 text-base'
              >
                <BookOpen className='size-4' />
                مراحل فعال‌سازی
                <ArrowLeft className='size-4 rtl:rotate-180' />
              </Button>
            </Link>
          </div>

          {/* Trust items */}
          <div className='flex flex-wrap items-center justify-center gap-x-6 gap-y-2'>
            {trustItems.map((item) => (
              <div
                key={item.text}
                className='flex items-center gap-1.5 text-sm text-muted-foreground'
              >
                <item.icon className='size-4 shrink-0 text-primary' />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
