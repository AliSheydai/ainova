'use client'

import React, { useEffect, useState } from 'react'
import {
  User,
  Phone,
  Calendar,
  ShieldCheck,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  phone: string
  name: string | null
  createdAt: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setProfile(data.user)
          setName(data.user.name || '')
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('لطفاً نام و نام خانوادگی را وارد کنید.')
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
        toast.success('اطلاعات با موفقیت ذخیره شد.')
        setProfile((prev) => (prev ? { ...prev, name: name.trim() } : null))
      } else {
        toast.error(data.message || 'خطا در ذخیره اطلاعات.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSaving(false)
    }
  }

  const displayName = name.trim() || profile?.name || 'کاربر گرامی'
  const initial = displayName.charAt(0) || 'ک'

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="flex flex-col gap-6 p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {/* Profile Header Banner */}
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-gradient-to-l from-primary/5 via-card to-card p-5 shadow-xs">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-2xl shadow-md shadow-primary/25 ring-2 ring-primary/20">
            {initial}
            <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-card" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                {displayName}
              </h1>
              <Badge className="bg-primary/10 text-primary border border-primary/20 text-[11px] gap-1 font-medium">
                <ShieldCheck className="h-3 w-3" />
                حساب احرازهویت‌شده
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              مدیریت مشخصات فردی و اطلاعات حساب کاربری جمینای
            </p>
          </div>
        </div>

        <Separator />

        {loading ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-2"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">در حال بارگذاری مشخصات کاربر...</span>
          </div>
        ) : (
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">مشخصات حساب</CardTitle>
              <CardDescription className="text-xs">
                نام و نام خانوادگی شما در پنل کاربری، رسید سفارش‌ها و پشتیبانی نمایش داده خواهد شد.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    نام و نام خانوادگی
                  </Label>
                  <div className="relative group">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: علی رضایی"
                      className="h-11 pr-10 rounded-xl border-border/80 focus-visible:ring-primary/40 font-sans"
                    />
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    شماره تلفن همراه (شناسه یکتا)
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      value={profile?.phone || ''}
                      readOnly
                      dir="ltr"
                      className="bg-muted/50 font-sans tabular-nums text-left h-11 pr-10 rounded-xl border-border/60 text-muted-foreground cursor-not-allowed"
                    />
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    شماره موبایل شناسه غیرقابل تغییر ورود شما به سامانه است.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3.5 text-xs text-muted-foreground border border-border/40">
                  <Calendar className="size-4 shrink-0 text-primary" />
                  <span>
                    تاریخ عضویت شما در سامانه:{' '}
                    <strong className="text-foreground font-sans tabular-nums">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('fa-IR')
                        : '-'}
                    </strong>
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  aria-busy={saving}
                  className="w-full sm:w-auto text-xs font-semibold h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md shadow-primary/20"
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 size-4 animate-spin" aria-hidden="true" />
                      در حال ذخیره اطلاعات...
                    </>
                  ) : (
                    <>
                      <Check className="ml-2 size-4" aria-hidden="true" />
                      ذخیره و به‌روزرسانی
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}
