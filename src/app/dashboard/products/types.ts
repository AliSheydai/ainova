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
      return { label: 'لینک فعال‌سازی آنی', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    case 'PRE_CREATED_ACCOUNT':
      return { label: 'اکانت آماده', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
    case 'CUSTOMER_PROVISIONING':
      return { label: 'ساخت روی اکانت مشتری', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    case 'MANUAL':
      return { label: 'تحویل دستی پشتیبانی', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    default:
      return { label: type, color: 'bg-muted text-muted-foreground' }
  }
}
