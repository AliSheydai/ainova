import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export interface CreateNotificationInput {
  userId?: string | null
  title: string
  message: string
  type?: NotificationType
  link?: string | null
  metadata?: Record<string, unknown> | null
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

export class UserNotificationService {
  /**
   * ایجاد یک اعلان جدید (اختصاصی یا سراسری)
   */
  static async createNotification({
    userId = null,
    title,
    message,
    type = NotificationType.SYSTEM_ANNOUNCEMENT,
    link = null,
    metadata = null,
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
   * دریافت اعلانات یک کاربر (شامل پیام‌های شخصی و پیام‌های عمومی ادمین)
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<{ notifications: UserNotificationItem[]; totalUnread: number }> {
    const limit = options?.limit ?? 40
    const offset = options?.offset ?? 0

    // Fetch user notifications and public broadcast notifications
    const rawNotifications = await prisma.notification.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      include: {
        reads: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

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

    const totalUnread = await this.getUnreadCount(userId)

    const result = options?.unreadOnly
      ? formatted.filter((item) => !item.isRead)
      : formatted

    return {
      notifications: result,
      totalUnread,
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
