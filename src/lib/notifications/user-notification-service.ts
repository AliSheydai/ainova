import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export interface CreateNotificationInput {
  userId?: string | null
  title: string
  message: string
  type?: NotificationType
  link?: string | null
  metadata?: Record<string, unknown> | null
  sendTelegram?: boolean
}

export interface UserNotificationItem {
  id: string
  userId: string | null
  title: string
  message: string
  type: NotificationType
  link: string | null
  metadata: unknown
  createdAt: Date
  isRead: boolean
  isBroadcast: boolean
}

function getNotificationTypeIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.ORDER_SUCCESS:
      return '🛒'
    case NotificationType.ORDER_FAILED:
      return '❌'
    case NotificationType.ORDER_READY:
      return '🚀'
    case NotificationType.ORDER_PENDING_DELIVERY:
      return '⏳'
    case NotificationType.SUPPORT_REPLY:
      return '💬'
    case NotificationType.PROMOTION:
      return '🎁'
    case NotificationType.SYSTEM_ANNOUNCEMENT:
    default:
      return '📢'
  }
}

export class UserNotificationService {
  /**
   * ایجاد یک اعلان جدید (اختصاصی یا سراسری) و ارسال پیام در تلگرام
   */
  static async createNotification({
    userId = null,
    title,
    message,
    type = NotificationType.SYSTEM_ANNOUNCEMENT,
    link = null,
    metadata = null,
    sendTelegram = true,
  }: CreateNotificationInput): Promise<UserNotificationItem> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
        metadata: metadata ? (metadata as any) : undefined,
        isRead: false,
      },
    })

    // ارسال بلادرنگ به چت‌بات تلگرام در صورت تمایل و اتصال حساب
    if (sendTelegram) {
      this.dispatchTelegramNotification({
        id: notification.id,
        userId,
        title,
        message,
        type,
        link,
      }).catch((err) => {
        console.error('Failed to dispatch telegram notification:', err)
      })
    }

    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      isRead: false,
      isBroadcast: notification.userId === null,
    }
  }

  /**
   * ارسال اعلان به چت‌بات تلگرام کاربر یا کاربران
   */
  private static async dispatchTelegramNotification({
    id,
    userId,
    title,
    message,
    type,
    link,
  }: {
    id: string
    userId: string | null
    title: string
    message: string
    type: NotificationType
    link: string | null
  }): Promise<void> {
    const { sendTelegramNotification } = await import('@/lib/telegram/bot')
    const { InlineKeyboard } = await import('grammy')

    const icon = getNotificationTypeIcon(type)
    const telegramText = `
${icon} **اعلان جدید:** ${title}
━━━━━━━━━━━━━━━━━━━━
${message}
`.trim()

    const kb = new InlineKeyboard()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ariachat.org'

    if (link) {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        kb.url('🔗 باز کردن پیوند', link).row()
      } else {
        const fullUrl = link.startsWith('/') ? `${appUrl}${link}` : `${appUrl}/${link}`
        kb.url('🌐 مشاهده در سایت', fullUrl).row()
      }
    }

    kb.text('✓ خوانده شد', `notif:read:${id}`).row()
    kb.text('🔔 صندوق اعلان‌ها', 'notif:list:1')

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      })

      if (user?.telegramId) {
        await sendTelegramNotification(user.telegramId, telegramText, kb)
      }
    } else {
      // پیام سراسری: ارسال به کاربران دارای اکانت تلگرام متصل (تا سقف ۵۰۰ کاربر)
      const users = await prisma.user.findMany({
        where: { telegramId: { not: null } },
        select: { telegramId: true },
        take: 500,
      })

      for (const u of users) {
        if (u.telegramId) {
          await sendTelegramNotification(u.telegramId, telegramText, kb).catch(() => {})
        }
      }
    }
  }

  /**
   * دریافت اعلانات یک کاربر (شامل پیام‌های شخصی و پیام‌های عمومی ادمین)
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<{ notifications: UserNotificationItem[]; totalUnread: number; totalCount: number }> {
    const limit = options?.limit ?? 40
    const offset = options?.offset ?? 0

    const whereClause: any = options?.unreadOnly
      ? {
          OR: [
            { userId, isRead: false },
            { userId: null, reads: { none: { userId } } },
          ],
        }
      : {
          OR: [{ userId }, { userId: null }],
        }

    const [rawNotifications, totalCount, totalUnread] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          reads: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: whereClause }),
      this.getUnreadCount(userId),
    ])

    const formatted: UserNotificationItem[] = rawNotifications.map((n) => {
      const isRead = n.userId !== null ? n.isRead : n.reads.length > 0
      return {
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        metadata: n.metadata,
        createdAt: n.createdAt,
        isRead,
        isBroadcast: n.userId === null,
      }
    })

    return {
      notifications: formatted,
      totalUnread,
      totalCount,
    }
  }

  /**
   * دریافت تعداد اعلانات خوانده‌نشده برای کاربر
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const [directUnread, broadcastUnread] = await Promise.all([
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
      prisma.notification.count({
        where: {
          userId: null,
          reads: {
            none: {
              userId,
            },
          },
        },
      }),
    ])

    return directUnread + broadcastUnread
  }

  /**
   * علامت‌گذاری یک اعلان به عنوان خوانده‌شده
   */
  static async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) return false

    if (notification.userId === userId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })
      return true
    }

    if (notification.userId === null) {
      await prisma.notificationRead.upsert({
        where: {
          notificationId_userId: {
            notificationId,
            userId,
          },
        },
        create: {
          notificationId,
          userId,
        },
        update: {},
      })
      return true
    }

    return false
  }

  /**
   * علامت‌گذاری تمام اعلانات کاربر به عنوان خوانده‌شده
   */
  static async markAllAsRead(userId: string): Promise<void> {
    // 1. علامت‌گذاری تمام پیام‌های شخصی خوانده‌نشده
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    // 2. یافتن تمام پیام‌های عمومی که کاربر هنوز نخوانده است
    const unreadBroadcasts = await prisma.notification.findMany({
      where: {
        userId: null,
        reads: {
          none: {
            userId,
          },
        },
      },
      select: { id: true },
    })

    if (unreadBroadcasts.length > 0) {
      await prisma.notificationRead.createMany({
        data: unreadBroadcasts.map((b) => ({
          notificationId: b.id,
          userId,
        })),
        skipDuplicates: true,
      })
    }
  }

  /**
   * دریافت لیست اعلانات برای پنل ادمین
   */
  static async getAdminNotifications(options?: {
    limit?: number
    offset?: number
  }) {
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              reads: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count(),
    ])

    return {
      notifications: items,
      total,
    }
  }
}
