import { IFulfillmentHandler, ActivationLinkDeliveryData } from '../types'
import { ActivationLink } from '@prisma/client'

export class ActivationLinkFulfillmentHandler implements IFulfillmentHandler {
  type = 'ACTIVATION_LINK' as const

  async fulfill({ tx, order, now }: { tx: any; order: any; now: Date }) {
    const effectiveProduct = order.product || order.plan?.product
    const productId = effectiveProduct?.id
    const planId = order.planId

    let linkId: string | null = null
    let linkUrl: string | null = null
    let updatedActivationLink: ActivationLink | null = null

    // 1. Check if a link was already RESERVED for this order
    const reservedLink = await tx.activationLink.findFirst({
      where: { orderId: order.id, status: 'RESERVED' },
    })

    if (reservedLink) {
      linkId = reservedLink.id
      linkUrl = reservedLink.url

      updatedActivationLink = await tx.activationLink.update({
        where: { id: linkId },
        data: {
          productId: productId || undefined,
          status: 'USED',
          assignedAt: reservedLink.assignedAt || now,
          usedAt: now,
        },
      })
    } else {
      // Check if an inventory item was already RESERVED for this order
      const reservedInventory = await tx.inventoryItem.findFirst({
        where: { orderId: order.id, status: 'RESERVED', type: 'ACTIVATION_LINK' },
      })

      if (reservedInventory) {
        const dataObj =
          typeof reservedInventory.data === 'string'
            ? JSON.parse(reservedInventory.data)
            : reservedInventory.data
        linkUrl = dataObj?.url || dataObj?.link

        await tx.inventoryItem.update({
          where: { id: reservedInventory.id },
          data: {
            status: 'USED',
            assignedAt: reservedInventory.assignedAt || now,
            usedAt: now,
          },
        })
      }
    }

    // 2. Fallback: If no item was pre-reserved, allocate an AVAILABLE item dynamically
    if (!linkUrl) {
      const availableRows = await tx.$queryRaw<Array<{ id: string; url: string }>>`
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
            usedAt: now,
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
