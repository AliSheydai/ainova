import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'

export async function GET() {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        plans: {
          orderBy: { price: 'asc' },
          include: {
            _count: {
              select: {
                orders: true,
                activationLinks: true,
              },
            },
          },
        },
      },
    })

    // Attach inventory counts for available links per plan
    const plansWithAvailable = await Promise.all(
      products.map(async (prod) => {
        const plans = await Promise.all(
          prod.plans.map(async (plan) => {
            const availableCount = await prisma.activationLink.count({
              where: {
                planId: plan.id,
                status: 'AVAILABLE',
              },
            })
            return {
              ...plan,
              availableLinks: availableCount,
            }
          })
        )
        return {
          ...prod,
          plans,
        }
      })
    )

    return NextResponse.json({
      success: true,
      products: plansWithAvailable,
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
    const { action } = body

    if (action === 'create-product') {
      const { name, slug, description } = body
      if (!name || !slug) {
        return NextResponse.json(
          { success: false, error: 'نام و نامک (slug) محصول الزامی هستند.' },
          { status: 400 }
        )
      }

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description: description || null,
          active: true,
        },
      })

      return NextResponse.json({
        success: true,
        product,
        message: 'محصول جدید با موفقیت ایجاد شد.',
      })
    }

    if (action === 'create-plan') {
      const { productId, name, duration, price } = body
      if (!productId || !name || !duration || !price) {
        return NextResponse.json(
          { success: false, error: 'تمام اطلاعات پلن الزامی هستند.' },
          { status: 400 }
        )
      }

      const plan = await prisma.plan.create({
        data: {
          productId,
          name,
          duration: parseInt(duration, 10),
          price: parseInt(price, 10),
          active: true,
        },
      })

      return NextResponse.json({
        success: true,
        plan,
        message: 'پلن جدید با موفقیت اضافه شد.',
      })
    }

    return NextResponse.json(
      { success: false, error: 'عملیات نامعتبر است.' },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error('Error creating product/plan:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد محصول یا پلن.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { planId, productId, name, price, duration, active } = body

    if (planId) {
      const data: any = {}
      if (name !== undefined) data.name = name
      if (price !== undefined) data.price = parseInt(price, 10)
      if (duration !== undefined) data.duration = parseInt(duration, 10)
      if (active !== undefined) data.active = Boolean(active)

      const updatedPlan = await prisma.plan.update({
        where: { id: planId },
        data,
      })

      return NextResponse.json({
        success: true,
        plan: updatedPlan,
        message: 'پلن با موفقیت به‌روزرسانی شد.',
      })
    }

    if (productId) {
      const data: any = {}
      if (name !== undefined) data.name = name
      if (active !== undefined) data.active = Boolean(active)

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data,
      })

      return NextResponse.json({
        success: true,
        product: updatedProduct,
        message: 'محصول با موفقیت به‌روزرسانی شد.',
      })
    }

    return NextResponse.json(
      { success: false, error: 'شناسه پلن یا محصول الزامی است.' },
      { status: 400 }
    )
  } catch (error: unknown) {
    console.error('Error updating product/plan:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی پلن یا محصول.' },
      { status: 500 }
    )
  }
}
