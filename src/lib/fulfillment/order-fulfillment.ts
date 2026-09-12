import { prisma } from '@/lib/prisma'
import { type FulfillmentType, type OrderStatus, type FulfillmentStatus, type DeliveryStatus } from '@prisma/client'
import { FulfillmentRegistry } from './registry'
import { type FulfillOrderOptions, type FulfillOrderResult, type ManualDeliveryData } from './types'
import { memoryCache } from '@/lib/cache/memory-cache'

export interface EnrichedProductMetrics {
  stock: number
  purchaseCount: number
  planStocks: Record<string, number>
}

export class FulfillmentService {
  /**
   * Invalidates all cached stocks and overview stats across the system.
   */
  static invalidateStockCache(): void {
    memoryCache.deletePattern('stock:')
    memoryCache.delete('admin:overview')
  }

  /**
   * High-performance batch resolver for product stock and purchase counts.
   * Executes only 2 consolidated groupBy queries regardless of the number of products and plans.
   */
  static async batchGetProductsStockAndPurchases(
    products: Array<{
      id: string
      plans?: Array<{ id: string; fulfillmentType?: FulfillmentType | string }>
    }>
  ): Promise<Map<string, EnrichedProductMetrics>> {
    const resultMap = new Map<string, EnrichedProductMetrics>()
    if (!products || products.length === 0) return resultMap

    const productIds = products.map((p) => p.id)

    // Parallel execution of only 2 batch queries
    const [orderCounts, inventoryCounts] = await Promise.all([
      // 1. Grouped purchase count per product
      prisma.order.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          status: { in: ['PAID', 'COMPLETED'] },
        },
        _count: { _all: true },
      }),
      // 2. Grouped available inventory items per product, plan, and type
      prisma.inventoryItem.groupBy({
        by: ['productId', 'planId', 'type'],
        where: {
          productId: { in: productIds },
          status: 'AVAILABLE',
        },
        _count: { _all: true },
      }),
    ])

    const purchaseCountMap = new Map<string, number>()
    for (const item of orderCounts) {
      if (item.productId) {
        purchaseCountMap.set(item.productId, item._count._all)
      }
    }

    for (const prod of products) {
      const purchaseCount = purchaseCountMap.get(prod.id) || 0
      const planStocks: Record<string, number> = {}
      let totalProductStock = 0

      const activePlans = prod.plans || []

      if (activePlans.length > 0) {
        for (const plan of activePlans) {
          const fType = (plan.fulfillmentType || 'ACTIVATION_LINK') as FulfillmentType

          let planStock = 0
          if (
            fType === 'CUSTOMER_PROVISIONING' ||
            fType === 'MANUAL' ||
            fType === 'DOWNLOAD' ||
            fType === 'ACTIVATION_CODE'
          ) {
            planStock = 999
          } else {
            // Count matching available inventory items
            // Matches items assigned directly to this plan OR unassigned items for this product
            for (const inv of inventoryCounts) {
              if (
                inv.type === fType &&
                (inv.planId === plan.id || (inv.productId === prod.id && !inv.planId))
              ) {
                planStock += inv._count._all
              }
            }
          }

          planStocks[plan.id] = planStock
          totalProductStock += planStock
        }
      } else {
        // Product without active plans: count items assigned directly to product
        for (const inv of inventoryCounts) {
          if (inv.productId === prod.id && !inv.planId) {
            totalProductStock += inv._count._all
          }
        }
      }

      resultMap.set(prod.id, {
        stock: totalProductStock,
        purchaseCount,
        planStocks,
      })
    }

    return resultMap
  }

  /**
   * Calculates real-time available stock for a specific plan with caching.
   */
  static async getPlanStock(planId: string): Promise<number> {
    const cacheKey = `stock:plan:${planId}`
    return memoryCache.getOrSet(cacheKey, 30, async () => {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      })

      if (!plan) return 0

      const fulfillmentType: FulfillmentType = plan.fulfillmentType || 'ACTIVATION_LINK'

      switch (fulfillmentType) {
        case 'ACTIVATION_LINK': {
          return await prisma.inventoryItem.count({
            where: {
              type: 'ACTIVATION_LINK',
              status: 'AVAILABLE',
              OR: [
                { planId: plan.id },
                { productId: plan.productId, planId: null },
              ],
            },
          })
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
    })
  }

  /**
   * Calculates overall stock for a product across all its active plans with caching.
   */
  static async getProductStock(productId: string): Promise<number> {
    const cacheKey = `stock:product:${productId}`
    return memoryCache.getOrSet(cacheKey, 30, async () => {
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

      return 0
    })
  }

  /**
   * Calculates verified purchase count for a product with caching.
   */
  static async getProductPurchaseCount(productId: string): Promise<number> {
    const cacheKey = `stock:purchases:${productId}`
    return memoryCache.getOrSet(cacheKey, 30, async () => {
      return await prisma.order.count({
        where: {
          productId,
          status: { in: ['PAID', 'COMPLETED'] },
        },
      })
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
    const txResult = await prisma.$transaction<FulfillOrderResult>(async (tx) => {
      // 1. Fetch order with product, plan, delivery, inventoryItem and payment
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          product: true,
          plan: {
            include: { product: true },
          },
          payment: true,
          activationLink: true,
          inventoryItem: true,
          delivery: true,
          user: true,
        },
      })

      if (!order) {
        throw new Error(`ORDER_NOT_FOUND: Order ${orderId} does not exist.`)
      }

      // Determine effective fulfillment type from Plan
      const fulfillmentType: FulfillmentType =
        order.plan?.fulfillmentType || 'ACTIVATION_LINK'

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
            inventoryItem: true,
            delivery: true,
          },
        })

        // Increment purchase count
        const effectiveProductId = order.productId || order.plan?.productId
        if (effectiveProductId) {
          await tx.product.update({
            where: { id: effectiveProductId },
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
          inventoryItem: true,
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

    // Invalidate stock and overview cache on successful mutation
    FulfillmentService.invalidateStockCache()

    return txResult
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
