import { prisma } from '@/lib/prisma'
import { FulfillmentType, OrderStatus, FulfillmentStatus, DeliveryStatus } from '@prisma/client'
import { FulfillmentRegistry } from './registry'
import { FulfillOrderOptions, FulfillOrderResult, ManualDeliveryData } from './types'

export class FulfillmentService {
  /**
   * Calculates real-time available stock for a product or specific plan.
   */
  static async getPlanStock(planId: string): Promise<number> {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true },
    })

    if (!plan) return 0

    const fulfillmentType = plan.fulfillmentType || plan.product?.fulfillmentType || 'ACTIVATION_LINK'

    switch (fulfillmentType) {
      case 'ACTIVATION_LINK': {
        const [linksCount, inventoryCount] = await Promise.all([
          prisma.activationLink.count({
            where: {
              OR: [
                { planId: plan.id, status: 'AVAILABLE' },
                { productId: plan.productId, planId: null, status: 'AVAILABLE' },
              ],
            },
          }),
          prisma.inventoryItem.count({
            where: {
              type: 'ACTIVATION_LINK',
              OR: [
                { planId: plan.id, status: 'AVAILABLE' },
                { productId: plan.productId, planId: null, status: 'AVAILABLE' },
              ],
            },
          }),
        ])
        return linksCount + inventoryCount
      }

      case 'PRE_CREATED_ACCOUNT': {
        return await prisma.inventoryItem.count({
          where: {
            type: 'PRE_CREATED_ACCOUNT',
            status: 'AVAILABLE',
            OR: [
              { planId: plan.id },
              { productId: plan.productId, planId: null },
            ],
          },
        })
      }

      case 'CUSTOMER_PROVISIONING':
      case 'MANUAL':
      default: {
        // Digital on-demand services: always available
        return 999
      }
    }
  }

  /**
   * Calculates overall stock for a product across all its plans.
   */
  static async getProductStock(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        plans: { where: { active: true } },
      },
    })

    if (!product) return 0

    if (product.plans && product.plans.length > 0) {
      // Sum available stock across active plans
      const planStocks = await Promise.all(
        product.plans.map((p) => FulfillmentService.getPlanStock(p.id))
      )
      return planStocks.reduce((sum, s) => sum + s, 0)
    }

    // Fallback if no plans: check activation links or product stock
    if (product.fulfillmentType === 'ACTIVATION_LINK') {
      return await prisma.activationLink.count({
        where: { productId, status: 'AVAILABLE' },
      })
    }

    return product.stock || 999
  }

  /**
   * Calculates verified purchase count for a product.
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
   * Atomically fulfills an order based on Plan's FulfillmentType upon payment verification or admin action.
   */
  static async fulfillOrder({
    orderId,
    refId,
    rawResponse,
    manualDeliveryData,
    adminUserId,
  }: FulfillOrderOptions): Promise<FulfillOrderResult> {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch order with product, plan, delivery and payment
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          product: true,
          plan: {
            include: { product: true },
          },
          payment: true,
          activationLink: true,
          delivery: true,
          user: true,
        },
      })

      if (!order) {
        throw new Error(`ORDER_NOT_FOUND: Order ${orderId} does not exist.`)
      }

      // Determine effective fulfillment type from Plan, fallback to Product
      const effectivePlan = order.plan
      const effectiveProduct = order.product || order.plan?.product

      const fulfillmentType: FulfillmentType =
        effectivePlan?.fulfillmentType ||
        effectiveProduct?.fulfillmentType ||
        'ACTIVATION_LINK'

      // 2. Idempotency check
      if (order.status === 'COMPLETED' && order.delivery?.status === 'DELIVERED') {
        return {
          success: true,
          order,
          delivery: order.delivery,
          activationLink: order.activationLink,
          status: 'ALREADY_COMPLETED',
          message: 'سفارش قبلاً با موفقیت تکمیل و تحویل داده شده است.',
        }
      }

      const now = new Date()

      // 3. Mark payment as SUCCESS if not already
      if (order.payment && order.payment.status !== 'SUCCESS') {
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

      // 4. Get appropriate handler from registry
      const handler = FulfillmentRegistry.getHandler(fulfillmentType)

      const result = await handler.fulfill({
        tx,
        order,
        now,
        refId,
        rawResponse,
        manualDeliveryData,
        adminUserId,
      })

      // 5. Process Handler Outcome
      if (result.status === 'COMPLETED') {
        // Upsert Delivery record
        const deliveryRecord = await tx.delivery.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            type: fulfillmentType,
            status: 'DELIVERED' as DeliveryStatus,
            data: (result.deliveryData as object) || {},
            deliveredAt: now,
          },
          update: {
            type: fulfillmentType,
            status: 'DELIVERED' as DeliveryStatus,
            data: (result.deliveryData as object) || {},
            deliveredAt: now,
          },
        })

        // Update Order to COMPLETED
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED' as OrderStatus,
            fulfillmentStatus: 'COMPLETED' as FulfillmentStatus,
          },
          include: {
            product: true,
            plan: { include: { product: true } },
            payment: true,
            activationLink: true,
            delivery: true,
          },
        })

        // Increment purchase count
        if (effectiveProduct?.id) {
          await tx.product.update({
            where: { id: effectiveProduct.id },
            data: { purchaseCount: { increment: 1 } },
          }).catch(() => {})
        }

        return {
          success: true,
          order: updatedOrder,
          delivery: deliveryRecord,
          activationLink: result.activationLink || order.activationLink,
          status: 'COMPLETED',
          message: result.message,
        }
      }

      // If Stock Exhausted or Awaiting Manual Delivery:
      // Order transitions to PAID with fulfillmentStatus PENDING
      const deliveryRecord = await tx.delivery.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          type: fulfillmentType,
          status: 'PENDING' as DeliveryStatus,
          data: {},
        },
        update: {
          type: fulfillmentType,
          status: 'PENDING' as DeliveryStatus,
        },
      })

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID' as OrderStatus,
          fulfillmentStatus: 'PENDING' as FulfillmentStatus,
        },
        include: {
          product: true,
          plan: { include: { product: true } },
          payment: true,
          activationLink: true,
          delivery: true,
        },
      })

      return {
        success: false,
        order: updatedOrder,
        delivery: deliveryRecord,
        activationLink: null,
        status: result.status,
        message: result.message,
      }
    })
  }

  /**
   * Allows an Admin to fulfill an order manually.
   */
  static async fulfillManualOrder(
    orderId: string,
    manualData: ManualDeliveryData,
    adminUserId?: string
  ): Promise<FulfillOrderResult> {
    return await this.fulfillOrder({
      orderId,
      manualDeliveryData: manualData,
      adminUserId,
    })
  }
}
