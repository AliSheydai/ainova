import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { type ProductItem, type PlanItem, type VariantItem } from '../types'
import { type CheckoutFieldDefinition, type FulfillmentType } from '@/lib/fulfillment/types'
import { toEnglishDigits } from '@/lib/persian-utils'

export function useProducts() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({})

  // Product Dialog State
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  const [formProdTitle, setFormProdTitle] = useState('')
  const [formProdSlug, setFormProdSlug] = useState('')
  const [formProdShortDesc, setFormProdShortDesc] = useState('')
  const [formProdDesc, setFormProdDesc] = useState('')
  const [formProdPrice, setFormProdPrice] = useState('')
  const [formProdImage, setFormProdImage] = useState('')
  const [formProdVideoUrl, setFormProdVideoUrl] = useState('')
  const [formProdSortOrder, setFormProdSortOrder] = useState('1')
  const [submittingProduct, setSubmittingProduct] = useState(false)

  // Plan Dialog State
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [planTargetProductId, setPlanTargetProductId] = useState<string>('')
  const [formPlanVariantId, setFormPlanVariantId] = useState<string | null>(null)
  const [formPlanName, setFormPlanName] = useState('')
  const [formPlanType, setFormPlanType] = useState('')
  const [formPlanDuration, setFormPlanDuration] = useState('1')
  const [formPlanPrice, setFormPlanPrice] = useState('')
  const [formPlanFulfillmentType, setFormPlanFulfillmentType] = useState<FulfillmentType>('ACTIVATION_LINK')
  const [formPlanFields, setFormPlanFields] = useState<CheckoutFieldDefinition[]>([])
  const [formPlanActive, setFormPlanActive] = useState(true)
  const [formPlanSortOrder, setFormPlanSortOrder] = useState('1')
  const [submittingPlan, setSubmittingPlan] = useState(false)

  // Variant Dialog State
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [isEditingVariant, setIsEditingVariant] = useState(false)
  const [currentVariantId, setCurrentVariantId] = useState<string | null>(null)
  const [variantTargetProductId, setVariantTargetProductId] = useState<string>('')
  const [formVariantName, setFormVariantName] = useState('')
  const [formVariantSlug, setFormVariantSlug] = useState('')
  const [formVariantDescription, setFormVariantDescription] = useState('')
  const [formVariantPrice, setFormVariantPrice] = useState('')
  const [formVariantDiscountedPrice, setFormVariantDiscountedPrice] = useState('')
  const [formVariantDiscountLabel, setFormVariantDiscountLabel] = useState('')
  const [formVariantDuration, setFormVariantDuration] = useState('1')
  const [formVariantFeatures, setFormVariantFeatures] = useState<string[]>([])
  const [formVariantBadge, setFormVariantBadge] = useState('')
  const [formVariantActive, setFormVariantActive] = useState(true)
  const [formVariantSortOrder, setFormVariantSortOrder] = useState('1')
  const [submittingVariant, setSubmittingVariant] = useState(false)

  // Delete Alert
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null)
  const [deletingProduct, setDeletingProduct] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      if (data.success) {
        setProducts(data.products || [])
      } else {
        toast.error(data.error || 'خطا در بارگذاری اطلاعات محصولات.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // --- Product Actions ---
  const openCreateProductDialog = () => {
    setIsEditingProduct(false)
    setCurrentProductId(null)
    setFormProdTitle('')
    setFormProdSlug('')
    setFormProdShortDesc('')
    setFormProdDesc('')
    setFormProdPrice('')
    setFormProdImage('')
    setFormProdVideoUrl('')
    setFormProdSortOrder(String(products.length + 1))
    setProductDialogOpen(true)
  }

  const openEditProductDialog = (prod: ProductItem) => {
    setIsEditingProduct(true)
    setCurrentProductId(prod.id)
    setFormProdTitle(prod.title || '')
    setFormProdSlug(prod.slug)
    setFormProdShortDesc(prod.shortDescription || '')
    setFormProdDesc(prod.description || '')
    setFormProdPrice(String(prod.price))
    setFormProdImage(prod.image || '')
    setFormProdVideoUrl(prod.videoUrl || '')
    setFormProdSortOrder(String(prod.sortOrder || 1))
    setProductDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!formProdTitle.trim() || !formProdSlug.trim()) {
      toast.error('عنوان و نامک (Slug) محصول الزامی هستند.')
      return
    }

    setSubmittingProduct(true)
    try {
      const payload = {
        id: currentProductId,
        title: formProdTitle.trim(),
        slug: formProdSlug.trim(),
        shortDescription: formProdShortDesc.trim(),
        description: formProdDesc.trim(),
        price: parseInt(formProdPrice, 10) || 0,
        image: formProdImage.trim(),
        videoUrl: formProdVideoUrl.trim() || null,
        sortOrder: parseInt(formProdSortOrder, 10) || 0,
      }

      const res = await fetch('/api/admin/products', {
        method: isEditingProduct ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setProductDialogOpen(false)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در ثبت مشخصات محصول.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSubmittingProduct(false)
    }
  }

  const handleToggleProductStatus = async (prod: ProductItem) => {
    const newStatus = prod.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prod.id, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(
          newStatus === 'ACTIVE'
            ? 'محصول با موفقیت فعال شد.'
            : 'محصول با موفقیت غیرفعال گردید.'
        )
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در تغییر وضعیت محصول.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    }
  }

  const promptDeleteProduct = (prod: ProductItem) => {
    setProductToDelete(prod)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return
    setDeletingProduct(true)
    try {
      const res = await fetch(`/api/admin/products?id=${productToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setDeleteDialogOpen(false)
        setProductToDelete(null)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در حذف محصول.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setDeletingProduct(false)
    }
  }

  // --- Plan Actions ---
  const openCreatePlanDialog = (productId: string) => {
    setIsEditingPlan(false)
    setCurrentPlanId(null)
    setPlanTargetProductId(productId)
    setFormPlanVariantId(null)
    const currentProd = products.find((p) => p.id === productId)

    setFormPlanName('')
    setFormPlanType('')
    setFormPlanDuration('1')
    setFormPlanPrice('')
    setFormPlanFulfillmentType('ACTIVATION_LINK')
    setFormPlanFields([])
    setFormPlanActive(true)
    const existingPlansCount = currentProd?.plans?.length || 0
    setFormPlanSortOrder(String(existingPlansCount + 1))
    setPlanDialogOpen(true)
  }

  const openEditPlanDialog = (plan: PlanItem) => {
    setIsEditingPlan(true)
    setCurrentPlanId(plan.id)
    setPlanTargetProductId(plan.productId)
    setFormPlanVariantId(null)
    setFormPlanName(plan.name)
    setFormPlanType(plan.planType || '')
    setFormPlanDuration(String(plan.duration))
    setFormPlanPrice(String(plan.price))
    setFormPlanFulfillmentType(plan.fulfillmentType || 'ACTIVATION_LINK')
    setFormPlanFields(Array.isArray(plan.checkoutFields) ? plan.checkoutFields : [])
    setFormPlanActive(plan.active !== undefined ? plan.active : true)
    setFormPlanSortOrder(String(plan.sortOrder || 1))
    setPlanDialogOpen(true)
  }

  const handleSavePlan = async () => {
    if (!formPlanName.trim()) {
      toast.error('نام پلن الزامی است.')
      return
    }

    const cleanPrice = toEnglishDigits(formPlanPrice).replace(/[^\d]/g, '')
    const priceNum = parseInt(cleanPrice, 10)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('مبلغ معتبری برای پلن وارد فرمایید.')
      return
    }

    const durationNum = parseInt(toEnglishDigits(formPlanDuration).replace(/[^\d]/g, ''), 10) || 1
    const sortOrderNum = parseInt(toEnglishDigits(formPlanSortOrder).replace(/[^\d]/g, ''), 10) || 1

    setSubmittingPlan(true)
    try {
      const payload = {
        id: currentPlanId,
        productId: planTargetProductId,
        variantId: null,
        name: formPlanName.trim(),
        planType: null,
        duration: durationNum,
        price: priceNum,
        fulfillmentType: formPlanFulfillmentType,
        checkoutFields: formPlanFields,
        sortOrder: sortOrderNum,
        active: formPlanActive,
      }

      const res = await fetch('/api/admin/plans', {
        method: isEditingPlan ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setPlanDialogOpen(false)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در ذخیره پلن.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSubmittingPlan(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('آیا از حذف یا غیرفعال‌سازی این پلن اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/admin/plans?id=${planId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در حذف پلن.')
      }
    } catch {
      toast.error('خطای سرور.')
    }
  }

  // --- Variant Actions ---
  const openCreateVariantDialog = (productId: string) => {
    setIsEditingVariant(false)
    setCurrentVariantId(null)
    setVariantTargetProductId(productId)
    setFormVariantName('')
    setFormVariantSlug('')
    setFormVariantDescription('')
    setFormVariantPrice('')
    setFormVariantDiscountedPrice('')
    setFormVariantDiscountLabel('')
    setFormVariantDuration('1')
    setFormVariantFeatures([])
    setFormVariantBadge('')
    setFormVariantActive(true)
    const currentProd = products.find((p) => p.id === productId)
    const existingVariantsCount = currentProd?.variants?.length || 0
    setFormVariantSortOrder(String(existingVariantsCount + 1))
    setVariantDialogOpen(true)
  }

  const openEditVariantDialog = (variant: VariantItem) => {
    setIsEditingVariant(true)
    setCurrentVariantId(variant.id)
    setVariantTargetProductId(variant.productId)
    setFormVariantName(variant.name || '')
    setFormVariantSlug(variant.slug || '')
    setFormVariantDescription(variant.description || '')
    setFormVariantPrice(String(variant.price || ''))
    setFormVariantDiscountedPrice(
      variant.discountedPrice !== null && variant.discountedPrice !== undefined
        ? String(variant.discountedPrice)
        : ''
    )
    setFormVariantDiscountLabel(variant.discountLabel || '')
    setFormVariantDuration(String(variant.duration || 1))
    setFormVariantFeatures(Array.isArray(variant.features) ? variant.features : [])
    setFormVariantBadge(variant.badge || '')
    setFormVariantActive(variant.active !== undefined ? variant.active : true)
    setFormVariantSortOrder(String(variant.sortOrder || 1))
    setVariantDialogOpen(true)
  }

  const handleSaveVariant = async () => {
    if (!formVariantName.trim()) {
      toast.error('نام نوع محصول الزامی است.')
      return
    }

    const cleanPrice = toEnglishDigits(formVariantPrice).replace(/[^\d]/g, '')
    const priceNum = parseInt(cleanPrice, 10)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('مبلغ معتبری برای نوع محصول وارد فرمایید.')
      return
    }

    let parsedDiscountedPrice: number | null = null
    if (formVariantDiscountedPrice.trim()) {
      const cleanDisc = toEnglishDigits(formVariantDiscountedPrice).replace(/[^\d]/g, '')
      const discNum = parseInt(cleanDisc, 10)
      if (isNaN(discNum) || discNum < 0) {
        toast.error('قیمت تخفیف‌خورده نامعتبر است.')
        return
      }
      if (discNum >= priceNum && priceNum > 0) {
        toast.error('قیمت تخفیف‌خورده باید کمتر از قیمت اصلی باشد.')
        return
      }
      parsedDiscountedPrice = discNum
    }

    const durationNum =
      parseInt(toEnglishDigits(formVariantDuration).replace(/[^\d]/g, ''), 10) || 1
    const sortOrderNum =
      parseInt(toEnglishDigits(formVariantSortOrder).replace(/[^\d]/g, ''), 10) || 1

    setSubmittingVariant(true)
    try {
      const payload = {
        id: currentVariantId,
        productId: variantTargetProductId,
        name: formVariantName.trim(),
        slug: formVariantSlug.trim() || null,
        description: formVariantDescription.trim() || null,
        price: priceNum,
        discountedPrice: parsedDiscountedPrice,
        discountLabel: formVariantDiscountLabel.trim() || null,
        duration: durationNum,
        features: formVariantFeatures,
        badge: formVariantBadge.trim() || null,
        active: formVariantActive,
        sortOrder: sortOrderNum,
      }

      const res = await fetch('/api/admin/variants', {
        method: isEditingVariant ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setVariantDialogOpen(false)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در ذخیره نوع محصول.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setSubmittingVariant(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('آیا از حذف یا غیرفعال‌سازی این نوع محصول اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/admin/variants?id=${variantId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchProducts()
      } else {
        toast.error(data.error || 'خطا در حذف نوع محصول.')
      }
    } catch {
      toast.error('خطای سرور.')
    }
  }

  const targetProduct = products.find((p) => p.id === planTargetProductId)
  const variantTargetProduct = products.find((p) => p.id === variantTargetProductId)

  return {
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
    formProdVideoUrl,
    setFormProdVideoUrl,
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
    planTargetProductTitle: targetProduct?.title || 'محصول',
    planTargetProductVariants: targetProduct?.variants || [],
    formPlanVariantId,
    setFormPlanVariantId,
    formPlanName,
    setFormPlanName,
    formPlanType,
    setFormPlanType,
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
    // Variant dialog
    variantDialogOpen,
    setVariantDialogOpen,
    isEditingVariant,
    variantTargetProductTitle: variantTargetProduct?.title || 'محصول',
    formVariantName,
    setFormVariantName,
    formVariantSlug,
    setFormVariantSlug,
    formVariantDescription,
    setFormVariantDescription,
    formVariantPrice,
    setFormVariantPrice,
    formVariantDiscountedPrice,
    setFormVariantDiscountedPrice,
    formVariantDiscountLabel,
    setFormVariantDiscountLabel,
    formVariantDuration,
    setFormVariantDuration,
    formVariantFeatures,
    setFormVariantFeatures,
    formVariantBadge,
    setFormVariantBadge,
    formVariantActive,
    setFormVariantActive,
    formVariantSortOrder,
    setFormVariantSortOrder,
    submittingVariant,
    openCreateVariantDialog,
    openEditVariantDialog,
    handleSaveVariant,
    handleDeleteVariant,
  }
}
