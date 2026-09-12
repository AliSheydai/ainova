'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, useScroll, useMotionValueEvent, useSpring } from 'framer-motion'
import {
  LogIn,
  Menu,
  Sparkles,
  User,
  Loader2,
  Shield,
  Package,
  ChevronDown,
  LayoutDashboard,
  Bell,
  LogOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AuthModal, type AuthUserData } from '@/components/auth/auth-modal'
import { DashboardModal } from '@/components/dashboard-modal/dashboard-modal'
import { MobileBottomNav } from '@/components/landing/mobile-bottom-nav'

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

interface UserDropdownProps {
  user: AuthUserData
  displayName: string
  openingTg: boolean
  handleTelegramCta: () => Promise<void>
  onOpenDashboard: () => void
  onLogout: () => void
  isMobile?: boolean
  isCompact?: boolean
}

function UserDropdown({
  user,
  displayName,
  openingTg,
  handleTelegramCta,
  onOpenDashboard,
  onLogout,
  isMobile,
  isCompact = false,
}: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isMobile ? (
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer transition-all duration-200',
              isCompact ? 'size-8' : 'size-9'
            )}
            aria-label='منوی کاربری'
            title={displayName}
          >
            <div
              className={cn(
                'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold transition-all',
                isCompact ? 'size-5 text-[10px]' : 'size-6 text-xs'
              )}
            >
              {user.name?.trim() ? user.name.trim().charAt(0) : <User className='size-3.5' />}
            </div>
          </Button>
        ) : (
          <Button
            variant='outline'
            size='sm'
            className={cn(
              'group items-center gap-2 border-primary/25 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all duration-200 cursor-pointer rounded-xl',
              isCompact ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm'
            )}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold transition-all',
                isCompact ? 'size-4.5 text-[10px]' : 'size-5 text-xs'
              )}
            >
              {user.name?.trim() ? user.name.trim().charAt(0) : <User className='size-3' />}
            </div>
            <span className='max-w-[130px] truncate font-medium'>
              {displayName}
            </span>
            <ChevronDown className='size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180' />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        sideOffset={8}
        className='w-56 p-1.5 rounded-2xl shadow-xl border-border/60 bg-background/95 backdrop-blur-md [direction:rtl] text-right font-sans z-50'
      >
        {/* اطلاعات کاربر */}
        <div className='px-2.5 py-2 select-none'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-sm font-semibold text-foreground truncate'>
              {displayName}
            </p>
            {user.role === 'ADMIN' && (
              <span className='rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0'>
                مدیر
              </span>
            )}
          </div>
          {user.phone && (
            <p className='text-xs text-muted-foreground font-mono mt-0.5 [direction:ltr] text-right'>
              {user.phone}
            </p>
          )}
        </div>

        <DropdownMenuSeparator className='my-1' />

        {/* 1. داشبورد (باز شدن مدال داشبورد) */}
        <DropdownMenuItem
          onClick={onOpenDashboard}
          className='cursor-pointer gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-foreground transition-colors'
        >
          <LayoutDashboard className='size-4 text-primary shrink-0' />
          <span>داشبورد</span>
        </DropdownMenuItem>

        {/* 2. پنل ادمین (در صورت دسترسی مدیر) */}
        {user.role === 'ADMIN' && (
          <DropdownMenuItem
            asChild
            className='cursor-pointer gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-500/10 transition-colors'
          >
            <Link href='/dashboard' className='flex items-center gap-2.5 w-full'>
              <Shield className='size-4 text-amber-500 shrink-0' />
              <span>پنل ادمین</span>
            </Link>
          </DropdownMenuItem>
        )}

        {/* 3. ربات تلگرام */}
        <DropdownMenuItem
          onClick={handleTelegramCta}
          disabled={openingTg}
          className='cursor-pointer gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-primary focus:text-primary focus:bg-primary/10 transition-colors'
        >
          {openingTg ? (
            <Loader2 className='size-4 animate-spin shrink-0' />
          ) : (
            <TelegramIcon className='size-4 text-primary shrink-0' />
          )}
          <span>ربات تلگرام</span>
        </DropdownMenuItem>

        {/* 4. اعلانات */}
        <DropdownMenuItem
          onClick={() => {
            toast.info('بخش اعلانات به زودی فعال خواهد شد.')
          }}
          className='cursor-pointer gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-foreground transition-colors justify-between'
        >
          <div className='flex items-center gap-2.5'>
            <Bell className='size-4 text-muted-foreground shrink-0' />
            <span>اعلانات</span>
          </div>
          <span className='rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary'>
            به‌زودی
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className='my-1' />

        {/* خروج از حساب */}
        <DropdownMenuItem
          onClick={onLogout}
          className='cursor-pointer gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors'
        >
          <LogOut className='size-4 shrink-0' />
          <span>خروج از حساب</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const navLinks = [
  { label: 'محصولات', href: '/#products' },
  { label: 'امکانات و مزایا', href: '/#features' },
  { label: 'نحوه فعال‌سازی', href: '/#how-it-works' },
  { label: 'سوالات متداول', href: '/#faq' },
]

