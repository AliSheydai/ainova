'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'

interface ThemeSwitchProps {
  className?: string
}

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : false

  /* Update theme-color meta tag when theme is updated */
  useEffect(() => {
    if (!mounted) return
    const themeColor = resolvedTheme === 'dark' ? '#020817' : '#ffffff'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [mounted, resolvedTheme])

  const toggleTheme = useCallback(() => {
    // Directly toggle between light and dark without system theme option
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [resolvedTheme, setTheme])

  return (
    <motion.button
      type='button'
      onClick={toggleTheme}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        'relative inline-flex items-center justify-center size-9 rounded-full cursor-pointer select-none',
        'text-muted-foreground hover:text-foreground',
        'bg-transparent hover:bg-accent/60 dark:hover:bg-accent/40',
        'hover:shadow-[0_0_16px_rgba(245,158,11,0.2)] dark:hover:shadow-[0_0_16px_rgba(56,189,248,0.25)]',
        'border border-transparent hover:border-border/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'transition-colors duration-200',
        className
      )}
      title={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
      aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
    >
      <div className='relative size-5 flex items-center justify-center overflow-visible pointer-events-none'>
        <AnimatePresence initial={false}>
          {isDark ? (
            <motion.div
              key='moon'
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 90, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              className='absolute inset-0 flex items-center justify-center text-sky-400 dark:text-sky-300'
            >
              <Moon className='size-[1.25rem]' strokeWidth={2.2} />
            </motion.div>
          ) : (
            <motion.div
              key='sun'
              initial={{ scale: 0, rotate: 90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: -90, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              className='absolute inset-0 flex items-center justify-center text-amber-500 hover:text-amber-600'
            >
              <Sun className='size-[1.25rem]' strokeWidth={2.2} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className='sr-only'>
        {isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
      </span>
    </motion.button>
  )
}
