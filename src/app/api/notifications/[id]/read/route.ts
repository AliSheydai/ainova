import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { UserNotificationService } from '@/lib/notifications/user-notification-service'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser()
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت الزامی است.' },
        { status: 401 }
      )
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه اعلان نامعتبر است.' },
        { status: 400 }
      )
    }

    const success = await UserNotificationService.markAsRead(session.userId, id)

    return NextResponse.json({ success })
  } catch (error: unknown) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت وضعیت اعلان.' },
      { status: 500 }
    )
  }
}
