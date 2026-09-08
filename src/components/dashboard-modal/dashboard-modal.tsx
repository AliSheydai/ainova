'use client'

import React, { useState } from 'react'
import {
  Package,
  BookOpen,
  HeadphonesIcon,
  User,
  Sparkles,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AuthUserData } from '@/components/auth/auth-modal'
import { OrdersTab } from './tabs/orders-tab'
import { ActivationGuideTab } from './tabs/activation-guide-tab'
import { SupportTab } from './tabs/support-tab'
import { ProfileTab } from './tabs/profile-tab'
import { cn } from '@/lib/utils'

interface DashboardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthUserData
  onUserUpdate: (updated: AuthUserData) => void
  onLogout: () => void
  defaultTab?: 'orders' | 'guide' | 'support' | 'profile'
}

type TabKey = 'orders' | 'guide' | 'support' | 'profile'

const menuItems: {
  id: TabKey
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    id: 'orders',
    title: 'سفارش‌های من',
    subtitle: 'تاریخچه، وضعیت و لینک‌ها',
    icon: Package,
  },
  {
    id: 'guide',
    title: 'راهنمای فعال‌سازی',
    subtitle: 'آموزش گام‌به‌گام',
    icon: BookOpen,
  },
  {
    id: 'support',
    title: 'پشتیبانی',
    subtitle: 'ارتباط تلگرام و تماس',
    icon: HeadphonesIcon,
  },
  {
    id: 'profile',
    title: 'حساب کاربری',
    subtitle: 'ویرایش مشخصات و خروج',
    icon: User,
  },
]

export function DashboardModal({
  open,
  onOpenChange,
  user,
  onUserUpdate,
  onLogout,
  defaultTab = 'orders',
}: DashboardModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)

  const displayName = user.name?.trim() || user.phone
  const initial = displayName.charAt(0) || 'ک'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="max-w-4xl sm:max-w-4xl md:max-w-5xl p-0 overflow-hidden border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-2xl h-[90vh] max-h-[720px] flex flex-col md:flex-row gap-0"
      >
        {/* ================= RIGHT SIDEBAR (راست‌چین عمودی) ================= */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-l border-border/60 bg-muted/30 flex flex-col justify-between p-4 sm:p-5 select-none">
          {/* Top Section: Brand & User Greeting */}
          <div className="space-y-4">
            {/* Header Brand */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-foreground">
                    جمینای
                  </DialogTitle>
                  <p className="text-[11px] text-muted-foreground">پنل کاربری و اشتراک</p>
                </div>
              </div>
            </div>

            {/* User Mini Card */}
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/70 p-3 shadow-xs">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-xs ring-1 ring-primary/20">
                {initial}
                <span className="absolute -bottom-0.5 -left-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {displayName}
                </h4>
                <p dir="ltr" className="text-[11px] text-muted-foreground font-mono truncate">
                  {user.phone}
                </p>
              </div>
            </div>

            {/* Vertical Menu Navigation (از بالا به پایین) */}
            <nav className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-muted-foreground px-2 pb-1">
                منوی اصلی داشبورد
              </div>

              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 text-right group cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'flex size-7 items-center justify-center rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary-foreground/15 text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs leading-tight">{item.title}</span>
                        <span
                          className={cn(
                            'text-[10px] leading-tight hidden lg:inline',
                            isActive
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground'
                          )}
                        >
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    <ChevronLeft
                      className={cn(
                        'size-3.5 transition-transform duration-200',
                        isActive
                          ? 'text-primary-foreground translate-x-0.5'
                          : 'text-muted-foreground/50 opacity-0 group-hover:opacity-100'
                      )}
                    />
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Actions */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false)
                window.location.href = '/dashboard/buy'
              }}
              className="w-full gap-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-primary to-blue-600 shadow-xs"
            >
              <ShoppingBag className="size-3.5" />
              خرید اشتراک جدید
            </Button>
          </div>
        </aside>

        {/* ================= LEFT MAIN CONTENT AREA ================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-background/50 overflow-hidden">
          {/* Content Header Bar */}
          <div className="h-14 shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xs px-5 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {menuItems.find((m) => m.id === activeTab)?.title}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                — {menuItems.find((m) => m.id === activeTab)?.subtitle}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
              aria-label="بستن"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Content Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === 'orders' && (
              <OrdersTab
                onGoToBuy={() => {
                  onOpenChange(false)
                  window.location.href = '/dashboard/buy'
                }}
              />
            )}

            {activeTab === 'guide' && (
              <ActivationGuideTab onGoToOrders={() => setActiveTab('orders')} />
            )}

            {activeTab === 'support' && <SupportTab />}

            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                onUserUpdate={onUserUpdate}
                onLogout={() => {
                  onLogout()
                  onOpenChange(false)
                }}
              />
            )}
          </div>
        </main>
      </DialogContent>
    </Dialog>
  )
}
