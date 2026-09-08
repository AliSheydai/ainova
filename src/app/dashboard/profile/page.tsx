'use client'

import React, { useEffect, useState } from 'react'
import { User, Phone, Calendar, ShieldCheck, Check, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('اطلاعات با موفقیت ذخیره شد.')
        setProfile((prev) => (prev ? { ...prev, name } : null))
      } else {
        toast.error(data.message || 'خطا در ذخیره اطلاعات.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="flex flex-col gap-6 p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <User className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">پروفایل کاربری</h1>
            <p className="text-sm text-muted-foreground">
              مدیریت اطلاعات و مشخصات حساب کاربری
            </p>
          </div>
        </div>

        <Separator />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="border-border/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">اطلاعات حساب</CardTitle>
              <CardDescription className="text-xs">
                شماره موبایل شما شناسه یکتای حساب شماست و امکان تغییر آن وجود ندارد.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره همراه</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      value={profile?.phone || ''}
                      readOnly
                      dir="ltr"
                      className="bg-muted/50 font-mono text-left"
                    />
                    <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">نام و نام خانوادگی (اختیاری)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: علی محمدی"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  <Calendar className="size-4 shrink-0" />
                  <span>
                    تاریخ عضویت:{' '}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('fa-IR')
                      : '-'}
                  </span>
                </div>

                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 size-4 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Check className="ml-2 size-4" />
                      ذخیره تغییرات
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
