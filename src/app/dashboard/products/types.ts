import { type CheckoutFieldDefinition, type FulfillmentType } from '@/lib/fulfillment/types'
import { formatPrice } from '@/lib/persian-utils'
export { formatPrice }

export interface VariantItem {
  id: string
  productId: string
  name: string
  slug?: string | null
  description?: string | null
  price: number
  discountedPrice?: number | null
  discountLabel?: string | null
  duration: number
  features?: string[] | null
  badge?: string | null
  active: boolean
  sortOrder: number
  plans?: PlanItem[]
  _count?: {
    orders: number
    plans?: number
  }
}

export interface PlanItem {
  id: string
  productId: string
  variantId?: string | null
  variant?: VariantItem | null
  name: string
  duration: number
  planType?: string | null
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
  videoUrl?: string | null
  price: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  stock: number
  purchaseCount: number
  sortOrder: number
  isFeatured?: boolean
  featuredOrder?: number
  createdAt: string
  plans?: PlanItem[]
  variants?: VariantItem[]
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
