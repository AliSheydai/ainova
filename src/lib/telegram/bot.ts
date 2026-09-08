import { Bot } from 'grammy'
import { registerHandlers } from './handlers'

let botInstance: Bot | null = null

export function createTelegramBot(token?: string): Bot {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured in environment variables.')
  }

  const bot = new Bot(botToken)

  bot.catch((err) => {
    console.error(`Error in Telegram bot update ${err.ctx.update.update_id}:`, err.error)
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

    const bot = getBot()
    await bot.api.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    })
    return true
  } catch (error) {
    console.error(`Failed to send Telegram notification to chatId ${chatId}:`, error)
    return false
  }
}
