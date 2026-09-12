'use client'

import React from 'react'
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  const activeProductsCount = products.filter((p) => p.status === 'ACTIVE').length
  const totalPlansCount = products.reduce((acc, p) => acc + (p.plans?.length || 0), 0)

  return (
    <>
      <Header>
        <div className='flex items-center gap-2 min-w-0 overflow-hidden'>
          <h1 className='text-sm sm:text-base font-bold flex items-center gap-2 truncate'>
            <ShoppingBag className='size-4 text-primary shrink-0' />
            <span className='truncate'>مدیریت محصولات و پلن‌های فروش</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='p-3.5 sm:p-6'>
        <div className='flex flex-col gap-4 sm:gap-6 w-full min-w-0'>
          {/* Action Bar & Quick Controls (Moved from header for complete mobile responsiveness) */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs'>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                <ShoppingBag className='size-4.5' />
              </div>
              <div className='min-w-0'>
                <h2 className='text-xs sm:text-sm font-bold text-foreground truncate'>
                  کاتالوگ محصولات و موتور پلن‌ها
                </h2>
                <p className='text-[11px] text-muted-foreground truncate'>
                  مدیریت موجودی، شرایط تحویل و فرم‌های داینامیک تسویه‌حساب
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2 self-stretch sm:self-auto shrink-0'>
              <Button
                size='sm'
                onClick={openCreateProductDialog}
                className='flex-1 sm:flex-initial gap-1.5 text-xs h-9 px-3.5 font-semibold shadow-xs rounded-xl'
              >
                <Plus className='size-3.5' />
                <span>محصول جدید</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchProducts}
                disabled={loading}
                className='gap-1.5 text-xs h-9 px-3 rounded-xl border-border/70'
                title='بروزرسانی اطلاعات'
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className='hidden xs:inline sm:inline'>بروزرسانی</span>
              </Button>
            </div>
          </div>

          {/* Architecture Banner */}
          <div className='rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs'>
            <div className='min-w-0'>
              <span className='font-bold text-foreground block text-xs sm:text-sm flex items-center gap-1.5'>
                <Sparkles className='size-4 text-primary shrink-0' />
                معماری تفکیک‌شده Product و Plan با موتور تحویل جنریک
              </span>
              <p className='text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed'>
                هر محصول ظرف اصلی خدمات است و هر پلن دارای قیمت، مدت زمان، روش تحویل (Fulfillment) و فیلدهای داینامیک تسویه‌حساب اختصاصی خود می‌باشد.
              </p>
            </div>
            <div className='flex items-center gap-2 shrink-0 flex-wrap'>
              <Badge variant='outline' className='bg-background text-primary border-primary/30 font-mono text-[10.5px] px-2.5 py-1'>
                {activeProductsCount} محصول فعال
              </Badge>
              <Badge variant='outline' className='bg-background text-muted-foreground border-border font-mono text-[10.5px] px-2.5 py-1'>
                {totalPlansCount} پلن فروش
              </Badge>
            </div>
          </div>

          {/* Products List Table / Cards */}
          <ProductTable
            products={products}
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
        planTargetProductTitle={planTargetProductTitle}
        submitting={submittingPlan}
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

      {/* Delete Product Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className='sm:max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-base font-bold'>
              حذف یا بایگانی محصول
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs text-muted-foreground leading-relaxed'>
              آیا از حذف یا خارج‌سازی محصول «{productToDelete?.title}» از ویترین فروشگاه اطمینان دارید؟ در صورت داشتن سوابق سفارش، محصول جهت حفظ سوابق مالی به صورت خودکار بایگانی (Archive) خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='flex flex-col-reverse sm:flex-row gap-2 pt-2'>
            <AlertDialogCancel disabled={deletingProduct} className='rounded-xl text-xs w-full sm:w-auto h-9'>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingProduct}
              onClick={handleConfirmDeleteProduct}
              className='rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 w-full sm:w-auto h-9'
            >
              {deletingProduct && <Loader2 className='size-3.5 animate-spin' />}
              <span>تأیید و حذف</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
