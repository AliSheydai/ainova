import { Context } from 'grammy'
import { prisma } from '@/lib/prisma'
import { MESSAGES } from '../messages'
import { mainMenuKeyboard } from '../keyboards'
import { handleOrders } from './orders'
import {
  verifyAndConsumeAccountLinkingToken,
  linkTelegramAccountToUser,
} from '../account-linking'

export async function handleStart(ctx: Context) {
  const from = ctx.from
  if (!from) return

  const telegramId = String(from.id)
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'کاربر گرامی'
  const telegramUsername = from.username || null

  // Extract start payload (Grammy ctx.match or /start <payload>)
  const text = ctx.msg?.text || ''
  const payload = (typeof ctx.match === 'string' && ctx.match.trim()) || text.split(/\s+/)[1] || ''

  // Case 1: Account Linking Deeplink (e.g. /start link_<token>)
  if (payload.startsWith('link_')) {
    const token = payload.slice(5).trim()
    const userId = await verifyAndConsumeAccountLinkingToken(token)

    if (userId) {
      const linkResult = await linkTelegramAccountToUser(userId, telegramId, telegramUsername)
      if (linkResult.success && linkResult.user) {
        const phone = linkResult.user.phone || ''
        const displayName = linkResult.user.name || name

        await ctx.reply(MESSAGES.linkSuccess(displayName, phone), {
          parse_mode: 'Markdown',
          reply_markup: mainMenuKeyboard(true),
        })
        return
      }
    }

    // Token invalid or expired
    await ctx.reply(MESSAGES.linkExpired, {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard(false),
    })
    return
  }

  // Case 2: Direct navigation to orders (e.g. /start orders)
  if (payload === 'orders') {
    await handleOrders(ctx, 1)
    return
  }

  // Case 3: Standard Start or generic deeplink (e.g. /start web_header)
  let isLinked = false
  try {
    const existing = await prisma.user.findUnique({
      where: { telegramId },
    })

    if (existing) {
      isLinked = Boolean(existing.phone)
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          telegramUsername,
          name: existing.name || name,
        },
      })
    } else {
      await prisma.user.create({
        data: {
          telegramId,
          telegramUsername,
          name,
        },
      })
    }
  } catch (error) {
    console.error('Error in handleStart user upsert:', error)
  }

  await ctx.reply(MESSAGES.welcome(name), {
    parse_mode: 'Markdown',
    reply_markup: mainMenuKeyboard(isLinked),
  })
}
