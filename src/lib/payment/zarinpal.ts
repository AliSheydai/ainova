import axios from 'axios'

interface RequestPaymentOptions {
  amount: number // in Toman
  description: string
  callbackUrl: string
  mobile?: string
}

interface RequestPaymentResult {
  success: boolean
  authority?: string
  paymentUrl?: string
  error?: string
}

interface VerifyPaymentOptions {
  authority: string
  amount: number // in Toman
}

interface VerifyPaymentResult {
  success: boolean
  refId?: string
  code?: number
  message?: string
}

const isSandbox = process.env.ZARINPAL_SANDBOX === 'true'
const BASE_URL = isSandbox
  ? 'https://sandbox.zarinpal.com/pg/v4/payment'
  : 'https://payment.zarinpal.com/pg/v4/payment'

const GATEWAY_URL = isSandbox
  ? 'https://sandbox.zarinpal.com/pg/StartPay/'
  : 'https://payment.zarinpal.com/pg/StartPay/'

export async function requestZarinpalPayment({
  amount,
  description,
  callbackUrl,
  mobile,
}: RequestPaymentOptions): Promise<RequestPaymentResult> {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID || '00000000-0000-0000-0000-000000000000'

  // If in sandbox with dummy merchant, allow simulation
  if (isSandbox && (!merchantId || merchantId.startsWith('00000000'))) {
    const randomSuffix = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`
    const dummyAuthority = `A00000000000000000000000000000000000`.slice(0, Math.max(0, 36 - randomSuffix.length)) + randomSuffix
    return {
      success: true,
      authority: dummyAuthority,
      paymentUrl: `/api/payment/simulate-gateway?authority=${dummyAuthority}&amount=${amount}`,
    }
  }

  try {
    // Zarinpal v4 expects amount in Toman (currency: "IRT") or Rials (currency: "IRR")
    const response = await axios.post(
      `${BASE_URL}/request.json`,
      {
        merchant_id: merchantId,
        amount: amount, // IRT
        currency: 'IRT',
        description,
        callback_url: callbackUrl,
        metadata: {
          mobile,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    )

    const data = response.data?.data

    if (data && data.code === 100) {
      return {
        success: true,
        authority: data.authority,
        paymentUrl: `${GATEWAY_URL}${data.authority}`,
      }
    }

    return {
      success: false,
      error: response.data?.errors?.message || 'خطا در اتصال به درگاه زرین‌پال.',
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string }
    console.error('Zarinpal request error:', error.response?.data || error.message)
    return {
      success: false,
      error: 'خطای ارتباط با درگاه پرداخت.',
    }
  }
}

export async function verifyZarinpalPayment({
  authority,
  amount,
}: VerifyPaymentOptions): Promise<VerifyPaymentResult> {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID || '00000000-0000-0000-0000-000000000000'

  // Simulated gateway in sandbox mode
  if (isSandbox && (!merchantId || merchantId.startsWith('00000000'))) {
    return {
      success: true,
      refId: `SIM-${Math.floor(100000 + Math.random() * 900000)}`,
      code: 100,
      message: 'پرداخت با موفقیت انجام شد (حالت شبیه‌ساز زرین‌پال)',
    }
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/verify.json`,
      {
        merchant_id: merchantId,
        amount,
        authority,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    )

    const data = response.data?.data

    if (data && (data.code === 100 || data.code === 101)) {
      return {
        success: true,
        refId: data.ref_id?.toString(),
        code: data.code,
        message: 'پرداخت با موفقیت تأیید شد.',
      }
    }

    return {
      success: false,
      code: data?.code,
      message: response.data?.errors?.message || 'تراکنش ناموفق بود یا تأیید نشد.',
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string }
    console.error('Zarinpal verify error:', error.response?.data || error.message)
    return {
      success: false,
      message: 'خطا در تأیید پرداخت از بانک.',
    }
  }
}
