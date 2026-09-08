import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/auth/admin'
import { TicketStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') as TicketStatus | null

    const where: any = {}
    if (statusFilter && Object.values(TicketStatus).includes(statusFilter)) {
      where.status = statusFilter
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, phone: true, name: true, telegramUsername: true },
        },
        order: {
          select: { id: true, amount: true, status: true, plan: { select: { name: true } } },
        },
      },
    })

    const statusCounts = await Promise.all([
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    ])

    return NextResponse.json({
      success: true,
      tickets,
      counts: {
        open: statusCounts[0],
        inProgress: statusCounts[1],
        resolved: statusCounts[2],
        closed: statusCounts[3],
        total: statusCounts.reduce((a, b) => a + b, 0),
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching admin support tickets:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری تیکت‌های پشتیبانی.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { ticketId, status, response } = body

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'شناسه تیکت الزامی است.' },
        { status: 400 }
      )
    }

    const data: any = {}
    if (status && Object.values(TicketStatus).includes(status)) {
      data.status = status
    }
    if (response !== undefined) {
      data.response = response
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data,
      include: { user: true, order: true },
    })

    return NextResponse.json({
      success: true,
      ticket: updated,
      message: 'تیکت با موفقیت به‌روزرسانی شد.',
    })
  } catch (error: unknown) {
    console.error('Error updating support ticket:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی تیکت.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, orderId, subject, message, contactInfo } = body

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'موضوع و متن پیام الزامی هستند.' },
        { status: 400 }
      )
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId || null,
        orderId: orderId || null,
        subject,
        message,
        contactInfo: contactInfo || null,
        status: TicketStatus.OPEN,
      },
    })

    return NextResponse.json({
      success: true,
      ticket,
      message: 'پیام پشتیبانی شما با موفقیت ثبت شد.',
    })
  } catch (error: unknown) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت درخواست پشتیبانی.' },
      { status: 500 }
    )
  }
}
