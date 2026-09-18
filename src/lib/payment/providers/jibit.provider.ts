import axios from 'axios'
import {
  type PaymentProvider,
  type CreatePaymentOptions,
  type CreatePaymentResult,
  type VerifyPaymentOptions,
  type VerifyPaymentResult,
} from '../types'

interface JibitTokenCache {
  accessToken: string
  refreshToken: string
  expiresAt: number // timestamp in ms
}

/**
 * JibitPaymentProvider
 * Implements Jibit PPG (Payment Gateway v3) according to official technical documentation (document.json).
 * Handles token generation/refresh, purchase initialization in IRR (Rials), verification, and sandbox simulation.
 */
export class JibitPaymentProvider implements PaymentProvider {
  public readonly name = 'jibit'

  private baseUrl = process.env.JIBIT_BASE_URL || 'https://napi.jibit.ir'
  private apiKey = process.env.JIBIT_API_KEY || ''
  private secretKey = process.env.JIBIT_SECRET_KEY || ''
  private isSandbox =
    process.env.JIBIT_SANDBOX === 'true' ||
    process.env.ALLOW_MOCK_PAYMENT === 'true' ||
    !process.env.JIBIT_API_KEY

  // In-memory token cache for live mode
  private static tokenCache: JibitTokenCache | null = null

  /**
   * Generates or refreshes Jibit JWT access token.
   * Path: /ppg/v3/tokens & /ppg/v3/tokens/refresh
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now()

    // 1. Check existing valid cached token (buffer 60 seconds before expiration)
    if (
      JibitPaymentProvider.tokenCache &&
      JibitPaymentProvider.tokenCache.expiresAt > now + 60_000
    ) {
      return JibitPaymentProvider.tokenCache.accessToken
    }

    // 2. Try refreshing if refresh token exists
    if (
      JibitPaymentProvider.tokenCache?.refreshToken &&
      JibitPaymentProvider.tokenCache.expiresAt <= now + 60_000
    ) {
      try {
        const refreshRes = await axios.post<{
          accessToken: string
          refreshToken: string
        }>(
          `${this.baseUrl}/ppg/v3/tokens/refresh`,
          {
            accessToken: JibitPaymentProvider.tokenCache.accessToken,
            refreshToken: JibitPaymentProvider.tokenCache.refreshToken,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10_000,
          }
        )

        if (refreshRes.data.accessToken) {
          // Assume 24 hours validity if not specified
          JibitPaymentProvider.tokenCache = {
            accessToken: refreshRes.data.accessToken,
            refreshToken: refreshRes.data.refreshToken,
            expiresAt: now + 23 * 60 * 60 * 1000,
          }
          return refreshRes.data.accessToken
        }
      } catch (refreshErr) {
        console.warn('Jibit token refresh failed, re-authenticating:', refreshErr)
        JibitPaymentProvider.tokenCache = null
      }
    }

    // 3. Request new token with API & Secret Key
    if (!this.apiKey || !this.secretKey) {
      throw new Error(
        'Jibit configuration error: JIBIT_API_KEY or JIBIT_SECRET_KEY is missing.'
      )
    }

    const tokenRes = await axios.post<{
      accessToken: string
      refreshToken: string
    }>(
      `${this.baseUrl}/ppg/v3/tokens`,
      {
        apiKey: this.apiKey,
        secretKey: this.secretKey,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10_000,
      }
    )

    if (!tokenRes.data.accessToken) {
      throw new Error('Failed to obtain access token from Jibit.')
    }

    JibitPaymentProvider.tokenCache = {
      accessToken: tokenRes.data.accessToken,
      refreshToken: tokenRes.data.refreshToken,
      expiresAt: now + 23 * 60 * 60 * 1000,
    }

    return tokenRes.data.accessToken
  }

  /**
   * Initializes a purchase with Jibit.
   * In sandbox mode: redirects to the dedicated Jibit test gateway simulator (/checkout/jibit-gateway).
   * In live mode: calls POST /ppg/v3/purchases to obtain pspSwitchingUrl.
   */
  async createPayment({
    orderId,
    amount, // in Toman
    description,
    callbackUrl,
    mobile,
  }: CreatePaymentOptions): Promise<CreatePaymentResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Amount in Rial (IRR) required by Jibit
    const amountInRials = amount * 10

    // ==========================================
    // 1. Sandbox / Testing Flow
    // ==========================================
    if (this.isSandbox) {
      // Generate realistic 8-digit Jibit purchase ID
      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000)
      const purchaseId = `${randomSuffix}`

      const query = new URLSearchParams({
        purchaseId,
        orderId,
        amount: amount.toString(),
        amountRials: amountInRials.toString(),
        currency: 'IRR',
        callbackUrl,
        description: description || `پرداخت سفارش ${orderId}`,
      })

      if (mobile) {
        query.set('mobile', mobile)
      }

