import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { LinkStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') as LinkStatus | null
    const planIdFilter = searchParams.get('planId')

    const where: any = {}
    if (statusFilter && Object.values(LinkStatus).includes(statusFilter)) {
      where.status = statusFilter
    }
    if (planIdFilter) {
      where.planId = planIdFilter
    }

    const [links, total, available, reserved, used, invalid, plans] = await Promise.all([
      prisma.activationLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            include: { product: true },
          },
          order: {
            select: {
              id: true,
              user: {
                select: { id: true, phone: true, name: true },
              },
            },
          },
        },
      }),
      prisma.activationLink.count(),
      prisma.activationLink.count({ where: { status: 'AVAILABLE' } }),
      prisma.activationLink.count({ where: { status: 'RESERVED' } }),
      prisma.activationLink.count({ where: { status: 'USED' } }),
      prisma.activationLink.count({ where: { status: 'INVALID' } }),
      prisma.plan.findMany({
        where: { active: true },
        include: { product: true },
        orderBy: { price: 'asc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      links,
      stats: {
        total,
        available,
        reserved,
        used,
        invalid,
      },
      plans,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/activation-links:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست لینک‌های فعال‌سازی.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { planId, links } = body

    if (!planId || !Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { success: false, error: 'پلن و حداقل یک لینک فعال‌سازی الزامی است.' },
        { status: 400 }
      )
    }

    // Clean links: trim, remove empty lines
    const cleanUrls = links
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 5)

    if (cleanUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'هیچ لینک معتبری برای افزودن یافت نشد.' },
        { status: 400 }
      )
    }

    // Verify plan exists
    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'پلن انتخابی نامعتبر است.' },
        { status: 404 }
      )
    }

    // Create many records
    const created = await prisma.activationLink.createMany({
      data: cleanUrls.map((url: string) => ({
        planId,
        url,
        status: LinkStatus.AVAILABLE,
      })),
    })

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `${created.count} لینک فعال‌سازی جدید با موفقیت به انبار اضافه شد.`,
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/admin/activation-links:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره‌سازی دسته‌ای لینک‌ها.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { linkId, status } = body

    if (!linkId || !status || !Object.values(LinkStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای درخواست نامعتبر هستند.' },
        { status: 400 }
      )
    }

    const updated = await prisma.activationLink.update({
      where: { id: linkId },
      data: { status },
    })

    return NextResponse.json({
      success: true,
      link: updated,
      message: 'وضعیت لینک با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error updating activation link:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در تغییر وضعیت لینک.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const linkId = searchParams.get('id')

    if (!linkId) {
      return NextResponse.json(
        { success: false, error: 'شناسه لینک الزامی است.' },
        { status: 400 }
      )
    }

    await prisma.activationLink.delete({
      where: { id: linkId },
    })

    return NextResponse.json({
      success: true,
      message: 'لینک فعال‌سازی با موفقیت حذف شد.',
    })
  } catch (error: unknown) {
    console.error('Error deleting activation link:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف لینک فعال‌سازی.' },
      { status: 500 }
    )
  }
}
