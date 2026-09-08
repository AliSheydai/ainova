import { NextRequest, NextResponse } from 'next/server'
import { createTelegramBot } from '@/lib/telegram/bot'

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not configured' }, { status: 500 })
  }

  // Verify secret token if configured
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const headerSecret = req.headers.get('x-telegram-bot-api-secret-token')
    if (headerSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized secret token' }, { status: 403 })
    }
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
