import { describe, expect, it } from 'vitest'
import { MockPaymentProvider } from './providers/mock.provider'

describe('Payment Verification & Amount Mismatch Security (Bug 2.1)', () => {
  const provider = new MockPaymentProvider()

  it('returns verified amount matching the requested amount in rawResponse and amount field', async () => {
    const result = await provider.verifyPayment({
      transactionId: 'MOCK-AUTH-TEST-1',
      amount: 150000,
    })

    expect(result.success).toBe(true)
    expect(result.amount).toBe(150000)
    expect((result.rawResponse as any)?.amount).toBe(150000)
  })

  it('reflects simulated amount mismatch when extraParams.simulatedAmount is provided', async () => {
    const result = await provider.verifyPayment({
      transactionId: 'MOCK-AUTH-TEST-2',
      amount: 150000,
      extraParams: {
        simulatedAmount: '50000',
      },
    })

    expect(result.success).toBe(true)
    expect(result.amount).toBe(50000)
    expect(result.amount).not.toBe(150000)
    expect((result.rawResponse as any)?.amount).toBe(50000)
  })

  it('fails verification when Status is NOK', async () => {
    const result = await provider.verifyPayment({
      transactionId: 'MOCK-AUTH-TEST-3',
      amount: 150000,
      extraParams: {
        Status: 'NOK',
      },
    })

    expect(result.success).toBe(false)
  })
})
