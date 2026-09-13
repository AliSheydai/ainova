'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Package,
  Zap,
  ArrowLeft,
  Check,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Bot,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductsPagination } from '@/components/products/products-pagination'
import { formatPrice, toPersianDigits } from '@/lib/persian-utils'
import { cn } from '@/lib/utils'

export interface CatalogPlan {
  id: string
  name: string
  duration: number
  price: number
  fulfillmentType: string
  stock?: number
}

export interface CatalogProduct {
  id: string
  title: string
  slug: string
  shortDescription: string | null
  description?: string | null
  price: number
  minPrice: number
  hasMultiplePlans: boolean
  image?: string | null
  stock: number
  purchaseCount: number
  fulfillmentType: string
  features?: string[] | null
  plans: CatalogPlan[]
}

export type AiCategory = 'all' | 'gemini' | 'chatgpt' | 'claude' | 'creative' | 'other'

const AI_CATEGORIES: { id: AiCategory; label: string }[] = [
  { id: 'all', label: 'همه هوش‌های مصنوعی' },
  { id: 'gemini', label: 'گوگل و جمینای (Gemini)' },
  { id: 'chatgpt', label: 'چت‌جی‌پی‌تی (ChatGPT)' },
  { id: 'claude', label: 'کلود (Claude)' },
  { id: 'creative', label: 'طراحی و ابزارهای مدیا' },
  { id: 'other', label: 'سایر سرویس‌ها' },
]

export function detectAiCategory(product: CatalogProduct): AiCategory {
  const text = `${product.title} ${product.slug} ${product.shortDescription || ''} ${product.description || ''}`.toLowerCase()
  if (text.includes('gemini') || text.includes('google') || text.includes('جمینای') || text.includes('گوگل')) {
    return 'gemini'
  }
  if (text.includes('chatgpt') || text.includes('gpt') || text.includes('openai') || text.includes('چت جی پی تی') || text.includes('چت‌جی‌پی‌تی') || text.includes('اوپن ای آی')) {
    return 'chatgpt'
  }
  if (text.includes('claude') || text.includes('anthropic') || text.includes('کلود') || text.includes('کلاد') || text.includes('آنتروپیک')) {
    return 'claude'
  }
  if (text.includes('midjourney') || text.includes('میدجورنی') || text.includes('dall-e') || text.includes('canva') || text.includes('طراحی') || text.includes('گرافیک')) {
    return 'creative'
  }
  return 'other'
}

function getFulfillmentLabel(type: string): { label: string; badgeClass: string } {
  switch (type) {
    case 'ACTIVATION_LINK':
      return {
        label: 'لینک فعال‌سازی آنی',
        badgeClass: 'bg-primary/10 text-primary border-primary/25',
      }
    case 'PRE_CREATED_ACCOUNT':
      return {
        label: 'اکانت آماده اختصاصی',
        badgeClass: 'bg-foreground/10 text-foreground border-border',
      }
    case 'CUSTOMER_PROVISIONING':
      return {
        label: 'فعال‌سازی روی اکانت شما',
        badgeClass: 'bg-muted text-foreground border-border',
      }
    case 'MANUAL':
      return {
        label: 'تحویل دستی پشتیبانی',
        badgeClass: 'bg-muted text-muted-foreground border-border/80',
      }
    default:
      return {
        label: 'تحویل آنلاین',
        badgeClass: 'bg-muted text-muted-foreground border-border/80',
      }
  }
}

function getPlanTypeLabel(type: string): string {
  switch (type) {
    case 'ACTIVATION_LINK':
      return 'لینک فعال‌سازی آنی'
    case 'PRE_CREATED_ACCOUNT':
      return 'اکانت آماده اختصاصی'
    case 'CUSTOMER_PROVISIONING':
      return 'فعال‌سازی روی ایمیل شما'
    case 'MANUAL':
      return 'تحویل دستی پشتیبانی'
    default:
      return 'همه انواع پلن'
  }
}

interface ProductsCatalogProps {
  initialProducts: CatalogProduct[]
}

const ITEMS_PER_PAGE = 6

