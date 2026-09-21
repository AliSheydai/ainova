import axios, { AxiosError } from 'axios'
import {
  type PaymentProvider,
  type CreatePaymentOptions,
  type CreatePaymentResult,
  type VerifyPaymentOptions,
  type VerifyPaymentResult,
} from '../types'

/**
 * Zibal result code descriptions per official documentation (api-1.json).
 */
const ZIBAL_RESULT_MESSAGES: Record<number, string> = {
  100: 'عملیات با موفقیت انجام شد.',
  102: 'مرچنت یافت نشد.',
  103: 'مرچنت غیرفعال است یا قرارداد منعقد نشده است.',
  104: 'مرچنت نامعتبر است.',
  105: 'مبلغ باید بیشتر از ۱,۰۰۰ ریال باشد.',
  106: 'آدرس کال‌بک (callbackUrl) نامعتبر است.',
  113: 'مبلغ تراکنش بیش از سقف مجاز است.',
  114: 'کد ملی ارسال شده نامعتبر است.',
  115: 'آدرس IP شما در پنل کاربری ثبت نشده است.',
  201: 'تراکنش قبلاً تأیید شده است.',
  202: 'سفارش پرداخت نشده یا ناموفق بوده است.',
  203: 'شناسه پیگیری (trackId) نامعتبر است.',
}

export function getZibalErrorMessage(code: number, fallback = 'خطای ناشناخته در ارتباط با درگاه زیبال'): string {
  return ZIBAL_RESULT_MESSAGES[code] || fallback
}

export interface ZibalRequestResponse {
  trackId: number
  result: number
  message: string
}

export interface ZibalVerifyResponse {
  paidAt?: string
  cardNumber?: string
  status?: number
  amount?: number // in Rial
  refNumber?: number
  description?: string
  orderId?: string
  result: number
  message: string
}

/**
 * ZibalPaymentProvider
 * Implements Zibal IPG (Internet Payment Gateway) according to official technical documentation (api-1.json).
 * Supports both test/sandbox mode with merchant='zibal' and live production mode.
 */
export class ZibalPaymentProvider implements PaymentProvider {
  public readonly name = 'zibal'
  private baseUrl = process.env.ZIBAL_BASE_URL || 'https://gateway.zibal.ir'
  private merchant = process.env.ZIBAL_MERCHANT || 'zibal'
  private isSandbox =
    process.env.ZIBAL_SANDBOX === 'true' ||
    !process.env.ZIBAL_MERCHANT ||
    process.env.ZIBAL_MERCHANT.toLowerCase() === 'zibal'

  /**
   * Requests a payment session with Zibal.
   * Endpoint: POST https://gateway.zibal.ir/v1/request
   * On success: returns paymentUrl https://gateway.zibal.ir/start/{trackId}
   */
  async createPayment({
    orderId,
    amount, // in Toman
    description,
    callbackUrl,
    mobile,
  }: CreatePaymentOptions): Promise<CreatePaymentResult> {
    // Amount in Rial (IRR) required by Zibal
    const amountInRials = Math.round(amount * 10)

    try {
      const payload: Record<string, unknown> = {
        merchant: this.merchant,
        amount: amountInRials,
        callbackUrl,
        description: description || `خرید سفارش ${orderId}`,
        orderId,
      }

      if (mobile) {
        payload.mobile = mobile
      }

      const response = await axios.post<ZibalRequestResponse>(
        `${this.baseUrl}/v1/request`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      )

      const data = response.data

      if (data.result === 100 && data.trackId) {
        const trackIdStr = String(data.trackId)
        const paymentUrl = `${this.baseUrl}/start/${trackIdStr}`

        return {
          success: true,
          provider: this.name,
          transactionId: trackIdStr,
          paymentUrl,
        }
      }

      const errorMessage = getZibalErrorMessage(
        data.result,
        data.message || 'خطا در ثبت درخواست پرداخت در درگاه زیبال.'
      )

      return {
        success: false,
        provider: this.name,
        transactionId: '',
        paymentUrl: '',
        error: errorMessage,
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<{ message?: string; result?: number }>
        const serverResult = axiosErr.response?.data?.result
        const message = serverResult
          ? getZibalErrorMessage(serverResult)
          : axiosErr.response?.data?.message || axiosErr.message

        console.error('Zibal createPayment error:', axiosErr.response?.data || axiosErr.message)
        return {
          success: false,
          provider: this.name,
          transactionId: '',
          paymentUrl: '',
          error: `خطا در ارتباط با سرور زیبال: ${message}`,
        }
      }

      const genericMessage = error instanceof Error ? error.message : 'خطای ناشناخته'
      console.error('Zibal createPayment error:', error)
      return {
        success: false,
        provider: this.name,
        transactionId: '',
        paymentUrl: '',
        error: genericMessage,
      }
    }
  }

  /**
   * Verifies payment with Zibal.
   * Endpoint: POST https://gateway.zibal.ir/v1/verify
   * In sandbox mode: works with trackId created with merchant='zibal'.
   */
  async verifyPayment({
    transactionId,
    amount, // in Toman
  }: VerifyPaymentOptions): Promise<VerifyPaymentResult> {
    try {
      const trackId = Number(transactionId)
      if (isNaN(trackId) || trackId <= 0) {
        return {
          success: false,
          provider: this.name,
          message: 'شناسه تراکنش زیبال (trackId) نامعتبر است.',
        }
      }

      const payload = {
        merchant: this.merchant,
        trackId,
      }

      const response = await axios.post<ZibalVerifyResponse>(
        `${this.baseUrl}/v1/verify`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      )

      const data = response.data

      // result 100: Successfully verified
      // result 201: Already verified (idempotency support)
      if (data.result === 100 || data.result === 201) {
        // Convert verified amount from Rial to Toman
        const verifiedAmountInToman =
          typeof data.amount === 'number'
            ? Math.floor(data.amount / 10)
            : amount

        return {
          success: true,
          provider: this.name,
          refId: data.refNumber ? String(data.refNumber) : transactionId,
          amount: verifiedAmountInToman,
          message: data.result === 201 ? 'تراکنش قبلاً تایید شده است.' : 'پرداخت با موفقیت تایید شد.',
          rawResponse: data,
        }
      }

      const errorMessage = getZibalErrorMessage(
        data.result,
        data.message || 'تأیید پرداخت ناموفق بود.'
      )

      return {
        success: false,
        provider: this.name,
        message: errorMessage,
        rawResponse: data,
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<{ message?: string; result?: number }>
        const serverResult = axiosErr.response?.data?.result
        const message = serverResult
          ? getZibalErrorMessage(serverResult)
          : axiosErr.response?.data?.message || axiosErr.message

        console.error('Zibal verifyPayment error:', axiosErr.response?.data || axiosErr.message)
        return {
          success: false,
          provider: this.name,
          message: `خطای تایید زیبال: ${message}`,
          rawResponse: axiosErr.response?.data,
        }
      }

      const genericMessage = error instanceof Error ? error.message : 'خطای ناشناخته'
      console.error('Zibal verifyPayment error:', error)
      return {
        success: false,
        provider: this.name,
        message: genericMessage,
      }
    }
  }
}
