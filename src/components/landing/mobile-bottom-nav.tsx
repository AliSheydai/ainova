'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  onOpenDashboard: () => void
  hidden?: boolean
}

export function MobileBottomNav({ onOpenDashboard, hidden = false }: MobileBottomNavProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      // Appear after a small, comfortable scroll down (~220px)
      setIsVisible(scrollY > 160)
    }

    // Initial check
    updateVisibility()

    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [])

  const handleProductsClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const productsEl = document.getElementById('products')
    if (productsEl) {
      e.preventDefault()
      productsEl.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  const shouldShow = isVisible && !hidden

  return (
    <aside
      role='navigation'
      aria-label='ناوبری سریع موبایل'
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none md:hidden transition-[transform,opacity] duration-300 ease-out will-change-transform',
        shouldShow
          ? 'translate-y-0 opacity-100'
          : 'translate-y-12 opacity-0'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between w-full max-w-sm rounded-2xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/10 dark:shadow-black/40 p-1.5 gap-2 ring-1 ring-border/30 transition-colors',
          shouldShow ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        {/* اکشن مشاهده محصولات (اولین دکمه در جهت راست به چپ) */}
        <Button
          asChild
          size='default'
          className='flex-1 h-11 rounded-xl text-xs sm:text-sm font-semibold shadow-sm gap-2 transition-transform active:scale-[0.98]'
        >
          <Link href='/#products' onClick={handleProductsClick}>
            <Sparkles className='size-4 shrink-0' />
            <span className='truncate'>مشاهده محصولات</span>
          </Link>
        </Button>

        {/* اکشن داشبورد (دومین دکمه در جهت راست به چپ) */}
        <Button
          type='button'
          variant='outline'
          size='default'
          onClick={onOpenDashboard}
          className='flex-1 h-11 rounded-xl text-xs sm:text-sm font-medium border-border/80 bg-background/60 hover:bg-accent/60 gap-2 transition-transform active:scale-[0.98] cursor-pointer'
        >
          <LayoutDashboard className='size-4 shrink-0 text-primary' />
          <span className='truncate'>داشبورد</span>
        </Button>
      </div>
    </aside>
  )
}
