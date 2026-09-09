'use client'

import React, { useState } from 'react'
import {
  User,
  Phone,
  Calendar,
  ShieldCheck,
  Check,
  Loader2,
  LogOut,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AuthUserData } from '@/components/auth/auth-modal'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'

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

interface ProfileTabProps {
  user: AuthUserData
  onUserUpdate: (updated: AuthUserData) => void
  onLogout: () => void
}

export function ProfileTab({ user, onUserUpdate, onLogout }: ProfileTabProps) {
  const [name, setName] = useState(user.name || '')
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [connectingTg, setConnectingTg] = useState(false)
  const [unlinkingTg, setUnlinkingTg] = useState(false)

  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'arioaccountbot'

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('لطفاً نام و نام خانوادگی خود را وارد کنید.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('مشخصات حساب با موفقیت به‌روزرسانی شد.')
        onUserUpdate({
          ...user,
          name: name.trim(),
        })
      } else {
        toast.error(data.message || 'خطا در به‌روزرسانی نام.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectTelegram = async () => {
    setConnectingTg(true)
    try {
      const res = await fetch('/api/telegram/link-token', { method: 'POST' })
      const data = await res.json()

      if (data.success && data.deepLinkUrl) {
        toast.info('در حال انتقال به تلگرام... لطفاً در ربات دکمه Start را بزنید.', {
          duration: 4000,
        })
        window.open(data.deepLinkUrl, '_blank')
      } else {
        toast.error(data.message || 'خطا در ایجاد لینک اتصال به تلگرام.')
      }
    } catch {
      toast.error('خطا در برقراری ارتباط با سرور.')
    } finally {
      setConnectingTg(false)
    }
  }

  const handleUnlinkTelegram = async () => {
    if (!confirm('آیا از قطع اتصال حساب تلگرام اطمینان دارید؟')) return

    setUnlinkingTg(true)
    try {
      const res = await fetch('/api/telegram/unlink', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        toast.success('اتصال حساب تلگرام با موفقیت قطع شد.')
        onUserUpdate({
          ...user,
          telegramId: null,
          telegramUsername: null,
        })
      } else {
        toast.error(data.message || 'خطا در قطع اتصال تلگرام.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setUnlinkingTg(false)
    }
  }

  const handleLogoutClick = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('با موفقیت از حساب کاربری خارج شدید.')
      onLogout()
    } catch {
      toast.error('خطا در خروج از حساب.')
    } finally {
      setLoggingOut(false)
    }
  }

  const displayName = name.trim() || user.name?.trim() || user.phone
  const initial = displayName.charAt(0) || 'ک'

  return (
    <motion.div
      className="space-y-4"
      variants={staggerContainer(0.06)}
      initial="hidden"
      animate="visible"
    >
      {/* Profile Header Banner */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-4 rounded-2xl border border-border/70 bg-gradient-to-l from-primary/5 via-card to-card p-4 sm:p-5 shadow-xs"
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-xl shadow-md shadow-primary/25 ring-2 ring-primary/20">
          {initial}
          <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-card" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-foreground truncate">
              {displayName}
            </h3>
            <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] gap-1 font-medium">
              <ShieldCheck className="h-3 w-3" />
              حساب فعال
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            شماره موبایل:{' '}
            <span dir="ltr" className="font-sans text-foreground font-medium">
              {user.phone}
            </span>
          </p>
        </div>
      </motion.div>

      {/* Edit Form Card */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-bold">ویرایش نام و مشخصات</CardTitle>
            <CardDescription className="text-xs">
              نام شما در رسید فاکتورها و پنل کاربری نمایش داده می‌شود.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-5 pb-5 pt-0">
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name" className="text-xs font-semibold">
                  نام و نام خانوادگی
                </Label>
                <div className="relative group">
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: علی رضایی"
                    className="h-11 pr-10 rounded-xl border-border/80 focus-visible:ring-primary/40 font-sans text-xs sm:text-sm"
                  />
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-phone" className="text-xs font-semibold">
                  شماره موبایل (شناسه یکتا)
                </Label>
                <div className="relative">
                  <Input
                    id="profile-phone"
                    value={user.phone}
                    readOnly
                    dir="ltr"
                    className="bg-muted/50 font-sans tabular-nums text-left h-11 pr-10 rounded-xl border-border/60 text-muted-foreground cursor-not-allowed text-xs sm:text-sm"
                  />
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {user.createdAt && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground border border-border/40">
                  <Calendar className="size-3.5 shrink-0 text-primary" />
                  <span>
                    تاریخ عضویت:{' '}
                    <strong className="text-foreground font-sans tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                    </strong>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  size="sm"
                  className="text-xs font-semibold h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/20 transition-transform active:scale-[0.98]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 size-3.5 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Check className="ml-2 size-3.5" />
                      ذخیره تغییرات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Telegram Account Linking Card */}
      <motion.div variants={fadeUp}>
        <Card className="border-sky-500/20 bg-sky-500/5 shadow-xs">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <TelegramIcon className="size-4" />
                </div>
                <CardTitle className="text-sm font-bold">یکپارچه‌سازی و اتصال به تلگرام</CardTitle>
              </div>
              {user.telegramId ? (
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[11px] gap-1 font-medium">
                  <CheckCircle2 className="size-3" />
                  متصل به تلگرام
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[11px] text-muted-foreground border-border">
                  عدم اتصال
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs leading-relaxed mt-1">
              با اتصال حساب به ربات تلگرام، کلیه سفارش‌ها و لینک‌های فعال‌سازی شما به صورت همگام و آنی در ربات نیز قابل دسترسی خواهند بود.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-5 pb-5 pt-0">
            {user.telegramId ? (
              <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                <div className="text-xs text-muted-foreground">
                  شناسه متصل:{' '}
                  <strong className="text-foreground font-sans font-medium">
                    {user.telegramUsername ? `@${user.telegramUsername}` : user.telegramId}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://t.me/${botUsername}`, '_blank')}
                    className="h-8 gap-1 text-xs border-sky-500/30 text-sky-700 dark:text-sky-400 hover:bg-sky-500/10 rounded-xl"
                  >
                    <ExternalLink className="size-3" />
                    ورود به ربات
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlinkTelegram}
                    disabled={unlinkingTg}
                    className="h-8 text-xs text-muted-foreground hover:text-red-600 rounded-xl"
                  >
                    {unlinkingTg ? <Loader2 className="size-3 animate-spin" /> : 'قطع اتصال'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleConnectTelegram}
                  disabled={connectingTg}
                  size="sm"
                  className="h-9 px-4 gap-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sm shadow-sky-500/20 transition-transform active:scale-[0.98]"
                >
                  {connectingTg ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      در حال تولید لینک اتصال...
                    </>
                  ) : (
                    <>
                      <TelegramIcon className="size-3.5" />
                      🤖 اتصال به ربات تلگرام
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Logout Card */}
      <motion.div variants={fadeUp}>
        <Card className="border-red-500/20 bg-red-500/5 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h4 className="text-xs font-bold text-red-700 dark:text-red-400">
                خروج از حساب کاربری
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                با خروج از حساب، سشن فعلی شما در این مرورگر خاتمه می‌یابد.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutClick}
              disabled={loggingOut}
              className="h-9 gap-1.5 text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700 border-red-500/30 rounded-xl transition-transform active:scale-[0.98]"
            >
              {loggingOut ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <LogOut className="size-3.5" />
              )}
              خروج از حساب
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
