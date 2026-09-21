import { describe, expect, it, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { ZibalPaymentProvider, getZibalErrorMessage } from './providers/zibal.provider'
import { getPaymentProvider } from './index'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

describe('ZibalPaymentProvider', () => {
  let provider: ZibalPaymentProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new ZibalPaymentProvider()
  })

  describe('Provider Registry', () => {
    it('returns ZibalPaymentProvider when requested by name "zibal"', () => {
      const p = getPaymentProvider('zibal')
      expect(p.name).toBe('zibal')
      expect(p).toBeInstanceOf(ZibalPaymentProvider)
    })
  })

  describe('createPayment', () => {
    it('successfully requests payment session and returns start URL with trackId', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          trackId: 15966442233311,
          result: 100,
          message: 'success',
        },
      })

      const result = await provider.createPayment({
        orderId: 'ORDER-12345',
        amount: 25000, // 25,000 Tomans
        description: 'خرید اشتراک تستی',
        callbackUrl: 'http://localhost:3000/api/payment/callback?orderId=ORDER-12345',
        mobile: '09123456789',
      })

      expect(result.success).toBe(true)
      expect(result.provider).toBe('zibal')
      expect(result.transactionId).toBe('15966442233311')
      expect(result.paymentUrl).toBe('https://gateway.zibal.ir/start/15966442233311')

      // Verify Rial conversion (25,000 Tomans = 250,000 Rials)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://gateway.zibal.ir/v1/request',
        expect.objectContaining({
          merchant: 'zibal',
          amount: 250000,
          callbackUrl: 'http://localhost:3000/api/payment/callback?orderId=ORDER-12345',
          description: 'خرید اشتراک تستی',
          orderId: 'ORDER-12345',
          mobile: '09123456789',
        }),
        expect.any(Object)
      )
    })

    it('handles Zibal error result code on payment request (e.g. 105: amount below 1000 rials)', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          result: 105,
          message: 'amount must be greater than 1000',
        },
      })

      const result = await provider.createPayment({
        orderId: 'ORDER-FAIL',
        amount: 50,
        description: 'تست مبلغ کم',
        callbackUrl: 'http://localhost:3000/api/payment/callback',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('مبلغ باید بیشتر از ۱,۰۰۰ ریال باشد.')
    })
  })

  describe('verifyPayment', () => {
    it('successfully verifies payment and converts Rial to Toman', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          paidAt: '2026-09-21T18:40:00.000Z',
          amount: 250000, // 250,000 Rials = 25,000 Tomans
          result: 100,
          status: 1,
          refNumber: 99887766,
          cardNumber: '603799******1234',
          orderId: 'ORDER-12345',
          message: 'success',
        },
      })

      const result = await provider.verifyPayment({
        transactionId: '15966442233311',
        amount: 25000,
      })

      expect(result.success).toBe(true)
      expect(result.provider).toBe('zibal')
      expect(result.refId).toBe('99887766')
      expect(result.amount).toBe(25000) // Correctly converted to Toman!
      expect(result.rawResponse).toBeDefined()

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://gateway.zibal.ir/v1/verify',
        {
          merchant: 'zibal',
          trackId: 15966442233311,
        },
        expect.any(Object)
      )
    })

    it('accepts already-verified status (result 201) as success', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          result: 201,
          status: 1,
          amount: 100000,
          refNumber: 11223344,
          message: 'already verified',
        },
      })

      const result = await provider.verifyPayment({
        transactionId: '15966442233311',
        amount: 10000,
      })

      expect(result.success).toBe(true)
      expect(result.amount).toBe(10000)
      expect(result.message).toContain('قبلاً تایید شده')
    })

    it('returns failure when Zibal verification fails (result 202: payment failed/not paid)', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          result: 202,
          status: 3,
          message: 'order not paid',
        },
      })

      const result = await provider.verifyPayment({
        transactionId: '15966442233311',
        amount: 25000,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('سفارش پرداخت نشده یا ناموفق بوده است.')
    })

    it('returns error when trackId is non-numeric or invalid', async () => {
      const result = await provider.verifyPayment({
        transactionId: 'invalid-track-id',
        amount: 25000,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('شناسه تراکنش زیبال (trackId) نامعتبر است.')
    })
  })

  describe('Error Message Mapping', () => {
    it('returns mapped Persian error message for known result codes', () => {
      expect(getZibalErrorMessage(102)).toBe('مرچنت یافت نشد.')
      expect(getZibalErrorMessage(104)).toBe('مرچنت نامعتبر است.')
      expect(getZibalErrorMessage(203)).toBe('شناسه پیگیری (trackId) نامعتبر است.')
      expect(getZibalErrorMessage(999, 'پیام پیش‌فرض')).toBe('پیام پیش‌فرض')
    })
  })
})
