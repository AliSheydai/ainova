import { type NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { UserNotificationService } from '@/lib/notifications/user-notification-service'
import { NotificationType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0

    const data = await UserNotificationService.getAdminNotifications({ limit, offset })
    return NextResponse.json({ success: true, ...data })
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری لیست اعلانات.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { userId, title, message, type, link } = body

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'عنوان و متن اعلان الزامی است.' },
        { status: 400 }
      )
    }

    const notification = await UserNotificationService.createNotification({
      userId: userId?.trim() ? userId.trim() : null, // null = broadcast to all
      title: title.trim(),
      message: message.trim(),
      type: type && Object.values(NotificationType).includes(type) ? type : NotificationType.SYSTEM_ANNOUNCEMENT,
      link: link?.trim() ? link.trim() : null,
    })

    return NextResponse.json({
      success: true,
      notification,
      message: notification.isBroadcast
        ? 'اطلاعیه عمومی برای تمام کاربران با موفقیت ارسال شد.'
        : 'پیام برای کاربر مورد نظر با موفقیت ارسال شد.',
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/admin/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت و ارسال اعلان.' },
      { status: 500 }
    )
  }
}
