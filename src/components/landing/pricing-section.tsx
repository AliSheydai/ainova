'use client'

import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { fadeUp, scaleIn, viewportOnce } from '@/lib/motion'

const planFeatures = [
  'فعال‌سازی رسمی و قانونی روی حساب کاربری شما',
  'دسترسی نامحدود و اختصاصی به امکانات پیشرفته',
  'تحویل ۱۰۰٪ خودکار و آنی بلافاصله پس از پرداخت',
  'پشتیبانی تخصصی و راهنمایی کامل در تمامی مراحل',
  'کاملاً امن و بدون نیاز به ارسال رمز عبور یا اطلاعات ورود',
  'گارانتی سلامت و پایداری در تمام طول دوره اشتراک',
]

interface PricingSectionProps {
  price?: string
  productTitle?: string
  productSlug?: string
}

export function PricingSection({
  price = '۳۹۰،۰۰۰ تومان',
  productTitle = 'Google AI Pro ۱۸ ماهه',
  productSlug = 'google-ai-pro',
}: PricingSectionProps) {
  return (
    <section id='pricing' className='py-20 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6'>
        <motion.div
          className='mb-12 text-center'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className='mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary'>
            <Sparkles className='size-3' />
            <span>پلن ویژه و برگزیده</span>
          </div>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            قیمت‌گذاری شفاف و بی‌واسطه
          </h2>
          <p className='text-sm text-muted-foreground sm:text-base'>
            ارائه پرطرفدارترین اشتراک هوش مصنوعی با بهترین قیمت بازار و تحویل آنی
          </p>
        </motion.div>

        <motion.div
          className='mx-auto max-w-sm'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={scaleIn}
        >
          <Card className='relative overflow-hidden border-primary/30 shadow-lg shadow-primary/10 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/15'>
            {/* Popular badge */}
            <div className='absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70' />

            <CardHeader className='pb-4 pt-7 text-center'>
              <div className='mb-2 flex justify-center'>
                <Badge className='rounded-full px-3 py-0.5 text-xs'>
                  <Sparkles className='me-1 size-3' />
                  پیشنهاد ویژه و پرفروش
                </Badge>
              </div>
              <h3 className='text-xl font-bold text-foreground'>{productTitle}</h3>

              <div className='mt-4'>
                <span className='text-4xl font-extrabold text-foreground'>
                  {price}
                </span>
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>تحویل فوری و ۱۰۰٪ خودکار بلافاصله پس از پرداخت</p>
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

              <Link href={`/products/${productSlug}`} className='block'>
                <Button className='w-full py-5 text-base font-semibold shadow-md transition-transform active:scale-[0.98]'>
                  مشاهده و خرید آنی
                </Button>
              </Link>

              <p className='mt-3 text-center text-xs text-muted-foreground'>
                لینک یا مشخصات فعال‌سازی بلافاصله پس از پرداخت در اختیارتان قرار می‌گیرد
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
