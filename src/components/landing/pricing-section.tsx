'use client'

import Link from 'next/link'
import { Check, Sparkles, Zap, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { fadeUp, scaleIn, staggerContainer, viewportOnce } from '@/lib/motion'

const fallbackFeatures = [
  'فعال‌سازی رسمی و قانونی روی حساب شما',
  'تحویل ۱۰۰٪ خودکار و آنی بلافاصله پس از پرداخت',
  'پشتیبانی تخصصی در تمامی مراحل فعال‌سازی',
  'بدون نیاز به ارسال رمز عبور یا اطلاعات ورود',
  'گارانتی سلامت و پایداری در طول دوره اشتراک',
]

export interface PricingProduct {
  id: string
  title: string
  slug: string
  shortDescription?: string | null
  price: number
  minPrice?: number
  hasMultiplePlans?: boolean
  features?: string[] | null
  plans?: {
    id: string
    name: string
    duration: number
    price: number
  }[]
}

interface PricingSectionProps {
  products?: PricingProduct[]
  price?: string
  productTitle?: string
  productSlug?: string
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

export function PricingSection({
  products,
  price = '۳۹۰،۰۰۰ تومان',
  productTitle = 'Google AI Pro ۱۸ ماهه',
  productSlug = 'google-ai-pro',
}: PricingSectionProps) {
  // If products array is provided and not empty, render dynamic comparison cards
  const displayProducts = products && products.length > 0 ? products.slice(0, 3) : null

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
            <span>پلن‌ها و تعرفه‌های ویژه</span>
          </div>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            قیمت‌گذاری شفاف، بی‌واسطه و رقابتی
          </h2>
          <p className='text-sm text-muted-foreground sm:text-base max-w-xl mx-auto'>
            دسترسی به قدرتمندترین سرویس‌های هوش مصنوعی با بهترین نرخ، تحویل تمام خودکار و پشتیبانی مستقیم
          </p>
        </motion.div>

        {displayProducts && displayProducts.length > 0 ? (
          <motion.div
            className={`grid gap-6 max-w-6xl mx-auto ${
              displayProducts.length === 1
                ? 'max-w-md grid-cols-1'
                : displayProducts.length === 2
                ? 'max-w-3xl grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
            initial='hidden'
            whileInView='visible'
            viewport={viewportOnce}
            variants={staggerContainer(0.1)}
          >
            {displayProducts.map((prod, index) => {
              const isPopular = index === 0
              const currentPrice = prod.minPrice ?? prod.price
              const feats =
                Array.isArray(prod.features) && prod.features.length > 0
                  ? (prod.features as string[]).slice(0, 5)
                  : fallbackFeatures.slice(0, 5)

              return (
                <motion.div key={prod.id} variants={scaleIn} className='flex'>
                  <Card
                    className={`relative flex flex-col justify-between w-full overflow-hidden transition-all duration-300 rounded-2xl ${
                      isPopular
                        ? 'border-primary/50 shadow-xl shadow-primary/10 ring-1 ring-primary/20'
                        : 'border-border/70 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Top Accent Line */}
                    <div
                      className={`absolute left-0 right-0 top-0 h-1.5 ${
                        isPopular
                          ? 'bg-gradient-to-r from-primary via-emerald-500 to-primary'
                          : 'bg-border/60'
                      }`}
                    />

                    <CardHeader className='pb-4 pt-7 text-center'>
                      <div className='mb-2 flex justify-center'>
                        {isPopular ? (
                          <Badge className='rounded-full px-3 py-0.5 text-xs bg-primary text-primary-foreground font-semibold'>
                            <Sparkles className='me-1 size-3' />
                            پیشنهاد ویژه و پرفروش
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='rounded-full px-3 py-0.5 text-xs text-muted-foreground'>
                            اشتراک قانونی
                          </Badge>
                        )}
                      </div>

                      <h3 className='text-xl font-bold text-foreground line-clamp-1'>
                        {prod.title}
                      </h3>

                      {prod.shortDescription && (
                        <p className='text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]'>
                          {prod.shortDescription}
                        </p>
                      )}

                      <div className='mt-4 flex flex-col items-center justify-center'>
                        {prod.hasMultiplePlans && (
                          <span className='text-xs text-muted-foreground mb-1'>شروع قیمت از</span>
                        )}
                        <span className='text-3xl sm:text-4xl font-extrabold text-foreground font-sans'>
                          {formatPrice(currentPrice)}
                        </span>
                      </div>
                      <p className='mt-1 text-[11px] text-muted-foreground flex items-center justify-center gap-1'>
                        <Zap className='size-3 text-emerald-500' />
                        <span>تحویل آنی و خودکار پس از پرداخت</span>
                      </p>
                    </CardHeader>

                    <Separator className='mx-6' />

                    <CardContent className='pt-5 flex-1 flex flex-col justify-between space-y-6'>
                      <ul className='space-y-3'>
                        {feats.map((feature, i) => (
                          <li key={i} className='flex items-start gap-2.5 text-xs sm:text-sm'>
                            <Check className='mt-0.5 size-4 shrink-0 text-primary' />
                            <span className='text-foreground/90'>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className='pt-2'>
                        <Link href={`/products/${prod.slug}`} className='block w-full'>
                          <Button
                            variant={isPopular ? 'default' : 'outline'}
                            className='w-full py-5 text-sm font-semibold shadow-xs'
                          >
                            <span>مشاهده و خرید</span>
                            <ArrowLeft className='size-4 ms-1.5' />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            className='mx-auto max-w-sm'
            initial='hidden'
            whileInView='visible'
            viewport={viewportOnce}
            variants={scaleIn}
          >
            <Card className='relative overflow-hidden border-primary/30 shadow-lg shadow-primary/10 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/15'>
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
                  {fallbackFeatures.map((feature) => (
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
        )}
      </div>
    </section>
  )
}
