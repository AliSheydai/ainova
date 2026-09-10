import { prisma } from '@/lib/prisma'
import { Order, ActivationLink, Payment, Product, FulfillmentType } from '@prisma/client'

export interface FulfillOrderOptions {
  orderId: string
  refId?: string
  rawResponse?: unknown
}

export interface FulfillOrderResult {
  success: boolean
  order: Order & {
    product?: Product | null
    activationLink?: ActivationLink | null
    payment?: Payment | null
  }
  activationLink: ActivationLink | null
  status: 'COMPLETED' | 'STOCK_EXHAUSTED' | 'ALREADY_COMPLETED' | 'ORDER_NOT_FOUND' | 'AWAITING_MANUAL_DELIVERY'
  message: string
}

export class FulfillmentService {
  /**
   * Calculates the available stock for any product based on its fulfillment type.
   * For ACTIVATION_LINK products, stock equals available activation links.
   */
  static async getProductStock(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { fulfillmentType: true, stock: true },
    })

    if (!product) return 0

    if (product.fulfillmentType === 'ACTIVATION_LINK') {
      return await prisma.activationLink.count({
        where: {
          productId,
          status: 'AVAILABLE',
        },
      })
    }

    return product.stock || 0
  }

  /**
   * Calculates dynamic purchase count for a product based on successful (PAID/COMPLETED) orders.
   */
  static async getProductPurchaseCount(productId: string): Promise<number> {
    return await prisma.order.count({
      where: {
        productId,
        status: { in: ['PAID', 'COMPLETED'] },
      },
    })
  }

  /**
   * Atomically fulfills an order based on the Product's FulfillmentType upon payment verification.
   * Uses PostgreSQL "FOR UPDATE SKIP LOCKED" to guarantee race-condition safety under high concurrency.
   * Links belonging to Product A can NEVER be assigned to Product B.
   */
  static async fulfillOrder({
    orderId,
    refId,
    rawResponse,
  }: FulfillOrderOptions): Promise<FulfillOrderResult> {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch order with product and existing associations
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          product: true,
          activationLink: true,
          payment: true,
          plan: {
            include: { product: true },
          },
        },
      })

      if (!order) {
        throw new Error(`ORDER_NOT_FOUND: Order ${orderId} does not exist.`)
      }

      // Determine the definitive product for this order
      const effectiveProduct = order.product || order.plan?.product

      if (!effectiveProduct) {
        throw new Error(`PRODUCT_NOT_FOUND: Order ${orderId} is not associated with any product.`)
      }

      const productId = effectiveProduct.id
      const fulfillmentType: FulfillmentType =
        effectiveProduct.fulfillmentType || 'ACTIVATION_LINK'

      // 2. Idempotency check: Already completed with delivery?
      if (order.status === 'COMPLETED' && (order.activationLink || fulfillmentType !== 'ACTIVATION_LINK')) {
        return {
          success: true,
          order,
          activationLink: order.activationLink,
          status: 'ALREADY_COMPLETED',
          message: 'سفارش قبلاً با موفقیت تکمیل و تحویل داده شده است.',
        }
      }

      const now = new Date()

      // 3. Dispatch based on product FulfillmentType
      switch (fulfillmentType) {
        case 'ACTIVATION_LINK': {
          // Find one available activation link for THIS SPECIFIC PRODUCT using SKIP LOCKED
          // Links for other products will NEVER be selected
          const availableRows = await tx.$queryRaw<Array<{ id: string; url: string }>>`
            SELECT id, url 
            FROM activation_links 
            WHERE ("productId" = ${productId} OR ("planId" = ${order.planId} AND "productId" IS NULL))
              AND status = 'AVAILABLE'::"LinkStatus"
            LIMIT 1 
            FOR UPDATE SKIP LOCKED
          `

          const chosenLinkRow = availableRows[0]

          if (!chosenLinkRow) {
            // STOCK EXHAUSTION SCENARIO:
            // Payment is confirmed (SUCCESS), but Order transitions to PAID (awaiting inventory/fulfillment)
            if (order.payment) {
              await tx.payment.update({
                where: { id: order.payment.id },
                data: {
                  status: 'SUCCESS',
                  refId: refId || order.payment.refId,
                  paidAt: now,
                  gatewayResponse: (rawResponse as object) || order.payment.gatewayResponse || {},
                },
              })
            }

            const updatedOrder = await tx.order.update({
              where: { id: order.id },
              data: { status: 'PAID' },
              include: {
                product: true,
                activationLink: true,
                payment: true,
              },
            })

            return {
              success: false,
              order: updatedOrder,
              activationLink: null,
              status: 'STOCK_EXHAUSTED',
              message:
                'پرداخت تایید شد، اما موجودی لینک‌های فعال‌سازی این محصول به پایان رسیده است. سفارش در وضعیت پرداخت‌شده (PAID) قرار گرفت.',
            }
          }

          // Stock is available: Assign link atomically to this order
          const updatedLink = await tx.activationLink.update({
            where: { id: chosenLinkRow.id },
            data: {
              productId,
              status: 'USED',
              orderId: order.id,
              assignedAt: now,
            },
          })

          // Update Payment to SUCCESS
          if (order.payment) {
            await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                status: 'SUCCESS',
                refId: refId || order.payment.refId,
                paidAt: now,
                gatewayResponse: (rawResponse as object) || order.payment.gatewayResponse || {},
              },
            })
          }

          // Update Order to COMPLETED
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: { status: 'COMPLETED' },
            include: {
              product: true,
              activationLink: true,
              payment: true,
            },
          })

          // Update product purchase count
          await tx.product.update({
            where: { id: productId },
            data: { purchaseCount: { increment: 1 } },
          }).catch(() => {})

          return {
            success: true,
            order: updatedOrder,
            activationLink: updatedLink,
            status: 'COMPLETED',
            message: 'سفارش با موفقیت تکمیل و لینک فعال‌سازی اختصاص داده شد.',
          }
        }

        case 'MANUAL': {
          // Manual fulfillment: mark payment as SUCCESS, order as PAID
          if (order.payment) {
            await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                status: 'SUCCESS',
                refId: refId || order.payment.refId,
                paidAt: now,
                gatewayResponse: (rawResponse as object) || order.payment.gatewayResponse || {},
              },
            })
          }

          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: { status: 'PAID' },
            include: {
              product: true,
              activationLink: true,
              payment: true,
            },
          })

          return {
            success: true,
            order: updatedOrder,
            activationLink: null,
            status: 'AWAITING_MANUAL_DELIVERY',
            message: 'پرداخت تایید شد. این محصول نیازمند تحویل دستی توسط ادمین است.',
          }
        }

        case 'ACTIVATION_CODE':
        case 'DOWNLOAD':
        default: {
          // Extensible generic handler
          if (order.payment) {
            await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                status: 'SUCCESS',
                refId: refId || order.payment.refId,
                paidAt: now,
                gatewayResponse: (rawResponse as object) || order.payment.gatewayResponse || {},
              },
            })
          }

          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: { status: 'COMPLETED' },
            include: {
              product: true,
              activationLink: true,
              payment: true,
            },
          })

          await tx.product.update({
            where: { id: productId },
            data: { purchaseCount: { increment: 1 } },
          }).catch(() => {})

          return {
            success: true,
            order: updatedOrder,
            activationLink: null,
            status: 'COMPLETED',
            message: 'سفارش با موفقیت پرداخت و ثبت گردید.',
          }
        }
      }
    })
  }
}
