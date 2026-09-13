import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        plans: {
          where: { active: true },
          orderBy: { price: 'asc' },
        },
      },
    })

    const metricsMap = await FulfillmentService.batchGetProductsStockAndPurchases(products)

    const enrichedProducts = await Promise.all(
      products.map(async (prod) => {
        const metrics = metricsMap.get(prod.id)
        const enrichedPlans = await Promise.all(
          (prod.plans || []).map(async (plan) => {
            let availableCount: number | null = null
            if (plan.fulfillmentType === 'PRE_CREATED_ACCOUNT') {
              availableCount = await prisma.inventoryItem.count({
                where: {
                  type: 'PRE_CREATED_ACCOUNT',
                  status: 'AVAILABLE',
                  OR: [
                    { planId: plan.id },
                    { productId: prod.id, planId: null },
                  ],
                },
              })
            }
            return {
              ...plan,
              stock: metrics?.planStocks[plan.id] ?? 0,
              availableInventoryCount: availableCount,
            }
          })
        )

        return {
          ...prod,
          plans: enrichedPlans,
          stock: metrics?.stock ?? 0,
          purchaseCount: metrics?.purchaseCount ?? 0,
        }
      })
    )

    const firstProduct = enrichedProducts[0] || null

    // Return list of products while preserving backwards-compatibility for legacy single-product callers
    return NextResponse.json({
      success: true,
      products: enrichedProducts,
      ...(firstProduct ? firstProduct : {}),
    })
  } catch (error) {
    console.error('[GET /api/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
