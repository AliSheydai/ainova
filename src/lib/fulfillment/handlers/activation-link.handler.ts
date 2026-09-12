import { IFulfillmentHandler, ActivationLinkDeliveryData } from '../types'
import { ActivationLink } from '@prisma/client'

export class ActivationLinkFulfillmentHandler implements IFulfillmentHandler {
  type = 'ACTIVATION_LINK' as const

  async fulfill({ tx, order, now }: { tx: any; order: any; now: Date }) {
    const effectiveProduct = order.product || order.plan?.product
    const productId = effectiveProduct?.id
    const planId = order.planId

    // Try finding an available link in activation_links table first (for full backward-compat)
    let availableRows = await tx.$queryRaw<Array<{ id: string; url: string }>>`
      SELECT id, url 
      FROM activation_links 
      WHERE (
        ("planId" = ${planId} AND "planId" IS NOT NULL) OR 
        ("productId" = ${productId} AND ("planId" IS NULL OR "planId" = ${planId}))
      )
      AND status = 'AVAILABLE'::"LinkStatus"
      LIMIT 1 
      FOR UPDATE SKIP LOCKED
    `

    let linkId: string | null = null
    let linkUrl: string | null = null
    let updatedActivationLink: ActivationLink | null = null

    if (availableRows && availableRows.length > 0) {
      linkId = availableRows[0].id
      linkUrl = availableRows[0].url

      updatedActivationLink = await tx.activationLink.update({
        where: { id: linkId },
        data: {
          productId: productId || undefined,
          status: 'USED',
          orderId: order.id,
          assignedAt: now,
        },
      })
    } else {
      // Check generic inventory_items table
      const inventoryRows = await tx.$queryRaw<Array<{ id: string; data: any }>>`
        SELECT id, data
        FROM inventory_items
        WHERE type = 'ACTIVATION_LINK'::"InventoryType"
          AND (
            ("planId" = ${planId} AND "planId" IS NOT NULL) OR 
            ("productId" = ${productId})
          )
          AND status = 'AVAILABLE'::"LinkStatus"
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `

      if (inventoryRows && inventoryRows.length > 0) {
        const item = inventoryRows[0]
        const dataObj = typeof item.data === 'string' ? JSON.parse(item.data) : item.data
        linkUrl = dataObj?.url || dataObj?.link

        await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            status: 'USED',
            orderId: order.id,
            assignedAt: now,
            usedAt: now,
          },
        })
      }
    }

    if (!linkUrl) {
      return {
        status: 'STOCK_EXHAUSTED' as const,
        message: 'پرداخت تایید شد، اما موجودی لینک‌های فعال‌سازی به پایان رسیده است. سفارش در صف تامین قرار گرفت.',
      }
    }

    const deliveryData: ActivationLinkDeliveryData = {
      url: linkUrl,
      instructions: 'روی لینک کلیک کنید و در حساب کاربری گوگل خود فعال‌سازی را تأیید فرمایید.',
    }

    return {
      status: 'COMPLETED' as const,
      message: 'سفارش با موفقیت تکمیل و لینک فعال‌سازی اختصاص داده شد.',
      deliveryData,
      activationLink: updatedActivationLink,
    }
  }
}
