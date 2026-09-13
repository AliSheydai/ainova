'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  HeadphonesIcon,
  Megaphone,
  Tag,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  Package,
  Check,
  BellOff,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { formatRelativeTime, toPersianDigits } from '@/lib/persian-utils'
import { cn } from '@/lib/utils'

export interface NotificationItem {
  id: string
  userId: string | null
  title: string
  message: string
  type:
    | 'ORDER_SUCCESS'
    | 'ORDER_FAILED'
    | 'ORDER_READY'
    | 'ORDER_PENDING_DELIVERY'
    | 'SUPPORT_REPLY'
    | 'SYSTEM_ANNOUNCEMENT'
    | 'PROMOTION'
  link: string | null
  metadata?: {
    orderId?: string
    ticketId?: string
    [key: string]: unknown
  } | null
  createdAt: string
  isRead: boolean
  isBroadcast: boolean
}

interface NotificationsTabProps {
  onNavigateTab?: (tab: 'orders' | 'support') => void
  onUnreadCountChange?: (count: number) => void
}

export function NotificationsTab({
  onNavigateTab,
  onUnreadCountChange,
}: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) throw new Error('خطا در دریافت اعلانات')
        const data = await res.json()
        if (data.success) {
          setNotifications(data.notifications || [])
          setTotalUnread(data.totalUnread || 0)
          onUnreadCountChange?.(data.totalUnread || 0)
        }
      } catch (err) {
        console.error(err)
        if (isManualRefresh) {
          toast.error('خطا در دریافت لیست اعلانات.')
        }
      } finally {
        setLoading(false)
        if (isManualRefresh) setRefreshing(false)
      }
    },
    [onUnreadCountChange]
  )

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // علامت‌گذاری یک اعلان به عنوان خوانده‌شده
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
        setTotalUnread((prev) => {
          const next = Math.max(0, prev - 1)
          onUnreadCountChange?.(next)
          return next
        })
        window.dispatchEvent(new CustomEvent('notifications-updated'))
      }
    } catch {
      toast.error('خطا در به‌روزرسانی اعلان')
    }
  }

  // علامت‌گذاری تمام اعلانات به عنوان خوانده‌شده
  const handleMarkAllAsRead = async () => {
    if (totalUnread === 0 || markingAll) return
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setTotalUnread(0)
        onUnreadCountChange?.(0)
        window.dispatchEvent(new CustomEvent('notifications-updated'))
        toast.success('همه اعلانات به عنوان خوانده‌شده ثبت شدند.')
      } else {
        throw new Error()
      }
    } catch {
      toast.error('خطا در ثبت وضعیت اعلانات.')
    } finally {
      setMarkingAll(false)
    }
  }

  const filteredList =
    activeFilter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications

  // دریافت آیکون و تم بر اساس نوع اعلان
  const getTypeConfig = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ORDER_SUCCESS':
        return {
          icon: CheckCircle2,
          badgeText: 'پرداخت موفق',
          iconWrapperClass:
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        }
      case 'ORDER_READY':
        return {
          icon: Sparkles,
          badgeText: 'تحویل سفارش',
          iconWrapperClass:
            'bg-primary/10 text-primary border-primary/20',
        }
      case 'ORDER_FAILED':
        return {
          icon: XCircle,
          badgeText: 'ناموفق / لغو',
          iconWrapperClass:
            'bg-destructive/10 text-destructive border-destructive/20',
        }
      case 'ORDER_PENDING_DELIVERY':
        return {
          icon: Clock,
          badgeText: 'در حال آماده‌سازی',
          iconWrapperClass:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        }
      case 'SUPPORT_REPLY':
        return {
          icon: HeadphonesIcon,
          badgeText: 'پشتیبانی',
          iconWrapperClass:
            'bg-primary/10 text-primary border-primary/20',
        }
      case 'PROMOTION':
        return {
          icon: Tag,
          badgeText: 'تخفیف و پیشنهاد',
          iconWrapperClass:
            'bg-primary/10 text-primary border-primary/20',
        }
      case 'SYSTEM_ANNOUNCEMENT':
      default:
        return {
          icon: Megaphone,
          badgeText: 'اطلاعیه سایت',
          iconWrapperClass:
            'bg-primary/10 text-primary border-primary/20',
        }
    }
  }

  return (
    <div className='flex flex-col gap-5 py-1 px-0.5 select-none'>
      {/* هدر بخش اعلانات */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60'>
        <div className='flex items-center gap-2.5'>
          <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs'>
            <Bell className='size-5' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-base font-bold text-foreground'>
                اعلانات و پیام‌ها
              </h3>
              {totalUnread > 0 && (
                <span className='inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-semibold font-sans'>
                  {toPersianDigits(totalUnread)} جدید
                </span>
              )}
            </div>
            <p className='text-xs text-muted-foreground mt-0.5'>
              تاریخچه پیام‌های خرید، تحویل سفارش و اطلاعیه‌ها
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 self-end sm:self-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => fetchNotifications(true)}
            disabled={refreshing || loading}
            className='h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg'
            title='به‌روزرسانی اعلانات'
          >
            <RefreshCw
              className={cn('size-3.5', refreshing && 'animate-spin')}
            />
            <span className='hidden sm:inline'>به‌روزرسانی</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={handleMarkAllAsRead}
            disabled={totalUnread === 0 || markingAll}
            className='h-8 px-3 text-xs gap-1.5 border-border/80 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors rounded-lg cursor-pointer'
          >
            {markingAll ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <CheckCheck className='size-3.5 text-primary' />
            )}
            <span>خواندن همه</span>
          </Button>
        </div>
      </div>

      {/* فیلترهای بالا */}
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => setActiveFilter('all')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border',
            activeFilter === 'all'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-background/80 text-muted-foreground hover:text-foreground border-border/60 hover:bg-accent/40'
          )}
        >
          <span>همه</span>
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-md text-[11px] font-sans font-semibold',
              activeFilter === 'all'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {toPersianDigits(notifications.length)}
          </span>
        </button>

        <button
          type='button'
          onClick={() => setActiveFilter('unread')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border',
            activeFilter === 'unread'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-background/80 text-muted-foreground hover:text-foreground border-border/60 hover:bg-accent/40'
          )}
        >
          <span>خوانده‌نشده</span>
          {totalUnread > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-md text-[11px] font-sans font-bold',
                activeFilter === 'unread'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {toPersianDigits(totalUnread)}
            </span>
          )}
        </button>
      </div>

      {/* لیست اعلانات یا وضعیت بارگذاری / خالی */}
      {loading ? (
        <div className='flex flex-col gap-3 pt-2'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-24 rounded-2xl border border-border/50 bg-card/40 animate-pulse'
            />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-14 text-center px-4 rounded-2xl border border-dashed border-border/70 bg-card/20'>
          <div className='flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3'>
            <BellOff className='size-7 stroke-[1.5]' />
          </div>
          <h4 className='text-sm font-semibold text-foreground'>
            {activeFilter === 'unread'
              ? 'هیچ اعلان خوانده‌نشده‌ای ندارید'
              : 'هنوز اعلانی برای شما ثبت نشده است'}
          </h4>
          <p className='text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed'>
            {activeFilter === 'unread'
              ? 'تمام پیام‌ها و رویدادهای شما قبلاً خوانده شده‌اند.'
              : 'پیام‌های ثبت سفارش، آماده‌سازی اکانت و پاسخ‌های پشتیبانی در این بخش نمایش داده می‌شوند.'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer()}
          initial='hidden'
          animate='visible'
          className='flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pl-1 pr-0.5 custom-scrollbar'
        >
          <AnimatePresence mode='popLayout'>
            {filteredList.map((item) => {
              const typeCfg = getTypeConfig(item.type)
              const IconComp = typeCfg.icon

              return (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  layout
                  className={cn(
                    'group relative flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 text-right',
                    item.isRead
                      ? 'bg-card/40 hover:bg-card/80 border-border/50 text-foreground/90'
                      : 'bg-primary/[0.03] hover:bg-primary/[0.06] border-primary/25 shadow-xs ring-1 ring-primary/10'
                  )}
                  onClick={() => {
                    if (!item.isRead) handleMarkAsRead(item.id)
                  }}
                >
                  {/* ردیف بالای کارت: آیکون، برچسب نوع، زمان و نقطه خوانده‌نشده */}
                  <div className='flex items-center justify-between gap-2 w-full'>
                    <div className='flex items-center gap-2.5 min-w-0'>
                      <div
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-2xs transition-transform group-hover:scale-105',
                          typeCfg.iconWrapperClass
                        )}
                      >
                        <IconComp className='size-4' />
                      </div>

                      <div className='flex items-center gap-2 truncate'>
                        <span className='text-xs font-semibold text-foreground truncate'>
                          {item.title}
                        </span>
                        {item.isBroadcast && (
                          <span className='hidden sm:inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium'>
                            سراسری
                          </span>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-2 shrink-0'>
                      <span className='text-[11px] text-muted-foreground font-sans'>
                        {formatRelativeTime(item.createdAt)}
                      </span>

                      {!item.isRead && (
                        <span
                          className='size-2 rounded-full bg-primary ring-4 ring-primary/20 shrink-0'
                          title='خوانده‌نشده'
                        />
                      )}
                    </div>
                  </div>

                  {/* متن پیام */}
                  <p className='text-xs sm:text-sm text-foreground/80 leading-relaxed pr-1 whitespace-pre-line'>
                    {item.message}
                  </p>

                  {/* ردیف پایین: اکشن‌های متناسب */}
                  <div className='flex items-center justify-between pt-1 gap-2 border-t border-border/40 mt-0.5'>
                    <div className='flex items-center gap-2'>
                      {/* اکشن هدایت به تب سفارش‌ها در صورت وجود سفارش */}
                      {item.metadata?.orderId && onNavigateTab && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!item.isRead) handleMarkAsRead(item.id)
                            onNavigateTab('orders')
                          }}
                          className='h-7 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-lg gap-1.5 cursor-pointer font-medium'
                        >
                          <Package className='size-3' />
                          <span>مشاهده در سفارش‌ها</span>
                        </Button>
                      )}

                      {/* اکشن هدایت به پشتیبانی در صورت تیکت */}
                      {item.metadata?.ticketId && onNavigateTab && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!item.isRead) handleMarkAsRead(item.id)
                            onNavigateTab('support')
                          }}
                          className='h-7 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-lg gap-1.5 cursor-pointer font-medium'
                        >
                          <HeadphonesIcon className='size-3' />
                          <span>مشاهده تیکت پشتیبانی</span>
                        </Button>
                      )}

                      {/* لینک مستقیم خارجی یا داخلی در صورت وجود */}
                      {item.link && (
                        <Button
                          asChild
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-lg gap-1.5 cursor-pointer font-medium'
                        >
                          <a
                            href={item.link}
                            target={item.link.startsWith('http') ? '_blank' : '_self'}
                            rel='noopener noreferrer'
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!item.isRead) handleMarkAsRead(item.id)
                            }}
                          >
                            <ExternalLink className='size-3' />
                            <span>مشاهده لینک</span>
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* دکمه علامت خوانده‌شده */}
                    {!item.isRead && (
                      <button
                        type='button'
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className='flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1 px-1.5 rounded-md hover:bg-accent/40'
                        title='علامت به عنوان خوانده‌شده'
                      >
                        <Check className='size-3' />
                        <span>خوانده شد</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
