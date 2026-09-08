import axios from 'axios'

interface SendOtpResult {
  success: boolean
  message: string
  devCode?: string
}

/**
 * Send OTP SMS using Kavenegar Verify Lookup API
 * @param phone Normalized 11-digit Iranian mobile number (09xxxxxxxxx)
 * @param token The OTP code (e.g. 5 digits)
 */
export async function sendOtpSms(phone: string, token: string): Promise<SendOtpResult> {
  const apiKey = process.env.KAVEH_NEGAR_API_KEY || process.env.KAVENEGAR_API_KEY
  const patternName = process.env.KAVEH_NEGAR_PATTERN_NAME || 'hiknow'
  const isDevBypass = process.env.KAVEH_NEGAR_DEV_BYPASS === 'true'

  // If in dev bypass mode or no API key, log to console for instant local development
  if (isDevBypass || !apiKey) {
    console.log(`\n==========================================`)
    console.log(`[DEV OTP BYPASS]`)
    console.log(`Phone: ${phone}`)
    console.log(`Code:  ${token}`)
    console.log(`==========================================\n`)
    return {
      success: true,
      message: 'کد با موفقیت ارسال شد (حالت توسعه)',
      devCode: token,
    }
  }

  try {
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`
    const params = {
      receptor: phone,
      token: token,
      template: patternName,
    }

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    })

    if (response.data && response.data.return && response.data.return.status === 200) {
      return {
        success: true,
        message: 'کد تأیید برای شما پیامک شد.',
      }
    }

    console.error('Kavenegar API response error:', response.data)
    return {
      success: false,
      message: response.data?.return?.message || 'خطا در ارسال پیامک. لطفاً بعداً تلاش کنید.',
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string }
    console.error('Kavenegar request failed:', error.response?.data || error.message)
    return {
      success: false,
      message: 'عدم برقراری ارتباط با سامانه پیامک. لطفاً دقایقی دیگر تلاش کنید.',
    }
  }
}
