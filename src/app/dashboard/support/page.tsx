'use client'

import { ExternalLink, HeadphonesIcon, MessageCircle, Phone } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// These would come from env/config in production
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '۰۲۱-XXXXXXXX'
const SUPPORT_TELEGRAM = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || 'https://t.me/support'

export default function SupportPage() {
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
            <HeadphonesIcon className='size-5 text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-foreground'>پشتیبانی</h1>
            <p className='text-sm text-muted-foreground'>
              در صورت وجود مشکل در خرید یا فعال‌سازی، با ما در ارتباط باشید
            </p>
          </div>
        </div>

        <Separator />

        <div className='grid gap-4 sm:grid-cols-2'>
          {/* Telegram */}
          <Card className='border-border/60'>
            <CardHeader>
              <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
                <MessageCircle className='size-5 text-primary' />
              </div>
              <CardTitle className='mt-3 text-base'>پشتیبانی تلگرام</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-3'>
              <p className='text-sm text-muted-foreground'>
                سریع‌ترین روش ارتباط با تیم پشتیبانی ما از طریق تلگرام است.
              </p>
              <a href={SUPPORT_TELEGRAM} target='_blank' rel='noopener noreferrer'>
                <Button className='w-full gap-2'>
                  <ExternalLink className='size-4' />
                  گفتگو در تلگرام
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Phone */}
          <Card className='border-border/60'>
            <CardHeader>
              <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
                <Phone className='size-5 text-primary' />
              </div>
              <CardTitle className='mt-3 text-base'>تماس تلفنی</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-3'>
              <p className='text-sm text-muted-foreground'>
                در صورت نیاز می‌توانید مستقیماً با پشتیبانی تماس بگیرید.
              </p>
              <a href={`tel:${SUPPORT_PHONE}`}>
                <Button variant='outline' className='w-full gap-2'>
                  <Phone className='size-4' />
                  {SUPPORT_PHONE}
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card className='border-border/50 bg-muted/40'>
          <CardContent className='p-5'>
            <p className='text-sm leading-relaxed text-muted-foreground'>
              هنگام تماس شماره سفارش خود را در اختیار داشته باشید تا پشتیبانی
              بتواند سریع‌تر به شما کمک کند.
            </p>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
