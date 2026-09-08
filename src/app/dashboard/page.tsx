'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  HeadphonesIcon,
  Package,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  User,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const quickLinks = [
  {
    icon: Package,
    title: 'سفارش‌های من',
    description: 'مشاهده تاریخچه و لینک‌ها',
    href: '/dashboard/orders',
  },
  {
    icon: BookOpen,
    title: 'راهنمای فعال‌سازی',
    description: 'آموزش گام به گام فعال‌سازی',
    href: '/dashboard/activation-guide',
  },
  {
    icon: HeadphonesIcon,
    title: 'پشتیبانی',
    description: 'ارتباط آنلاین و تلفنی',
    href: '/dashboard/support',
  },
]

interface DashboardData {
  user: {
    name: string | null
    phone: string
  } | null
  activeOrder: {
    id: string
    planName: string
    activationUrl: string
    createdAt: string
  } | null
  ordersCount: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    user: null,
    activeOrder: null,
    ordersCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()).catch(() => null),
      fetch('/api/orders').then((r) => r.json()).catch(() => null),
    ])
      .then(([authRes, ordersRes]) => {
        const user = authRes?.authenticated ? authRes.user : null
        const orders = ordersRes?.orders || []
        const completed = orders.find((o: any) => o.status === 'COMPLETED' && o.activationLink?.url)

        setData({
          user,
          activeOrder: completed
            ? {
                id: completed.id,
                planName: `${completed.plan?.product?.name} (${completed.plan?.name})`,
                activationUrl: completed.activationLink.url,
                createdAt: completed.createdAt,
              }
            : null,
          ordersCount: orders.length,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const hasName = Boolean(data.user?.name && data.user.name.trim().length > 0)
  const displayName = hasName ? data.user!.name!.trim() : 'کاربر گرامی'
  const initial = displayName.charAt(0) || 'ک'

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="flex flex-col gap-6 p-4 sm:p-6">
        {/* Welcome Section - Showing user name instead of phone number */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/70 bg-gradient-to-l from-primary/5 via-card to-card p-5 shadow-xs">
          <div className="flex items-center gap-4">
            {/* Modern Avatar with Gradient Ring */}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-2xl shadow-lg shadow-primary/25 ring-2 ring-primary/20">
              {initial}
              <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">
                  سلام، {displayName} عزیز 👋
                </h1>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 text-xs gap-1 font-medium">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  حساب کاربری فعال
                </Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                به سامانه فعال‌سازی و مدیریت اشتراک جمینای خوش آمدید.
              </p>
            </div>
          </div>

          {/* User Name Badge or CTA */}
          <div className="flex items-center gap-2">
            {hasName ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card px-4 py-2 shadow-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col text-xs text-start">
                  <span className="text-[10px] text-muted-foreground">نام حساب کاربری:</span>
                  <span className="font-bold text-foreground text-sm">{displayName}</span>
                </div>
              </div>
            ) : (
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                <Link href="/dashboard/profile">
                  <User className="h-3.5 w-3.5" />
                  تکمیل نام و نام خانوادگی
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active Subscription Banner */}
            {data.activeOrder && (
              <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent shadow-sm">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">اشتراک فعال شما:</span>
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none text-xs">
                          {data.activeOrder.planName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        لینک فعال‌سازی آماده استفاده روی اکانت گوگل شماست.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs">
                      <Link href={`/dashboard/orders/${data.activeOrder.id}`}>
                        <Sparkles className="size-3.5" />
                        مشاهده لینک فعال‌سازی
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick links grid */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                دسترسی سریع
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {quickLinks.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Card className="h-full cursor-pointer border-border/60 transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="size-4 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="mb-1 text-sm font-semibold">
                          {item.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </Main>
    </>
  )
}
