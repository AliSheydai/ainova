import { type Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { UserNotificationService, type UserNotificationItem } from '@/lib/notifications/user-notification-service'
import { notificationsListKeyboard, notificationDetailKeyboard } from '../keyboards'
import { NotificationType } from '@prisma/client'
import { escapeHtml } from '../formatting'

const PAGE_SIZE = 3

function getNotificationTypeConfig(type: NotificationType): { label: string; icon: string } {
  switch (type) {
    case NotificationType.ORDER_SUCCESS:
      return { label: 'سفارش موفق', icon: '🛒' }
    case NotificationType.ORDER_FAILED:
      return { label: 'خطا در سفارش', icon: '❌' }
    case NotificationType.ORDER_READY:
      return { label: 'سفارش آماده تحویل', icon: '🚀' }
    case NotificationType.ORDER_PENDING_DELIVERY:
      return { label: 'در انتظار تحویل', icon: '⏳' }
    case NotificationType.SUPPORT_REPLY:
      return { label: 'پاسخ پشتیبانی', icon: '💬' }
    case NotificationType.PROMOTION:
      return { label: 'پیشنهاد و تخفیف', icon: '🎁' }
    case NotificationType.SYSTEM_ANNOUNCEMENT:
    default:
      return { label: 'اطلاعیه سیستم', icon: '📢' }
  }
}

function formatPersianDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  } catch {
    return ''
  }
}

/**
 * نمایش لیست اعلانات کاربر در تلگرام با پشتیبانی از فیلتر، صفحه‌بندی و وضعیت خوانده‌شده
 */
export async function handleNotifications(
  ctx: Context,
  page: number = 1,
  filter: 'all' | 'unread' = 'all'
) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user || !user.phone) {
      const { startLoginFlow } = await import('./auth')
      await startLoginFlow(ctx, '⚠️ برای مشاهده اعلانات و پیام‌های خود، لطفاً ابتدا وارد حساب کاربری شوید:')
      return
    }

    const unreadOnly = filter === 'unread'
    const offset = (Math.max(1, page) - 1) * PAGE_SIZE

    const data = await UserNotificationService.getUserNotifications(user.id, {
      unreadOnly,
      limit: PAGE_SIZE,
      offset,
    })

    const totalPages = Math.ceil(data.totalCount / PAGE_SIZE) || 1
    const validPage = Math.max(1, Math.min(page, totalPages))

    if (data.totalCount === 0) {
      const emptyText =
        filter === 'unread'
          ? `🎉 <b>هیچ اعلان جدیدی ندارید!</b>\n\nتمامی پیام‌ها و اعلانات قبلاً توسط شما مطالعه شده‌اند.`
          : `📭 <b>صندوق اعلان‌های شما خالی است</b>\n\nدر حال حاضر هیچ اعلان یا پیامی برای شما ثبت نشده است.`

      const keyboard = notificationsListKeyboard([], 1, 1, filter, data.totalUnread)

      if (ctx.callbackQuery) {
        await ctx.editMessageText(emptyText, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        }).catch(async () => {
          await ctx.reply(emptyText, {
            parse_mode: 'HTML',
            reply_markup: keyboard,
          })
        })
        await ctx.answerCallbackQuery().catch(() => {})
      } else {
        await ctx.reply(emptyText, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        })
      }
      return
    }

    let messageText = `🔔 <b>صندوق اعلانات و پیام‌ها</b> (${data.totalCount.toLocaleString('fa-IR')} اعلان${data.totalUnread > 0 ? ` · ${data.totalUnread.toLocaleString('fa-IR')} جدید` : ''})\n\n`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ariachat.org'

    for (let i = 0; i < data.notifications.length; i++) {
      const item = data.notifications[i]
      const { label, icon } = getNotificationTypeConfig(item.type)
      const dateStr = formatPersianDate(item.createdAt)
      const statusText = item.isRead ? 'خوانده‌شده' : '✨ جدید'
      const itemNumber = (offset + i + 1).toLocaleString('fa-IR')

      messageText += `${icon} <b>اعلان شماره ${itemNumber}</b> — ${escapeHtml(item.title)}\n`
      messageText += `• 📅 ${dateStr} · <b>${escapeHtml(label)}</b> · <code>${statusText}</code>\n`
      messageText += `<blockquote>${escapeHtml(item.message)}</blockquote>\n`

      if (item.link) {
        const fullUrl =
          item.link.startsWith('http://') || item.link.startsWith('https://')
            ? item.link
            : item.link.startsWith('/')
            ? `${appUrl}${item.link}`
            : `${appUrl}/${item.link}`
        messageText += `🔗 <a href="${fullUrl}">مشاهده پیوند مرتبط</a>\n`
      }

      if (i < data.notifications.length - 1) {
        messageText += `\n`
      }
    }

    messageText += `\n📄 صفحه ${validPage.toLocaleString('fa-IR')} از ${totalPages.toLocaleString('fa-IR')}`

    const keyboard = notificationsListKeyboard(
      data.notifications,
      validPage,
      totalPages,
      filter,
      data.totalUnread
    )

    if (ctx.callbackQuery) {
      await ctx.editMessageText(messageText, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
        link_preview_options: { is_disabled: true },
      }).catch(async () => {
        await ctx.reply(messageText, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
          link_preview_options: { is_disabled: true },
        })
      })
      await ctx.answerCallbackQuery().catch(() => {})
    } else {
      await ctx.reply(messageText, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
        link_preview_options: { is_disabled: true },
      })
    }
  } catch (error) {
    console.error('Error in handleNotifications:', error)
    await ctx.reply('خطا در بارگذاری صندوق اعلان‌ها. لطفاً دوباره تلاش کنید.')
  }
}

/**
 * علامت‌گذاری یک اعلان مشخص به عنوان خوانده‌شده
 */
export async function handleNotificationRead(
  ctx: Context,
  notificationId: string,
  page: number = 1,
  filter: 'all' | 'unread' = 'all'
) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user) return

    await UserNotificationService.markAsRead(user.id, notificationId)
    await ctx.answerCallbackQuery({
      text: '✅ اعلان به عنوان خوانده‌شده علامت‌گذاری شد.',
    }).catch(() => {})

    // به‌روزرسانی لیست جاری
    await handleNotifications(ctx, page, filter)
  } catch (error) {
    console.error('Error in handleNotificationRead:', error)
    await ctx.answerCallbackQuery({
      text: 'خطا در ثبت وضعیت اعلان.',
    }).catch(() => {})
  }
}

/**
 * علامت‌گذاری همه اعلانات به عنوان خوانده‌شده
 */
export async function handleNotificationReadAll(
  ctx: Context,
  page: number = 1,
  filter: 'all' | 'unread' = 'all'
) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (!user) return

    await UserNotificationService.markAllAsRead(user.id)
    await ctx.answerCallbackQuery({
      text: '✅ تمام اعلان‌ها با موفقیت خوانده شدند.',
    }).catch(() => {})

    // پس از خواندن همه، اگر روی فیلتر unread بود به all بازمی‌گردانیم
    await handleNotifications(ctx, 1, 'all')
  } catch (error) {
    console.error('Error in handleNotificationReadAll:', error)
    await ctx.answerCallbackQuery({
      text: 'خطا در ثبت وضعیت همه اعلان‌ها.',
    }).catch(() => {})
  }
}
