import { type IFulfillmentHandler, type AccountCredentialsDeliveryData, type CustomerProvisioningDeliveryData, type OrderWithFulfillmentDetails, type PrismaTransactionClient } from '../types'
import { encryptCredential, decryptCredential } from '@/lib/security/crypto'

export class PreCreatedAccountFulfillmentHandler implements IFulfillmentHandler {
  type = 'PRE_CREATED_ACCOUNT' as const

  async fulfill({ tx, order, now }: { tx: PrismaTransactionClient; order: OrderWithFulfillmentDetails; now: Date }) {
    const checkoutData = (order.checkoutData as Record<string, unknown>) || {}

    // Check if customer provided their own Gmail credentials
    const customerEmail =
      (typeof checkoutData.customer_email === 'string' && checkoutData.customer_email.trim()) ||
      (typeof checkoutData.customer_gmail === 'string' && checkoutData.customer_gmail.trim()) ||
      ''
    const customerPassword =
      (typeof checkoutData.customer_password === 'string' && checkoutData.customer_password.trim()) || ''

    // If customer provided their own account — route to admin confirmation flow
    if (customerEmail) {
      const serviceName =
        order.plan?.product?.title ||
        order.product?.title ||
        'سرویس'

      const deliveryData: CustomerProvisioningDeliveryData = {
        email: customerEmail,
        serviceName,
        provisionDetails: `اشتراک ${serviceName} پس از بررسی و تأیید ادمین روی حساب «${customerEmail}» فعال خواهد شد.`,
        accountInfo: customerPassword
          ? `ایمیل: ${customerEmail} | رمزعبور: ${encryptCredential(customerPassword)}`
          : `ایمیل: ${customerEmail}`,
        status: 'PENDING',
      }

      return {
        status: 'AWAITING_MANUAL_DELIVERY' as const,
        message: `پرداخت تأیید شد. اشتراک پس از بررسی ادمین روی اکانت «${customerEmail}» فعال خواهد شد.`,
        deliveryData,
      }
    }

    // No customer account provided — fulfill from inventory (pre-created account)
    const effectiveProduct = order.product || order.plan?.product
    const productId = effectiveProduct?.id
    const planId = order.planId

    let chosenAccount: { id: string; data: Record<string, unknown> | string } | null = null

    // 1. Check if an account was already RESERVED for this order
    const reservedAccount = await tx.inventoryItem.findFirst({
      where: {
        orderId: order.id,
        status: 'RESERVED',
        type: 'PRE_CREATED_ACCOUNT',
      },
    })

    if (reservedAccount) {
      chosenAccount = {
        id: reservedAccount.id,
        data: reservedAccount.data as Record<string, unknown> | string,
      }

      await tx.inventoryItem.update({
        where: { id: reservedAccount.id },
        data: {
          status: 'USED',
          assignedAt: reservedAccount.assignedAt || now,
          usedAt: now,
        },
      })
    } else {
      // 2. Fallback: Find available account in inventory_items with FOR UPDATE SKIP LOCKED
      const availableRows = await tx.$queryRaw<Array<{ id: string; data: Record<string, unknown> | string }>>`
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

      if (availableRows && availableRows.length > 0) {
        chosenAccount = availableRows[0]

        await tx.inventoryItem.update({
          where: { id: chosenAccount.id },
          data: {
            status: 'USED',
            orderId: order.id,
            assignedAt: now,
            usedAt: now,
          },
        })
      }
    }

    if (!chosenAccount) {
      return {
        status: 'STOCK_EXHAUSTED' as const,
        message:
          'پرداخت تایید شد، اما موجودی اکانت‌های آماده این پلن به پایان رسیده است. سفارش در وضعیت پرداخت‌شده (PAID) قرار گرفت.',
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
