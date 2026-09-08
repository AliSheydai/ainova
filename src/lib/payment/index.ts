import { prisma } from '@/lib/prisma'
import { PaymentProvider, CreatePaymentOptions, VerifyPaymentOptions } from './types'
import { MockPaymentProvider } from './providers/mock.provider'
import { ZarinpalPaymentProvider } from './providers/zarinpal.provider'

export * from './types'
export * from './providers/mock.provider'
export * from './providers/zarinpal.provider'

const providers: Record<string, PaymentProvider> = {
  mock: new MockPaymentProvider(),
  zarinpal: new ZarinpalPaymentProvider(),
}

/**
 * Returns the active payment provider based on configuration.
 */
export function getPaymentProvider(requestedName?: string): PaymentProvider {
  const name = requestedName || process.env.PAYMENT_PROVIDER || 'mock'
  const provider = providers[name.toLowerCase()]

  if (!provider) {
    console.warn(`Payment provider "${name}" not found. Falling back to "mock".`)
    return providers.mock
  }

  return provider
}

/**
 * High-Level Payment Service
 * Manages database persistence and coordination with the active PaymentProvider.
 */
export class PaymentService {
  /**
   * Initializes a payment for an order and persists the Payment record.
   */
  static async createPayment({
    orderId,
    amount,
    description,
    callbackUrl,
    mobile,
    providerName,
  }: CreatePaymentOptions & { providerName?: string }) {
    const provider = getPaymentProvider(providerName)

    const result = await provider.createPayment({
      orderId,
      amount,
      description,
      callbackUrl,
      mobile,
    })

    if (!result.success || !result.transactionId) {
      // Mark order as failed if payment initialization fails
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'FAILED' },
      })

      return {
        success: false,
        error: result.error || 'خطا در ارتباط با درگاه پرداخت.',
        paymentUrl: null,
      }
    }

    // Upsert / Create Payment record
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: {
        amount,
        authority: result.transactionId,
        gatewayName: provider.name,
        status: 'PENDING',
        gatewayResponse: (result as unknown as object) || {},
      },
      create: {
        orderId,
        amount,
        authority: result.transactionId,
        gatewayName: provider.name,
        status: 'PENDING',
        gatewayResponse: (result as unknown as object) || {},
      },
    })

    return {
      success: true,
      payment,
      paymentUrl: result.paymentUrl,
      transactionId: result.transactionId,
    }
  }

  /**
   * Verifies a payment with the provider by authority/transactionId.
   */
  static async verifyPayment({
    transactionId,
    amount,
    providerName,
    extraParams,
  }: VerifyPaymentOptions & { providerName?: string }) {
    const provider = getPaymentProvider(providerName)

    return await provider.verifyPayment({
      transactionId,
      amount,
      extraParams,
    })
  }
}

// Backwards-compatible legacy exports
export async function requestZarinpalPayment(options: {
  amount: number
  description: string
  callbackUrl: string
  mobile?: string
}) {
  const provider = getPaymentProvider()
  const res = await provider.createPayment({
    orderId: 'legacy',
    ...options,
  })
  return {
    success: res.success,
    authority: res.transactionId,
    paymentUrl: res.paymentUrl,
    error: res.error,
  }
}

export async function verifyZarinpalPayment(options: {
  authority: string
  amount: number
}) {
  const provider = getPaymentProvider()
  const res = await provider.verifyPayment({
    transactionId: options.authority,
    amount: options.amount,
  })
  return {
    success: res.success,
    refId: res.refId,
    message: res.message,
  }
}
