import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params
    const slug = params.slug

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        plans: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
          include: {
            variant: true,
          },
        },
        variants: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
          include: {
            plans: {
              where: { active: true },
              orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
            },
          },
        },
      },
    })

    if (!product || product.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const [stock, purchaseCount] = await Promise.all([
      FulfillmentService.getProductStock(product.id),
      FulfillmentService.getProductPurchaseCount(product.id),
    ])

    // Enrich plans with available inventory count (for PRE_CREATED_ACCOUNT)
    const enrichPlanWithStock = async <T extends { id: string; fulfillmentType: string }>(plan: T) => {
      if (plan.fulfillmentType === 'PRE_CREATED_ACCOUNT') {
        const availableCount = await prisma.inventoryItem.count({
          where: {
            type: 'PRE_CREATED_ACCOUNT',
            status: 'AVAILABLE',
            OR: [
              { planId: plan.id },
              { productId: product.id, planId: null },
            ],
          },
        })
        return { ...plan, availableInventoryCount: availableCount }
      }
      return { ...plan, availableInventoryCount: null }
    }

    const [plansWithStock, variantsWithStock] = await Promise.all([
      Promise.all(product.plans.map(enrichPlanWithStock)),
      Promise.all(
        product.variants.map(async (variant) => {
          const variantPlans = await Promise.all(
            (variant.plans || []).map(enrichPlanWithStock)
          )
          return {
            ...variant,
            plans: variantPlans,
          }
        })
      ),
    ])

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        plans: plansWithStock,
        variants: variantsWithStock,
        stock,
        purchaseCount,
      },
    })
  } catch (error) {
    console.error('[GET /api/products/[slug]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
