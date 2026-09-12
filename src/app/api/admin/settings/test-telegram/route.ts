import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { AdminNotificationService } from '@/lib/notifications/admin-notification'

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json().catch(() => ({}))
    const { chatId } = body

    const result = await AdminNotificationService.sendTestNotification(chatId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'خطا در ارسال پیام آزمایشی.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'پیام آزمایشی با موفقیت به تلگرام ادمین ارسال گردید.',
    })
  } catch (error: unknown) {
    console.error('Error sending test telegram notification:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سیستمی در ارسال پیام آزمایشی.' },
      { status: 500 }
    )
  }
}
