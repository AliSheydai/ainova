'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const navLinks = [
  { label: 'امکانات', href: '#features' },
  { label: 'نحوه فعال‌سازی', href: '#how-it-works' },
  { label: 'سوالات متداول', href: '#faq' },
]

export function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className='sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md [direction:ltr] md:[direction:rtl]'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2.5 select-none'>
          <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
            <Sparkles className='size-4' />
          </div>
          <span className='text-base font-bold text-foreground'>جمینای</span>
        </Link>

        {/* Desktop Nav */}
        <nav className='hidden items-center gap-6 md:flex'>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          <ThemeSwitch />
          <Link href='/login' className='hidden md:block'>
            <Button variant='ghost' size='sm' className='text-sm'>
              ورود
            </Button>
          </Link>
          <Link href='/dashboard/buy'>
            <Button size='sm' className='hidden text-sm md:flex'>
              خرید اشتراک جمینای
            </Button>
          </Link>

          {/* Mobile Drawer Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='md:hidden'
                aria-label='منو'
              >
                <Menu className='size-5' />
              </Button>
            </SheetTrigger>

            <SheetContent
              side='left'
              className='flex w-[290px] flex-col justify-between p-6 sm:w-[320px]'
              dir='rtl'
            >
              <div>
                <SheetHeader className='border-b border-border/50 p-0 pb-4 text-start'>
                  <div className='flex items-center gap-2.5 select-none'>
                    <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
                      <Sparkles className='size-4' />
                    </div>
                    <SheetTitle className='text-base font-bold text-foreground'>
                      جمینای
                    </SheetTitle>
                  </div>
                </SheetHeader>

                {/* Mobile Links */}
                <nav className='mt-6 flex flex-col gap-1'>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className='rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Mobile CTA */}
              <div className='flex flex-col gap-2.5 border-t border-border/50 pt-4'>
                <Link href='/login' onClick={() => setOpen(false)}>
                  <Button variant='outline' className='w-full justify-center text-sm'>
                    ورود به حساب
                  </Button>
                </Link>
                <Link href='/dashboard/buy' onClick={() => setOpen(false)}>
                  <Button className='w-full justify-center text-sm'>
                    خرید اشتراک جمینای
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
