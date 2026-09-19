'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/persian-utils'

interface StickyMobileCtaProps {
  price: number
  isAvailable: boolean
  slug: string
  planId?: string
  variantId?: string
}

export function StickyMobileCta({ price, isAvailable, slug, planId, variantId }: StickyMobileCtaProps) {
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
    const mainBtn = document.getElementById('main-buy-button') as HTMLButtonElement | null
    if (mainBtn) {
      mainBtn.click()
    } else {
      const params = new URLSearchParams()
      if (slug) params.set('slug', slug)
      if (variantId) params.set('variantId', variantId)
      if (planId) params.set('planId', planId)
      router.push(`/checkout?${params.toString()}`)
    }
  }

  if (!visible) return null

  return (
    <div
      className='fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-border/60 bg-background/95 px-4 py-2.5 sm:py-3 backdrop-blur-sm lg:hidden'
      dir='rtl'
    >
      <div>
        <p className='text-[10px] text-muted-foreground'>قیمت اشتراک</p>
        <p className='text-sm sm:text-base font-bold text-foreground font-sans'>{formatPrice(price)}</p>
      </div>
      <Button
        size='sm'
        className='h-9 sm:h-10 gap-1.5 px-4 sm:px-5 text-xs sm:text-sm font-semibold rounded-xl'
        disabled={!isAvailable}
        onClick={handleBuy}
      >
        <ShoppingCart className='size-3.5 sm:size-4' aria-hidden='true' />
        {isAvailable ? 'ادامه خرید' : 'ناموجود'}
      </Button>
    </div>
  )
}
