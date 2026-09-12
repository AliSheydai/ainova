import { type NextRequest, NextResponse } from 'next/server'
import { OtpCleanupService } from '@/lib/auth/otp-cleanup'

export async function GET(req: NextRequest) {
  return handleCleanup(req)
}

export async function POST(req: NextRequest) {
  return handleCleanup(req)
}

async function handleCleanup(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Optional security verification if CRON_SECRET is defined in environment
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlKey = req.nextUrl.searchParams.get('key')
      if (urlKey !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'دسترسی غیرمجاز. کلید امنیتی صحیح نیست.' },
          { status: 401 }
        )
      }
    }

    const daysParam = req.nextUrl.searchParams.get('days')
    const usedHoursParam = req.nextUrl.searchParams.get('usedHours')

    const olderThanDays = daysParam
      ? Math.max(1, parseInt(daysParam, 10) || 7)
      : 7
    const usedOlderThanHours =
      usedHoursParam !== null && usedHoursParam !== undefined
        ? Math.max(0, parseInt(usedHoursParam, 10) || 24)
        : 24

    const result = await OtpCleanupService.cleanupTokens({
      olderThanDays,
      usedOlderThanHours,
    })

    return NextResponse.json({
      success: true,
      message: `پاک‌سازی توکن‌های OTP با موفقیت انجام شد (${result.deletedCount.toLocaleString('fa-IR')} رکورد حذف شد).`,
      result,
    })
  } catch (error: unknown) {
    console.error('Error in cron OTP cleanup:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سیستمی در پاک‌سازی توکن‌های OTP.' },
      { status: 500 }
    )
  }
}
