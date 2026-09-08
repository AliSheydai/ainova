import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'

export async function GET() {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    })

    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({
      success: true,
      settings: settingsMap,
      raw: settings,
    })
  } catch (error: unknown) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری تنظیمات سیستم.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'فرمت داده‌های ارسالی نامعتبر است.' },
        { status: 400 }
      )
    }

    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
        },
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شدند.',
    })
  } catch (error: unknown) {
    console.error('Error updating admin settings:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره‌سازی تنظیمات.' },
      { status: 500 }
    )
  }
}
