'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from '@/context/theme-provider'

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group font-sans'
      dir='rtl'
      richColors
      closeButton
      position='top-center'
      toastOptions={{
        className: '!font-sans',
        style: {
          fontFamily: "var(--font-vazirmatn), 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          direction: 'rtl',
        },
        classNames: {
          toast: 'font-sans font-medium !font-sans text-sm',
          title: 'font-sans font-semibold text-sm leading-snug !font-sans',
          description: 'font-sans font-normal text-xs leading-relaxed text-muted-foreground !font-sans',
          actionButton: 'font-sans font-medium text-xs !font-sans',
          cancelButton: 'font-sans font-medium text-xs !font-sans',
          closeButton: 'font-sans !font-sans',
        },
      }}
      style={
        {
          fontFamily: "var(--font-vazirmatn), 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

