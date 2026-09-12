import { type Context } from 'grammy'
import { normalizePhone, isValidIranianPhone, requestOtp, verifyOtpCode } from '@/lib/auth/otp'
import { prisma } from '@/lib/prisma'
import { MESSAGES } from '../messages'
import {
  phoneRequestKeyboard,
  otpInlineKeyboard,
  mainMenuKeyboard,
} from '../keyboards'
import {
  getBotLoginSession,
  setBotLoginSession,
  clearBotLoginSession,
  linkUserByVerifiedPhone,
} from '../account-linking'

/**
 * Initiates the phone number login flow.
 */
export async function startLoginFlow(ctx: Context, customPrompt?: string) {
  const telegramId = ctx.from ? String(ctx.from.id) : null
  if (!telegramId) return

  await setBotLoginSession(telegramId, { step: 'AWAITING_PHONE' })

  const text = customPrompt || MESSAGES.loginPrompt
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: phoneRequestKeyboard(),
  })
}

/**
 * Processes incoming phone number (from text or contact).
 */
export async function processPhoneInput(ctx: Context, rawPhone: string) {
  const from = ctx.from
  if (!from) return
  const telegramId = String(from.id)

  const phone = normalizePhone(rawPhone)
  if (!isValidIranianPhone(phone)) {
    await ctx.reply(MESSAGES.phoneInvalid, {
      parse_mode: 'Markdown',
      reply_markup: phoneRequestKeyboard(),
    })
    return
  }

  // Request OTP via SMS
  const otpRes = await requestOtp(phone)

  if (!otpRes.success) {
    await ctx.reply(`⚠️ ${otpRes.message}`, {
      reply_markup: phoneRequestKeyboard(),
    })
    return
  }

  // Update session to awaiting OTP
  await setBotLoginSession(telegramId, {
    step: 'AWAITING_OTP',
    phone,
    lastSentAt: Date.now(),
  })

  const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES || '5', 10)
  await ctx.reply(MESSAGES.otpSent(phone, expireMinutes, otpRes.devCode), {
    parse_mode: 'Markdown',
    reply_markup: otpInlineKeyboard(),
  })
}

/**
 * Processes incoming OTP code verification.
 */
export async function processOtpInput(ctx: Context, rawCode: string) {
  const from = ctx.from
  if (!from) return
  const telegramId = String(from.id)
  const telegramUsername = from.username || null

  const session = await getBotLoginSession(telegramId)
  if (!session || session.step !== 'AWAITING_OTP' || !session.phone) {
    return false
  }

  const code = normalizePhone(rawCode).trim()
  if (!/^\d{4,6}$/.test(code)) {
    await ctx.reply(MESSAGES.otpInvalid, {
      parse_mode: 'Markdown',
      reply_markup: otpInlineKeyboard(),
    })
    return true
  }

  const verifyRes = await verifyOtpCode(session.phone, code)

  if (!verifyRes.success) {
    await ctx.reply(`❌ ${verifyRes.message}`, {
      parse_mode: 'Markdown',
      reply_markup: otpInlineKeyboard(),
    })
    return true
  }

  // Link telegram account to the verified user
  const linkResult = await linkUserByVerifiedPhone(
    session.phone,
    telegramId,
    telegramUsername
  )

  await clearBotLoginSession(telegramId)

  if (linkResult.success) {
    await ctx.reply(MESSAGES.loginSuccess(session.phone), {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard(true),
    })
  } else {
    await ctx.reply(`❌ ${linkResult.message}`, {
      reply_markup: mainMenuKeyboard(false),
    })
  }

  return true
}

/**
 * Handles callback query to resend OTP.
 */
export async function handleAuthResend(ctx: Context) {
  const from = ctx.from
  if (!from) return
  const telegramId = String(from.id)

  const session = await getBotLoginSession(telegramId)
  if (!session || !session.phone) {
    await ctx.answerCallbackQuery({
      text: 'جلسه ورود منقضی شده است. لطفاً مجدداً شماره را وارد کنید.',
      show_alert: true,
    }).catch(() => {})
    await startLoginFlow(ctx)
    return
  }

  const otpRes = await requestOtp(session.phone)

  if (!otpRes.success) {
    await ctx.answerCallbackQuery({
      text: otpRes.message,
      show_alert: true,
    }).catch(() => {})
    return
  }

  await ctx.answerCallbackQuery({
    text: 'کد تأیید مجدداً ارسال گردید.',
  }).catch(() => {})

  await setBotLoginSession(telegramId, {
    step: 'AWAITING_OTP',
    phone: session.phone,
    lastSentAt: Date.now(),
  })

  const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES || '5', 10)
  await ctx.reply(MESSAGES.otpSent(session.phone, expireMinutes, otpRes.devCode), {
    parse_mode: 'Markdown',
    reply_markup: otpInlineKeyboard(),
  })
}

/**
 * Handles callback query to change mobile number.
 */
export async function handleAuthChangePhone(ctx: Context) {
  const from = ctx.from
  if (!from) return
  const telegramId = String(from.id)

  await ctx.answerCallbackQuery().catch(() => {})
  await clearBotLoginSession(telegramId)
  await startLoginFlow(ctx, '📱 لطفاً شماره موبایل جدید خود را وارد نمایید:')
}
