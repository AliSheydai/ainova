import { describe, expect, it, vi } from 'vitest'
import { ActivationLinkFulfillmentHandler } from './handlers/activation-link.handler'
import { PreCreatedAccountFulfillmentHandler } from './handlers/pre-created-account.handler'
import { type OrderWithFulfillmentDetails, type PrismaTransactionClient } from './types'

describe('Warehouse Inventory Safety & Variant Matching Tests (shop.md)', () => {
  process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long!!'
  const mockNow = new Date('2026-09-21T12:00:00Z')

  describe('ActivationLinkFulfillmentHandler', () => {
    const handler = new ActivationLinkFulfillmentHandler()

    it('successfully delivers reserved link when product and variant match', async () => {
      const order = {
        id: 'order-1',
        productId: 'prod-chatgpt',
        planId: 'plan-pro-1m',
        variantId: 'var-pro',
        checkoutData: {},
      } as unknown as OrderWithFulfillmentDetails

      const reservedItem = {
        id: 'inv-pro-1',
        productId: 'prod-chatgpt',
        variantId: 'var-pro',
        planId: 'plan-pro-1m',
        type: 'ACTIVATION_LINK',
        status: 'RESERVED',
        data: { url: 'https://chatgpt.com/activate/pro-123' },
        assignedAt: mockNow,
      }

      const updateMock = vi.fn().mockResolvedValue({})
      const mockTx = {
        inventoryItem: {
          findFirst: vi.fn().mockResolvedValue(reservedItem),
          update: updateMock,
        },
        $queryRaw: vi.fn(),
      } as unknown as PrismaTransactionClient

      const result = await handler.fulfill({
        tx: mockTx,
        order,
        now: mockNow,
      })

      expect(result.status).toBe('COMPLETED')
      expect(result.deliveryData).toEqual({
        url: 'https://chatgpt.com/activate/pro-123',
        instructions: 'روی لینک کلیک کنید و در حساب کاربری گوگل خود فعال‌سازی را تأیید فرمایید.',
      })
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'inv-pro-1' },
        data: {
          status: 'USED',
          assignedAt: mockNow,
          usedAt: mockNow,
        },
      })
    })

    it('releases reserved link and dynamically allocates correct one when variant mismatches (Safety Check)', async () => {
      const order = {
        id: 'order-2',
        productId: 'prod-chatgpt',
        planId: 'plan-pro-1m',
        variantId: 'var-pro',
        checkoutData: {},
      } as unknown as OrderWithFulfillmentDetails

      // Reserved item mistakenly has Plus variant instead of Pro
      const mismatchedReservedItem = {
        id: 'inv-plus-wrong',
        productId: 'prod-chatgpt',
        variantId: 'var-plus',
        planId: 'plan-plus-1m',
        type: 'ACTIVATION_LINK',
        status: 'RESERVED',
        data: { url: 'https://chatgpt.com/activate/plus-wrong' },
        assignedAt: mockNow,
      }

      // Dynamic fallback correctly returns Pro link
      const fallbackItem = {
        id: 'inv-pro-correct',
        data: { url: 'https://chatgpt.com/activate/pro-correct' },
      }

      const updateMock = vi.fn().mockResolvedValue({})
      const queryRawMock = vi.fn().mockResolvedValue([fallbackItem])

      const mockTx = {
        inventoryItem: {
          findFirst: vi.fn().mockResolvedValue(mismatchedReservedItem),
          update: updateMock,
        },
        $queryRaw: queryRawMock,
      } as unknown as PrismaTransactionClient

      const result = await handler.fulfill({
        tx: mockTx,
        order,
        now: mockNow,
      })

      expect(result.status).toBe('COMPLETED')
      expect(result.deliveryData).toEqual({
        url: 'https://chatgpt.com/activate/pro-correct',
        instructions: 'روی لینک کلیک کنید و در حساب کاربری گوگل خود فعال‌سازی را تأیید فرمایید.',
      })

      // 1. Released mismatched item to AVAILABLE
      expect(updateMock).toHaveBeenNthCalledWith(1, {
        where: { id: 'inv-plus-wrong' },
        data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
      })

      // 2. Used dynamic fallback item
      expect(updateMock).toHaveBeenNthCalledWith(2, {
        where: { id: 'inv-pro-correct' },
        data: {
          status: 'USED',
          orderId: 'order-2',
          assignedAt: mockNow,
          usedAt: mockNow,
        },
      })
    })

    it('releases reserved link when order has no variant but reserved item has a variant', async () => {
      const order = {
        id: 'order-no-var',
        productId: 'prod-chatgpt',
        planId: 'plan-plain',
        variantId: null,
        checkoutData: {},
      } as unknown as OrderWithFulfillmentDetails

      const reservedItem = {
        id: 'inv-var-pro',
        productId: 'prod-chatgpt',
        variantId: 'var-pro',
        type: 'ACTIVATION_LINK',
        status: 'RESERVED',
        data: { url: 'https://chatgpt.com/activate/pro-specific' },
        assignedAt: mockNow,
      }

      const genericItem = {
        id: 'inv-generic',
        data: { url: 'https://chatgpt.com/activate/generic' },
      }

      const updateMock = vi.fn().mockResolvedValue({})
      const queryRawMock = vi.fn().mockResolvedValue([genericItem])

      const mockTx = {
        inventoryItem: {
          findFirst: vi.fn().mockResolvedValue(reservedItem),
          update: updateMock,
        },
        $queryRaw: queryRawMock,
      } as unknown as PrismaTransactionClient

      const result = await handler.fulfill({
        tx: mockTx,
        order,
        now: mockNow,
      })

      expect(result.status).toBe('COMPLETED')
      expect(result.deliveryData).toEqual({
        url: 'https://chatgpt.com/activate/generic',
        instructions: 'روی لینک کلیک کنید و در حساب کاربری گوگل خود فعال‌سازی را تأیید فرمایید.',
      })
      expect(updateMock).toHaveBeenNthCalledWith(1, {
        where: { id: 'inv-var-pro' },
        data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
      })
    })
  })

  describe('PreCreatedAccountFulfillmentHandler', () => {
    const handler = new PreCreatedAccountFulfillmentHandler()

    it('releases reserved account and dynamically allocates correct one when variant mismatches (Safety Check)', async () => {
      const order = {
        id: 'order-3',
        productId: 'prod-chatgpt',
        planId: 'plan-pro-1m',
        variantId: 'var-pro',
        checkoutData: {},
      } as unknown as OrderWithFulfillmentDetails

      // Mismatched reserved account
      const mismatchedReservedAccount = {
        id: 'acc-plus-wrong',
        productId: 'prod-chatgpt',
        variantId: 'var-plus',
        type: 'PRE_CREATED_ACCOUNT',
        status: 'RESERVED',
        data: { email: 'plus@example.com', password: 'plainpassword' },
        assignedAt: mockNow,
      }

      // Dynamic fallback correctly returns Pro account
      const fallbackAccount = {
        id: 'acc-pro-correct',
        data: { email: 'pro@example.com', password: 'plainpassword' },
      }

      const updateMock = vi.fn().mockResolvedValue({})
      const queryRawMock = vi.fn().mockResolvedValue([fallbackAccount])

      const mockTx = {
        inventoryItem: {
          findFirst: vi.fn().mockResolvedValue(mismatchedReservedAccount),
          update: updateMock,
        },
        $queryRaw: queryRawMock,
      } as unknown as PrismaTransactionClient

      const result = await handler.fulfill({
        tx: mockTx,
        order,
        now: mockNow,
      })

      expect(result.status).toBe('COMPLETED')
      expect((result.deliveryData as any).email).toBe('pro@example.com')

      // Released mismatched item
      expect(updateMock).toHaveBeenNthCalledWith(1, {
        where: { id: 'acc-plus-wrong' },
        data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
      })

      // Used dynamic fallback account
      expect(updateMock).toHaveBeenNthCalledWith(2, {
        where: { id: 'acc-pro-correct' },
        data: {
          status: 'USED',
          orderId: 'order-3',
          assignedAt: mockNow,
          usedAt: mockNow,
        },
      })
    })
  })
})
