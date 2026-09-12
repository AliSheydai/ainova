import { type NextRequest, NextResponse } from 'next/server'
import { verifyOtpCode } from '@/lib/auth/otp'
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt'
import { getClientIp } from '@/lib/security/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: 'شماره موبایل و کد تأیید الزامی هستند.' },
        { status: 400 }
      )
    }

    const ip = getClientIp(req.headers)
    const result = await verifyOtpCode(phone, code, ip)

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    })

    // Set HTTP-only JWT Cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error: unknown) {
    console.error('Error in verify-otp:', error)
    return NextResponse.json(
      { success: false, message: 'خطای سرور در تأیید کد.' },
      { status: 500 }
    )
  }
}
