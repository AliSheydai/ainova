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
    const cronSecret = process.env.CRON_SECRET

    // Optional security verification if CRON_SECRET is defined
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlKey = req.nextUrl.searchParams.get('key')
      if (urlKey !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز. کلید امنیتی صحیح نیست.' },
          { status: 401 }
        )
      }
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
