'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AuthModal, AuthUserData } from '@/components/auth/auth-modal'
import { DashboardModal } from '@/components/dashboard-modal/dashboard-modal'

const navLinks = [
  { label: 'امکانات', href: '#features' },
  { label: 'نحوه فعال‌سازی', href: '#how-it-works' },
  { label: 'سوالات متداول', href: '#faq' },
]

export function LandingHeader() {
  const [open, setOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false)
  const [user, setUser] = useState<AuthUserData | null>(null)

  useEffect(() => {
    let isMounted = true
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json()
        return null
      })
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setUser(data.user)
        }
      })
      .catch(() => null)

    return () => {
      isMounted = false
    }
  }, [])

  const displayName = user?.name?.trim() || user?.phone || 'حساب کاربری'

  return (
    <>
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
            {user ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setDashboardModalOpen(true)}
                className='hidden md:flex items-center gap-2 border-primary/25 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all duration-200 cursor-pointer'
              >
                <div className='flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold'>
                  {user.name?.trim() ? user.name.trim().charAt(0) : <User className='size-3' />}
                </div>
                <span className='max-w-[140px] truncate text-sm font-medium'>
                  {displayName}
                </span>
              </Button>
            ) : (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setAuthModalOpen(true)}
                className='hidden md:flex text-sm cursor-pointer'
              >
                ورود
              </Button>
            )}
            <Link href='/dashboard/buy'>
              <Button size='sm' className='hidden text-sm md:flex'>
                خرید اشتراک جمینای
              </Button>
            </Link>

            {/* Mobile User Quick Icon */}
            {user && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setDashboardModalOpen(true)}
                className='md:hidden size-9 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                aria-label='داشبورد کاربری'
                title={displayName}
              >
                <div className='flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold'>
                  {user.name?.trim() ? user.name.trim().charAt(0) : <User className='size-3.5' />}
                </div>
              </Button>
            )}

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
                  {user ? (
                    <Button
                      variant='outline'
                      onClick={() => {
                        setOpen(false)
                        setDashboardModalOpen(true)
                      }}
                      className='w-full justify-center gap-2 border-primary/25 bg-primary/5 text-sm font-medium'
                    >
                      <div className='flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold'>
                        {user.name?.trim() ? user.name.trim().charAt(0) : <User className='size-3' />}
                      </div>
                      <span className='truncate'>{displayName}</span>
                    </Button>
                  ) : (
                    <Button
                      variant='outline'
                      onClick={() => {
                        setOpen(false)
                        setAuthModalOpen(true)
                      }}
                      className='w-full justify-center text-sm'
                    >
                      ورود به حساب
                    </Button>
                  )}
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

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={(newUser) => {
          setUser(newUser)
        }}
      />

      {/* Dashboard Modal */}
      {user && (
        <DashboardModal
          open={dashboardModalOpen}
          onOpenChange={setDashboardModalOpen}
          user={user}
          onUserUpdate={(updated) => {
            setUser(updated)
          }}
          onLogout={() => {
            setUser(null)
          }}
        />
      )}
    </>
  )
}

