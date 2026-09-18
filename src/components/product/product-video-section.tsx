'use client'

import React, { useState } from 'react'
import { PlayCircle, Film, Maximize2, Sparkles, Video, AlertCircle } from 'lucide-react'
import { parseVideoUrl } from '@/lib/video-utils'
import { Badge } from '@/components/ui/badge'

interface ProductVideoSectionProps {
  videoUrl: string | null | undefined
  productTitle: string
}

export function ProductVideoSection({ videoUrl, productTitle }: ProductVideoSectionProps) {
  const [loadError, setLoadError] = useState(false)

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
      <div className='relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 via-card/50 to-muted/20 p-4 sm:p-7 md:p-8 backdrop-blur-xl shadow-xs'>
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
            <span className='hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium'>
              <Sparkles className='size-3 text-primary' />
              بررسی کامل قابلیت‌ها
            </span>
          </div>

          <h2 className='text-base sm:text-xl md:text-2xl font-bold tracking-tight text-foreground'>
            آشنایی با اشتراک و نحوه استفاده از {productTitle}
          </h2>

          <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl'>
            در این ویدئو می‌توانید امکانات، نحوه فعال‌سازی و ویژگی‌های برجسته این سرویس را پیش از خرید مشاهده فرمایید.
          </p>
        </div>

        {/* Video Player Container */}
        <div className='relative z-10 w-full overflow-hidden rounded-2xl border border-border/80 bg-black/95 shadow-md'>
          <div className='relative w-full aspect-video flex items-center justify-center'>
            {loadError ? (
              <div className='flex flex-col items-center justify-center p-6 text-center text-muted-foreground gap-2.5'>
                <AlertCircle className='size-8 text-rose-500' />
                <p className='text-xs sm:text-sm font-medium'>
                  خطا در بارگذاری پلیر ویدئو.
                </p>
                <a
                  href={videoUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-primary hover:underline font-mono'
                  dir='ltr'
                >
                  مشاهده مستقیم ویدئو در برگه جدید
                </a>
              </div>
            ) : videoType === 'aparat' ? (
              <iframe
                src={videoSrc}
                title={`ویدئو معرفی ${productTitle} در آپارات`}
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
                allowFullScreen
                className='size-full border-0'
                onError={() => setLoadError(true)}
              />
            ) : videoType === 'youtube' ? (
              <iframe
                src={videoSrc}
                title={`ویدئو معرفی ${productTitle} در یوتیوب`}
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                allowFullScreen
                className='size-full border-0'
                onError={() => setLoadError(true)}
              />
            ) : (
              <video
                src={videoSrc}
                controls
                playsInline
                preload='metadata'
                className='size-full object-contain'
                onError={() => setLoadError(true)}
              >
                مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
              </video>
            )}
          </div>
        </div>

        {/* Video Footer Info Bar */}
        <div className='relative z-10 mt-3.5 sm:mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs text-muted-foreground pt-2 border-t border-border/40'>
          <div className='flex items-center gap-2'>
            <span className='inline-flex items-center gap-1 font-medium text-foreground'>
              <PlayCircle className='size-3.5 text-primary' />
              منبع پخش:
            </span>
            <span className='bg-muted/60 px-2 py-0.5 rounded-md border border-border/50 text-[11px] font-sans'>
              {parsed?.label || 'پلیر اختصاصی'}
            </span>
          </div>

          <div className='flex items-center gap-3 sm:gap-4'>
            <span className='inline-flex items-center gap-1'>
              <Maximize2 className='size-3 text-muted-foreground' />
              پشتیبانی از حالت تمام‌صفحه
            </span>
            <span className='inline-flex items-center gap-1'>
              <Video className='size-3 text-muted-foreground' />
              کیفیت بالا (HD)
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
