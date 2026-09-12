import { NextRequest, NextResponse } from 'next/server'
import { requestOtp } from '@/lib/auth/otp'
import { getClientIp } from '@/lib/security/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل الزامی است.' },
        { status: 400 }
      )
    }

    const ip = getClientIp(req.headers)
    const result = await requestOtp(phone, ip)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })
  } catch (error: unknown) {
    console.error('Error in send-otp:', error)
    return NextResponse.json(
      { success: false, message: 'خطای سرور در ارسال کد تأیید.' },
      { status: 500 }
    )
  }
}
