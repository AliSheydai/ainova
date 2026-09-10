import { NextRequest, NextResponse } from 'next/server'
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

    const enrichedProducts = await Promise.all(
      products.map(async (prod) => {
        const [stock, purchaseCount] = await Promise.all([
          FulfillmentService.getProductStock(prod.id),
          FulfillmentService.getProductPurchaseCount(prod.id),
        ])

        return {
          ...prod,
          stock,
          purchaseCount,
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
