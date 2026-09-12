import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'

export async function GET(
  req: NextRequest,
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
          orderBy: { price: 'asc' },
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

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        stock,
        purchaseCount,
      },
    })
  } catch (error) {
    console.error('[GET /api/products/[slug]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
