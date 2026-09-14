'use client'

import { useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Star,
  ChevronRight,
  ChevronLeft,
  Quote,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp, viewportOnce } from '@/lib/motion'
import { formatPersianDate, toPersianDigits } from '@/lib/persian-utils'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import InfiniteSpiral, { type InfiniteSpiralRef } from '@/components/ui/comment-gallery'

export interface TopReviewItem {
  id: string
  userName: string
  rating: number
  comment: string
  createdAt: string | Date
  product: {
    id: string
    title: string
    slug: string
    image?: string | null
  }
}

interface TopReviewsSectionProps {
  reviews: TopReviewItem[]
}

export function TopReviewsSection({ reviews }: TopReviewsSectionProps) {
  const spiralRef = useRef<InfiniteSpiralRef>(null)
  const isMobile = useIsMobile()

  // Ensure enough items for a seamless, continuous 3D loop without gaps
  const displayReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return []
    if (reviews.length >= 8) return reviews

    const repeated = [...reviews]
    while (repeated.length < 8) {
      repeated.push(...reviews)
    }
    return repeated
  }, [reviews])

  if (!reviews || reviews.length === 0) {
    return null
  }

  return (
    <section
      id='testimonials'
      className='py-14 sm:py-20 md:py-28 relative overflow-hidden'
      dir='rtl'
    >
      <div className='container mx-auto px-4 sm:px-6 relative z-10'>
        {/* Section Header */}
        <div className='flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12'>
          <motion.div
            className='max-w-2xl text-start'
            initial='hidden'
            whileInView='visible'
            viewport={viewportOnce}
            variants={fadeUp}
          >
            {/* Pill Badge */}
            {/* <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3.5 shadow-2xs'>
              <Sparkles className='size-3.5 text-primary animate-pulse' />
              <span>بازخورد و نظرات برتر خریداران</span>
            </div> */}

            <h2 className='mb-3 text-xl sm:text-2xl md:text-3xl font-bold text-foreground max-md:text-center'>
              تجربه واقعی مشتریان از سرویس‌های آریوچت
            </h2>
            <p className='mt-3 text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground text-muted-foreground max-md:text-center'>
              دیدگاه‌های برگزیده و مستند خریداران پیرامون سرعت فعال‌سازی، کیفیت پشتیبانی و اصالت
              اشتراک‌های تحویل داده شده.  
            </p>
          </motion.div>

          {/* Navigation Controls */}
          <div className='flex items-center gap-2.5 self-end shrink-0'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => spiralRef.current?.prev(1)}
              className='size-9 p-0 rounded-xl border-border/70 bg-card hover:bg-muted/80 shadow-2xs hover:scale-105 active:scale-95 transition-all'
              title='دیدگاه قبلی'
              aria-label='دیدگاه قبلی'
            >
              <ChevronRight className='size-4 text-foreground' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => spiralRef.current?.next(1)}
              className='size-9 p-0 rounded-xl border-border/70 bg-card hover:bg-muted/80 shadow-2xs hover:scale-105 active:scale-95 transition-all'
              title='دیدگاه بعدی'
              aria-label='دیدگاه بعدی'
            >
              <ChevronLeft className='size-4 text-foreground' />
            </Button>
          </div>
        </div>

        {/* Interactive 3D Comment Gallery Spiral - seamless floating on section background */}
        <div className='relative w-[calc(100%+2rem)] -mx-4 sm:w-full sm:mx-0 h-[460px] sm:h-[530px] md:h-[590px]'>
          <InfiniteSpiral
            ref={spiralRef}
            items={displayReviews}
            animationMode='auto'
            enableScroll={false}
            speed={0.35}
            radius={isMobile ? 76 : 250}
            cardWidth={isMobile ? 276 : 330}
            cardHeight={isMobile ? 174 : 195}
            verticalSpacing={isMobile ? 64 : 75}
            perspective={isMobile ? 850 : 1100}
            cardRadius={16}
            centerScale={isMobile ? 1.05 : 1.12}
            edgeBlur={isMobile ? 2 : 2.5}
            cardsPerTurn={isMobile ? 6 : 7}
            pauseOnHover
            direction='up'
            rotation={0}
            cardTilt={0}
            edgeFade={0.38}
            renderItem={(item: TopReviewItem) => {
              const formattedDate = formatPersianDate(item.createdAt, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })

              return (
                <div className='group relative h-full w-full flex flex-col justify-between p-3.5 sm:p-5 text-start select-none'>
                  {/* Decorative Quote Mark Watermark */}
                  <Quote className='absolute end-3.5 top-1/2 -translate-y-1/2 size-9 text-muted-foreground/5 group-hover:text-primary/10 transition-colors pointer-events-none' />

                  {/* Top: User info & Rating */}
                  <div>
                    <div className='flex items-start justify-between gap-2 mb-2 sm:mb-2.5'>
                      <div className='flex items-center gap-1.5 sm:gap-2 min-w-0'>
                        <div className='min-w-0'>
                          <div className='font-bold text-xs sm:text-sm text-foreground truncate'>
                            {item.userName}
                          </div>
                          <div className='flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5'>
                            <ShieldCheck className='size-2.5 sm:size-3 shrink-0' />
                            <span>خریدار تاییدشده</span>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <span className='text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap pt-0.5 font-sans'>
                        {toPersianDigits(formattedDate)}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className='flex items-center gap-1 mb-2 sm:mb-2.5'>
                      <div className='flex items-center gap-0.5'>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3 sm:size-3.5 ${
                              i < item.rating
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-muted-foreground/20 fill-muted-foreground/10'
                            }`}
                          />
                        ))}
                      </div>
                      <span className='text-[9px] sm:text-[11px] font-bold text-foreground font-sans ms-1'>
                        {toPersianDigits(item.rating)} از ۵
                      </span>
                    </div>

                    {/* Review Comment Text */}
                    <p className='text-xs sm:text-sm text-foreground/90 leading-relaxed line-clamp-2 sm:line-clamp-3 font-medium break-words'>
                      «{item.comment}»
                    </p>
                  </div>

                  {/* Bottom: Related Product Link Badge */}
                  {item.product && (
                    <div className='pt-2 sm:pt-2.5 mt-1.5 sm:mt-2 border-t border-border/60 flex items-center justify-between gap-2'>
                      <span className='text-[9px] sm:text-[10px] text-muted-foreground truncate'>
                        محصول:
                      </span>
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className='group/link inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-muted/60 hover:bg-primary/10 text-foreground hover:text-primary font-medium text-[9px] sm:text-[11px] transition-colors max-w-[140px] sm:max-w-[190px] truncate border border-border/40'
                      >
                        <span className='truncate'>{item.product.title}</span>
                        <ExternalLink className='size-2.5 sm:size-3 shrink-0 opacity-60 group-hover/link:opacity-100 transition-opacity' />
                      </Link>
                    </div>
                  )}
                </div>
              )
            }}
          />
        </div>
      </div>
    </section>
  )
}
