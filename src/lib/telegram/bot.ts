import { Bot } from 'grammy'
import { registerHandlers } from './handlers'

let botInstance: Bot | null = null

export function createTelegramBot(token?: string): Bot {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured in environment variables.')
  }

  const bot = new Bot(botToken)

  // Default parse_mode to 'HTML' and sanitize inline keyboard URLs (localhost -> 127.0.0.1)
  bot.api.config.use((prev, method, payload, signal) => {
    if (payload && typeof payload === 'object') {
      if (!('parse_mode' in payload) && ['sendMessage', 'editMessageText'].includes(method)) {
        ;(payload as any).parse_mode = 'HTML'
      }

      // Telegram Bot API strictly rejects "localhost" in InlineKeyboardButton URLs with
      // "400 Bad Request: inline keyboard button URL ... is invalid: Wrong HTTP URL".
      // We recursively sanitize any inline_keyboard URLs in reply_markup to ensure Telegram accepts them.
      const replyMarkup = (payload as any).reply_markup
      if (replyMarkup && typeof replyMarkup === 'object' && Array.isArray(replyMarkup.inline_keyboard)) {
        for (const row of replyMarkup.inline_keyboard) {
          if (Array.isArray(row)) {
            for (const btn of row) {
              if (btn && typeof btn === 'object' && typeof btn.url === 'string') {
                if (btn.url.includes('localhost')) {
                  btn.url = btn.url.replaceAll('localhost', '127.0.0.1')
                }
              }
            }
          }
        }
      }
    }
    return prev(method, payload, signal)
  })

  // Middleware to log incoming Telegram updates
  bot.use(async (ctx, next) => {
    const from = ctx.from
    const sender = `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || from?.username || String(from?.id)
    const text = ctx.msg?.text || ctx.callbackQuery?.data || (ctx.msg?.contact ? '[ارسال شماره تماس]' : '')
    if (text) {
      console.log(`📩 [تلگرام] پیام دریافت شد از ${sender} (@${from?.username || from?.id}): "${text}"`)
    }
    await next()
  })

  bot.catch((err) => {
    console.error(`❌ [خطا در پردازش پیام تلگرام (update ${err.ctx?.update?.update_id})]:`, err.error)
  })

  registerHandlers(bot)
  return bot
}

export function getBot(): Bot {
  if (!botInstance) {
    botInstance = createTelegramBot()
  }
  return botInstance
}

export async function sendTelegramNotification(
  chatId: string,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN is not configured; skipping notification.')
      return false
    }

    // Sanitize any inline_keyboard URLs if passed as an object
    if (replyMarkup && typeof replyMarkup === 'object' && Array.isArray(replyMarkup.inline_keyboard)) {
      for (const row of replyMarkup.inline_keyboard) {
        if (Array.isArray(row)) {
          for (const btn of row) {
            if (btn && typeof btn === 'object' && typeof btn.url === 'string' && btn.url.includes('localhost')) {
              btn.url = btn.url.replaceAll('localhost', '127.0.0.1')
            }
          }
        }
      }
    }

    const bot = getBot()
    await bot.api.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    })
    return true
  } catch (error) {
    console.error(`Failed to send Telegram notification to chatId ${chatId}:`, error)
    return false
  }
}
