'use client'

import React from 'react'
import { ShoppingCart, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/persian-utils'

interface CheckoutMobileBarProps {
  payablePrice: number
  buying: boolean
  handleBuy: () => void
  productTitle: string
}

export function CheckoutMobileBar({
  payablePrice,
  buying,
  handleBuy,
  productTitle,
}: CheckoutMobileBarProps) {
  return (
    <div className='lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-background/95 backdrop-blur-md border-t border-border/70 shadow-lg shadow-black/10'>
      <div className='container mx-auto max-w-lg flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <span className='block text-[11px] text-muted-foreground truncate'>
            مبلغ نهایی:
          </span>
          <span className='text-base sm:text-lg font-black font-sans text-foreground'>
            {formatPrice(payablePrice)}
          </span>
        </div>

        <Button
          size='default'
          className='h-11 px-5 text-xs sm:text-sm font-bold shadow-md shadow-primary/20 rounded-xl shrink-0 cursor-pointer'
          onClick={handleBuy}
          disabled={buying}
          aria-busy={buying}
        >
          {buying ? (
            <>
              <Loader2 className='me-1.5 size-4 animate-spin' aria-hidden='true' />
              <span>در حال اتصال...</span>
            </>
          ) : (
            <>
              <ShoppingCart className='me-1.5 size-4' aria-hidden='true' />
              <span>پرداخت و ثبت نهایی</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
