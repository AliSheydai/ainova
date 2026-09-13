'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, ArrowLeft, Check, Zap, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'
import { formatPrice, toPersianDigits } from '@/lib/persian-utils'

export interface ProductSummary {
  id: string
  title: string
  name: string
  slug: string
  shortDescription: string | null
  price: number
  minPrice?: number
  hasMultiplePlans?: boolean
  image?: string | null
  stock: number
  purchaseCount: number
  fulfillmentType: string
}

export function ProductsShowcaseSection({ products }: { products: ProductSummary[] }) {
  if (!products || products.length === 0) return null

  return (
    <section id='products' className='py-20 md:py-24 bg-muted/20 border-y border-border/40'>
      <div className='container mx-auto px-4 sm:px-6'>
        <motion.div
          className='mb-12 text-center max-w-2xl mx-auto'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mb-3'>
            <span>محصولات و اشتراک‌های برگزیده</span>
          </div>
          <h2 className='text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight'>
            ویترین اشتراک‌های هوش مصنوعی و دیجیتال
          </h2>
          <p className='text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl mx-auto leading-relaxed'>
            تمامی اشتراک‌ها با فعال‌سازی قانونی روی حساب کاربری شما، تحویل ۱۰۰٪ خودکار بلافاصله پس از پرداخت و گارانتی کامل پشتیبانی ارائه می‌شوند.
          </p>
        </motion.div>

        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={staggerContainer(0.08)}
        >
          {products.map((prod) => {
            const isAvailable = prod.stock > 0
            const displayPrice = prod.minPrice ?? prod.price
            return (
              <motion.div key={prod.id} variants={fadeUp} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className='h-full flex flex-col justify-between overflow-hidden border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 bg-card'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between gap-2 mb-2'>
                      {prod.image ? (
                        <div className='size-12 rounded-xl overflow-hidden border border-border/70 bg-muted/30 shrink-0 shadow-xs transition-transform duration-200'>
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
                      ) : (
                        <div className='size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/15 shadow-xs'>
                          <Package className='size-5' />
                        </div>
                      )}
                      {isAvailable ? (
                        <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'>
                          <Zap className='size-2.5 me-1' />
                          تحویل آنی
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-rose-500 border-rose-500/30 text-[10px]'>
                          اتمام موجودی
                        </Badge>
                      )}
                    </div>
                    <CardTitle className='text-base font-bold text-foreground line-clamp-1'>
                      {prod.title}
                    </CardTitle>
                    {prod.shortDescription && (
                      <CardDescription className='text-xs line-clamp-2 mt-1'>
                        {prod.shortDescription}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className='pt-0 space-y-4 flex-1 flex flex-col justify-end'>
                    <div className='pt-3 border-t border-border/40 flex items-baseline justify-between'>
                      <span className='text-[11px] text-muted-foreground'>
                        {prod.hasMultiplePlans ? 'شروع قیمت:' : 'قیمت اشتراک:'}
                      </span>
                      <div className='flex items-baseline gap-1'>
                        {prod.hasMultiplePlans && (
                          <span className='text-[11px] font-medium text-muted-foreground'>شروع از</span>
                        )}
                        <strong className='text-lg font-bold text-primary font-sans'>
                          {formatPrice(displayPrice)}
                        </strong>
                      </div>
                    </div>

                    <div className='flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg'>
                      <span>موجودی: {isAvailable ? `${toPersianDigits(prod.stock)} عدد` : 'ناموجود'}</span>
                      <span>{toPersianDigits(prod.purchaseCount)} خرید موفق</span>
                    </div>

                    <Link href={`/products/${prod.slug}`} className='block w-full'>
                      <Button className='w-full text-xs font-semibold gap-1.5 h-9'>
                        <span>مشاهده و خرید محصول</span>
                        <ArrowLeft className='size-3.5' />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* View All Products CTA */}
        <motion.div
          className='mt-10 sm:mt-12 text-center'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <Link href='/products'>
            <Button
              variant='outline'
              size='lg'
              className='h-11 sm:h-12 px-6 sm:px-8 text-xs sm:text-sm font-semibold gap-2 border-border/80 bg-background/80 hover:bg-accent/60 transition-all rounded-xl shadow-xs'
            >
              <span>مشاهده همه محصولات و فیلتر پیشرفته</span>
              <ArrowLeft className='size-4' />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
