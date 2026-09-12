'use client'

import { useState } from 'react'
import { Package, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProductDetailVisualProps {
  image?: string | null
  title: string
}

export function ProductDetailVisual({ image, title }: ProductDetailVisualProps) {
  const [hasError, setHasError] = useState(false)

  const showFallback = !image || hasError

  return (
    <div className='relative select-none'>
      {/* Ambient Colored Aura Glow behind the card */}
      <div
        className='absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/25 via-emerald-500/15 to-primary/20 blur-2xl opacity-40 dark:opacity-50 pointer-events-none -z-10'
        aria-hidden='true'
      />

      {/* Main Visual Showcase Stage */}
      <div className='relative rounded-2xl overflow-hidden border border-border/80 dark:border-white/10 bg-card/60 backdrop-blur-md shadow-xl transition-all duration-300 group hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5'>
        {!showFallback ? (
          <>
            {/* Ambient Blurred Background (matches image colors and fills letterbox areas) */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <img
                src={image}
                alt=''
                aria-hidden='true'
                className='size-full object-cover filter blur-2xl opacity-20 dark:opacity-30 scale-125'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent' />
            </div>

            {/* Top Toolbar Badges */}
            <div className='absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-10 flex items-center justify-between gap-2 pointer-events-none'>
              {/* Trust Badge */}
              <div className='pointer-events-auto'>
                <Badge
                  variant='outline'
                  className='bg-background/85 dark:bg-card/85 backdrop-blur-md border-border/70 shadow-xs text-[11px] font-medium text-foreground gap-1.5 py-1 px-2.5 rounded-full'
                >
                  <ShieldCheck className='size-3.5 text-emerald-500 shrink-0' />
                  <span>اشتراک رسمی و معتبر</span>
                </Badge>
              </div>
            </div>

            {/* Foreground Sharp Image Area */}
            <div className='relative w-full aspect-16/10 sm:aspect-16/9 min-h-[260px] sm:min-h-[340px] max-h-[440px] flex items-center justify-center p-4 sm:p-8'>
              <img
                src={image}
                alt={title}
                className='max-h-full max-w-full object-contain drop-shadow-md rounded-lg transition-transform duration-500 ease-out group-hover:scale-[1.02]'
                loading='lazy'
                onError={() => setHasError(true)}
              />
            </div>
          </>
        ) : (
          /* High-End Fallback State (when image is missing or failed) */
          <div className='relative w-full aspect-16/10 sm:aspect-16/9 min-h-[260px] sm:min-h-[320px] flex flex-col items-center justify-center p-6 sm:p-10 text-center'>
            {/* Subtle decorative dot pattern */}
            <div
              className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]'
              aria-hidden='true'
            />

            {/* Glowing 3D-styled Icon */}
            <div className='relative mb-4 sm:mb-5'>
              <div className='absolute -inset-2 rounded-3xl bg-primary/20 blur-xl opacity-75' />
              <div className='relative size-20 sm:size-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-muted/50 text-primary flex items-center justify-center shadow-lg border border-primary/25 transition-transform duration-300 group-hover:scale-105'>
                <Package className='size-10 sm:size-12 stroke-[1.8]' />
              </div>
            </div>

            {/* Titles & Info */}
            <div className='space-y-1.5 max-w-sm'>
              <h3 className='text-base sm:text-lg font-bold text-foreground tracking-tight'>
                {title}
              </h3>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                سرویس اورجینال دیجیتال و هوش مصنوعی با فعال‌سازی آنی و ضمانت بازگشت وجه
              </p>
            </div>

            {/* Mini Trust Pills */}
            <div className='flex flex-wrap items-center justify-center gap-2 mt-5'>
              <Badge
                variant='outline'
                className='text-[11px] bg-background/80 border-border/60 text-muted-foreground gap-1 py-1'
              >
                <CheckCircle2 className='size-3 text-emerald-500' />
                <span>تحویل ۱۰۰٪ خودکار</span>
              </Badge>
              <Badge
                variant='outline'
                className='text-[11px] bg-background/80 border-border/60 text-muted-foreground gap-1 py-1'
              >
                <ShieldCheck className='size-3 text-primary' />
                <span>پشتیبانی شبانه‌روزی</span>
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
