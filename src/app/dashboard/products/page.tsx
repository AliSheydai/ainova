'use client'

import React, { useState, useMemo } from 'react'
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Archive,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useProducts } from './hooks/use-products'
import { ProductTable } from './components/product-table'
import { ProductDialog } from './components/product-dialog'
import { PlanDialog } from './components/plan-dialog'
import { toPersianDigits } from '@/lib/persian-utils'

export default function AdminProductsPage() {
  const {
    products,
    loading,
    expandedProductIds,
    toggleExpand,
    fetchProducts,
    // Product dialog
    productDialogOpen,
    setProductDialogOpen,
    isEditingProduct,
    formProdTitle,
    setFormProdTitle,
    formProdSlug,
    setFormProdSlug,
    formProdShortDesc,
    setFormProdShortDesc,
    formProdDesc,
    setFormProdDesc,
    formProdPrice,
    setFormProdPrice,
    formProdImage,
    setFormProdImage,
    formProdSortOrder,
    setFormProdSortOrder,
    submittingProduct,
    openCreateProductDialog,
    openEditProductDialog,
    handleSaveProduct,
    handleToggleProductStatus,
    // Product delete
    deleteDialogOpen,
    setDeleteDialogOpen,
    productToDelete,
    deletingProduct,
    promptDeleteProduct,
    handleConfirmDeleteProduct,
    // Plan dialog
    planDialogOpen,
    setPlanDialogOpen,
    isEditingPlan,
    planTargetProductTitle,
    formPlanName,
    setFormPlanName,
    formPlanDuration,
    setFormPlanDuration,
    formPlanPrice,
    setFormPlanPrice,
    formPlanFulfillmentType,
    setFormPlanFulfillmentType,
    formPlanFields,
    setFormPlanFields,
    formPlanActive,
    setFormPlanActive,
    formPlanSortOrder,
    setFormPlanSortOrder,
    submittingPlan,
    openCreatePlanDialog,
    openEditPlanDialog,
    handleSavePlan,
    handleDeletePlan,
  } = useProducts()

  // Filter States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [fulfillmentFilter, setFulfillmentFilter] = useState('ALL')
  const [stockFilter, setStockFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('DEFAULT')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // KPI counts
  const totalProductsCount = products.length
  const activeProductsCount = products.filter((p) => p.status === 'ACTIVE').length
  const inStockCount = products.filter((p) => (p.stock || 0) > 0).length
  const totalPlansCount = products.reduce((acc, p) => acc + (p.plans?.length || 0), 0)

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        // Search
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const matchesTitle = prod.title?.toLowerCase().includes(q)
          const matchesSlug = prod.slug?.toLowerCase().includes(q)
          const matchesDesc =
            prod.shortDescription?.toLowerCase().includes(q) ||
            prod.description?.toLowerCase().includes(q)
          const matchesPlan = prod.plans?.some((pl) => pl.name?.toLowerCase().includes(q))
          if (!matchesTitle && !matchesSlug && !matchesDesc && !matchesPlan) return false
        }

        // Status
        if (statusFilter !== 'ALL' && prod.status !== statusFilter) {
          return false
        }

        // Stock
        if (stockFilter === 'IN_STOCK' && (prod.stock || 0) <= 0) {
          return false
        }
        if (stockFilter === 'OUT_OF_STOCK' && (prod.stock || 0) > 0) {
          return false
        }

        // Fulfillment Type
        if (fulfillmentFilter !== 'ALL') {
          const hasMatchingPlan = prod.plans?.some(
            (pl) => pl.fulfillmentType === fulfillmentFilter
          )
          if (!hasMatchingPlan) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_ASC') return (a.price || 0) - (b.price || 0)
        if (sortBy === 'PRICE_DESC') return (b.price || 0) - (a.price || 0)
        if (sortBy === 'PLANS_DESC') return (b.plans?.length || 0) - (a.plans?.length || 0)
        if (sortBy === 'NEWEST')
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      })
  }, [products, search, statusFilter, stockFilter, fulfillmentFilter, sortBy])

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setFulfillmentFilter('ALL')
    setStockFilter('ALL')
    setSortBy('DEFAULT')
  }

  const activeFiltersCount = [
    statusFilter !== 'ALL',
    fulfillmentFilter !== 'ALL',
    stockFilter !== 'ALL',
    sortBy !== 'DEFAULT',
    search.trim().length > 0,
  ].filter(Boolean).length

  return (
    <>
      <Header>
        <div className='hidden sm:flex items-center gap-2.5 min-w-0'>
          <div className='size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0'>
            <ShoppingBag className='size-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h1 className='text-sm sm:text-base font-bold truncate text-foreground'>
                کاتالوگ محصولات و پلن‌ها
              </h1>
              <Badge variant='secondary' className='text-[10px] h-5 px-1.5 font-sans font-medium'>
                {toPersianDigits(totalProductsCount)} محصول
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground hidden sm:block truncate'>
              مدیریت سرویس‌ها، پلن‌های قیمتی، فرم‌های اختصاصی و روش‌های تحویل خودکار
            </p>
          </div>
        </div>

        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            size='sm'
            onClick={openCreateProductDialog}
            className='gap-1.5 text-xs h-8 px-3 font-semibold shadow-xs'
          >
            <Plus className='size-3.5' />
            <span>محصول جدید</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={fetchProducts}
            disabled={loading}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3'
            title='بروزرسانی اطلاعات'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='p-3.5 sm:p-6 max-w-7xl mx-auto w-full'>
        <div className='flex flex-col gap-4 sm:gap-6 w-full min-w-0'>
          {/* Products KPI Overview Chips */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3'>
            {/* Total Products */}
            <button
              type='button'
              onClick={() => {
                setStatusFilter('ALL')
                setStockFilter('ALL')
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                statusFilter === 'ALL' && stockFilter === 'ALL'
                  ? 'bg-primary/5 border-primary/40 shadow-xs ring-1 ring-primary/20'
                  : 'bg-card border-border/70 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-muted-foreground font-medium'>کل محصولات</span>
                <Package className='size-4 text-muted-foreground' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                  {toPersianDigits(totalProductsCount)}
                </span>
                <span className='text-[10px] text-muted-foreground'>محصول</span>
              </div>
            </button>

            {/* Active Products */}
            <button
              type='button'
              onClick={() => {
                setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                  : 'bg-card border-border/70 hover:border-emerald-500/30 hover:bg-emerald-500/5'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-emerald-600 dark:text-emerald-400 font-medium'>
                  محصولات فعال
                </span>
                <CheckCircle2 className='size-4 text-emerald-500' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400'>
                  {toPersianDigits(activeProductsCount)}
                </span>
                <span className='text-[10px] text-emerald-600/80 dark:text-emerald-400/80'>فعال</span>
              </div>
            </button>

            {/* In Stock */}
            <button
              type='button'
              onClick={() => {
                setStockFilter(stockFilter === 'IN_STOCK' ? 'ALL' : 'IN_STOCK')
              }}
              className={`text-start p-3 sm:p-3.5 rounded-xl border transition-all duration-200 ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-primary/10 border-primary/50 shadow-xs ring-1 ring-primary/30'
                  : 'bg-card border-border/70 hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-primary font-medium'>دارای موجودی انبار</span>
                <ShoppingBag className='size-4 text-primary' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-primary'>
                  {toPersianDigits(inStockCount)}
                </span>
                <span className='text-[10px] text-primary/80'>موجود</span>
              </div>
            </button>

            {/* Total Plans */}
            <div className='p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card'>
              <div className='flex items-center justify-between'>
                <span className='text-[11px] text-muted-foreground font-medium'>کل پلن‌های فروش</span>
                <Layers className='size-4 text-muted-foreground' />
              </div>
              <div className='mt-2 flex items-baseline gap-1.5'>
                <span className='text-lg sm:text-xl font-bold font-sans text-foreground'>
                  {toPersianDigits(totalPlansCount)}
                </span>
                <span className='text-[10px] text-muted-foreground'>پلن تعریف‌شده</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <Card className='border-border/70 shadow-xs bg-card/60 backdrop-blur-sm'>
            <CardContent className='p-3.5 sm:p-4 space-y-3'>
              <div className='flex flex-col sm:flex-row items-center gap-2.5'>
                {/* Search Input */}
                <div className='relative flex-1 w-full'>
                  <Search className='absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
                  <Input
                    placeholder='جستجو در عناوین محصولات، اسلاگ، توضیحات یا نام پلن‌ها...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='ps-9 pe-8 text-xs sm:text-sm h-10 rounded-xl bg-background/80 border-border/80'
                  />
                  {search && (
                    <button
                      type='button'
                      onClick={() => setSearch('')}
                      className='absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors'
                      title='پاک کردن جستجو'
                    >
                      <X className='size-3.5' />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className='flex items-center gap-2 w-full sm:w-auto shrink-0'>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-full sm:w-40 h-10 text-xs rounded-xl bg-background/80 border-border/80'>
                      <SelectValue placeholder='وضعیت محصول' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                      <SelectItem value='ACTIVE'>فعال (Active)</SelectItem>
                      <SelectItem value='INACTIVE'>غیرفعال (Inactive)</SelectItem>
                      <SelectItem value='ARCHIVED'>آرشیو شده</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showAdvancedFilters ? 'secondary' : 'outline'}
                    size='sm'
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`h-10 px-3 text-xs gap-1.5 rounded-xl shrink-0 transition-colors ${
                      activeFiltersCount > 0 ? 'border-primary/50 text-primary' : ''
                    }`}
                  >
                    <SlidersHorizontal className='size-3.5' />
                    <span className='hidden sm:inline'>فیلترها</span>
                    {activeFiltersCount > 0 && (
                      <span className='size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center font-sans'>
                        {toPersianDigits(activeFiltersCount)}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className='pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in-50 duration-200'>
                  {/* Fulfillment Type */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      روش تحویل پلن‌ها:
                    </label>
                    <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
                      <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                        <SelectValue placeholder='روش تحویل' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ALL'>همه روش‌ها</SelectItem>
                        <SelectItem value='ACTIVATION_LINK'>لینک فعال‌سازی</SelectItem>
                        <SelectItem value='PRE_CREATED_ACCOUNT'>اکانت آماده</SelectItem>
                        <SelectItem value='CUSTOMER_PROVISIONING'>ساخت روی اکانت مشتری</SelectItem>
                        <SelectItem value='MANUAL'>تحویل دستی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stock Availability */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      وضعیت موجودی انبار:
                    </label>
                    <Select value={stockFilter} onValueChange={setStockFilter}>
                      <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                        <SelectValue placeholder='وضعیت موجودی' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ALL'>همه وضعیت‌ها</SelectItem>
                        <SelectItem value='IN_STOCK'>دارای موجودی</SelectItem>
                        <SelectItem value='OUT_OF_STOCK'>ناموجود در انبار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className='block text-[11px] font-medium text-muted-foreground mb-1'>
                      مرتب‌سازی محصولات:
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                        <SelectValue placeholder='مرتب‌سازی' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='DEFAULT'>ترتیب چینش دستی</SelectItem>
                        <SelectItem value='PRICE_ASC'>ارزان‌ترین به گران‌ترین</SelectItem>
                        <SelectItem value='PRICE_DESC'>گران‌ترین به ارزان‌ترین</SelectItem>
                        <SelectItem value='PLANS_DESC'>بیشترین تعداد پلن</SelectItem>
                        <SelectItem value='NEWEST'>جدیدترین محصولات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Active Filter Chips */}
              {activeFiltersCount > 0 && (
                <div className='flex flex-wrap items-center gap-1.5 pt-1 text-[11px]'>
                  <span className='text-muted-foreground'>فیلترهای فعال:</span>

                  {search && (
                    <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                      جستجو: {search}
                      <button onClick={() => setSearch('')} className='hover:text-destructive'>
                        <X className='size-3' />
                      </button>
                    </Badge>
                  )}

                  {statusFilter !== 'ALL' && (
                    <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                      وضعیت: {statusFilter}
                      <button onClick={() => setStatusFilter('ALL')} className='hover:text-destructive'>
                        <X className='size-3' />
                      </button>
                    </Badge>
                  )}

                  {fulfillmentFilter !== 'ALL' && (
                    <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                      روش تحویل: {fulfillmentFilter}
                      <button onClick={() => setFulfillmentFilter('ALL')} className='hover:text-destructive'>
                        <X className='size-3' />
                      </button>
                    </Badge>
                  )}

                  {stockFilter !== 'ALL' && (
                    <Badge variant='secondary' className='gap-1 h-6 px-2 text-[11px] font-normal'>
                      موجودی: {stockFilter === 'IN_STOCK' ? 'موجود' : 'ناموجود'}
                      <button onClick={() => setStockFilter('ALL')} className='hover:text-destructive'>
                        <X className='size-3' />
                      </button>
                    </Badge>
                  )}

                  <button
                    type='button'
                    onClick={handleResetFilters}
                    className='text-primary hover:underline text-[11px] ms-1'
                  >
                    حذف همه
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products List Table / Cards */}
          {filteredProducts.length === 0 && !loading ? (
            <Card className='p-12 text-center text-xs text-muted-foreground border-dashed'>
              <Package className='size-8 mx-auto mb-2 text-muted-foreground/60' />
              <p className='font-semibold text-foreground text-sm'>محصولی با این مشخصات یافت نشد.</p>
              <p className='text-muted-foreground mt-1'>می‌توانید کلمات جستجو را تغییر دهید یا فیلترها را حذف کنید.</p>
              {activeFiltersCount > 0 && (
                <Button variant='outline' size='sm' onClick={handleResetFilters} className='mt-3 text-xs'>
                  بازنشانی فیلترها
                </Button>
              )}
            </Card>
          ) : (
            <ProductTable
              products={filteredProducts}
              loading={loading}
              expandedProductIds={expandedProductIds}
              onToggleExpand={toggleExpand}
              onEditProduct={openEditProductDialog}
              onDeleteProduct={promptDeleteProduct}
              onToggleStatus={handleToggleProductStatus}
              onAddPlan={openCreatePlanDialog}
              onEditPlan={openEditPlanDialog}
              onDeletePlan={handleDeletePlan}
            />
          )}
        </div>
      </Main>

      {/* Product Create/Edit Dialog */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        isEditing={isEditingProduct}
        submitting={submittingProduct}
        formProdTitle={formProdTitle}
        setFormProdTitle={setFormProdTitle}
        formProdSlug={formProdSlug}
        setFormProdSlug={setFormProdSlug}
        formProdShortDesc={formProdShortDesc}
        setFormProdShortDesc={setFormProdShortDesc}
        formProdDesc={formProdDesc}
        setFormProdDesc={setFormProdDesc}
        formProdPrice={formProdPrice}
        setFormProdPrice={setFormProdPrice}
        formProdImage={formProdImage}
        setFormProdImage={setFormProdImage}
        formProdSortOrder={formProdSortOrder}
        setFormProdSortOrder={setFormProdSortOrder}
        onSave={handleSaveProduct}
      />

      {/* Plan Create/Edit Dialog */}
      <PlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        isEditing={isEditingPlan}
        submitting={submittingPlan}
        planTargetProductTitle={planTargetProductTitle}
        formPlanName={formPlanName}
        setFormPlanName={setFormPlanName}
        formPlanDuration={formPlanDuration}
        setFormPlanDuration={setFormPlanDuration}
        formPlanPrice={formPlanPrice}
        setFormPlanPrice={setFormPlanPrice}
        formPlanFulfillmentType={formPlanFulfillmentType}
        setFormPlanFulfillmentType={setFormPlanFulfillmentType}
        formPlanFields={formPlanFields}
        setFormPlanFields={setFormPlanFields}
        formPlanActive={formPlanActive}
        setFormPlanActive={setFormPlanActive}
        formPlanSortOrder={formPlanSortOrder}
        setFormPlanSortOrder={setFormPlanSortOrder}
        onSave={handleSavePlan}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-bold'>
              حذف محصول «{productToDelete?.title}»
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs leading-relaxed'>
              در صورتی که برای این محصول تا کنون سفارش پرداخت‌شده ثبت شده باشد، محصول به وضعیت «آرشیو شده» تغییر وضعیت می‌دهد و داده‌های مالی حفظ می‌گردند. در غیر این صورت محصول و تمامی پلن‌های آن به طور کامل حذف خواهند شد. آیا مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex-col-reverse sm:flex-row gap-2'>
            <AlertDialogCancel disabled={deletingProduct} className='text-xs h-9'>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDeleteProduct()
              }}
              disabled={deletingProduct}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold h-9'
            >
              {deletingProduct && <Loader2 className='size-3.5 animate-spin me-1.5' />}
              تأیید و حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
