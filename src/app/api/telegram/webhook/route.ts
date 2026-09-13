import { type NextRequest, NextResponse } from 'next/server'
import { createTelegramBot } from '@/lib/telegram/bot'

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not configured' }, { status: 500 })
  }

  // Enforce mandatory secret token validation
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) {
    console.error('SECURITY: TELEGRAM_WEBHOOK_SECRET is not configured!')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const headerSecret = req.headers.get('x-telegram-bot-api-secret-token')
  if (headerSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const update = await req.json()
    const bot = createTelegramBot(token)
    await bot.init()
    await bot.handleUpdate(update)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error handling Telegram webhook update:', error)
    return NextResponse.json({ ok: false, error: 'Internal Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Google AI Pro Telegram Webhook Handler',
  })
}
