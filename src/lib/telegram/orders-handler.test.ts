import { describe, expect, it, vi } from 'vitest'
import { BotStoreService } from '../bot/bot-store-service'
import { prisma } from '../prisma'

describe('Telegram Bot Orders Handling & Deeplink', () => {
  it('verifies prisma.order.findMany does not include removed activationLink field', async () => {
    // Attempting to query with activationLink in prisma causes PrismaClientValidationError at runtime.
    // Ensure our orders query options are completely valid for Prisma model Order.
    const queryArgs = {
      where: {
        OR: [{ userId: 'user-1' }, { telegramChatId: '12345678' }],
      },
      include: {
        product: true,
        variant: true,
        plan: {
          include: { product: true, variant: true },
        },
        payment: true,
        inventoryItem: true,
        delivery: true,
      },
    }

    // Verify it doesn't throw a validation error
    const result = await prisma.order.findMany({
      ...queryArgs,
      take: 0,
    })
    expect(Array.isArray(result)).toBe(true)
  })

  it('formats delivery message correctly when delivery contains url in data', () => {
    const order = {
      status: 'COMPLETED',
      delivery: {
        type: 'ACTIVATION_LINK',
        data: { url: 'https://example.com/activate/order123' },
      },
      checkoutData: {},
    }

    const message = BotStoreService.formatDeliveryMessage(order)
    expect(message).toContain('https://example.com/activate/order123')
    expect(message).toContain('لینک فعال‌سازی اختصاصی')
  })

  it('formats delivery message correctly using fallback link or inventoryItem', () => {
    const orderWithLink = {
      status: 'COMPLETED',
      delivery: {
        type: 'ACTIVATION_LINK',
        data: { link: 'https://example.com/invitation/link-456' },
      },
      checkoutData: {},
    }

    const msg1 = BotStoreService.formatDeliveryMessage(orderWithLink)
    expect(msg1).toContain('https://example.com/invitation/link-456')

    const orderWithInventory = {
      status: 'COMPLETED',
      delivery: {
        type: 'ACTIVATION_LINK',
        data: {},
      },
      inventoryItem: {
        data: { url: 'https://example.com/inventory/link-789' },
      },
      checkoutData: {},
    }

    const msg2 = BotStoreService.formatDeliveryMessage(orderWithInventory)
    expect(msg2).toContain('https://example.com/inventory/link-789')
  })

  it('formats pre-created account delivery message with masked password for security', () => {
    const order = {
      status: 'COMPLETED',
      delivery: {
        type: 'PRE_CREATED_ACCOUNT',
        data: { email: 'user@gmail.com', username: 'user@gmail.com' },
      },
      checkoutData: { delivery_preference: 'ready_account' },
    }

    const message = BotStoreService.formatDeliveryMessage(order)
    expect(message).toContain('user@gmail.com')
    expect(message).toContain('اطلاعات ورود به اکانت اختصاصی')
    expect(message).toContain('در پنل کاربری سایت قابل مشاهده است')
  })
})
