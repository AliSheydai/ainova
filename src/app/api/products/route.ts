import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        active: true,
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

    const enrichedProducts = products.map((prod) => {
      const metrics = metricsMap.get(prod.id)
      return {
        ...prod,
        stock: metrics?.stock ?? 0,
        purchaseCount: metrics?.purchaseCount ?? 0,
      }
    })

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