export function LandingHeader() {
  const [open, setOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false)
  const [dashboardTab, setDashboardTab] = useState<'orders' | 'guide' | 'support' | 'profile'>('orders')
  const [user, setUser] = useState<AuthUserData | null>(null)
  const [openingTg, setOpeningTg] = useState(false)

  const SCROLL_THRESHOLD = 160
  const { scrollY, scrollYProgress } = useScroll()
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > SCROLL_THRESHOLD
    }
    return false
  })

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > SCROLL_THRESHOLD)
  })

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  })

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

          // Check if returned from payment or dashboard deeplink
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            if (
              params.get('payment') ||
              params.get('orderId') ||
              params.get('dashboard') === 'orders' ||
              params.get('tab') === 'orders'
            ) {
              setDashboardTab('orders')
              setDashboardModalOpen(true)
            }
          }
        }
      })
      .catch(() => null)

    return () => {
      isMounted = false
    }
  }, [])

  const openOrdersModal = () => {
    if (user) {
      setDashboardTab('orders')
      setDashboardModalOpen(true)
    } else {
      setAuthModalOpen(true)
    }
  }

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        setUser(null)
        toast.success('با موفقیت از حساب کاربری خارج شدید.')
      } else {
        toast.error('خطا در خروج از حساب.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    }
  }

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
      <header
        className={cn(
          'sticky top-0 z-50 w-full pointer-events-none transition-all duration-300',
          isScrolled ? 'pt-2 sm:pt-3' : 'pt-0'
        )}
      >
        {/* Full-width baseline bar at the top (fades out smoothly when scrolled) */}
        <div
          className={cn(
            'absolute inset-0 border-b border-border/50 bg-background/80 backdrop-blur-md transition-opacity duration-300 pointer-events-none',
            isScrolled ? 'opacity-0' : 'opacity-100'
          )}
        />

        {/* Dynamic Floating Pill Island */}
        <div className='container mx-auto flex justify-center px-3 sm:px-4 md:px-6'>
          <motion.div
            layout
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 28,
              mass: 0.6,
            }}
            className={cn(
              'pointer-events-auto relative flex items-center justify-between w-full [direction:ltr] md:[direction:rtl] transition-all duration-300',
              isScrolled
                ? 'max-w-5xl h-14 px-3.5 sm:px-5 rounded-2xl border border-border/80 dark:border-white/10 bg-background/90 dark:bg-background/85 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] ring-1 ring-border/20'
                : 'max-w-full h-16 px-0 sm:px-2 rounded-none border-none bg-transparent shadow-none ring-0'
            )}
          >
            {/* Logo */}
            <Link
              href='/'
              className='group flex items-center gap-2.5 select-none transition-transform active:scale-[0.98]'
            >
              <div
                className={cn(
                  'flex items-center justify-center bg-primary text-primary-foreground shadow-sm transition-all duration-300',
                  isScrolled ? 'size-7.5 rounded-lg' : 'size-8 rounded-xl'
                )}
              >
                <Sparkles
                  className={cn(
                    'transition-all duration-300',
                    isScrolled ? 'size-3.5' : 'size-4'
                  )}
                />
              </div>
              <span
                className={cn(
                  'font-bold text-foreground leading-tight transition-all duration-300',
                  isScrolled ? 'text-sm sm:text-base' : 'text-base'
                )}
              >
                آریوچت
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav
              className={cn(
                'hidden items-center md:flex transition-all duration-300',
                isScrolled ? 'gap-1 lg:gap-2' : 'gap-1.5 lg:gap-3'
              )}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative rounded-full text-xs lg:text-sm font-medium text-muted-foreground transition-all duration-200',
                    'hover:text-foreground hover:bg-accent/60 active:scale-95',
                    isScrolled ? 'px-2.5 py-1' : 'px-3 py-1.5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div
              className={cn(
                'flex items-center transition-all duration-300',
                isScrolled ? 'gap-1.5 sm:gap-2' : 'gap-2'
              )}
            >
              <ThemeSwitch />

              {/* Desktop User Section */}
              {user ? (
                <div className='hidden md:flex items-center gap-2'>
                  {/* دکمه سفارش‌های من در هدر باقی می‌ماند */}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={openOrdersModal}
                    className={cn(
                      'items-center gap-1.5 border-primary/25 bg-primary/5 hover:bg-primary/10 text-foreground font-medium rounded-xl cursor-pointer transition-all duration-200',
                      isScrolled ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-xs'
                    )}
                  >
                    <Package className='size-3.5 text-primary' />
                    <span>سفارش‌های من</span>
                  </Button>

                  {/* دراپ‌داون نام کاربری با گزینه‌های داشبورد، پنل ادمین، ربات تلگرام، اعلانات و خروج */}
                  <UserDropdown
                    user={user}
                    displayName={displayName}
                    openingTg={openingTg}
                    handleTelegramCta={handleTelegramCta}
                    onOpenDashboard={() => setDashboardModalOpen(true)}
                    onLogout={handleLogout}
                    isCompact={isScrolled}
                  />
                </div>
              ) : (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setAuthModalOpen(true)}
                  className={cn(
                    'hidden md:flex cursor-pointer transition-all duration-200',
                    isScrolled ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm'
                  )}
                >
                  ورود
                </Button>
              )}

              <Button
                asChild
                size='sm'
                className={cn(
                  'hidden md:inline-flex rounded-xl font-semibold shadow-xs transition-all duration-200 cursor-pointer',
                  isScrolled ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm'
                )}
              >
                <Link href='/#products'>
                  مشاهده محصولات
                </Link>
              </Button>

              {/* Mobile User Quick Icon / Dropdown */}
              {user ? (
                <div className='md:hidden flex items-center'>
                  <UserDropdown
                    user={user}
                    displayName={displayName}
                    openingTg={openingTg}
                    handleTelegramCta={handleTelegramCta}
                    onOpenDashboard={() => setDashboardModalOpen(true)}
                    onLogout={handleLogout}
                    isMobile
                    isCompact={isScrolled}
                  />
                </div>
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
                    className={cn(
                      'md:hidden rounded-lg transition-all',
                      isScrolled ? 'size-8' : 'size-9'
                    )}
                    aria-label='منو'
                  >
                    <Menu className={cn('transition-all', isScrolled ? 'size-4.5' : 'size-5')} />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side='right'
                  className='flex w-[290px] flex-col justify-between p-6 sm:w-[320px] overflow-y-auto overscroll-contain max-h-screen touch-pan-y'
                  dir='rtl'
                >
                  <div>
                    <SheetHeader className='border-b border-border/50 p-0 pb-4 text-start'>
                      <div className='flex items-center gap-2.5 select-none'>
                        <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
                          <Sparkles className='size-4' />
                        </div>
                        <div className='flex flex-col text-start'>
                          <SheetTitle className='text-base font-bold text-foreground leading-tight'>
                            آریوچت
                          </SheetTitle>
                          <SheetDescription className='sr-only'>
                            منوی دسترسی سریع و ناوبری بخش‌های فروشگاه
                          </SheetDescription>
                        </div>
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
                      {user && (
                        <button
                          onClick={() => {
                            setOpen(false)
                            openOrdersModal()
                          }}
                          className='rounded-lg px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent flex items-center gap-2 w-full text-start cursor-pointer'
                        >
                          <Package className='size-4' />
                          <span>سفارش‌های من</span>
                        </button>
                      )}
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
                      className='w-full justify-center gap-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium py-2.5 rounded-xl'
                    >
                      <TelegramIcon className='size-4.5 text-primary shrink-0' />
                      <span>🤖 ورود به ربات تلگرام</span>
                    </Button>

                    {user ? (
                      <>
                        {user.role === 'ADMIN' && (
                          <Link href='/dashboard' onClick={() => setOpen(false)}>
                            <Button
                              variant='outline'
                              className='w-full justify-center gap-2 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold'
                            >
                              <Shield className='size-4' />
                              <span>ورود به پنل مدیریت</span>
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant='outline'
                          onClick={() => {
                            setOpen(false)
                            openOrdersModal()
                          }}
                          className='w-full justify-center gap-2 border-primary/25 bg-primary/5 text-sm font-medium cursor-pointer'
                        >
                          <Package className='size-4' />
                          <span>سفارش‌های من</span>
                        </Button>
                        <Button
                          variant='ghost'
                          onClick={() => {
                            setOpen(false)
                            setDashboardModalOpen(true)
                          }}
                          className='w-full justify-center gap-2 text-xs text-muted-foreground'
                        >
                          <div className='flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold'>
                            {user.name?.trim() ? user.name.trim().charAt(0) : <User className='size-2.5' />}
                          </div>
                          <span className='truncate'>{displayName} (تنظیمات حساب)</span>
                        </Button>
                      </>
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
                    <Link href='/#products' onClick={() => setOpen(false)}>
                      <Button className='w-full justify-center text-sm'>
                        مشاهده و خرید محصولات
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Scroll Progress Bar at bottom of the floating capsule */}
            <motion.div
              className='absolute inset-x-4 -bottom-[1px] h-[2px] overflow-hidden rounded-full pointer-events-none'
              initial={{ opacity: 0 }}
              animate={{ opacity: isScrolled ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className='h-full w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30 origin-right'
                style={{ scaleX }}
              />
            </motion.div>
          </motion.div>
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
          defaultTab={dashboardTab}
          user={user}
          onUserUpdate={(updated) => {
            setUser(updated)
          }}
          onLogout={() => {
            setUser(null)
          }}
        />
      )}

      {/* Mobile Sticky/Fixed Bottom Navigation */}
      <MobileBottomNav
        onOpenDashboard={() => {
          if (user) {
            setDashboardTab('orders')
            setDashboardModalOpen(true)
          } else {
            setAuthModalOpen(true)
          }
        }}
        hidden={open || authModalOpen || dashboardModalOpen}
      />
    </>
  )
}
