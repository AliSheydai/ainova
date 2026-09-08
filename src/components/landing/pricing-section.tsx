'use client'

import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const planFeatures = [
  'فعال‌سازی روی حساب شخصی گوگل شما (جیمیل)',
  'اشتراک کامل جمینای با دسترسی ۱۸ ماهه',
  'فضای ابری ۲ ترابایتی گوگل وان',
  'دسترسی به ابزارهای پیشرفته هوش مصنوعی',
  'دریافت فوری لینک فعال‌سازی پس از پرداخت',
  'پشتیبانی و راهنمایی کامل در تمامی مراحل',
  'کاملاً امن و بدون نیاز به ارسال رمز عبور',
]

interface PricingSectionProps {
  price?: string
}

export function PricingSection({ price = '۳۹۰،۰۰۰ تومان' }: PricingSectionProps) {
  return (
    <section id='pricing' className='py-20 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6'>
        <div className='mb-12 text-center'>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            قیمت شفاف و بدون هزینه پنهان
          </h2>
          <p className='text-sm text-muted-foreground sm:text-base'>
            یک‌بار پرداخت برای ۱۸ ماه استفاده نامحدود از جمینای
          </p>
        </div>

        <div className='mx-auto max-w-sm'>
          <Card className='relative overflow-hidden border-primary/30 shadow-lg shadow-primary/10'>
            {/* Popular badge */}
            <div className='absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70' />

            <CardHeader className='pb-4 pt-7 text-center'>
              <div className='mb-2 flex justify-center'>
                <Badge className='rounded-full px-3 py-0.5 text-xs'>
                  <Sparkles className='me-1 size-3' />
                  پیشنهاد ویژه لانچ — ۱۸ ماهه
                </Badge>
              </div>
              <h3 className='text-xl font-bold text-foreground'>اشتراک ۱۸ ماهه جمینای</h3>

              <div className='mt-4'>
                <span className='text-4xl font-extrabold text-foreground'>
                  {price}
                </span>
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>یک‌بار پرداخت — ۱۸ ماه دسترسی کامل</p>
            </CardHeader>

            <Separator className='mx-6' />

            <CardContent className='pt-5'>
              <ul className='mb-6 space-y-3'>
                {planFeatures.map((feature) => (
                  <li key={feature} className='flex items-start gap-2.5 text-sm'>
                    <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                    <span className='text-foreground'>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href='/checkout' className='block'>
                <Button className='w-full py-5 text-base font-semibold shadow-md'>
                  خرید و فعال‌سازی فوری
                </Button>
              </Link>

              <p className='mt-3 text-center text-xs text-muted-foreground'>
                لینک فعال‌سازی بلافاصله پس از پرداخت در اختیارتان قرار می‌گیرد
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
