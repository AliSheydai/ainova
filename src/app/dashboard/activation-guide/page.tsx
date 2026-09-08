'use client'

import { BookOpen, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

const steps = [
  {
    number: '۱',
    title: 'لینک فعال‌سازی را باز کنید',
    description:
      'از بخش «سفارش‌های من» یا صفحه موفقیت خرید، لینک فعال‌سازی خود را پیدا کنید.',
  },
  {
    number: '۲',
    title: 'با حساب Google وارد شوید',
    description:
      'در صورت درخواست Google، با حساب Google خود (Gmail) وارد شوید. رمز عبور را فقط به Google وارد کنید.',
  },
  {
    number: '۳',
    title: 'مراحل را تکمیل کنید',
    description:
      'مراحل نمایش‌داده‌شده توسط Google را دنبال کنید و فعال‌سازی را تأیید کنید.',
  },
  {
    number: '۴',
    title: 'وضعیت را بررسی کنید',
    description:
      'پس از فعال‌سازی، از طریق تنظیمات حساب Google وضعیت Google AI Pro را بررسی کنید.',
  },
]

export default function ActivationGuidePage() {
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-col gap-6 p-4 sm:p-6'>
        {/* Page title */}
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
            <BookOpen className='size-5 text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-foreground'>
              راهنمای فعال‌سازی
            </h1>
            <p className='text-sm text-muted-foreground'>
              نحوه استفاده از لینک فعال‌سازی Google AI Pro
            </p>
          </div>
        </div>

        <Separator />

        {/* Steps */}
        <div className='flex flex-col gap-4'>
          {steps.map((step, idx) => (
            <Card key={idx} className='border-border/60'>
              <CardContent className='flex gap-4 p-5'>
                <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
                  {step.number}
                </div>
                <div>
                  <h3 className='mb-1 text-sm font-semibold text-foreground'>
                    {step.title}
                  </h3>
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security warning */}
        <Card className='border-destructive/20 bg-destructive/5'>
          <CardHeader className='pb-2'>
            <div className='flex items-center gap-2'>
              <ShieldCheck className='size-4 text-destructive' />
              <span className='text-sm font-semibold text-destructive'>
                هشدار امنیتی مهم
              </span>
            </div>
          </CardHeader>
          <CardContent className='pb-5'>
            <p className='text-sm leading-relaxed text-foreground'>
              <strong>هرگز رمز عبور حساب Google خود را برای ما ارسال نکنید.</strong>
              <br />
              ما نیازی به رمز عبور شما نداریم. رمز عبور را فقط در صفحات رسمی
              Google وارد کنید.
            </p>
          </CardContent>
        </Card>

        {/* Region info */}
        <Card className='border-border/60'>
          <CardContent className='p-5'>
            <h3 className='mb-2 text-sm font-semibold text-foreground'>
              🌍 نکته مهم درباره Region
            </h3>
            <p className='mb-4 text-sm leading-relaxed text-muted-foreground'>
              برخی قابلیت‌های Google AI Pro بر اساس کشور/Region حساب متفاوت
              هستند. قبل از فعال‌سازی وضعیت Region حساب Google خود را بررسی
              کنید.
            </p>
            <Link
              href='https://policies.google.com/country-association-form'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Button variant='outline' size='sm' className='gap-2'>
                <ExternalLink className='size-3.5' />
                مدیریت کشور حساب Google
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Go to orders */}
        <div className='flex items-center gap-3'>
          <Link href='/dashboard/orders'>
            <Button variant='outline' className='gap-2'>
              <Sparkles className='size-4' />
              مشاهده سفارش‌های من
            </Button>
          </Link>
        </div>
      </Main>
    </>
  )
}
