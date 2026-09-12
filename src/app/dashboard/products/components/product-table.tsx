import React from 'react'
import Link from 'next/link'
import {
  Package,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Power,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductItem, PlanItem, formatPrice } from '../types'
import { ProductStatusBadge, StockBadge } from './product-badges'
import { ProductPlansAccordion } from './product-plans-accordion'

interface ProductTableProps {
  products: ProductItem[]
  loading: boolean
  expandedProductIds: Record<string, boolean>
  onToggleExpand: (id: string) => void
  onEditProduct: (product: ProductItem) => void
  onDeleteProduct: (product: ProductItem) => void
  onToggleStatus: (product: ProductItem) => void
  onAddPlan: (productId: string) => void
  onEditPlan: (plan: PlanItem) => void
  onDeletePlan: (planId: string) => void
}

export function ProductTable({
  products,
  loading,
  expandedProductIds,
  onToggleExpand,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
  onAddPlan,
  onEditPlan,
  onDeletePlan,
}: ProductTableProps) {
  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground'>
        <Loader2 className='size-8 animate-spin text-primary' />
        <span className='text-xs'>در حال بارگذاری اطلاعات محصولات...</span>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <Card className='p-12 text-center text-xs text-muted-foreground border-dashed'>
        هنوز هیچ محصولی ثبت نشده است. با کلیک بر روی «محصول جدید» اولین محصول را تعریف کنید.
      </Card>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-4'>
      {products.map((prod) => {
        const isExpanded = expandedProductIds[prod.id] !== false // default expanded
        const plans = prod.plans || []

        return (
          <Card
            key={prod.id}
            className={`border-border/60 shadow-xs overflow-hidden transition-all duration-200 ${
              prod.status === 'ACTIVE' ? 'hover:border-primary/40' : 'opacity-75 bg-muted/20'
            }`}
          >
            <div className='p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40'>
              {/* Product Header Info */}
              <div className='flex items-start gap-3.5 min-w-0 flex-1'>
                <div className='size-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 font-bold'>
                  <Package className='size-6' />
                </div>
                <div className='min-w-0 flex-1 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h2 className='text-sm sm:text-base font-bold text-foreground truncate'>
                      {prod.title}
                    </h2>
                    <Link
                      href={`/products/${prod.slug}`}
                      target='_blank'
                      className='text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono text-xs'
                      title='مشاهده صفحه اختصاصی'
                    >
                      <span>/{prod.slug}</span>
                      <ExternalLink className='size-3' />
                    </Link>
                    <ProductStatusBadge status={prod.status} />
                    <Badge variant='outline' className='text-[10px] font-sans'>
                      {plans.length} پلن
                    </Badge>
                    <StockBadge stock={prod.stock} />
                  </div>
                  {prod.shortDescription && (
                    <p className='text-xs text-muted-foreground line-clamp-1'>
                      {prod.shortDescription}
                    </p>
                  )}
                  <div className='flex flex-wrap items-center gap-4 text-xs pt-1 text-muted-foreground'>
                    <span>قیمت پایه: {formatPrice(prod.price)}</span>
                    <span>فروش موفق: {prod.purchaseCount.toLocaleString('fa-IR')} سفارش</span>
                    <span>اولویت: {prod.sortOrder}</span>
                  </div>
                </div>
              </div>

              {/* Product Actions */}
              <div className='flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onAddPlan(prod.id)}
                  className='h-8 px-2.5 text-xs gap-1 font-semibold border-primary/30 text-primary hover:bg-primary/10'
                >
                  <Plus className='size-3.5' />
                  <span>افزودن پلن</span>
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onEditProduct(prod)}
                  className='h-8 px-2.5 text-xs gap-1'
                >
                  <Edit3 className='size-3.5' />
                  <span>ویرایش</span>
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onToggleStatus(prod)}
                  className={`h-8 px-2.5 text-xs gap-1 ${
                    prod.status === 'ACTIVE'
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                  title={prod.status === 'ACTIVE' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                >
                  <Power className='size-3.5' />
                  <span>{prod.status === 'ACTIVE' ? 'غیرفعال' : 'فعال'}</span>
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onDeleteProduct(prod)}
                  className='h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10'
                  title='حذف یا بایگانی محصول'
                >
                  <Trash2 className='size-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onToggleExpand(prod.id)}
                  className='h-8 px-2 text-xs'
                  title={isExpanded ? 'بستن پلن‌ها' : 'مشاهده پلن‌ها'}
                >
                  {isExpanded ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
                </Button>
              </div>
            </div>

            {/* Associated Plans Accordion Section */}
            {isExpanded && (
              <ProductPlansAccordion
                plans={plans}
                productId={prod.id}
                onAddPlan={onAddPlan}
                onEditPlan={onEditPlan}
                onDeletePlan={onDeletePlan}
              />
            )}
          </Card>
        )
      })}
    </div>
  )
}
