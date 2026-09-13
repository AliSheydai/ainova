import { type CheckoutFieldDefinition, type FulfillmentType } from '@/lib/fulfillment/types'
import { formatPrice } from '@/lib/persian-utils'
export { formatPrice }

export interface PlanItem {
  id: string
  productId: string
  name: string
  duration: number
  price: number
  active: boolean
  fulfillmentType: FulfillmentType
  checkoutFields: CheckoutFieldDefinition[] | null
  sortOrder: number
  stock?: number
  _count?: {
    orders: number
  }
}

export interface ProductItem {
  id: string
  title: string
  slug: string
  shortDescription: string | null
  description: string | null
  image: string | null
  price: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  stock: number
  purchaseCount: number
  sortOrder: number
  createdAt: string
  plans?: PlanItem[]
  _count?: {
    orders: number
    inventoryItems: number
  }
}


export function getFulfillmentBadge(type: string) {
  switch (type) {
    case 'ACTIVATION_LINK':
      return { label: 'لینک فعال‌سازی آنی', color: 'bg-primary/10 text-primary border-primary/20' }
    case 'PRE_CREATED_ACCOUNT':
      return { label: 'اکانت آماده', color: 'bg-primary/10 text-primary border-primary/20' }
    case 'CUSTOMER_PROVISIONING':
      return { label: 'ساخت روی اکانت مشتری', color: 'bg-primary/10 text-primary border-primary/20' }
    case 'MANUAL':
      return { label: 'تحویل دستی پشتیبانی', color: 'bg-muted text-muted-foreground border-border' }
    default:
      return { label: type, color: 'bg-muted text-muted-foreground' }
  }
}
