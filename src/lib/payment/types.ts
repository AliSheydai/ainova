/**
 * Payment Provider Abstraction Layer
 * Defines contracts for all payment gateways (Mock, Zarinpal, etc.)
 */

export interface CreatePaymentOptions {
  orderId: string
  amount: number // in Toman
  description: string
  callbackUrl: string
  mobile?: string | null
}

export interface CreatePaymentResult {
  success: boolean
  provider: string
  transactionId: string // Authority or provider unique transaction ID
  paymentUrl: string
  error?: string
}

export interface VerifyPaymentOptions {
  transactionId: string // Authority / Ref token
  amount: number // in Toman
  extraParams?: Record<string, string | null>
}

export interface VerifyPaymentResult {
  success: boolean
  provider: string
  refId?: string // Bank reference tracking number
  message?: string
  rawResponse?: unknown
}

export interface PaymentProvider {
  readonly name: string

  /**
   * Initializes a payment with the provider and obtains a redirect/payment URL.
   */
  createPayment(options: CreatePaymentOptions): Promise<CreatePaymentResult>

  /**
   * Verifies the payment transaction status with the provider.
   */
  verifyPayment(options: VerifyPaymentOptions): Promise<VerifyPaymentResult>
}
