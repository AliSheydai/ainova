import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { sendOtpSms } from './sms'
import { signToken } from './jwt'
import { getOrCreateUserWithRole } from './user-role'
import { otpSendRateLimiter, otpVerifyRateLimiter } from '@/lib/security/rate-limit'

export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return ''

  // Convert Persian numbers to English
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

  let clean = rawPhone.trim()

  for (let i = 0; i < 10; i++) {
    clean = clean.split(persianDigits[i]).join(i.toString())
    clean = clean.split(arabicDigits[i]).join(i.toString())
  }

  // Remove all non-digits except +
  clean = clean.replace(/[^\d+]/g, '')

  // Normalize Iranian country codes
  if (clean.startsWith('+98')) {
    clean = '0' + clean.slice(3)
  } else if (clean.startsWith('0098')) {
    clean = '0' + clean.slice(4)
  } else if (clean.startsWith('98') && clean.length === 12) {
    clean = '0' + clean.slice(2)
  } else if (clean.length === 10 && clean.startsWith('9')) {
    clean = '0' + clean
  }

  return clean
}

/**
 * Normalizes OTP code: converts Persian/Arabic numbers to English digits.
 * Preserves leading zeros and does NOT modify length or apply phone normalization rules.
 */
export function normalizeOtpCode(rawCode: string): string {
  if (!rawCode) return ''

  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

  let clean = rawCode.trim()

  for (let i = 0; i < 10; i++) {
    clean = clean.split(persianDigits[i]).join(i.toString())
    clean = clean.split(arabicDigits[i]).join(i.toString())
  }

  // Strip any non-digit character (preserves leading zeros and exact numeric digits)
  return clean.replace(/\D/g, '')
}

export function isValidIranianPhone(phone: string): boolean {
  return /^09\d{9}$/.test(phone)
}

export interface RequestOtpResult {
  success: boolean
  message: string
  cooldownRemaining?: number
  devCode?: string
}

// In-memory tracker for failed verify attempts per OTP token ID (max 5)
const MAX_VERIFY_ATTEMPTS = 5
const verifyAttemptsMap = new Map<string, number>()

