'use client'

import Link from 'next/link'
import { Check, Sparkles, Zap, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { fadeUp, scaleIn, staggerContainer, viewportOnce } from '@/lib/motion'
import { formatPrice } from '@/lib/persian-utils'

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
  image?: string | null
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
          <div className='mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-[11px] sm:text-xs font-semibold text-primary'>
            <span>پلن‌ها و تعرفه‌های ویژه</span>
          </div>
          <h2 className='mb-3 text-xl sm:text-2xl md:text-3xl font-bold text-foreground'>
            قیمت‌گذاری شفاف، بی‌واسطه و رقابتی
          </h2>
          <p className='text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed'>
            دسترسی به قدرتمندترین سرویس‌های هوش مصنوعی با بهترین نرخ، تحویل تمام خودکار و پشتیبانی مستقیم
          </p>
        </motion.div>

        {displayProducts && displayProducts.length > 0 ? (
          <motion.div
            className={`grid gap-4 sm:gap-6 max-w-6xl mx-auto ${
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
                        : 'border-border/70 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* Top Accent Line */}
                    <div
                      className={`absolute left-0 right-0 top-0 h-1.5 ${
                        isPopular
                          ? 'bg-gradient-to-r from-primary/40 via-primary to-primary/40'
                          : 'bg-border/60'
                      }`}
                    />

                    <CardHeader className='pb-4 pt-6 sm:pt-7 text-center px-4 sm:px-6'>
                      <div className='mb-2.5 flex items-center justify-center gap-2'>
                        {prod.image && (
                          <div className='size-7 sm:size-8 rounded-lg overflow-hidden border border-border/80 bg-muted/30 shrink-0 shadow-2xs'>
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className='size-full object-cover'
                              loading='lazy'
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        {isPopular ? (
                          <Badge className='rounded-full px-2.5 sm:px-3 py-0.5 text-[11px] sm:text-xs bg-primary text-primary-foreground font-semibold'>
                            <Sparkles className='me-1 size-3' />
                            پیشنهاد ویژه و پرفروش
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='rounded-full px-2.5 sm:px-3 py-0.5 text-[11px] sm:text-xs text-muted-foreground'>
                            اشتراک قانونی
                          </Badge>
                        )}
                      </div>

                      <h3 className='text-base sm:text-lg md:text-xl font-bold text-foreground line-clamp-1'>
                        {prod.title}
                      </h3>

                      {prod.shortDescription && (
                        <p className='text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed min-h-[32px]'>
                          {prod.shortDescription}
                        </p>
                      )}

                      <div className='mt-3 sm:mt-4 flex flex-col items-center justify-center'>
                        {prod.hasMultiplePlans && (
                          <span className='text-[10px] sm:text-xs text-muted-foreground mb-0.5'>شروع قیمت از</span>
                        )}
                        <span className='text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground font-sans'>
                          {formatPrice(currentPrice)}
                        </span>
                      </div>
                      <p className='mt-1 text-[10px] sm:text-[11px] text-muted-foreground flex items-center justify-center gap-1'>
                        <Zap className='size-3 text-primary shrink-0' />
                        <span>تحویل آنی و خودکار پس از پرداخت</span>
                      </p>
                    </CardHeader>

                    <Separator className='mx-4 sm:mx-6' />

                    <CardContent className='pt-4 sm:pt-5 px-4 sm:px-6 flex-1 flex flex-col justify-between space-y-5 sm:space-y-6'>
                      <ul className='space-y-2.5 sm:space-y-3'>
                        {feats.map((feature, i) => (
                          <li key={i} className='flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm leading-relaxed'>
                            <Check className='mt-0.5 size-3.5 sm:size-4 shrink-0 text-primary' />
                            <span className='text-foreground/90'>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className='pt-2'>
                        <Link href={`/products/${prod.slug}`} className='block w-full'>
                          <Button
                            variant={isPopular ? 'default' : 'outline'}
                            className='w-full h-11 sm:h-12 text-xs sm:text-sm font-semibold shadow-xs rounded-xl'
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
            <Card className='relative overflow-hidden border-primary/30 shadow-lg shadow-primary/10 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/15 rounded-2xl'>
              <div className='absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70' />

              <CardHeader className='pb-4 pt-6 sm:pt-7 text-center px-4 sm:px-6'>
                <div className='mb-2 flex justify-center'>
                  <Badge className='rounded-full px-3 py-0.5 text-xs'>
                    <Sparkles className='me-1 size-3' />
                    پیشنهاد ویژه و پرفروش
                  </Badge>
                </div>
                <h3 className='text-lg sm:text-xl font-bold text-foreground'>{productTitle}</h3>

                <div className='mt-3 sm:mt-4'>
                  <span className='text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground font-sans'>
                    {price}
                  </span>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>تحویل فوری و ۱۰۰٪ خودکار بلافاصله پس از پرداخت</p>
              </CardHeader>

              <Separator className='mx-4 sm:mx-6' />

              <CardContent className='pt-4 sm:pt-5 px-4 sm:px-6'>
                <ul className='mb-5 sm:mb-6 space-y-2.5 sm:space-y-3'>
                  {fallbackFeatures.map((feature) => (
                    <li key={feature} className='flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed'>
                      <Check className='mt-0.5 size-3.5 sm:size-4 shrink-0 text-primary' />
                      <span className='text-foreground'>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/products/${productSlug}`} className='block'>
                  <Button className='w-full h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-md transition-transform active:scale-[0.98] rounded-xl'>
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
