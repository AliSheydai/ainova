'use client'

import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toPersianDigits } from '@/lib/persian-utils'
import { cn } from '@/lib/utils'

interface ProductsPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCount?: number
  pageSize?: number
  className?: string
}

export function ProductsPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize,
  className,
}: ProductsPaginationProps) {
  if (totalPages <= 1) {
    if (totalCount !== undefined && totalCount > 0) {
      return (
        <div className={cn('flex justify-center items-center py-4 text-xs text-muted-foreground font-sans', className)}>
          <span>نمایش همه {toPersianDigits(totalCount)} محصول</span>
        </div>
      )
    }
    return null
  }

  // Generate pagination items with ellipses if many pages
  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  // Calculate item range
  let rangeStart = 0
  let rangeEnd = 0
  if (totalCount && pageSize) {
    rangeStart = (currentPage - 1) * pageSize + 1
    rangeEnd = Math.min(currentPage * pageSize, totalCount)
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border/40 font-sans', className)}>
      {/* Items count summary */}
      {totalCount !== undefined && pageSize !== undefined ? (
        <div className='text-xs text-muted-foreground order-2 sm:order-1 text-center sm:text-start'>
          نمایش{' '}
          <span className='font-semibold text-foreground font-sans'>
            {toPersianDigits(rangeStart)}
          </span>{' '}
          تا{' '}
          <span className='font-semibold text-foreground font-sans'>
            {toPersianDigits(rangeEnd)}
          </span>{' '}
          از{' '}
          <span className='font-semibold text-foreground font-sans'>
            {toPersianDigits(totalCount)}
          </span>{' '}
          محصول
        </div>
      ) : (
        <div className='order-2 sm:order-1' />
      )}

      {/* Pagination controls */}
      <nav aria-label='صفحه‌بندی محصولات' className='flex items-center gap-1.5 order-1 sm:order-2'>
        {/* Previous page (In RTL, previous is on the right) */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className='h-9 px-2.5 sm:px-3 text-xs gap-1 font-sans rounded-lg border-border/70 hover:bg-accent disabled:opacity-40 cursor-pointer'
          aria-label='صفحه قبل'
        >
          <ChevronRight className='size-3.5' />
          <span className='hidden sm:inline'>صفحه قبل</span>
        </Button>

        {/* Numbered pages */}
        <div className='flex items-center gap-1'>
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className='size-9 flex items-center justify-center text-xs text-muted-foreground font-sans select-none'
                >
                  …
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={`page-${pageNum}`}
                type='button'
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'size-9 rounded-lg text-xs font-medium font-sans transition-all duration-150 flex items-center justify-center cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-transparent hover:border-border/60'
                )}
              >
                {toPersianDigits(pageNum)}
              </button>
            )
          })}
        </div>

        {/* Next page (In RTL, next is on the left) */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className='h-9 px-2.5 sm:px-3 text-xs gap-1 font-sans rounded-lg border-border/70 hover:bg-accent disabled:opacity-40 cursor-pointer'
          aria-label='صفحه بعد'
        >
          <span className='hidden sm:inline'>صفحه بعد</span>
          <ChevronLeft className='size-3.5' />
        </Button>
      </nav>
    </div>
  )
}
