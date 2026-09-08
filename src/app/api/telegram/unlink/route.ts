import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'لطفاً ابتدا وارد حساب شوید.' },
        { status: 401 }
      )
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        telegramId: null,
        telegramUsername: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'اتصال حساب تلگرام با موفقیت قطع شد.',
    })
  } catch (error) {
    console.error('Error unlinking telegram account:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در قطع اتصال تلگرام.' },
      { status: 500 }
    )
  }
}
