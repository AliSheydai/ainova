import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json({ success: false, message: 'عدم احراز هویت' }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: typeof name === 'string' ? name.trim() : null,
      },
      select: {
        id: true,
        phone: true,
        name: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: unknown) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { success: false, message: 'خطای سرور در ذخیره اطلاعات.' },
      { status: 500 }
    )
  }
}
