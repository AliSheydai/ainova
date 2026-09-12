import { type IFulfillmentHandler, type ManualDeliveryData, type OrderWithFulfillmentDetails, type PrismaTransactionClient } from '../types'

export class ManualFulfillmentHandler implements IFulfillmentHandler {
  type = 'MANUAL' as const

  async fulfill({
    tx: _tx,
    order: _order,
    now,
    manualDeliveryData,
    adminUserId,
  }: {
    tx: PrismaTransactionClient
    order: OrderWithFulfillmentDetails
    now: Date
    manualDeliveryData?: ManualDeliveryData
    adminUserId?: string
  }) {
    // If admin has supplied manual delivery data, this is the admin fulfilling the order
    if (manualDeliveryData && manualDeliveryData.manualNote) {
      const deliveryData: ManualDeliveryData = {
        manualNote: manualDeliveryData.manualNote,
        deliveredInfo: manualDeliveryData.deliveredInfo || '',
        deliveredByAdminId: adminUserId || 'ADMIN',
        deliveredAt: now.toISOString(),
      }

      return {
        status: 'COMPLETED' as const,
        message: 'سفارش دستی توسط مدیر سیستم تکمیل و تحویل داده شد.',
        deliveryData,
      }
    }

    // Default flow upon customer payment: order is paid, but awaiting manual fulfillment by admin
    return {
      status: 'AWAITING_MANUAL_DELIVERY' as const,
      message: 'پرداخت با موفقیت تایید شد. این سفارش نیازمند آماده‌سازی و تحویل دستی توسط پشتیبانی است.',
    }
  }
}
