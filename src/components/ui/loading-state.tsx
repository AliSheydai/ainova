import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  spinnerClassName?: string
}

export function LoadingState({
  message = 'در حال بارگذاری اطلاعات...',
  className,
  spinnerClassName,
  ...props
}: LoadingStateProps) {
  return (
    <div
      role='status'
      aria-live='polite'
      aria-atomic='true'
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground select-none',
        className
      )}
      {...props}
    >
      <Loader2
        className={cn('size-8 animate-spin text-primary', spinnerClassName)}
        aria-hidden='true'
      />
      <span className='text-xs font-medium'>{message}</span>
    </div>
  )
}
