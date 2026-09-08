import { NextRequest, NextResponse } from 'next/server'
import { InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'
import { verifyZarinpalPayment } from '@/lib/payment/zarinpal'
import { sendTelegramNotification } from '@/lib/telegram/bot'
import { MESSAGES } from '@/lib/telegram/messages'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const authority = searchParams.get('Authority')
  const status = searchParams.get('Status')
  const querySource = searchParams.get('source')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!authority) {
    return NextResponse.redirect(`${appUrl}/dashboard/orders?payment=invalid_request`)
  }

  // Find payment record
  const payment = await prisma.payment.findUnique({
    where: { authority },
    include: {
      order: {
        include: {
          plan: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  })

  if (!payment) {
    if (querySource === 'telegram') {
      return NextResponse.redirect(`${appUrl}/telegram-return?status=failed&msg=not_found`)
    }
    return NextResponse.redirect(`${appUrl}/dashboard/orders?payment=not_found`)
  }

  const isTelegram =
    querySource === 'telegram' ||
    payment.order.source === 'telegram' ||
    Boolean(payment.order.telegramChatId)

  // If bank status is not OK
  if (status !== 'OK') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CANCELLED' },
      }),
    ])

    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=cancelled&orderId=${payment.orderId}`
      )
    }

    return NextResponse.redirect(`${appUrl}/dashboard/orders?payment=cancelled`)
  }

  // Already processed?
  if (payment.status === 'SUCCESS' && payment.order.status === 'COMPLETED') {
    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=success&orderId=${payment.orderId}`
      )
    }
    return NextResponse.redirect(
      `${appUrl}/dashboard/orders/${payment.orderId}?payment=already_verified`
    )
  }

  // Verify transaction with Zarinpal
  const verifyResult = await verifyZarinpalPayment({
    authority,
    amount: payment.amount,
  })

  if (!verifyResult.success) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'FAILED' },
      }),
    ])

    const errorMsg = verifyResult.message || 'خطا در تایید تراکنش'
    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=failed&orderId=${payment.orderId}&msg=${encodeURIComponent(errorMsg)}`
      )
    }

    return NextResponse.redirect(
      `${appUrl}/dashboard/orders?payment=failed&msg=${encodeURIComponent(errorMsg)}`
    )
  }

  // Transaction succeeded! Assign activation link atomically
  try {
    let assignedLinkUrl: string | null = null

    await prisma.$transaction(async (tx) => {
      // Find one available activation link for the plan
      const link = await tx.activationLink.findFirst({
        where: {
          planId: payment.order.planId,
          status: 'AVAILABLE',
        },
      })

      if (!link) {
        throw new Error('NO_AVAILABLE_LINKS')
      }

      assignedLinkUrl = link.url

      // Assign link to order
      await tx.activationLink.update({
        where: { id: link.id },
        data: {
          status: 'USED',
          orderId: payment.orderId,
          assignedAt: new Date(),
        },
      })

      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          refId: verifyResult.refId,
        },
      })

      // Update order
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'COMPLETED',
        },
      })
    })

    // Notify user in Telegram if this was a Telegram order
    if (payment.order.telegramChatId && assignedLinkUrl) {
      const productTitle = `${payment.order.plan.product.name} — ${payment.order.plan.name}`
      await sendTelegramNotification(
        payment.order.telegramChatId,
        MESSAGES.paymentSuccess(payment.orderId, productTitle, assignedLinkUrl),
        new InlineKeyboard()
          .url('🔗 فعال‌سازی Google AI Pro', assignedLinkUrl)
          .row()
          .text('📖 راهنمای فعال‌سازی', 'guide')
      ).catch((err) => console.error('Telegram notification error:', err))
    }

    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=success&orderId=${payment.orderId}`
      )
    }

    return NextResponse.redirect(
      `${appUrl}/dashboard/orders/${payment.orderId}?payment=success`
    )
  } catch (err: unknown) {
    const error = err as Error
    console.error('Error assigning activation link:', error)

    if (error.message === 'NO_AVAILABLE_LINKS') {
      // Payment succeeded but stock ran out; mark order as PAID pending manual fulfillment
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', refId: verifyResult.refId },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'PAID' },
        }),
      ])

      if (payment.order.telegramChatId) {
        const productTitle = `${payment.order.plan.product.name} — ${payment.order.plan.name}`
        await sendTelegramNotification(
          payment.order.telegramChatId,
          MESSAGES.paymentSuccessStockWaiting(payment.orderId, productTitle)
        ).catch((err) => console.error('Telegram notification error:', err))
      }

      if (isTelegram) {
        return NextResponse.redirect(
          `${appUrl}/telegram-return?status=stock_waiting&orderId=${payment.orderId}`
        )
      }

      return NextResponse.redirect(
        `${appUrl}/dashboard/orders/${payment.orderId}?payment=stock_exhausted`
      )
    }

    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=failed&orderId=${payment.orderId}&msg=processing_error`
      )
    }

    return NextResponse.redirect(`${appUrl}/dashboard/orders?payment=processing_error`)
  }
}
