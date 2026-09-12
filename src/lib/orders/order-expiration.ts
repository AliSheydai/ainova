import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus } from '@prisma/client'

export interface ExpireOrdersResult {
  expiredOrdersCount: number
  releasedInventoryCount: number
  orderIds: string[]
}

export class OrderExpirationService {
  /**
   * Default timeout in minutes before an unpaid pending order expires (30 minutes).
   */
  public static readonly DEFAULT_TIMEOUT_MINUTES = 30

  /**
   * Identifies orders that have stayed in PENDING_PAYMENT status longer than
   * `olderThanMinutes`, marks them as EXPIRED, sets associated payments to FAILED,
   * and immediately releases any RESERVED inventory items back to AVAILABLE status.
   */
  static async expirePendingOrders(olderThanMinutes = this.DEFAULT_TIMEOUT_MINUTES): Promise<ExpireOrdersResult> {
    const cutoffDate = new Date(Date.now() - olderThanMinutes * 60 * 1000)

    return await prisma.$transaction(async (tx) => {
      // 1. Find all stale pending orders
      const staleOrders = await tx.order.findMany({
        where: {
          status: OrderStatus.PENDING_PAYMENT,
          createdAt: { lt: cutoffDate },
        },
        select: { id: true },
      })

      if (staleOrders.length === 0) {
        return {
          expiredOrdersCount: 0,
          releasedInventoryCount: 0,
          orderIds: [],
        }
      }

      const orderIds = staleOrders.map((o) => o.id)

      // 2. Release any reserved inventory items atomically
      const releasedInventory = await tx.inventoryItem.updateMany({
        where: {
          orderId: { in: orderIds },
          status: 'RESERVED',
        },
        data: {
          status: 'AVAILABLE',
          orderId: null,
          assignedAt: null,
        },
      })

      // 3. Mark pending payments as FAILED
      await tx.payment.updateMany({
        where: {
          orderId: { in: orderIds },
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      })

      // 4. Update order status to EXPIRED
      const updatedOrders = await tx.order.updateMany({
        where: {
          id: { in: orderIds },
          status: OrderStatus.PENDING_PAYMENT,
        },
        data: {
          status: OrderStatus.EXPIRED,
        },
      })

      return {
        expiredOrdersCount: updatedOrders.count,
        releasedInventoryCount: releasedInventory.count,
        orderIds,
      }
    })
  }

  /**
   * Lazy on-demand cleanup: runs safely in the background without blocking the caller.
   */
  static triggerBackgroundCleanup(): void {
    this.expirePendingOrders()
      .then((res) => {
        if (res.expiredOrdersCount > 0) {
          console.log(
            `[OrderExpiration] Background cleanup expired ${res.expiredOrdersCount} orders and released ${res.releasedInventoryCount} inventory items.`
          )
        }
      })
      .catch((err) => {
        console.error('[OrderExpiration] Background cleanup error:', err)
      })
  }
}
