import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { DiscountType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        product: { select: { id: true, title: true, slug: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, title: true, slug: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      success: true,
      coupons,
      products,
    })
  } catch (error: unknown) {
    console.error('Error fetching admin coupons:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری لیست کدهای تخفیف.' },
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
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      maxUses,
      expiresAt,
      active,
      productId,
    } = body

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'کد تخفیف الزامی است.' },
        { status: 400 }
      )
    }

    const normalizedCode = code.trim().toUpperCase()

    // Check unique code
    const existing = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این کد تخفیف قبلاً تعریف شده است.' },
        { status: 400 }
      )
    }

    const parsedDiscountValue = parseInt(String(discountValue), 10)
    if (isNaN(parsedDiscountValue) || parsedDiscountValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'مقدار تخفیف باید یک عدد بزرگتر از صفر باشد.' },
        { status: 400 }
      )
    }

    const type: DiscountType =
      discountType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE'

    if (type === 'PERCENTAGE' && parsedDiscountValue > 100) {
      return NextResponse.json(
        { success: false, error: 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.' },
        { status: 400 }
      )
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        description: description?.trim() || null,
        discountType: type,
        discountValue: parsedDiscountValue,
        minOrderAmount: minOrderAmount ? parseInt(String(minOrderAmount), 10) : null,
        maxDiscountAmount: maxDiscountAmount ? parseInt(String(maxDiscountAmount), 10) : null,
        maxUses: maxUses ? parseInt(String(maxUses), 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== false,
        productId: productId?.trim() || null,
      },
      include: {
        product: { select: { id: true, title: true, slug: true } },
      },
    })

    return NextResponse.json({
      success: true,
      coupon: newCoupon,
      message: 'کد تخفیف جدید با موفقیت ایجاد گردید.',
    })
  } catch (error: unknown) {
    console.error('Error creating admin coupon:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد کد تخفیف.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { id, active, description, minOrderAmount, maxDiscountAmount, maxUses, expiresAt } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه کد تخفیف الزامی است.' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (active !== undefined) updateData.active = Boolean(active)
    if (description !== undefined) updateData.description = description?.trim() || null
    if (minOrderAmount !== undefined) {
      updateData.minOrderAmount = minOrderAmount ? parseInt(String(minOrderAmount), 10) : null
    }
    if (maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = maxDiscountAmount ? parseInt(String(maxDiscountAmount), 10) : null
    }
    if (maxUses !== undefined) {
      updateData.maxUses = maxUses ? parseInt(String(maxUses), 10) : null
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        product: { select: { id: true, title: true, slug: true } },
      },
    })

    return NextResponse.json({
      success: true,
      coupon: updated,
      message: 'کد تخفیف با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error updating admin coupon:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ویرایش کد تخفیف.' },
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
        { success: false, error: 'شناسه کد تخفیف الزامی است.' },
        { status: 400 }
      )
    }

    // Check if orders exist with this coupon
    const usedOrdersCount = await prisma.order.count({
      where: { couponId: id },
    })

    if (usedOrdersCount > 0) {
      // Soft-disable instead of hard delete to preserve historical integrity
      await prisma.coupon.update({
        where: { id },
        data: { active: false },
      })

      return NextResponse.json({
        success: true,
        message: 'کد تخفیف به دلیل استفاده در سفارش‌های قبلی غیرفعال گردید.',
      })
    }

    await prisma.coupon.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'کد تخفیف با موفقیت حذف گردید.',
    })
  } catch (error: unknown) {
    console.error('Error deleting admin coupon:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف کد تخفیف.' },
      { status: 500 }
    )
  }
}
