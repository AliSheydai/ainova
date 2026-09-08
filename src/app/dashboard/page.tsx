'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, HeadphonesIcon, Package, ShoppingCart, Sparkles, CheckCircle2, ArrowLeft, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const quickLinks = [
  {
    icon: ShoppingCart,
    title: 'خرید Google AI Pro',
    description: 'دریافت اشتراک ۱۸ ماهه',
    href: '/dashboard/buy',
  },
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

  const displayName = data.user?.name || data.user?.phone || 'کاربر گرامی'

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="flex flex-col gap-6 p-4 sm:p-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              سلام، {displayName} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              به پنل کاربری Google AI Pro خوش آمدید.
            </p>
          </div>

          <Badge variant="outline" className="w-fit text-xs font-mono">
            {data.user?.phone}
          </Badge>
        </div>

        <Separator />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active Subscription Banner OR Purchase CTA */}
            {data.activeOrder ? (
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
            ) : (
              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0 shadow-md shadow-primary/25">
                      <Sparkles className="size-6" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">
                        خرید اشتراک قانونی Google AI Pro — ۱۸ ماهه
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        فعال‌سازی بدون رمز عبور، مستقیماً روی اکانت جیمیل شخصی شما با تحویل آنی
                      </p>
                    </div>
                  </div>
                  <Button asChild className="shrink-0">
                    <Link href="/dashboard/buy">
                      <ShoppingCart className="me-2 size-4" />
                      خرید اشتراک (۳۹۰,۰۰۰ ت)
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick links grid */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                دسترسی سریع
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
