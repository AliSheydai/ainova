import { NextRequest, NextResponse } from 'next/server'
import { requestOtp } from '@/lib/auth/otp'

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

    const result = await requestOtp(phone)

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