      const paymentUrl = `${appUrl}/checkout/jibit-gateway?${query.toString()}`

      return {
        success: true,
        provider: this.name,
        transactionId: purchaseId,
        paymentUrl,
      }
    }

    // ==========================================
    // 2. Production Flow (/ppg/v3/purchases)
    // ==========================================
    try {
      const accessToken = await this.getAccessToken()

      const payload = {
        amount: amountInRials,
        currency: 'IRR',
        clientReferenceNumber: orderId.slice(0, 50),
        callbackUrl,
        description: description?.slice(0, 256) || `سفارش ${orderId}`,
        payerMobileNumber: mobile || undefined,
        userIdentifier: mobile || undefined,
      }

      const res = await axios.post<{
        purchaseId: number
        purchaseIdStr?: string
        clientReferenceNumber: string
        pspSwitchingUrl: string
        payableAmount: number
        currency: string
      }>(`${this.baseUrl}/ppg/v3/purchases`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 15_000,
      })

      const data = res.data

      if (!data.pspSwitchingUrl || !data.purchaseId) {
        return {
          success: false,
          provider: this.name,
          transactionId: '',
          paymentUrl: '',
          error: 'پاسخ نامعتبر از درگاه پرداخت جیبیت دریافت شد.',
        }
      }

      const transactionId = data.purchaseIdStr || String(data.purchaseId)

      return {
        success: true,
        provider: this.name,
        transactionId,
        paymentUrl: data.pspSwitchingUrl,
      }
    } catch (error: any) {
      console.error('Jibit createPayment error:', error.response?.data || error.message)
      const errDetail =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        error.message ||
        'خطا در ارتباط با درگاه جیبیت.'

      return {
        success: false,
        provider: this.name,
        transactionId: '',
        paymentUrl: '',
        error: `خطای جیبیت: ${errDetail}`,
      }
    }
  }

  /**
   * Verifies purchase with Jibit.
   * In sandbox mode: verifies simulator state.
   * In live mode: calls POST /ppg/v3/purchases/{purchaseId}/verify.
   */
  async verifyPayment({
    transactionId, // purchaseId
    amount, // in Toman
    extraParams,
  }: VerifyPaymentOptions): Promise<VerifyPaymentResult> {
    const rawStatus =
      extraParams?.status ||
      extraParams?.Status ||
      extraParams?.state ||
      ''

    // ==========================================
    // 1. Sandbox / Testing Flow
    // ==========================================
    if (this.isSandbox) {
      // User pressed "خرید ناموفق" or cancelled
      if (
        rawStatus === 'FAILED' ||
        rawStatus === 'NOK' ||
        rawStatus === 'failed' ||
        rawStatus === 'cancelled'
      ) {
        return {
          success: false,
          provider: this.name,
          message: 'پرداخت در درگاه آزمایشی جیبیت لغو شد یا ناموفق بود.',
        }
      }

      // Success
      const refId = `JBT-REF-${transactionId}`

      return {
        success: true,
        provider: this.name,
        refId,
        amount, // verified amount in Toman
        message: 'پرداخت تستی جیبیت با موفقیت تأیید شد.',
        rawResponse: {
          sandbox: true,
          provider: 'jibit',
          purchaseId: transactionId,
          status: 'SUCCESSFUL',
          amountRials: amount * 10,
          amountToman: amount,
          verifiedAt: new Date().toISOString(),
        },
      }
    }

    // ==========================================
    // 2. Production Flow (/ppg/v3/purchases/{purchaseId}/verify)
    // ==========================================
    try {
      const accessToken = await this.getAccessToken()

      const res = await axios.post<{
        status:
          | 'SUCCESSFUL'
          | 'ALREADY_VERIFIED'
          | 'FAILED'
          | 'UNKNOWN'
          | 'NOT_VERIFIABLE'
      }>(
        `${this.baseUrl}/ppg/v3/purchases/${transactionId}/verify`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 15_000,
        }
      )

      const result = res.data

      if (
        result.status === 'SUCCESSFUL' ||
        result.status === 'ALREADY_VERIFIED'
      ) {
        return {
          success: true,
          provider: this.name,
          refId: `JIBIT-${transactionId}`,
          amount,
          message: 'پرداخت جیبیت با موفقیت تایید و نهایی گردید.',
          rawResponse: result,
        }
      }

      return {
        success: false,
        provider: this.name,
        message: `تایید تراکنش در جیبیت با وضعیت ${result.status} رد شد.`,
        rawResponse: result,
      }
    } catch (error: any) {
      console.error('Jibit verifyPayment error:', error.response?.data || error.message)
      const errDetail =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        'خطا در اعتبارسنجی تراکنش با درگاه جیبیت.'

      return {
        success: false,
        provider: this.name,
        message: errDetail,
        rawResponse: error.response?.data,
      }
    }
  }
}
