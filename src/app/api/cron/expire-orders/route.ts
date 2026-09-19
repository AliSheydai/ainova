import { type NextRequest, NextResponse } from 'next/server'
import { OrderExpirationService } from '@/lib/orders/order-expiration'

export const dynamic = 'force-dynamic'

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_KEY

  // If secret is configured, require matching bearer token or x-cron-secret header (query parameters strictly prohibited)
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null
    const headerSecret = req.headers.get('x-cron-secret')?.trim()

    return (
      bearerToken === cronSecret ||
      headerSecret === cronSecret
    )
  }

  // If no secret configured and in production, reject for security
  if (process.env.NODE_ENV === 'production') {
    console.error('[Cron:ExpireOrders] CRON_SECRET is not configured in production!')
    return false
  }

  // Allow in development for easy local testing
  return true
}

async function handleExpireOrders(req: NextRequest) {
  const startTime = Date.now()

  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized. Valid CRON_SECRET is required.',
      },
      { status: 401 }
    )
  }

  try {
    const queryMinutes = req.nextUrl.searchParams.get('olderThanMinutes')
    const parsedMinutes = queryMinutes ? parseInt(queryMinutes, 10) : undefined
    const timeoutMinutes =
      parsedMinutes && !isNaN(parsedMinutes) && parsedMinutes > 0
        ? parsedMinutes
        : OrderExpirationService.DEFAULT_TIMEOUT_MINUTES

    const result = await OrderExpirationService.expirePendingOrders(timeoutMinutes)
    const durationMs = Date.now() - startTime

    if (result.expiredOrdersCount > 0) {
      console.log(
        `[Cron:ExpireOrders] Expired ${result.expiredOrdersCount} pending orders and released ${result.releasedInventoryCount} inventory items in ${durationMs}ms.`
      )
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      timeoutMinutes,
      result,
    })
  } catch (error: unknown) {
    console.error('[Cron:ExpireOrders] Error during order expiration:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during order expiration cleanup.',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return handleExpireOrders(req)
}

export async function POST(req: NextRequest) {
  return handleExpireOrders(req)
}
