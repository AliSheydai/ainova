import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { InventoryType, LinkStatus } from '@prisma/client'
import { encryptCredential } from '@/lib/security/crypto'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const planId = searchParams.get('planId')
    const type = searchParams.get('type') as InventoryType | null
    const status = searchParams.get('status') as LinkStatus | null

    const where: any = {}
    if (productId) where.productId = productId
    if (planId) where.planId = planId
    if (type && Object.values(InventoryType).includes(type)) where.type = type
    if (status && Object.values(LinkStatus).includes(status)) where.status = status

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, title: true, name: true, slug: true } },
        plan: { select: { id: true, name: true } },
        order: {
          select: {
            id: true,
            user: { select: { phone: true, name: true } },
          },
        },
      },
      take: 100,
    })

    // Also get counts by status and type
    const [totalAvailable, totalUsed] = await Promise.all([
      prisma.inventoryItem.count({ where: { ...where, status: 'AVAILABLE' } }),
      prisma.inventoryItem.count({ where: { ...where, status: 'USED' } }),
    ])

    return NextResponse.json({
      success: true,
      items,
      stats: {
        total: items.length,
        available: totalAvailable,
        used: totalUsed,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری موجودی انبار.' },
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
      planId,
      type, // 'ACTIVATION_LINK' | 'PRE_CREATED_ACCOUNT'
      rawContent, // string with lines
      items, // array of objects
    } = body

    if (!type || !Object.values(InventoryType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'نوع آیتم انبار نامعتبر است.' },
        { status: 400 }
      )
    }

    const itemsToCreate: Array<{
      productId?: string | null
      planId?: string | null
      type: InventoryType
      status: LinkStatus
      data: any
    }> = []

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (type === 'ACTIVATION_LINK') {
          const url = (item.url || item.link || '').trim()
          if (url) {
            itemsToCreate.push({
              productId: productId || null,
              planId: planId || null,
              type: 'ACTIVATION_LINK',
              status: 'AVAILABLE',
              data: { url },
            })
          }
        } else if (type === 'PRE_CREATED_ACCOUNT') {
          const email = (item.email || item.username || '').trim()
          const password = (item.password || '').trim()
          if (email) {
            itemsToCreate.push({
              productId: productId || null,
              planId: planId || null,
              type: 'PRE_CREATED_ACCOUNT',
              status: 'AVAILABLE',
              data: {
                email,
                password: encryptCredential(password),
                username: item.username || email,
                recoveryEmail: item.recoveryEmail || null,
                note: item.note || null,
              },
            })
          }
        }
      }
    } else if (typeof rawContent === 'string' && rawContent.trim()) {
      const lines = rawContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

      for (const line of lines) {
        if (type === 'ACTIVATION_LINK') {
          if (line.startsWith('http://') || line.startsWith('https://')) {
            itemsToCreate.push({
              productId: productId || null,
              planId: planId || null,
              type: 'ACTIVATION_LINK',
              status: 'AVAILABLE',
              data: { url: line },
            })
          }
        } else if (type === 'PRE_CREATED_ACCOUNT') {
          // Format: email:password or email:password:note
          const parts = line.split(':')
          if (parts.length >= 2) {
            const email = parts[0].trim()
            const password = parts[1].trim()
            const note = parts.slice(2).join(':').trim() || null

            itemsToCreate.push({
              productId: productId || null,
              planId: planId || null,
              type: 'PRE_CREATED_ACCOUNT',
              status: 'AVAILABLE',
              data: {
                email,
                password: encryptCredential(password),
                username: email,
                note,
              },
            })
          }
        }
      }
    }

    if (itemsToCreate.length === 0) {
      return NextResponse.json(
        { success: false, error: 'هیچ داده معتبری برای افزودن به انبار یافت نشد.' },
        { status: 400 }
      )
    }

    // Insert items
    await prisma.inventoryItem.createMany({
      data: itemsToCreate,
    })

    return NextResponse.json({
      success: true,
      count: itemsToCreate.length,
      message: `${itemsToCreate.length.toLocaleString('fa-IR')} آیتم جدید با موفقیت به انبار افزوده شد.`,
    })
  } catch (error: unknown) {
    console.error('Error adding inventory items:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت آیتم‌های انبار.' },
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
        { success: false, error: 'شناسه آیتم الزامی است.' },
        { status: 400 }
      )
    }

    await prisma.inventoryItem.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'آیتم از انبار حذف شد.',
    })
  } catch (error: unknown) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در حذف آیتم.' },
      { status: 500 }
    )
  }
}
