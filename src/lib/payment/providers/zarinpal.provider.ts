import axios from 'axios'
import {
  type PaymentProvider,
  type CreatePaymentOptions,
  type CreatePaymentResult,
  type VerifyPaymentOptions,
  type VerifyPaymentResult,
} from '../types'

export class ZarinpalPaymentProvider implements PaymentProvider {
  public readonly name = 'zarinpal'

  private isSandbox = process.env.ZARINPAL_SANDBOX === 'true'
  private merchantId =
    process.env.ZARINPAL_MERCHANT_ID || '00000000-0000-0000-0000-000000000000'

  private get baseUrl(): string {
    return this.isSandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://payment.zarinpal.com/pg/v4/payment'
  }

  private get gatewayUrl(): string {
    return this.isSandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay/'
      : 'https://payment.zarinpal.com/pg/StartPay/'
  }

  async createPayment({
    amount,
    description,
    callbackUrl,
    mobile,
  }: CreatePaymentOptions): Promise<CreatePaymentResult> {
    // If sandbox with dummy zero merchant ID, fallback to mock bank simulator
    if (this.isSandbox && (!this.merchantId || this.merchantId.startsWith('00000000'))) {
      const randomSuffix = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`
      const dummyAuthority =
        `A00000000000000000000000000000000000`.slice(
          0,
          Math.max(0, 36 - randomSuffix.length)
        ) + randomSuffix
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return {
        success: true,
        provider: this.name,
        transactionId: dummyAuthority,
        paymentUrl: `${appUrl}/checkout/mock-bank?authority=${dummyAuthority}&amount=${amount}`,
      }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/request.json`,
        {
          merchant_id: this.merchantId,
          amount,
          currency: 'IRT',
          description,
          callback_url: callbackUrl,
          metadata: { mobile: mobile || undefined },
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
          provider: this.name,
          transactionId: data.authority,
          paymentUrl: `${this.gatewayUrl}${data.authority}`,
        }
      }

      return {
        success: false,
        provider: this.name,
        transactionId: '',
        paymentUrl: '',
        error: response.data?.errors?.message || 'خطا در ایجاد تراکنش زرین‌پال.',
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: unknown }; message?: string }
      console.error('Zarinpal request error:', error.response?.data || error.message)
      return {
        success: false,
        provider: this.name,
        transactionId: '',
        paymentUrl: '',
        error: 'خطای برقراری ارتباط با درگاه زرین‌پال.',
      }
    }
  }

  async verifyPayment({
    transactionId,
    amount,
  }: VerifyPaymentOptions): Promise<VerifyPaymentResult> {
    if (this.isSandbox && (!this.merchantId || this.merchantId.startsWith('00000000'))) {
      return {
        success: true,
        provider: this.name,
        refId: `SIM-${Math.floor(100000 + Math.random() * 900000)}`,
        message: 'پرداخت با موفقیت انجام شد (شبیه‌ساز زرین‌پال)',
      }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/verify.json`,
        {
          merchant_id: this.merchantId,
          amount,
          authority: transactionId,
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
          provider: this.name,
          refId: data.ref_id?.toString(),
          message: 'پرداخت با موفقیت تأیید شد.',
          rawResponse: data,
        }
      }

      return {
        success: false,
        provider: this.name,
        message: response.data?.errors?.message || 'تراکنش ناموفق بود یا تأیید نشد.',
        rawResponse: response.data,
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: unknown }; message?: string }
      console.error('Zarinpal verify error:', error.response?.data || error.message)
      return {
        success: false,
        provider: this.name,
        message: 'خطا در تأیید پرداخت از سمت بانک.',
      }
    }
  }
}
