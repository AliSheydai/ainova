import { type PaymentProvider, type CreatePaymentOptions, type CreatePaymentResult, type VerifyPaymentOptions, type VerifyPaymentResult } from '../types'

/**
 * MockPaymentProvider
 * Fully functional mock gateway for end-to-end testing and development.
 * Safely blocked in production unless explicitly allowed.
 */
export class MockPaymentProvider implements PaymentProvider {
  public readonly name = 'mock'

  private assertEnvironmentSafe() {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_MOCK_PAYMENT !== 'true'
    ) {
      throw new Error(
        'SECURITY ALERT: MockPaymentProvider is strictly disabled in production environments!'
      )
    }
  }

  async createPayment({
    amount,
    callbackUrl,
  }: CreatePaymentOptions): Promise<CreatePaymentResult> {
    this.assertEnvironmentSafe()

    const randomSuffix = Math.floor(100000 + Math.random() * 900000)
    const transactionId = `MOCK-AUTH-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const paymentUrl = `${appUrl}/checkout/mock-bank?authority=${encodeURIComponent(
      transactionId
    )}&amount=${amount}&callbackUrl=${encodeURIComponent(callbackUrl)}`

    return {
      success: true,
      provider: this.name,
      transactionId,
      paymentUrl,
    }
  }

  async verifyPayment({
    transactionId,
    extraParams,
  }: VerifyPaymentOptions): Promise<VerifyPaymentResult> {
    this.assertEnvironmentSafe()

    // If caller simulated bank rejection (e.g. Status === 'NOK')
    if (extraParams?.Status === 'NOK' || extraParams?.status === 'failed') {
      return {
        success: false,
        provider: this.name,
        message: 'پرداخت توسط کاربر لغو شد یا ناموفق بود (حالت تست).',
      }
    }

    const randomRef = Math.floor(10000000 + Math.random() * 90000000)
    const refId = `MOCK-REF-${randomRef}`

    return {
      success: true,
      provider: this.name,
      refId,
      message: 'پرداخت تستی با موفقیت تأیید شد.',
      rawResponse: {
        mock: true,
        transactionId,
        verifiedAt: new Date().toISOString(),
      },
    }
  }
}
