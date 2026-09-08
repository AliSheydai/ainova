import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { createAccountLinkingToken } from '@/lib/telegram/account-linking'

export async function POST() {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      )
    }

    const token = await createAccountLinkingToken(session.userId)
    const botUsername =
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
      process.env.TELEGRAM_BOT_USERNAME ||
      'arioaccountbot'

    const deepLinkUrl = `https://t.me/${botUsername}?start=link_${token}`

    return NextResponse.json({
      success: true,
      token,
      deepLinkUrl,
      botUsername,
    })
  } catch (error) {
    console.error('Error generating telegram link token:', error)
    return NextResponse.json(
      { success: false, message: 'خطای سرور در تولید لینک اتصال.' },
      { status: 500 }
    )
  }
}
