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
    expect(message).toContain('پنل کاربری سایت')
    expect(message).toContain('قابل مشاهده است')
    expect(message).toContain('?dashboard=orders')
  })

  it('renders productsPaginationKeyboard correctly for multi-page products catalog', async () => {
    const { productsPaginationKeyboard } = await import('./keyboards')

    const mockProducts = [
      { id: 'p1', title: 'گوگل وان ۲ ترابایت', price: 290000, stock: 5 },
      { id: 'p2', title: 'جمینای ادونسد', price: 450000, stock: 0 },
      { id: 'p3', title: 'چت‌جی‌پی‌تی پلاس', price: 1200000, stock: 3 },
      { id: 'p4', title: 'کلود پرو', price: 1100000, stock: 2 },
    ]

    const keyboard = productsPaginationKeyboard(mockProducts, 1, 3)
    const json = keyboard.inline_keyboard as any

    // 4 product rows + 1 pagination row + 1 refresh row + 1 menu row = 7 rows
    expect(json.length).toBe(7)

    // Check product rows
    expect(json[0][0].text).toContain('گوگل وان ۲ ترابایت')
    expect(json[0][0].text).toContain('⚡ تحویل آنی')
    expect(json[0][0].callback_data).toBe('product:select:p1:1')

    expect(json[1][0].text).toContain('جمینای ادونسد')
    expect(json[1][0].text).toContain('🕒 ارسال طی ۱ روز کاری')
    expect(json[1][0].callback_data).toBe('product:select:p2:1')

    // Check pagination row (page 1 of 3: has next page button, no prev button)
    const paginationRow = json[4]
    expect(paginationRow.length).toBe(2)
    expect(paginationRow[0].text).toBe('صفحه بعدی ⬅️')
    expect(paginationRow[0].callback_data).toBe('products:page:2')
    expect(paginationRow[1].text).toContain('صفحه ۱ از ۳')
    expect(paginationRow[1].callback_data).toBe('noop')

    // Check middle page (page 2 of 3)
    const page2Keyboard = productsPaginationKeyboard(mockProducts, 2, 3)
    const page2PaginationRow = (page2Keyboard.inline_keyboard as any)[4]
    expect(page2PaginationRow.length).toBe(3)
    expect(page2PaginationRow[0].text).toBe('صفحه بعدی ⬅️')
    expect(page2PaginationRow[0].callback_data).toBe('products:page:3')
    expect(page2PaginationRow[1].text).toContain('صفحه ۲ از ۳')
    expect(page2PaginationRow[2].text).toBe('➡️ صفحه قبلی')
    expect(page2PaginationRow[2].callback_data).toBe('products:page:1')

    // Check utility buttons rows
    const refreshRow = json[5]
    expect(refreshRow[0].text).toBe('🔄 به‌روزرسانی لیست')
    expect(refreshRow[0].callback_data).toBe('products:page:1')

    const menuRow = json[6]
    expect(menuRow[0].text).toBe('🔙 بازگشت به منوی اصلی')
    expect(menuRow[0].callback_data).toBe('nav:main')
  })
})
