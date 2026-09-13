import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { UserNotificationService } from '@/lib/notifications/user-notification-service'

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'برای مشاهده اعلانات ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0

    const data = await UserNotificationService.getUserNotifications(session.userId, {
      unreadOnly,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      ...data,
    })
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری اعلانات.' },
      { status: 500 }
    )
  }
}
