import { IFulfillmentHandler, CustomerProvisioningDeliveryData } from '../types'

export class CustomerProvisioningFulfillmentHandler implements IFulfillmentHandler {
  type = 'CUSTOMER_PROVISIONING' as const

  async fulfill({ tx, order, now }: { tx: any; order: any; now: Date }) {
    const checkoutData = (order.checkoutData as Record<string, any>) || {}
    const customerEmail =
      checkoutData.email ||
      checkoutData.customer_email ||
      checkoutData.user_email ||
      order.user?.phone ||
      'مشتری'

    // Extensible Provisioning hook:
    // In production or when an external API is connected, call external provisioning API here.
    // For now, simulate successful automated provisioning.
    const serviceName =
      order.plan?.product?.title ||
      order.product?.title ||
      'سرویس'

    const deliveryData: CustomerProvisioningDeliveryData = {
      email: customerEmail,
      serviceName,
      provisionDetails: `اشتراک ${serviceName} با موفقیت روی حساب کاربری «${customerEmail}» فعال گردید.`,
      accountInfo: `ایمیل فعال‌شده: ${customerEmail}`,
      status: 'COMPLETED',
    }

    return {
      status: 'COMPLETED' as const,
      message: `اشتراک با موفقیت روی حساب ${customerEmail} فعال‌سازی شد.`,
      deliveryData,
    }
  }
}
