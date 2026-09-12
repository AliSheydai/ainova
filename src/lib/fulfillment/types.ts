import { FulfillmentType, DeliveryStatus, FulfillmentStatus, Order, Product, Plan, Payment, ActivationLink, Delivery, InventoryItem } from '@prisma/client'

export { FulfillmentType, DeliveryStatus, FulfillmentStatus }

export type CheckoutFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'checkbox'

export interface CheckoutFieldDefinition {
  key: string
  label: string
  type: CheckoutFieldType
  required: boolean
  placeholder?: string
  defaultValue?: string
  options?: Array<{ label: string; value: string }>
  validationRegex?: string
  order: number
}

export interface ActivationLinkDeliveryData {
  url: string
  instructions?: string
}

export interface AccountCredentialsDeliveryData {
  email: string
  password?: string
  username?: string
  recoveryEmail?: string
  note?: string
}

export interface CustomerProvisioningDeliveryData {
  email: string
  serviceName?: string
  provisionDetails?: string
  accountInfo?: string
  status: 'COMPLETED' | 'PENDING'
}

export interface ManualDeliveryData {
  manualNote: string
  deliveredInfo?: string
  deliveredByAdminId?: string
  deliveredAt?: string
}

export type AnyDeliveryData =
  | ActivationLinkDeliveryData
  | AccountCredentialsDeliveryData
  | CustomerProvisioningDeliveryData
  | ManualDeliveryData
  | Record<string, unknown>

export interface FulfillOrderOptions {
  orderId: string
  refId?: string
  rawResponse?: unknown
  manualDeliveryData?: ManualDeliveryData
  adminUserId?: string
}

export interface FulfillOrderResult {
  success: boolean
  order: Order & {
    product?: Product | null
    plan?: (Plan & { product?: Product | null }) | null
    activationLink?: ActivationLink | null
    delivery?: Delivery | null
    payment?: Payment | null
  }
  delivery: Delivery | null
  activationLink: ActivationLink | null
  status: 'COMPLETED' | 'STOCK_EXHAUSTED' | 'ALREADY_COMPLETED' | 'ORDER_NOT_FOUND' | 'AWAITING_MANUAL_DELIVERY' | 'FAILED'
  message: string
}

export interface IFulfillmentHandler {
  type: FulfillmentType
  fulfill(options: {
    tx: any
    order: Order & {
      product: Product | null
      plan: (Plan & { product?: Product | null }) | null
      payment: Payment | null
      activationLink: ActivationLink | null
      delivery: Delivery | null
    }
    now: Date
    refId?: string
    rawResponse?: unknown
    manualDeliveryData?: ManualDeliveryData
    adminUserId?: string
  }): Promise<{
    status: 'COMPLETED' | 'STOCK_EXHAUSTED' | 'AWAITING_MANUAL_DELIVERY' | 'FAILED'
    message: string
    deliveryData?: AnyDeliveryData
    activationLink?: ActivationLink | null
  }>
}
