import { type NextRequest, NextResponse } from 'next/server'
import { OrderExpirationService } from '@/lib/orders/order-expiration'

export async function GET(req: NextRequest) {
  return handleExpiration(req)
}

export async function POST(req: NextRequest) {
  return handleExpiration(req)
}

async function handleExpiration(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const headerSecret = req.headers.get('x-cron-secret')?.trim()
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret) {
      if (bearerToken !== cronSecret && headerSecret !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز. کلید امنیتی صحیح نیست.' },
          { status: 401 }
        )
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز. کلید امنیتی تعریف نشده است.' },
        { status: 401 }
      )
    }

    const minutesParam = req.nextUrl.searchParams.get('minutes')
    const olderThanMinutes = minutesParam ? Math.max(5, parseInt(minutesParam, 10) || 30) : 30

    const result = await OrderExpirationService.expirePendingOrders(olderThanMinutes)

    return NextResponse.json({
      success: true,
      message: `انقضای سفارش‌ها با موفقیت بررسی شد.`,
      result,
    })
  } catch (error: unknown) {
    console.error('Error in cron orders expiration:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سیستمی در اجرای انقضای سفارش‌ها.' },
      { status: 500 }
    )
  }
}
