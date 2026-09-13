import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { UserNotificationService } from '@/lib/notifications/user-notification-service'

export async function GET() {
  try {
    const session = await getCurrentUser()
    if (!session || !session.userId) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const unreadCount = await UserNotificationService.getUnreadCount(session.userId)
    return NextResponse.json({ unreadCount })
  } catch (error: unknown) {
    console.error('Error fetching unread notification count:', error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
