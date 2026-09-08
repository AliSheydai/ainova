'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { LogIn, Menu, Sparkles, User, Loader2 } from 'lucide-react'
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

function TelegramIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      className={className}
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z' />
    </svg>
  )
}

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
  const [openingTg, setOpeningTg] = useState(false)

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

  const handleTelegramCta = async () => {
    const botUsername =
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'arioaccountbot'

    if (user) {
      setOpeningTg(true)
      try {
        const res = await fetch('/api/telegram/link-token', { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          if (data.deepLinkUrl) {
            window.open(data.deepLinkUrl, '_blank')
            return
          }
        }
      } catch {
        // fallback to standard start
      } finally {
        setOpeningTg(false)
      }
    }

    window.open(`https://t.me/${botUsername}?start=guest`, '_blank')
  }

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

            {/* Telegram Bot CTA - Desktop */}
            <Button
              variant='outline'
              size='sm'
              onClick={handleTelegramCta}
              disabled={openingTg}
              className='hidden sm:inline-flex items-center gap-2 border-sky-500/30 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 hover:border-sky-500/50 dark:text-sky-400 dark:border-sky-500/20 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 font-medium text-xs md:text-sm px-3.5 h-9 rounded-xl shadow-xs transition-all duration-200 cursor-pointer'
              title='ورود مستقیم به ربات تلگرام'
            >
              {openingTg ? (
                <Loader2 className='size-4 animate-spin text-sky-500' />
              ) : (
                <TelegramIcon className='size-4 text-sky-500 shrink-0' />
              )}
              <span>ربات تلگرام</span>
            </Button>

            {/* Telegram Bot CTA - Mobile quick button */}
            <Button
              variant='outline'
              size='icon'
              onClick={handleTelegramCta}
              disabled={openingTg}
              className='sm:hidden size-8 rounded-lg border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20'
              aria-label='ورود به ربات تلگرام'
              title='ورود به ربات تلگرام'
            >
              {openingTg ? (
                <Loader2 className='size-3.5 animate-spin text-sky-500' />
              ) : (
                <TelegramIcon className='size-4 text-sky-500' />
              )}
            </Button>

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
            {user ? (
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
            ) : (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setAuthModalOpen(true)}
                className='md:hidden h-8 gap-1.5 px-3 text-xs font-medium rounded-lg border-primary/25 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer'
              >
                <LogIn className='size-3.5' />
                <span>ورود</span>
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
                  {/* Telegram Bot Button in Mobile Drawer */}
                  <Button
                    variant='outline'
                    onClick={() => {
                      setOpen(false)
                      handleTelegramCta()
                    }}
                    className='w-full justify-center gap-2 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 text-sm font-medium py-2.5 rounded-xl'
                  >
                    <TelegramIcon className='size-4.5 text-sky-500 shrink-0' />
                    <span>🤖 ورود به ربات تلگرام</span>
                  </Button>

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
