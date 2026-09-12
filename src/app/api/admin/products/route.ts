import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { ProductStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const whereClause: any = {}
    if (!includeArchived) {
      whereClause.status = { not: 'ARCHIVED' }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        plans: {
          orderBy: { price: 'asc' },
        },
        _count: {
          select: {
            orders: true,
            inventoryItems: true,
          },
        },
      },
    })

    // Compute real-time stock and verified purchase count for every product
    const metricsMap = await FulfillmentService.batchGetProductsStockAndPurchases(products)

    const enrichedProducts = products.map((prod) => {
      const metrics = metricsMap.get(prod.id)
      return {
        ...prod,
        stock: metrics?.stock ?? 0,
        purchaseCount: metrics?.purchaseCount ?? 0,
      }
    })

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
    })
  } catch (error: unknown) {
    console.error('Error fetching admin products:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری محصولات.' },
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
      title,
      slug,
      shortDescription,
      description,
      price,
      image,
      sortOrder,
    } = body

    const productTitle = (title || '').trim()
    const productSlug = (slug || '').trim().toLowerCase().replace(/\s+/g, '-')

    if (!productTitle || !productSlug) {
      return NextResponse.json(
        { success: false, error: 'عنوان و نامک (Slug) محصول الزامی هستند.' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({
      where: { slug: productSlug },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این نامک (Slug) قبلاً برای محصول دیگری ثبت شده است.' },
        { status: 400 }
      )
    }

    const parsedPrice = parseInt(String(price || 0), 10)
    const parsedSortOrder = parseInt(String(sortOrder || 0), 10)

    const product = await prisma.product.create({
      data: {
        title: productTitle,
        slug: productSlug,
        shortDescription: shortDescription?.trim() || null,
        description: description?.trim() || null,
        price: isNaN(parsedPrice) ? 0 : parsedPrice,
        image: image?.trim() || null,
        sortOrder: isNaN(parsedSortOrder) ? 0 : parsedSortOrder,
        status: ProductStatus.ACTIVE,
      },
    })

    return NextResponse.json({
      success: true,
      product,
      message: 'محصول جدید با موفقیت ایجاد شد.',
    })
  } catch (error: unknown) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد محصول.' },
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
      productId,
      title,
      slug,
      shortDescription,
      description,
      price,
      image,
      status,
      sortOrder,
    } = body

    const targetId = id || productId
    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است.' },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (title !== undefined) {
      updateData.title = (title || '').trim()
    }

    if (slug !== undefined) {
      const newSlug = slug.trim().toLowerCase().replace(/\s+/g, '-')
      // Ensure slug uniqueness if changed
      const current = await prisma.product.findUnique({ where: { id: targetId } })
      if (current && current.slug !== newSlug) {
        const slugExists = await prisma.product.findUnique({ where: { slug: newSlug } })
        if (slugExists) {
          return NextResponse.json(
            { success: false, error: 'این نامک (Slug) توسط محصول دیگری استفاده شده است.' },
            { status: 400 }
          )
        }
        updateData.slug = newSlug
      }
    }

    if (shortDescription !== undefined) updateData.shortDescription = shortDescription?.trim() || null
    if (description !== undefined) updateData.description = description?.trim() || null
    if (image !== undefined) updateData.image = image?.trim() || null

    if (price !== undefined) {
      const p = parseInt(String(price), 10)
      if (!isNaN(p) && p >= 0) updateData.price = p
    }

    if (sortOrder !== undefined) {
      const so = parseInt(String(sortOrder), 10)
      if (!isNaN(so)) updateData.sortOrder = so
    }

    if (status !== undefined && Object.values(ProductStatus).includes(status)) {
      updateData.status = status
    }

    const updatedProduct = await prisma.product.update({
      where: { id: targetId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'مشخصات محصول با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی محصول.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است.' },
        { status: 400 }
      )
    }

    // Check if product has orders
    const orderCount = await prisma.order.count({
      where: { productId: id },
    })

    if (orderCount > 0) {
      // Soft delete / Archive to preserve financial and historical data integrity
      await prisma.product.update({
        where: { id },
        data: {
          status: ProductStatus.ARCHIVED,
          archivedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: `این محصول دارای ${orderCount.toLocaleString('fa-IR')} سفارش ثبت‌شده است؛ بنابراین به صورت امن بایگانی (Archive) گردید و از دسترس عمومی خارج شد.`,
        action: 'archived',
      })
    }

    // If no orders, delete safely
    // 1. Delete associated inventory items first if any exist
    await prisma.inventoryItem.deleteMany({ where: { productId: id } })
    // 2. Delete plans if any exist
    await prisma.plan.deleteMany({ where: { productId: id } })
    // 3. Delete product
    await prisma.product.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'محصول با موفقیت حذف شد.',
      action: 'deleted',
    })
  } catch (error: unknown) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف یا بایگانی محصول.' },
      { status: 500 }
    )
  }
}
