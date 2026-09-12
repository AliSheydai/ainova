'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/persian-utils'

interface StickyMobileCtaProps {
  price: number
  isAvailable: boolean
  slug: string
  planId?: string
}

export function StickyMobileCta({ price, isAvailable, slug, planId }: StickyMobileCtaProps) {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const anchor = document.getElementById('buy-button-anchor')
    if (!anchor) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar only when the main buy button is NOT visible
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(anchor)
    return () => observer.disconnect()
  }, [])

  const handleBuy = () => {
    if (!isAvailable) return
    const url = planId ? `/checkout?slug=${slug}&planId=${planId}` : `/checkout?slug=${slug}`
    router.push(url)
  }

  if (!visible) return null

  return (
    <div
      className='fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden'
      dir='rtl'
    >
      <div>
        <p className='text-[10px] text-muted-foreground'>قیمت</p>
        <p className='text-base font-bold text-foreground'>{formatPrice(price)}</p>
      </div>
      <Button
        size='sm'
        className='h-10 gap-2 px-5 text-sm font-semibold'
        disabled={!isAvailable}
        onClick={handleBuy}
      >
        <ShoppingCart className='size-4' aria-hidden='true' />
        {isAvailable ? 'ادامه خرید' : 'ناموجود'}
      </Button>
    </div>
  )
}
