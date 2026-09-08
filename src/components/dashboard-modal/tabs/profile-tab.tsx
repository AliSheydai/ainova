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
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AuthUserData } from '@/components/auth/auth-modal'

interface ProfileTabProps {
  user: AuthUserData
  onUserUpdate: (updated: AuthUserData) => void
  onLogout: () => void
}

export function ProfileTab({ user, onUserUpdate, onLogout }: ProfileTabProps) {
  const [name, setName] = useState(user.name || '')
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

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
    <div className="space-y-4">
      {/* Profile Header Banner */}
      <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-gradient-to-l from-primary/5 via-card to-card p-4 sm:p-5 shadow-xs">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-xl shadow-md shadow-primary/25 ring-2 ring-primary/20">
          {initial}
          <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-foreground truncate">
              {displayName}
            </h3>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px] gap-1 font-medium">
              <ShieldCheck className="h-3 w-3" />
              حساب فعال
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            شماره موبایل:{' '}
            <span dir="ltr" className="font-mono text-foreground">
              {user.phone}
            </span>
          </p>
        </div>
      </div>

      {/* Edit Form Card */}
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
                  className="bg-muted/50 font-mono text-left h-11 pr-10 rounded-xl border-border/60 text-muted-foreground cursor-not-allowed text-xs sm:text-sm"
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
                className="text-xs font-semibold h-10 px-5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/20"
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

      {/* Logout Card */}
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
            className="h-9 gap-1.5 text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700 border-red-500/30 rounded-xl"
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
    </div>
  )
}
