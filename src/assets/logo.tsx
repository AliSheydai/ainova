import { type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  className?: string
}

export function Logo({ className, alt = 'آریوچت', ...props }: LogoProps) {
  return (
    <img
      src='/images/ario-chat.png'
      alt={alt}
      className={cn('object-contain', className)}
      loading='eager'
      draggable={false}
      {...props}
    />
  )
}

