'use client'

import React from 'react'
import {
  HeadphonesIcon,
  MessageCircle,
  Phone,
  ExternalLink,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '۰۲۱-XXXXXXXX'
const SUPPORT_TELEGRAM = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || 'https://t.me/support'

export function SupportTab() {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge className="bg-primary/10 text-primary border-none text-xs gap-1 font-semibold">
            <HeadphonesIcon className="size-3" />
            مرکز پشتیبانی ۲۴/۷
          </Badge>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs gap-1">
            <Clock className="size-3" />
            پاسخ‌گویی سریع
          </Badge>
        </div>
        <h3 className="text-base font-bold text-foreground">
          پشتیبانی اختصاصی کاربران
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          در صورت بروز هرگونه ابهام یا نیاز به راهنمایی در فعال‌سازی و صدور اشتراک، از روش‌های زیر با کارشناسان ما ارتباط برقرار کنید.
        </p>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Telegram Card */}
        <Card className="border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MessageCircle className="size-5" />
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none text-[10px]">
                روش پیشنهادی
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">پشتیبانی تلگرام</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              سریع‌ترین روش دریافت پشتیبانی فنی، تعویض لینک یا بررسی وضعیت سفارش از طریق تلگرام است.
            </p>
            <a
              href={SUPPORT_TELEGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full gap-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs">
                <ExternalLink className="size-3.5" />
                گفتگو در تلگرام
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Phone Card */}
        <Card className="border-border/70 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="size-5" />
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                تماس صوتی
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold mt-2">تماس تلفنی</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              برای امور اداری یا موارد اضطراری، در ساعات اداری می‌توانید مستقیماً تماس حاصل فرمایید.
            </p>
            <a href={`tel:${SUPPORT_PHONE}`} className="block">
              <Button
                variant="outline"
                className="w-full gap-2 text-xs font-semibold rounded-xl border-border/80"
              >
                <Phone className="size-3.5" />
                <span dir="ltr" className="font-sans tabular-nums">
                  {SUPPORT_PHONE}
                </span>
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Assurance Note */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
        <ShieldCheck className="size-4 shrink-0 text-primary" />
        <span>
          کلیه اشتراک‌های ارائه‌شده دارای ضمانت کارکرد ۱۸ ماهه قانونی بوده و پشتیبانی اختصاصی برای رفع مشکلات احتمالی ارائه می‌شود.
        </span>
      </div>
    </div>
  )
}