export function ProductsCatalog({ initialProducts }: ProductsCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<AiCategory>('all')
  const [selectedPlanType, setSelectedPlanType] = useState<string>('all')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'newest'>('popular')
  const [currentPage, setCurrentPage] = useState(1)

  const catalogTopRef = useRef<HTMLDivElement>(null)

  // Compute category counts for badge pills
  const categoryCounts = useMemo(() => {
    const counts: Record<AiCategory, number> = {
      all: initialProducts.length,
      gemini: 0,
      chatgpt: 0,
      claude: 0,
      creative: 0,
      other: 0,
    }

    initialProducts.forEach((p) => {
      const cat = detectAiCategory(p)
      counts[cat] = (counts[cat] || 0) + 1
    })

    return counts
  }, [initialProducts])

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const matchTitle = product.title.toLowerCase().includes(query)
        const matchShortDesc = (product.shortDescription || '').toLowerCase().includes(query)
        const matchDesc = (product.description || '').toLowerCase().includes(query)
        const matchPlans = product.plans.some((pl) => pl.name.toLowerCase().includes(query))
        if (!matchTitle && !matchShortDesc && !matchDesc && !matchPlans) {
          return false
        }
      }

      // 2. AI Category
      if (selectedCategory !== 'all') {
        const cat = detectAiCategory(product)
        if (cat !== selectedCategory) return false
      }

      // 3. Plan / Fulfillment Type
      if (selectedPlanType !== 'all') {
        const hasMatchingPlan = product.plans.some((p) => p.fulfillmentType === selectedPlanType)
        const matchesMainType = product.fulfillmentType === selectedPlanType
        if (!hasMatchingPlan && !matchesMainType) return false
      }

      // 4. Stock
      if (onlyInStock) {
        const hasAvailablePlan = product.plans.some(
          (p) => (p.stock ?? 0) > 0 || p.fulfillmentType === 'PRE_CREATED_ACCOUNT'
        )
        const isAvailable = product.stock > 0 || hasAvailablePlan
        if (!isAvailable) return false
      }

      return true
    }).sort((a, b) => {
      const priceA = a.minPrice > 0 ? a.minPrice : a.price
      const priceB = b.minPrice > 0 ? b.minPrice : b.price

      switch (sortBy) {
        case 'price_asc':
          return priceA - priceB
        case 'price_desc':
          return priceB - priceA
        case 'newest':
          return b.id.localeCompare(a.id)
        case 'popular':
        default:
          return (b.purchaseCount || 0) - (a.purchaseCount || 0)
      }
    })
  }, [initialProducts, searchQuery, selectedCategory, selectedPlanType, onlyInStock, sortBy])

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  // Reset page when filters change
  const handleFilterChange = (updater: () => void) => {
    updater()
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (catalogTopRef.current) {
      catalogTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedPlanType('all')
    setOnlyInStock(false)
    setSortBy('popular')
    setCurrentPage(1)
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedPlanType !== 'all' ||
    onlyInStock

  return (
    <div ref={catalogTopRef} className='space-y-6'>
      {/* Controls Card: Search & Filters */}
      <div className='rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs'>
        <div className='flex flex-col gap-4'>
          {/* Top Row: Search Input */}
          <div className='relative w-full'>
            <Search className='absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
            <Input
              type='text'
              value={searchQuery}
              onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
              placeholder='جستجوی نام سرویس، هوش مصنوعی یا مشخصات اشتراک...'
              className='h-11 sm:h-12 pe-10 ps-10 text-xs sm:text-sm rounded-xl border-border/80 bg-background/60 focus:bg-background transition-colors'
            />
            {searchQuery && (
              <button
                type='button'
                onClick={() => handleFilterChange(() => setSearchQuery(''))}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors'
                aria-label='پاک کردن جستجو'
              >
                <X className='size-3' />
              </button>
            )}
          </div>

          {/* Bottom Row: AI Category, Plan Type, Stock Filter, Sort (fixed layout, no horizontal jump) */}
          <div className='pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-2.5 w-full sm:w-auto'>
              {/* AI Category Dropdown Selector */}
              <div className='flex-1 sm:flex-initial min-w-[155px] sm:min-w-[175px]'>
                <Select
                  value={selectedCategory}
                  onValueChange={(val: AiCategory) => handleFilterChange(() => setSelectedCategory(val))}
                >
                  <SelectTrigger className='h-9 text-xs rounded-xl border-border/80 bg-background/80 font-sans'>
                    <div className='flex items-center gap-1.5 truncate'>
                      <Bot className='size-3.5 text-primary shrink-0' />
                      <SelectValue placeholder='نوع هوش مصنوعی' />
                    </div>
                  </SelectTrigger>
                  <SelectContent align='end' className='font-sans'>
                    {AI_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className='text-xs'>
                        <div className='flex items-center justify-between w-full gap-2'>
                          <span>{cat.label}</span>
                          <span className='text-[10px] text-muted-foreground font-sans'>
                            ({toPersianDigits(categoryCounts[cat.id] ?? 0)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan Type Selector */}
              <div className='flex-1 sm:flex-initial min-w-[140px]'>
                <Select
                  value={selectedPlanType}
                  onValueChange={(val) => handleFilterChange(() => setSelectedPlanType(val))}
                >
                  <SelectTrigger className='h-9 text-xs rounded-xl border-border/80 bg-background/80 font-sans'>
                    <div className='flex items-center gap-1.5 truncate'>
                      <Layers className='size-3.5 text-muted-foreground shrink-0' />
                      <SelectValue placeholder='نوع پلن' />
                    </div>
                  </SelectTrigger>
                  <SelectContent align='end' className='font-sans'>
                    <SelectItem value='all' className='text-xs'>همه انواع پلن</SelectItem>
                    <SelectItem value='ACTIVATION_LINK' className='text-xs'>لینک فعال‌سازی آنی</SelectItem>
                    <SelectItem value='PRE_CREATED_ACCOUNT' className='text-xs'>اکانت آماده اختصاصی</SelectItem>
                    <SelectItem value='CUSTOMER_PROVISIONING' className='text-xs'>فعال‌سازی روی ایمیل شما</SelectItem>
                    <SelectItem value='MANUAL' className='text-xs'>تحویل دستی پشتیبانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Only in Stock Toggle */}
              <button
                type='button'
                onClick={() => handleFilterChange(() => setOnlyInStock(!onlyInStock))}
                className={cn(
                  'h-9 px-3 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer select-none font-sans',
                  onlyInStock
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-background/80 text-muted-foreground border-border/80 hover:bg-accent/60 hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'size-3.5 rounded flex items-center justify-center border transition-colors',
                    onlyInStock
                      ? 'bg-emerald-600 dark:bg-emerald-500 border-transparent text-white'
                      : 'border-muted-foreground/40'
                  )}
                >
                  {onlyInStock && <Check className='size-2.5 stroke-[3]' />}
                </div>
                <span>فقط محصولات موجود</span>
              </button>
            </div>

            {/* Sorting - Stable position, no adjacent button jump */}
            <div className='w-full sm:w-auto flex items-center justify-end'>
              <div className='min-w-[145px] w-full sm:w-auto'>
                <Select
                  value={sortBy}
                  onValueChange={(val: 'popular' | 'price_asc' | 'price_desc' | 'newest') =>
                    handleFilterChange(() => setSortBy(val))
                  }
                >
                  <SelectTrigger className='h-9 text-xs rounded-xl border-border/80 bg-background/80 font-sans w-full'>
                    <div className='flex items-center gap-1.5 truncate'>
                      <SlidersHorizontal className='size-3.5 text-muted-foreground shrink-0' />
                      <SelectValue placeholder='مرتب‌سازی' />
                    </div>
                  </SelectTrigger>
                  <SelectContent align='start' className='font-sans'>
                    <SelectItem value='popular' className='text-xs'>پرفروش‌ترین و محبوب</SelectItem>
                    <SelectItem value='newest' className='text-xs'>جدیدترین محصولات</SelectItem>
                    <SelectItem value='price_asc' className='text-xs'>ارزان‌ترین قیمت</SelectItem>
                    <SelectItem value='price_desc' className='text-xs'>گران‌ترین قیمت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header Info & Active Filter Tags / Reset Button */}
      <div className='flex flex-wrap items-center justify-between gap-3 px-1 text-xs font-sans min-h-[36px]'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-muted-foreground'>
            تعداد نتایج:{' '}
            <strong className='font-bold text-foreground font-sans'>
              {toPersianDigits(filteredProducts.length)}
            </strong>{' '}
            محصول یافت شد
          </span>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className='flex flex-wrap items-center gap-2 ms-2'>
              {selectedCategory !== 'all' && (
                <span className='inline-flex items-center gap-1.5 ps-2.5 pe-1.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20'>
                  <span>{AI_CATEGORIES.find((c) => c.id === selectedCategory)?.label}</span>
                  <button
                    type='button'
                    onClick={() => handleFilterChange(() => setSelectedCategory('all'))}
                    className='size-4 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors'
                    title='حذف فیلتر دسته‌بندی'
                  >
                    <X className='size-3' />
                  </button>
                </span>
              )}

              {selectedPlanType !== 'all' && (
                <span className='inline-flex items-center gap-1.5 ps-2.5 pe-1.5 py-1 rounded-lg bg-muted text-foreground text-xs font-medium border border-border'>
                  <span>پلن: {getPlanTypeLabel(selectedPlanType)}</span>
                  <button
                    type='button'
                    onClick={() => handleFilterChange(() => setSelectedPlanType('all'))}
                    className='size-4 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors'
                    title='حذف فیلتر نوع پلن'
                  >
                    <X className='size-3' />
                  </button>
                </span>
              )}

              {onlyInStock && (
                <span className='inline-flex items-center gap-1.5 ps-2.5 pe-1.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20'>
                  <span>فقط محصولات موجود</span>
                  <button
                    type='button'
                    onClick={() => handleFilterChange(() => setOnlyInStock(false))}
                    className='size-4 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors'
                    title='حذف فیلتر موجودی'
                  >
                    <X className='size-3' />
                  </button>
                </span>
              )}

              {searchQuery.trim() !== '' && (
                <span className='inline-flex items-center gap-1.5 ps-2.5 pe-1.5 py-1 rounded-lg bg-muted text-foreground text-xs font-medium border border-border'>
                  <span>جستجو: «{searchQuery.trim()}»</span>
                  <button
                    type='button'
                    onClick={() => handleFilterChange(() => setSearchQuery(''))}
                    className='size-4 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors'
                    title='حذف عبارت جستجو'
                  >
                    <X className='size-3' />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleResetFilters}
            className='h-7 px-2.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1.5 rounded-lg transition-colors font-sans'
          >
            <X className='size-3.5' />
            <span>پاک کردن همه فیلترها</span>
          </Button>
        )}
      </div>

      {/* Empty State */}
      {paginatedProducts.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-border/80 bg-card/50 p-8 sm:p-12 text-center'>
          <div className='size-14 mx-auto mb-4 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground'>
            <Package className='size-7 stroke-[1.5]' />
          </div>
          <h3 className='text-base font-bold text-foreground mb-1'>محصولی با این مشخصات یافت نشد</h3>
          <p className='text-xs text-muted-foreground max-w-sm mx-auto mb-5 leading-relaxed'>
            عبارت جستجو یا فیلترهای انتخاب شده را تغییر دهید تا محصولات مرتبط نمایش داده شوند.
          </p>
          <Button
            variant='outline'
            size='sm'
            onClick={handleResetFilters}
            className='h-9 text-xs rounded-xl font-sans'
          >
            مشاهده همه محصولات
          </Button>
        </div>
      ) : (
        /* Product Cards Grid */
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
          {paginatedProducts.map((prod) => {
            const hasPreCreatedPlan = prod.plans.some(
              (p) => p.fulfillmentType === 'PRE_CREATED_ACCOUNT'
            )
            const isAvailable = prod.stock > 0 || hasPreCreatedPlan
            const displayPrice = prod.minPrice > 0 ? prod.minPrice : prod.price
            const fulfillmentInfo = getFulfillmentLabel(prod.fulfillmentType)

            return (
              <Card
                key={prod.id}
                className='h-full flex flex-col justify-between overflow-hidden border-border/80 bg-card rounded-2xl shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200'
              >
                <CardHeader className='p-4 sm:p-5 pb-3'>
                  {/* Top Bar: Image/Icon + Badges */}
                  <div className='flex items-start justify-between gap-3 mb-3'>
                    {prod.image ? (
                      <div className='size-12 rounded-xl overflow-hidden border border-border/80 bg-muted/30 shrink-0 shadow-2xs'>
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className='size-full object-cover'
                          loading='lazy'
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className='size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20 shadow-2xs'>
                        <Package className='size-5' />
                      </div>
                    )}

                    <div className='flex flex-col items-end gap-1.5'>
                      {isAvailable ? (
                        <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-sans font-medium'>
                          <Zap className='size-2.5 me-1' />
                          تحویل آنی
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-rose-500 border-rose-500/30 text-[10px] font-sans'>
                          اتمام موجودی
                        </Badge>
                      )}

                      <Badge
                        variant='outline'
                        className={cn('text-[10px] font-sans px-2 py-0.5', fulfillmentInfo.badgeClass)}
                      >
                        {fulfillmentInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <CardTitle className='text-sm sm:text-base font-bold text-foreground line-clamp-1'>
                    <Link
                      href={`/products/${prod.slug}`}
                      className='hover:text-primary transition-colors'
                    >
                      {prod.title}
                    </Link>
                  </CardTitle>

                  <CardDescription className='text-xs line-clamp-2 mt-1.5 min-h-[2.5rem] leading-relaxed text-muted-foreground'>
                    {prod.shortDescription || 'اشتراک اختصاصی با فعال‌سازی قانونی و تضمین کامل پشتیبانی.'}
                  </CardDescription>

                  {/* Plans count summary */}
                  {prod.plans.length > 0 && (
                    <div className='mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground font-sans'>
                      <Layers className='size-3 text-primary/70 shrink-0' />
                      <span>
                        {prod.hasMultiplePlans
                          ? `${toPersianDigits(prod.plans.length)} پلن زمانی متنوع`
                          : prod.plans[0]?.name || 'پلن رسمی'}
                      </span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className='p-4 sm:p-5 pt-0 space-y-3.5 flex-1 flex flex-col justify-end'>
                  {/* Price Section */}
                  <div className='pt-3 border-t border-border/40 flex items-baseline justify-between'>
                    <span className='text-[11px] sm:text-xs text-muted-foreground'>
                      {prod.hasMultiplePlans ? 'شروع قیمت:' : 'قیمت اشتراک:'}
                    </span>
                    <div className='flex items-baseline gap-1'>
                      {prod.hasMultiplePlans && (
                        <span className='text-[10px] sm:text-[11px] font-medium text-muted-foreground font-sans'>
                          شروع از
                        </span>
                      )}
                      <strong className='text-base sm:text-lg font-bold text-primary font-sans'>
                        {formatPrice(displayPrice)}
                      </strong>
                    </div>
                  </div>

                  {/* Stock and Purchase metrics */}
                  <div className='flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl font-sans'>
                    <span>
                      {isAvailable
                        ? `موجودی: ${toPersianDigits(prod.stock)} عدد`
                        : 'وضعیت: ناموجود'}
                    </span>
                    <span>{toPersianDigits(prod.purchaseCount)} خرید موفق</span>
                  </div>

                  {/* Action Button */}
                  <Link href={`/products/${prod.slug}`} className='block w-full'>
                    <Button
                      variant={isAvailable ? 'default' : 'secondary'}
                      className='w-full text-xs sm:text-sm font-semibold gap-1.5 h-10 rounded-xl transition-transform active:scale-[0.98]'
                    >
                      <span>{isAvailable ? 'مشاهده و خرید اشتراک' : 'اطلاعات بیشتر'}</span>
                      <ArrowLeft className='size-3.5 rtl:rotate-0' />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <ProductsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalCount={filteredProducts.length}
        pageSize={ITEMS_PER_PAGE}
      />
    </div>
  )
}
