import { type NextRequest, NextResponse } from 'next/server'
import { MultiBotController } from '@/lib/bot/adapters/multi-bot'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params
    const validPlatforms = ['telegram', 'bale', 'rubika', 'soroush']

    if (!validPlatforms.includes(platform.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'پلتفرم پیام‌رسان نامعتبر است.' },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))

    // Handle catalog or action
    const action = body.action || 'catalog'
    if (action === 'catalog') {
      const response = await MultiBotController.handleCatalogRequest()
      return NextResponse.json({ success: true, platform, response })
    }

    if (action === 'select_product' && body.productId) {
      const response = await MultiBotController.handleProductSelect(body.productId)
      return NextResponse.json({ success: true, platform, response })
    }

    return NextResponse.json({
      success: true,
      message: `بات ${platform} با موفقیت به سیستم فروش متصل است.`,
    })
  } catch (error: unknown) {
    console.error('Error in multi-bot route:', error)
    return NextResponse.json(
      { success: false, error: 'خطای سرور در پردازش درخواست بات.' },
      { status: 500 }
    )
  }
}
