'use client'

import React from 'react'
import { Film } from 'lucide-react'
import { parseVideoUrl } from '@/lib/video-utils'
import { Badge } from '@/components/ui/badge'
import { MinimalVideoPlayer } from '@/components/video/minimal-video-player'

interface ProductVideoSectionProps {
  videoUrl: string | null | undefined
  productTitle: string
}

export function ProductVideoSection({ videoUrl, productTitle }: ProductVideoSectionProps) {
  if (!videoUrl || !videoUrl.trim()) {
    return null
  }

  const parsed = parseVideoUrl(videoUrl)

  if (!parsed && !videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
    return null
  }

  const videoType = parsed?.type || 'direct'
  const videoSrc = parsed?.src || videoUrl

  return (
    <section
      id='product-video'
      aria-label={`ویدئو معرفی ${productTitle}`}
      className='my-10 sm:my-14 scroll-mt-24'
    >
      <div className='relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-card/60 to-muted/20 p-4 sm:p-7 md:p-8 backdrop-blur-xl shadow-xs'>
        {/* Subtle Ambient Glow Background */}
        <div
          className='pointer-events-none absolute -top-24 -start-24 size-72 rounded-full bg-primary/10 blur-3xl'
          aria-hidden='true'
        />
        <div
          className='pointer-events-none absolute -bottom-24 -end-24 size-72 rounded-full bg-primary/5 blur-3xl'
          aria-hidden='true'
        />

        {/* Section Header */}
        <div className='relative z-10 mb-5 sm:mb-6 space-y-2 text-start'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='gap-1.5 px-2.5 py-1 text-xs font-semibold text-primary border-primary/30 bg-primary/10 rounded-full'
            >
              <Film className='size-3.5' />
              <span>ویدئو معرفی و آموزش</span>
            </Badge>
          </div>

          <h2 className='text-base sm:text-xl md:text-2xl font-bold tracking-tight text-foreground'>
            آشنایی با اشتراک و نحوه استفاده از {productTitle}
          </h2>

          <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl'>
            در این ویدئو می‌توانید امکانات، نحوه فعال‌سازی و ویژگی‌های برجسته این سرویس را پیش از خرید مشاهده فرمایید.
          </p>
        </div>

        {/* Modern Minimal Video Player Container */}
        <div className='relative z-10 w-full overflow-hidden rounded-2xl border border-border/80 shadow-xl bg-black/95'>
          <MinimalVideoPlayer
            src={videoSrc}
            title={`معرفی و آموزش ${productTitle}`}
            type={videoType}
          />
        </div>
      </div>
    </section>
  )
}


