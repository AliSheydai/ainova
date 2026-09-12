import { IFulfillmentHandler, AccountCredentialsDeliveryData } from '../types'
import { encryptCredential, decryptCredential } from '@/lib/security/crypto'

export class PreCreatedAccountFulfillmentHandler implements IFulfillmentHandler {
  type = 'PRE_CREATED_ACCOUNT' as const

  async fulfill({ tx, order, now }: { tx: any; order: any; now: Date }) {
    const effectiveProduct = order.product || order.plan?.product
    const productId = effectiveProduct?.id
    const planId = order.planId

    // Find available account in inventory_items with FOR UPDATE SKIP LOCKED
    const availableRows = await tx.$queryRaw<Array<{ id: string; data: any }>>`
      SELECT id, data
      FROM inventory_items
      WHERE type = 'PRE_CREATED_ACCOUNT'::"InventoryType"
        AND (
          ("planId" = ${planId} AND "planId" IS NOT NULL) OR 
          ("productId" = ${productId} AND ("planId" IS NULL OR "planId" = ${planId}))
        )
        AND status = 'AVAILABLE'::"LinkStatus"
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `

    const chosenAccount = availableRows[0]

    if (!chosenAccount) {
      return {
        status: 'STOCK_EXHAUSTED' as const,
        message: 'پرداخت تایید شد، اما موجودی اکانت‌های آماده این پلن به پایان رسیده است. سفارش در وضعیت پرداخت‌شده (PAID) قرار گرفت.',
      }
    }

    const rawData =
      typeof chosenAccount.data === 'string'
        ? JSON.parse(chosenAccount.data)
        : chosenAccount.data

    const email = rawData?.email || rawData?.username || ''
    // Ensure password is safe
    const rawPassword = rawData?.password ? decryptCredential(rawData.password) : ''
    const encryptedPassword = encryptCredential(rawPassword)

    // Mark inventory item as USED
    await tx.inventoryItem.update({
      where: { id: chosenAccount.id },
      data: {
        status: 'USED',
        orderId: order.id,
        assignedAt: now,
        usedAt: now,
      },
    })

    const deliveryData: AccountCredentialsDeliveryData = {
      email,
      password: encryptedPassword, // stored encrypted in DB delivery data
      username: rawData?.username || email,
      recoveryEmail: rawData?.recoveryEmail || null,
      note: rawData?.note || 'لطفاً بلافاصله پس از اولین ورود، اطلاعات امنیتی و رمز عبور را تغییر دهید.',
    }

    return {
      status: 'COMPLETED' as const,
      message: 'اکانت آماده با موفقیت به سفارش شما اختصاص داده شد.',
      deliveryData,
    }
  }
}
