import { type IFulfillmentHandler, type AccountCredentialsDeliveryData, type CustomerProvisioningDeliveryData, type OrderWithFulfillmentDetails, type PrismaTransactionClient } from '../types'
import { encryptCredential, decryptCredential } from '@/lib/security/crypto'

export class PreCreatedAccountFulfillmentHandler implements IFulfillmentHandler {
  type = 'PRE_CREATED_ACCOUNT' as const

  async fulfill({
    tx,
    order,
    now,
    manualDeliveryData,
    adminUserId: _adminUserId,
  }: {
    tx: PrismaTransactionClient
    order: OrderWithFulfillmentDetails
    now: Date
    manualDeliveryData?: import('../types').ManualDeliveryData
    adminUserId?: string
  }) {
    // 0. If admin provides manual delivery data with email and password
    if (manualDeliveryData?.email) {
      const email = manualDeliveryData.email.trim()
      const rawPassword = manualDeliveryData.password?.trim() || ''
      const encryptedPassword = encryptCredential(rawPassword)

      const deliveryData: AccountCredentialsDeliveryData = {
        email,
        password: encryptedPassword,
        username: email,
        recoveryEmail: manualDeliveryData.recoveryEmail?.trim() || null,
        note:
          manualDeliveryData.manualNote ||
          'لطفاً بلافاصله پس از اولین ورود، اطلاعات امنیتی و رمز عبور را تغییر دهید.',
      }

      return {
        status: 'COMPLETED' as const,
        message: 'اکانت اختصاصی با موفقیت توسط مدیر به خریدار تحویل داده شد.',
        deliveryData,
      }
    }

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

      const rawCustomerPassword = customerPassword ? decryptCredential(customerPassword) : ''

      const deliveryData: CustomerProvisioningDeliveryData = {
        email: customerEmail,
        password: rawCustomerPassword || undefined,
        serviceName,
        provisionDetails: `اشتراک ${serviceName} پس از بررسی و تأیید ادمین روی حساب «${customerEmail}» فعال خواهد شد.`,
        accountInfo: rawCustomerPassword
          ? `ایمیل: ${customerEmail} | رمزعبور: ${rawCustomerPassword}`
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
    const variantId = order.variantId || order.plan?.variantId || null

    let chosenAccount: { id: string; data: Record<string, unknown> | string } | null = null

    // 1. Check if an account was already RESERVED for this order
    let reservedAccount = await tx.inventoryItem.findFirst({
      where: {
        orderId: order.id,
        status: 'RESERVED',
        type: 'PRE_CREATED_ACCOUNT',
      },
    })

    // Safety Check: Verify reserved item belongs to the correct product/variant
    if (reservedAccount) {
      const matchesProduct = !productId || reservedAccount.productId === productId
      const matchesVariant = variantId
        ? (reservedAccount.variantId === variantId || !reservedAccount.variantId)
        : !reservedAccount.variantId

      if (!matchesProduct || !matchesVariant) {
        console.warn(
          `[FULFILLMENT] Mismatched reserved account ${reservedAccount.id} for order ${order.id} (product: ${productId}, variant: ${variantId}). Releasing back to inventory.`
        )
        // Release mismatched reserved item and fall through to dynamic allocation
        await tx.inventoryItem.update({
          where: { id: reservedAccount.id },
          data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
        })
        reservedAccount = null // Force fallback to correct allocation
      }
    }

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
          AND status = 'AVAILABLE'::"LinkStatus"
          AND (
            (${variantId}::text IS NOT NULL AND "variantId" = ${variantId})
            OR
            (${variantId}::text IS NULL AND "variantId" IS NULL)
            OR
            ("variantId" IS NULL AND "productId" = ${productId})
          )
          AND (
            ${planId}::text IS NULL OR "planId" = ${planId} OR "planId" IS NULL
          )
          AND (
            ${productId}::text IS NULL OR "productId" = ${productId}
          )
        ORDER BY
          (CASE 
            WHEN "variantId" = ${variantId} AND "planId" = ${planId} THEN 100
            WHEN "variantId" = ${variantId} AND "planId" IS NULL THEN 80
            WHEN "variantId" = ${variantId} THEN 70
            WHEN "variantId" IS NULL AND "planId" = ${planId} THEN 50
            WHEN "variantId" IS NULL AND "planId" IS NULL THEN 30
            ELSE 10 
          END) DESC,
          "createdAt" ASC
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
        : (chosenAccount.data as Record<string, any>)

    const email = rawData?.email || rawData?.username || ''
    // Ensure password is safe
    const rawPassword = rawData?.password ? decryptCredential(rawData.password) : ''
    const encryptedPassword = encryptCredential(rawPassword)

    // Self-healing: Ensure inventoryItem data is stored encrypted in database
    if (rawData?.password && rawData.password !== encryptedPassword) {
      await tx.inventoryItem.update({
        where: { id: chosenAccount.id },
        data: {
          data: {
            ...rawData,
            password: encryptedPassword,
          },
        },
      }).catch(() => {})
    }

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
