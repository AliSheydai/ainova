import 'dotenv/config'
import { createTelegramBot } from '../src/lib/telegram/bot'

async function run() {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token || token.trim() === '') {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️ TELEGRAM_BOT_TOKEN در فایل .env تنظیم نشده است.')
    console.log('جهت راه‌اندازی ربات تلگرام:')
    console.log('1. با @BotFather در تلگرام صحبت کنید و یک توکن بسازید.')
    console.log('2. مقدار TELEGRAM_BOT_TOKEN=... را در فایل .env قرار دهید.')
    console.log('3. دستور pnpm bot:dev را مجدداً اجرا فرمایید.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    process.exit(0)
  }

  try {
    const bot = createTelegramBot(token)
    await bot.init()
    console.log(`🚀 ربات تلگرام با موفقیت متصل شد! (@${bot.botInfo.username})`)
    console.log('در حال دریافت و پاسخگویی به پیام‌های تلگرام (Long Polling)...')
    await bot.start()
  } catch (error) {
    console.error('❌ خطا در اجرای ربات تلگرام:', error)
    process.exit(1)
  }
}

run()
