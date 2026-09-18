'use client'

import { useState } from 'react'
import { Package, PlayCircle } from 'lucide-react'

interface ProductDetailVisualProps {
  image?: string | null
  title: string
  hasVideo?: boolean
}

export function ProductDetailVisual({ image, title, hasVideo }: ProductDetailVisualProps) {
  const [hasError, setHasError] = useState(false)

  const showFallback = !image || hasError

  if (showFallback) {
    return (
      <div className='relative flex aspect-video w-full items-center justify-center rounded-2xl border border-border/60 bg-muted/30'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground'>
            <Package className='size-8 stroke-[1.5]' />
          </div>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
        </div>

        {hasVideo && (
          <a
            href='#product-video'
            className='absolute bottom-3 end-3 z-10 flex items-center gap-1.5 rounded-xl bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md border border-border/80 hover:bg-background hover:scale-[1.02] active:scale-[0.98] transition-all'
          >
            <PlayCircle className='size-3.5 text-primary' />
            <span>ویدئو معرفی</span>
          </a>
        )}
      </div>
    )
  }

  return (
    <div className='relative w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/20'>
      <img
        src={image}
        alt={title}
        className='h-auto w-full object-contain'
        loading='lazy'
        onError={() => setHasError(true)}
      />

      {hasVideo && (
        <a
          href='#product-video'
          className='absolute bottom-3 end-3 z-10 flex items-center gap-1.5 rounded-xl bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md border border-border/80 hover:bg-background hover:scale-[1.02] active:scale-[0.98] transition-all'
        >
          <PlayCircle className='size-3.5 text-primary' />
          <span>ویدئو معرفی</span>
        </a>
      )}
    </div>
  )
}
