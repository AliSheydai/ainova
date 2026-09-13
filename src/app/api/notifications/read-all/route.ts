import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { UserNotificationService } from '@/lib/notifications/user-notification-service'

export async function POST() {
  try {
    const session = await getCurrentUser()
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت الزامی است.' },
        { status: 401 }
      )
    }

    await UserNotificationService.markAllAsRead(session.userId)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت وضعیت اعلانات.' },
      { status: 500 }
    )
  }
}