export async function requestOtp(rawPhone: string, ip?: string): Promise<RequestOtpResult> {
  // IP-based Rate Limiting
  if (ip) {
    const ipCheck = otpSendRateLimiter.check(ip)
    if (!ipCheck.success) {
      return {
        success: false,
        message: 'تعداد درخواست‌های کد تأیید از این آدرس به سقف مجاز رسیده است. لطفاً دقایقی دیگر تلاش فرمایید.',
      }
    }
  }

  const phone = normalizePhone(rawPhone)

  if (!isValidIranianPhone(phone)) {
    return {
      success: false,
      message: 'شماره موبایل وارد شده معتبر نیست. لطفاً شماره‌ای مانند ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.',
    }
  }

  const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS || '60', 10)
  const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES || '5', 10)
  const otpLength = parseInt(process.env.OTP_LENGTH || '5', 10)

  // Hourly Rate Limit Check: max 10 requests per hour per phone number
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const hourlyCount = await prisma.otpToken.count({
    where: {
      phone,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (hourlyCount >= 10) {
    return {
      success: false,
      message: 'تعداد درخواست‌های کد تایید برای این شماره به سقف مجاز (۱۰ بار در ساعت) رسیده است. لطفاً یک ساعت دیگر مجدداً تلاش فرمایید.',
    }
  }

  // Cooldown check based on the last issued token
  const lastOtp = await prisma.otpToken.findFirst({
    where: {
      phone,
      used: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (lastOtp) {
    const elapsedSeconds = Math.floor((Date.now() - lastOtp.createdAt.getTime()) / 1000)
    if (elapsedSeconds < cooldownSeconds) {
      const remaining = cooldownSeconds - elapsedSeconds
      return {
        success: false,
        message: `لطفاً ${remaining} ثانیه دیگر مجدداً تلاش نمایید.`,
        cooldownRemaining: remaining,
      }
    }
  }

  // Generate cryptographically secure random numeric OTP
  let code = ''
  for (let i = 0; i < otpLength; i++) {
    code += crypto.randomInt(0, 10).toString()
  }

  const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000)

  // Invalidate previous unused tokens for this phone
  await prisma.otpToken.updateMany({
    where: {
      phone,
      used: false,
    },
    data: {
      used: true,
    },
  })

  // Save new OTP token
  await prisma.otpToken.create({
    data: {
      phone,
      code,
      expiresAt,
    },
  })

  // Send via SMS
  const smsResult = await sendOtpSms(phone, code)

  if (!smsResult.success) {
    return {
      success: false,
      message: smsResult.message,
    }
  }

  return {
    success: true,
    message: smsResult.message,
    cooldownRemaining: cooldownSeconds,
    devCode: smsResult.devCode,
  }
}

export interface VerifyOtpResult {
  success: boolean
  message: string
  token?: string
  user?: {
    id: string
    phone: string
    name: string | null
    role: string
  }
}

export async function verifyOtpCode(
  rawPhone: string,
  rawCode: string,
  ip?: string
): Promise<VerifyOtpResult> {
  // IP-based Rate Limiting
  if (ip) {
    const ipCheck = otpVerifyRateLimiter.check(ip)
    if (!ipCheck.success) {
      return {
        success: false,
        message: 'تعداد تلاش‌های مکرر از این آدرس به سقف مجاز رسیده است. لطفاً کمی بعد تلاش کنید.',
      }
    }
  }

  const phone = normalizePhone(rawPhone)
  const code = normalizeOtpCode(rawCode)

  if (!isValidIranianPhone(phone)) {
    return {
      success: false,
      message: 'شماره موبایل نامعتبر است.',
    }
  }

  if (!code || code.length < 4) {
    return {
      success: false,
      message: 'کد تأیید وارد شده نامعتبر است.',
    }
  }

  // Find active token
  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      phone,
      used: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!otpRecord) {
    return {
      success: false,
      message: 'کد تأیید نادرست است یا منقضی شده است.',
    }
  }

  if (new Date() > otpRecord.expiresAt) {
    return {
      success: false,
      message: 'کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید.',
    }
  }

  // Check code match with max attempts rate limiting
  const attempts = (verifyAttemptsMap.get(otpRecord.id) || 0) + 1

  if (otpRecord.code !== code) {
    verifyAttemptsMap.set(otpRecord.id, attempts)

    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      // Invalidate token after 5 failed attempts to prevent brute force
      await prisma.otpToken.update({
        where: { id: otpRecord.id },
        data: { used: true },
      })
      verifyAttemptsMap.delete(otpRecord.id)
      return {
        success: false,
        message: 'تعداد تلاش‌های ناموفق شما به سقف مجاز (۵ بار) رسید. کد تأیید ابطال شد؛ لطفاً مجدداً کد دریافت فرمایید.',
      }
    }

    const remaining = MAX_VERIFY_ATTEMPTS - attempts
    return {
      success: false,
      message: `کد تأیید نادرست است. (${remaining} تلاش مجاز دیگر باقی مانده است)`,
    }
  }

  // Success: clean attempts map and mark token as used
  verifyAttemptsMap.delete(otpRecord.id)

  await prisma.otpToken.update({
    where: { id: otpRecord.id },
    data: { used: true },
  })

  // Get or create user with race-safe first user = ADMIN logic
  const user = await getOrCreateUserWithRole({ phone })

  // Create JWT session
  const jwt = await signToken({
    userId: user.id,
    phone: user.phone || phone,
    name: user.name,
    role: user.role,
  })

  return {
    success: true,
    message: 'ورود با موفقیت انجام شد.',
    token: jwt,
    user: {
      id: user.id,
      phone: user.phone || phone,
      name: user.name,
      role: user.role,
    },
  }
}
