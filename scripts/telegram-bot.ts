import 'dotenv/config'
import { createTelegramBot } from '../src/lib/telegram/bot'

async function run() {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token || token.trim() === '') {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️ TELEGRAM_BOT_TOKEN در فایل .env تنظیم نشده است.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    process.exit(0)
  }

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason)
  })

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
  })

  // Auto-reconnecting resilience loop
  while (true) {
    try {
      const bot = createTelegramBot(token)
      await bot.init()
      console.log(`🚀 ربات تلگرام با موفقیت متصل شد! (@${bot.botInfo.username})`)
      console.log('در حال دریافت و پاسخگویی به پیام‌های تلگرام (Long Polling)...')

      await bot.start({
        drop_pending_updates: false,
        onStart(botInfo) {
          console.log(`Bot @${botInfo.username} polling started successfully.`)
        },
      })
    } catch (error) {
      console.error('❌ قطع اتصال موقت ربات (تلاش برای اتصال مجدد در ۵ ثانیه):', error)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

run()
