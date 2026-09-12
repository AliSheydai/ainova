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
import { type ProductItem, type PlanItem, formatPrice } from '../types'
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
      <div
        className='flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground'
        role='status'
        aria-live='polite'
      >
        <Loader2 className='size-8 animate-spin text-primary' aria-hidden='true' />
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
              prod.status === 'ACTIVE' ? 'hover:border-primary/40' : 'opacity-85 bg-muted/15'
            }`}
          >
            <div className='p-3.5 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40'>
              {/* Product Header Info */}
              <div className='flex items-start gap-3 min-w-0 w-full md:flex-1'>
                <div className='size-11 sm:size-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 font-bold mt-0.5'>
                  <Package className='size-5 sm:size-6' />
                </div>
                <div className='min-w-0 flex-1 space-y-1.5'>
                  {/* Product Title - Multi-line word-wrap for mobile */}
                  <div className='w-full'>
                    <h2 className='text-sm sm:text-base font-bold text-foreground break-words whitespace-normal leading-snug'>
                      {prod.title}
                    </h2>
                  </div>

                  {/* Badges & Direct Link */}
                  <div className='flex flex-wrap items-center gap-1.5 pt-0.5'>
                    <Link
                      href={`/products/${prod.slug}`}
                      target='_blank'
                      className='text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-mono text-[11px] bg-muted/40 px-2 py-0.5 rounded-md border border-border/50 max-w-full break-all'
                      title='مشاهده صفحه اختصاصی'
                    >
                      <span className='truncate'>/{prod.slug}</span>
                      <ExternalLink className='size-2.5 shrink-0' />
                    </Link>
                    <ProductStatusBadge status={prod.status} />
                    <Badge variant='outline' className='text-[10px] font-sans px-2 py-0.5'>
                      {plans.length} پلن
                    </Badge>
                    <StockBadge stock={prod.stock} />
                  </div>

                  {prod.shortDescription && (
                    <p className='text-xs text-muted-foreground break-words line-clamp-2 leading-relaxed'>
                      {prod.shortDescription}
                    </p>
                  )}

                  {/* Product Details - Responsive wrap chips */}
                  <div className='flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[11px] pt-1 text-muted-foreground'>
                    <span className='inline-flex items-center gap-1 bg-background px-2 py-1 rounded-lg border border-border/60 shadow-2xs font-medium'>
                      قیمت پایه: <strong className='text-foreground font-sans'>{formatPrice(prod.price)}</strong>
                    </span>
                    <span className='inline-flex items-center gap-1 bg-background px-2 py-1 rounded-lg border border-border/60 shadow-2xs font-medium'>
                      فروش موفق: <strong className='text-foreground font-sans'>{prod.purchaseCount.toLocaleString('fa-IR')}</strong> سفارش
                    </span>
                    <span className='inline-flex items-center gap-1 bg-background px-2 py-1 rounded-lg border border-border/60 shadow-2xs font-medium'>
                      اولویت نمایش: <strong className='text-foreground font-mono'>{prod.sortOrder}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Actions - Fully responsive & wrap */}
              <div className='w-full md:w-auto flex items-center justify-between sm:justify-end gap-1.5 flex-wrap pt-2.5 md:pt-0 border-t md:border-t-0 border-border/40'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onAddPlan(prod.id)}
                  className='h-8 px-2.5 text-xs gap-1 font-semibold border-primary/30 text-primary hover:bg-primary/10 rounded-xl'
                >
                  <Plus className='size-3.5' />
                  <span>افزودن پلن</span>
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onEditProduct(prod)}
                  className='h-8 px-2.5 text-xs gap-1 rounded-xl'
                >
                  <Edit3 className='size-3.5' />
                  <span>ویرایش</span>
                </Button>

                {/* Status Toggle Button: Clearly shows current status per user request */}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onToggleStatus(prod)}
                  className={`h-8 px-2.5 text-xs gap-1 rounded-xl font-medium transition-all ${
                    prod.status === 'ACTIVE'
                      ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400'
                      : 'text-muted-foreground bg-muted/40 border-border/70 hover:bg-muted'
                  }`}
                  title={
                    prod.status === 'ACTIVE'
                      ? 'محصول فعال است (کلیک جهت غیرفعال‌سازی)'
                      : 'محصول غیرفعال است (کلیک جهت فعال‌سازی)'
                  }
                >
                  <Power className={`size-3.5 ${prod.status === 'ACTIVE' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <span>{prod.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}</span>
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onDeleteProduct(prod)}
                  className='h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl'
                  title='حذف یا بایگانی محصول'
                >
                  <Trash2 className='size-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onToggleExpand(prod.id)}
                  className='h-8 px-2 text-xs rounded-xl'
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
