import { Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { MESSAGES } from '../messages'
import { mainMenuKeyboard } from '../keyboards'

export async function handleStart(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'کاربر گرامی'
  const telegramUsername = from.username || null

  try {
    // Upsert Telegram user
    await prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        telegramUsername,
        name,
      },
      update: {
        telegramUsername,
        name,
      },
    })
  } catch (error) {
    console.error('Error upserting Telegram user:', error)
  }

  await ctx.reply(MESSAGES.welcome(name), {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(),
  })
}
