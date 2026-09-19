import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { type Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    const where: Prisma.ProductVariantWhereInput = {}
    if (productId) {
      where.productId = productId
    }

    const variants = await prisma.productVariant.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      include: {
        product: true,
        plans: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            orders: true,
            plans: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      variants,
    })
  } catch (error: unknown) {
    console.error('Error fetching admin product variants:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری انواع محصول.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const {
      productId,
      name,
      slug,
      description,
      price,
      discountedPrice,
      discountLabel,
      duration,
      features,
      badge,
      active,
      sortOrder,
    } = body

    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است.' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'نام نوع محصول الزامی است.' },
        { status: 400 }
      )
    }

    // Check if product exists
    const productExists = await prisma.product.findUnique({
      where: { id: productId.trim() },
      select: { id: true },
    })

    if (!productExists) {
      return NextResponse.json(
        { success: false, error: 'محصول انتخاب‌شده یافت نشد.' },
        { status: 404 }
      )
    }

    const priceNum = parseInt(String(price), 10)
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { success: false, error: 'قیمت اصلی نامعتبر است (باید عدد نامنفی باشد).' },
        { status: 400 }
      )
    }

    let parsedDiscountedPrice: number | null = null
    if (discountedPrice !== undefined && discountedPrice !== null && String(discountedPrice).trim() !== '') {
      const discNum = parseInt(String(discountedPrice), 10)
      if (isNaN(discNum) || discNum < 0) {
        return NextResponse.json(
          { success: false, error: 'قیمت تخفیف‌خورده نامعتبر است.' },
          { status: 400 }
        )
      }
      if (discNum >= priceNum && priceNum > 0) {
        return NextResponse.json(
          { success: false, error: 'قیمت تخفیف‌خورده باید کمتر از قیمت اصلی باشد.' },
          { status: 400 }
        )
      }
      parsedDiscountedPrice = discNum
    }

    const durationNum = parseInt(String(duration ?? 1), 10)
    const sortOrderNum = parseInt(String(sortOrder ?? 0), 10)

    const trimmedSlug = slug ? String(slug).trim().toLowerCase().replace(/\s+/g, '-') : null
    const trimmedDesc = description ? String(description).trim() : null
    const trimmedDiscountLabel = discountLabel ? String(discountLabel).trim() : null
    const trimmedBadge = badge ? String(badge).trim() : null

    // Ensure features is clean array of strings or null
    let cleanFeatures: Prisma.InputJsonValue | undefined = undefined
    if (Array.isArray(features)) {
      cleanFeatures = features.map((f) => String(f).trim()).filter(Boolean)
    } else if (features === null) {
      cleanFeatures = []
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: productId.trim(),
        name: name.trim(),
        slug: trimmedSlug,
        description: trimmedDesc,
        price: priceNum,
        discountedPrice: parsedDiscountedPrice,
        discountLabel: trimmedDiscountLabel,
        duration: isNaN(durationNum) || durationNum <= 0 ? 1 : durationNum,
        features: cleanFeatures,
        badge: trimmedBadge,
        active: active !== undefined ? Boolean(active) : true,
        sortOrder: isNaN(sortOrderNum) ? 0 : sortOrderNum,
      },
      include: {
        product: true,
        plans: true,
        _count: {
          select: {
            orders: true,
            plans: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      variant,
      message: 'نوع محصول جدید با موفقیت ایجاد شد.',
    })
  } catch (error: unknown) {
    console.error('Error creating product variant:', error)
    const errorMsg = error instanceof Error ? error.message : 'خطا در ایجاد نوع محصول.'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const {
      id,
      name,
      slug,
      description,
      price,
      discountedPrice,
      discountLabel,
      duration,
      features,
      badge,
      active,
      sortOrder,
    } = body

    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json(
        { success: false, error: 'شناسه نوع محصول الزامی است.' },
        { status: 400 }
      )
    }

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: id.trim() },
    })

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, error: 'نوع محصول مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    const updateData: Prisma.ProductVariantUpdateInput = {}

    if (name !== undefined) {
      if (!name || !String(name).trim()) {
        return NextResponse.json(
          { success: false, error: 'نام نوع محصول نمی‌تواند خالی باشد.' },
          { status: 400 }
        )
      }
      updateData.name = String(name).trim()
    }

    if (slug !== undefined) {
      updateData.slug = slug ? String(slug).trim().toLowerCase().replace(/\s+/g, '-') : null
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null
    }

    let targetPrice = existingVariant.price
    if (price !== undefined) {
      const priceNum = parseInt(String(price), 10)
      if (isNaN(priceNum) || priceNum < 0) {
        return NextResponse.json(
          { success: false, error: 'قیمت اصلی نامعتبر است.' },
          { status: 400 }
        )
      }
      updateData.price = priceNum
      targetPrice = priceNum
    }

    if (discountedPrice !== undefined) {
      if (discountedPrice === null || String(discountedPrice).trim() === '') {
        updateData.discountedPrice = null
      } else {
        const discNum = parseInt(String(discountedPrice), 10)
        if (isNaN(discNum) || discNum < 0) {
          return NextResponse.json(
            { success: false, error: 'قیمت تخفیف‌خورده نامعتبر است.' },
            { status: 400 }
          )
        }
        if (discNum >= targetPrice && targetPrice > 0) {
          return NextResponse.json(
            { success: false, error: 'قیمت تخفیف‌خورده باید کمتر از قیمت اصلی باشد.' },
            { status: 400 }
          )
        }
        updateData.discountedPrice = discNum
      }
    }

    if (discountLabel !== undefined) {
      updateData.discountLabel = discountLabel ? String(discountLabel).trim() : null
    }

    if (duration !== undefined) {
      const durationNum = parseInt(String(duration), 10)
      updateData.duration = isNaN(durationNum) || durationNum <= 0 ? 1 : durationNum
    }

    if (sortOrder !== undefined) {
      const sortOrderNum = parseInt(String(sortOrder), 10)
      updateData.sortOrder = isNaN(sortOrderNum) ? 0 : sortOrderNum
    }

    if (badge !== undefined) {
      updateData.badge = badge ? String(badge).trim() : null
    }

    if (active !== undefined) {
      updateData.active = Boolean(active)
    }

    if (features !== undefined) {
      if (Array.isArray(features)) {
        updateData.features = features.map((f) => String(f).trim()).filter(Boolean)
      } else if (features === null) {
        updateData.features = []
      }
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: id.trim() },
      data: updateData,
      include: {
        product: true,
        plans: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            orders: true,
            plans: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      variant: updatedVariant,
      message: 'نوع محصول با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error updating product variant:', error)
    const errorMsg = error instanceof Error ? error.message : 'خطا در به‌روزرسانی نوع محصول.'
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id')

    if (!id) {
      const body = await req.json().catch(() => ({}))
      id = body?.id
    }

    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json(
        { success: false, error: 'شناسه نوع محصول الزامی است.' },
        { status: 400 }
      )
    }

    const variantId = id.trim()

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    })

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, error: 'نوع محصول مورد نظر یافت نشد.' },
        { status: 404 }
      )
    }

    // Check if variant has orders
    const ordersCount = await prisma.order.count({
      where: { variantId },
    })

    if (ordersCount > 0) {
      // Soft-deactivate to protect order records
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { active: false },
      })

      return NextResponse.json({
        success: true,
        message: `این نوع محصول دارای ${ordersCount.toLocaleString('fa-IR')} سفارش ثبت‌شده است؛ بنابراین جهت حفظ یکپارچگی داده‌ها غیرفعال شد.`,
        action: 'deactivated',
      })
    }

    // If no orders, delete variant safely.
    // Note: Plan.variantId is SetNull on delete in Prisma schema.
    await prisma.productVariant.delete({
      where: { id: variantId },
    })

    return NextResponse.json({
      success: true,
      message: 'نوع محصول با موفقیت حذف شد.',
      action: 'deleted',
    })
  } catch (error: unknown) {
    console.error('Error deleting product variant:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف نوع محصول.' },
      { status: 500 }
    )
  }
}
