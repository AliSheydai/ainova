'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import Image from 'next/image'

interface ProductDetailVisualProps {
  image?: string | null
  title: string
}

export function ProductDetailVisual({ image, title }: ProductDetailVisualProps) {
  const [hasError, setHasError] = useState(false)

  const showFallback = !image || hasError

  if (showFallback) {
    return (
      <div className='flex aspect-video w-full items-center justify-center rounded-2xl border border-border/60 bg-muted/30'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground'>
            <Package className='size-8 stroke-[1.5]' />
          </div>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
        </div>
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
    </div>
  )
}
