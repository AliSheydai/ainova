import { Badge } from '@/components/ui/badge'
import { toPersianDigits } from '@/lib/persian-utils'
import { getFulfillmentBadge } from '../types'

export function ProductStatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-normal'>
          فعال
        </Badge>
      )
    case 'INACTIVE':
      return (
        <Badge variant='outline' className='bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px] font-normal'>
          غیرفعال
        </Badge>
      )
    case 'ARCHIVED':
      return (
        <Badge variant='outline' className='bg-rose-500/10 text-rose-600 border-rose-500/20 text-[11px] font-normal'>
          بایگانی‌شده
        </Badge>
      )
  }
}

export function PlanFulfillmentBadge({ type }: { type: string }) {
  const info = getFulfillmentBadge(type)
  return (
    <Badge variant='outline' className={`text-[10px] font-normal px-2 py-0.5 border ${info.color}`}>
      {info.label}
    </Badge>
  )
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock > 0) {
    return (
      <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-sans'>
        {toPersianDigits(stock)} عدد موجود
      </Badge>
    )
  }
  return (
    <Badge variant='outline' className='bg-rose-500/10 text-rose-600 border-rose-500/20 text-[11px]'>
      ناموجود
    </Badge>
  )
}
