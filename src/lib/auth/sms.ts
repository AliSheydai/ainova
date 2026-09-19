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

  // If in dev bypass mode or no API key
  if (isDevBypass || !apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CRITICAL SECURITY] OTP SMS bypass or missing API key in production environment is forbidden!')
      return {
        success: false,
        message: 'سامانه پیامک در حال حاضر در دسترس نیست. لطفاً با پشتیبانی تماس بگیرید.',
      }
    }

    console.log(`\n==========================================`)
    console.log(`[DEV OTP BYPASS]`)
    console.log(`Phone: ${phone}`)
    console.log(`Code:  ${token}`)
    console.log(`==========================================\n`)
    return {
      success: true,
      message: 'کد با موفقیت ارسال شد (حالت توسعه)',
      devCode: process.env.NODE_ENV === 'development' ? token : undefined,
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

interface SendSmsResult {
  success: boolean
  message: string
}

/**
 * Send order confirmation SMS after successful payment
 * @param phone Iranian mobile number (e.g. 09xxxxxxxxx)
 * @param orderId Short or full order ID
 * @param orderUrl Direct link to view the order
 */
export async function sendOrderConfirmationSms(
  phone: string,
  orderId: string,
  orderUrl: string
): Promise<SendSmsResult> {
  const apiKey = process.env.KAVEH_NEGAR_API_KEY || process.env.KAVENEGAR_API_KEY
  const sender = process.env.KAVEH_NEGAR_SENDER || process.env.KAVENEGAR_SENDER
  const orderPattern = process.env.KAVEH_NEGAR_ORDER_PATTERN
  const isDevBypass =
    process.env.KAVEH_NEGAR_DEV_BYPASS === 'true' ||
    process.env.NODE_ENV === 'test'

  const messageText = `سفارش #${orderId} ثبت شد.\nمشاهده: ${orderUrl}`

  if (isDevBypass || !apiKey) {
    console.log(`\n==========================================`)
    console.log(`[DEV SMS ORDER CONFIRMATION]`)
    console.log(`Phone:   ${phone}`)
    console.log(`Message: ${messageText}`)
    console.log(`==========================================\n`)
    return {
      success: true,
      message: 'پیامک تأیید سفارش ارسال شد (حالت توسعه)',
    }
  }

  try {
    let url: string
    let params: Record<string, string>

    if (orderPattern) {
      url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`
      params = {
        receptor: phone,
        token: orderId,
        token2: orderUrl,
        template: orderPattern,
      }
    } else {
      url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`
      params = {
        receptor: phone,
        message: messageText,
      }
      if (sender) {
        params.sender = sender
      }
    }

    const response = await axios.get(url, {
      params,
      timeout: 10000,
    })

    if (response.data && response.data.return && response.data.return.status === 200) {
      return {
        success: true,
        message: 'پیامک تأیید سفارش با موفقیت ارسال شد.',
      }
    }

    console.error('Kavenegar SMS send error:', response.data)
    return {
      success: false,
      message: response.data?.return?.message || 'خطا در ارسال پیامک تأیید سفارش.',
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string }
    console.error('Kavenegar order SMS failed:', error.response?.data || error.message)
    return {
      success: false,
      message: 'خطا در برقراری ارتباط با سامانه پیامک جهت تأیید سفارش.',
    }
  }
}
