import { prisma } from '@/lib/prisma'
import { Order, ActivationLink, Payment } from '@prisma/client'

export interface FulfillOrderOptions {
  orderId: string
  refId?: string
  rawResponse?: unknown
}

export interface FulfillOrderResult {
  success: boolean
  order: Order & {
    activationLink?: ActivationLink | null
    payment?: Payment | null
  }
  activationLink: ActivationLink | null
  status: 'COMPLETED' | 'STOCK_EXHAUSTED' | 'ALREADY_COMPLETED' | 'ORDER_NOT_FOUND'
  message: string
}

export class FulfillmentService {
  /**
   * Atomically assigns an activation link to an order upon successful payment verification.
   * Uses PostgreSQL "FOR UPDATE SKIP LOCKED" to guarantee race-condition safety under high concurrency.
   */
  static async fulfillOrder({
    orderId,
    refId,
    rawResponse,
  }: FulfillOrderOptions): Promise<FulfillOrderResult> {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch order with current associations
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          activationLink: true,
          payment: true,
          plan: true,
        },
      })

      if (!order) {
        throw new Error(`ORDER_NOT_FOUND: Order ${orderId} does not exist.`)
      }

      // 2. Idempotency check: Already completed with link?
      if (order.status === 'COMPLETED' && order.activationLink) {
        return {
          success: true,
          order,
          activationLink: order.activationLink,
          status: 'ALREADY_COMPLETED',
          message: 'سفارش قبلاً با موفقیت تکمیل و تحویل داده شده است.',
        }
      }

      const now = new Date()

      // 3. Find one available activation link for the ordered plan using SKIP LOCKED
      // This prevents race conditions: concurrent transactions will lock distinct rows
      const availableRows = await tx.$queryRaw<Array<{ id: string; url: string }>>`
        SELECT id, url 
        FROM activation_links 
        WHERE "planId" = ${order.planId} AND status = 'AVAILABLE'::"LinkStatus"
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
      `

      const chosenLinkRow = availableRows[0]

      if (!chosenLinkRow) {
        // STOCK EXHAUSTION SCENARIO:
        // Payment is confirmed (SUCCESS), but Order transitions to PAID (awaiting inventory/fulfillment)
        // NOT COMPLETED!

        const updatedPayment = order.payment
          ? await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                status: 'SUCCESS',
                refId: refId || order.payment.refId,
                paidAt: now,
                gatewayResponse: (rawResponse as object) || order.payment.gatewayResponse || {},
              },
            })
          : null

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
          },
          include: {
            activationLink: true,
            payment: true,
            plan: true,
          },
        })

        return {
          success: false,
          order: updatedOrder,
          activationLink: null,
          status: 'STOCK_EXHAUSTED',
          message:
            'پرداخت تایید شد، اما موجودی لینک‌های فعال‌سازی به پایان رسیده است. سفارش در وضعیت پرداخت‌شده (PAID) قرار گرفت.',
        }
      }

      // 4. Stock is available: Assign link atomically
      const updatedLink = await tx.activationLink.update({
        where: { id: chosenLinkRow.id },
        data: {
          status: 'USED',
          orderId: order.id,
          assignedAt: now,
        },
      })

      // Update Payment record to SUCCESS
      const updatedPayment = order.payment
        ? await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: 'SUCCESS',
              refId: refId || order.payment.refId,
              paidAt: now,
              gatewayResponse: (rawResponse as object) || order.payment.gatewayResponse || {},
            },
          })
        : null

      // Update Order status to COMPLETED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
        },
        include: {
          activationLink: true,
          payment: true,
          plan: true,
        },
      })

      return {
        success: true,
        order: updatedOrder,
        activationLink: updatedLink,
        status: 'COMPLETED',
        message: 'سفارش با موفقیت تکمیل و لینک فعال‌سازی اختصاص داده شد.',
      }
    })
  }
}
