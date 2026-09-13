'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Bell,
  Megaphone,
  Tag,
  Sparkles,
  Send,
  RefreshCw,
  Loader2,
  Users,
  User,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { formatPersianDate, formatRelativeTime, toPersianDigits } from '@/lib/persian-utils'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AdminNotificationItem {
  id: string
  userId: string | null
  title: string
  message: string
  type: string
  link: string | null
  createdAt: string
  user?: {
    id: string
    name: string | null
    phone: string | null
  } | null
  _count?: {
    reads: number
  }
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)

  // Form State
  const [targetType, setTargetType] = useState<'broadcast' | 'user'>('broadcast')
  const [targetUserId, setTargetUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<string>('SYSTEM_ANNOUNCEMENT')
  const [link, setLink] = useState('')

  const fetchNotifications = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/notifications?limit=50')
      if (!res.ok) throw new Error('خطا در بارگذاری اعلانات')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        setTotal(data.total || 0)
      }
    } catch {
      toast.error('خطا در بارگذاری لیست اعلانات.')
    } finally {
      setLoading(false)
      if (manual) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('عنوان و متن پیام الزامی هستند.')
      return
    }

    if (targetType === 'user' && !targetUserId.trim()) {
      toast.error('شناسه کاربر گیرنده الزامی است.')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetType === 'user' ? targetUserId.trim() : null,
          title: title.trim(),
          message: message.trim(),
          type,
          link: link.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'اعلان با موفقیت ارسال شد.')
        setDialogOpen(false)
        setTitle('')
        setMessage('')
        setLink('')
        setTargetUserId('')
        fetchNotifications()
      } else {
        toast.error(data.error || 'خطا در ارسال اعلان.')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور.')
    } finally {
      setSending(false)
    }
  }

  const getTypeBadge = (notifType: string) => {
    switch (notifType) {
      case 'ORDER_SUCCESS':
      case 'ORDER_READY':
        return (
          <span className='inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
            سفارش و تحویل
          </span>
        )
      case 'ORDER_FAILED':
        return (
          <span className='inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive border border-destructive/20'>
            تراکنش ناموفق
          </span>
        )
      case 'PROMOTION':
        return (
          <span className='inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20'>
            جشنواره و تخفیف
          </span>
        )
      case 'SUPPORT_REPLY':
        return (
          <span className='inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20'>
            پشتیبانی
          </span>
        )
      case 'SYSTEM_ANNOUNCEMENT':
      default:
        return (
          <span className='inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20'>
            اطلاعیه عمومی
          </span>
        )
    }
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center justify-between w-full px-4'>
          <div className='flex items-center gap-2'>
            <Bell className='size-5 text-primary' />
            <h1 className='text-base font-bold text-foreground'>
              مدیریت اعلانات و پیام‌ها
            </h1>
          </div>
          <div className='flex items-center gap-2'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main className='p-4 md:p-6 max-w-7xl mx-auto space-y-6'>
        {/* هدر صفحه و دکمه ارسال پیام */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-xl font-bold text-foreground'>
              اعلانات سیستم و پیام‌های سراسری
            </h2>
            <p className='text-xs text-muted-foreground mt-1'>
              ارسال اطلاعیه، پیام‌های تخفیف و مشاهده سوابق رویدادهای ارسالی به کاربران
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => fetchNotifications(true)}
              disabled={refreshing || loading}
              className='h-9 gap-1.5 cursor-pointer rounded-xl'
            >
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
              <span>به‌روزرسانی</span>
            </Button>

            <Button
              onClick={() => setDialogOpen(true)}
              size='sm'
              className='h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold shadow-xs cursor-pointer'
            >
              <Plus className='size-4' />
              <span>ارسال اعلان جدید</span>
            </Button>
          </div>
        </div>

        {/* لیست اعلانات */}
        <Card className='border border-border/70 rounded-2xl shadow-xs overflow-hidden'>
          <CardHeader className='border-b border-border/50 pb-4'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base font-bold flex items-center gap-2'>
                <span>سوابق پیام‌ها و اعلانات</span>
                <Badge variant='secondary' className='font-sans text-xs'>
                  {toPersianDigits(total)} مورد
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            {loading ? (
              <div className='flex flex-col items-center justify-center py-20 gap-3'>
                <Loader2 className='size-8 animate-spin text-primary' />
                <p className='text-xs text-muted-foreground'>در حال دریافت اطلاعات...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-center px-4'>
                <Bell className='size-10 text-muted-foreground/50 mb-3' />
                <p className='text-sm font-semibold text-foreground'>هنوز اعلانی ثبت نشده است.</p>
                <p className='text-xs text-muted-foreground mt-1'>
                  با کلیک بر روی دکمه «ارسال اعلان جدید» می‌توانید پیام سراسری بفرستید.
                </p>
              </div>
            ) : (
              <div className='divide-y divide-border/50'>
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className='p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-right'
                  >
                    <div className='space-y-1.5 flex-1 min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        {getTypeBadge(item.type)}

                        {item.userId === null ? (
                          <span className='inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium'>
                            <Users className='size-3' />
                            <span>همه کاربران (سراسری)</span>
                          </span>
                        ) : (
                          <span className='inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium'>
                            <User className='size-3' />
                            <span>
                              {item.user?.name || item.user?.phone || 'کاربر اختصاصی'}
                            </span>
                          </span>
                        )}

                        <span className='text-xs font-bold text-foreground'>
                          {item.title}
                        </span>
                      </div>

                      <p className='text-xs sm:text-sm text-foreground/80 whitespace-pre-line leading-relaxed'>
                        {item.message}
                      </p>

                      {item.link && (
                        <div className='pt-1'>
                          <a
                            href={item.link}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
                          >
                            <ExternalLink className='size-3' />
                            <span>{item.link}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <div className='flex flex-row sm:flex-col items-end justify-between sm:justify-start gap-1 shrink-0 text-left sm:text-left'>
                      <span className='text-[11px] text-muted-foreground font-sans' dir='ltr'>
                        {formatPersianDate(item.createdAt)}
                      </span>
                      {item.userId === null && item._count?.reads !== undefined && (
                        <span className='text-[11px] text-muted-foreground font-sans'>
                          {toPersianDigits(item._count.reads)} خوانده‌شده
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Main>

      {/* مودال ایجاد و ارسال اعلان جدید */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-lg rounded-2xl p-5' dir='rtl'>
          <DialogHeader className='text-right'>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <Megaphone className='size-5 text-primary' />
              <span>ارسال اعلان و پیام</span>
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground mt-1'>
              ارسال پیام به صورت عمومی برای تمام کاربران یا به صورت خصوصی برای یک کاربر خاص.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendNotification} className='space-y-4 pt-2'>
            <div className='space-y-1.5 text-right'>
              <label className='text-xs font-semibold text-foreground'>نوع گیرنده</label>
              <Select
                value={targetType}
                onValueChange={(val: 'broadcast' | 'user') => setTargetType(val)}
              >
                <SelectTrigger className='w-full text-xs rounded-xl'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir='rtl'>
                  <SelectItem value='broadcast' className='text-xs'>
                    همه کاربران (پیام سراسری)
                  </SelectItem>
                  <SelectItem value='user' className='text-xs'>
                    کاربر اختصاصی
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === 'user' && (
              <div className='space-y-1.5 text-right'>
                <label className='text-xs font-semibold text-foreground'>
                  شناسه کاربر (User ID)
                </label>
                <Input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder='مثلاً clu...'
                  className='text-xs rounded-xl font-mono'
                  required
                />
              </div>
            )}

            <div className='space-y-1.5 text-right'>
              <label className='text-xs font-semibold text-foreground'>نوع اعلان</label>
              <Select value={type} onValueChange={(val) => setType(val)}>
                <SelectTrigger className='w-full text-xs rounded-xl'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir='rtl'>
                  <SelectItem value='SYSTEM_ANNOUNCEMENT' className='text-xs'>
                    اطلاعیه عمومی
                  </SelectItem>
                  <SelectItem value='PROMOTION' className='text-xs'>
                    تخفیف و جشنواره ویژه
                  </SelectItem>
                  <SelectItem value='ORDER_READY' className='text-xs'>
                    سفارش و تحویل
                  </SelectItem>
                  <SelectItem value='SUPPORT_REPLY' className='text-xs'>
                    پیام پشتیبانی
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5 text-right'>
              <label className='text-xs font-semibold text-foreground'>عنوان اعلان</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='مثلاً: جشنواره تخفیف بهاره، به‌روزرسانی سیستم...'
                className='text-xs rounded-xl'
                required
              />
            </div>

            <div className='space-y-1.5 text-right'>
              <label className='text-xs font-semibold text-foreground'>متن پیام</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='متن کامل پیامی که کاربر مشاهده خواهد کرد...'
                rows={4}
                className='text-xs rounded-xl resize-none leading-relaxed'
                required
              />
            </div>

            <div className='space-y-1.5 text-right'>
              <label className='text-xs font-semibold text-foreground'>
                لینک ارجاع (اختیاری)
              </label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder='مثلاً: /#products یا https://...'
                className='text-xs rounded-xl font-mono'
                dir='ltr'
              />
            </div>

            <DialogFooter className='pt-2 gap-2 flex-row-reverse sm:justify-start'>
              <Button
                type='submit'
                disabled={sending}
                className='gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-semibold cursor-pointer'
              >
                {sending ? <Loader2 className='size-3.5 animate-spin' /> : <Send className='size-3.5' />}
                <span>ارسال اعلان</span>
              </Button>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setDialogOpen(false)}
                className='rounded-xl text-xs cursor-pointer'
              >
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
