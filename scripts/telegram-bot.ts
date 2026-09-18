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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`🚀 ربات تلگرام با موفقیت متصل شد! (@${bot.botInfo.username})`)
      console.log(`📡 در حال دریافت و پاسخگویی به پیام‌های تلگرام (Long Polling)...`)
      console.log(`💡 برای تست، در تلگرام به @${bot.botInfo.username} پیام دهید یا /start بزنید.`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      await bot.start({
        drop_pending_updates: false,
        onStart(botInfo) {
          console.log(`✅ ربات @${botInfo.username} با موفقیت آماده به کار شد.`)
        },
      })
    } catch (error: any) {
      if (error?.error_code === 409) {
        console.error('\n⚠️ [خطای تداخل ۴۰۹]: یک نسخه دیگر از این ربات در ترمینال یا فرآیند دیگری در حال اجراست.')
        console.error('تلگرام اجازه نمی‌دهد دو فرآیند همزمان با یک توکن پیام دریافت کنند.')
        console.error('لطفاً سایر ترمینال‌ها را ببندید تا این ربات بتواند متصل شود.\n')
      } else {
        console.error('❌ قطع اتصال موقت ربات (تلاش برای اتصال مجدد در ۵ ثانیه):', error)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

run()
