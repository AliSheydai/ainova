import { type NextRequest, NextResponse } from 'next/server'
import { getBot } from '@/lib/telegram/bot'

export async function GET(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'TELEGRAM_BOT_TOKEN is not configured in environment variables.' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'info'

    const bot = getBot()

    if (action === 'info') {
      const info = await bot.api.getWebhookInfo()
      const me = await bot.api.getMe()
      return NextResponse.json({
        success: true,
        bot: me,
        webhookInfo: info,
      })
    }

    if (action === 'set') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const webhookUrl = `${appUrl}/api/telegram/webhook`
      const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET

      await bot.api.setWebhook(webhookUrl, {
        secret_token: secretToken || undefined,
        drop_pending_updates: true,
      })

      const info = await bot.api.getWebhookInfo()
      return NextResponse.json({
        success: true,
        message: `Webhook successfully set to ${webhookUrl}`,
        webhookInfo: info,
      })
    }

    if (action === 'delete') {
      await bot.api.deleteWebhook({ drop_pending_updates: true })
      return NextResponse.json({
        success: true,
        message: 'Webhook deleted successfully.',
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use info, set, or delete.' })
  } catch (error: unknown) {
    console.error('Error in telegram setup route:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Setup error' },
      { status: 500 }
    )
  }
}
