import { NextRequest, NextResponse } from 'next/server'
import { InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'
import { PaymentService } from '@/lib/payment'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { sendTelegramNotification } from '@/lib/telegram/bot'
import { MESSAGES } from '@/lib/telegram/messages'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const authority =
    searchParams.get('Authority') ||
    searchParams.get('authority') ||
    searchParams.get('transactionId')
  const status = searchParams.get('Status') || searchParams.get('status')
  const querySource = searchParams.get('source')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!authority) {
    return NextResponse.redirect(`${appUrl}/?payment=invalid_request`)
  }

  // Find payment record
  const payment = await prisma.payment.findUnique({
    where: { authority },
    include: {
      order: {
        include: {
          user: true,
          product: true,
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
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=failed&msg=not_found`
      )
    }
    return NextResponse.redirect(`${appUrl}/?payment=not_found`)
  }

  const isTelegram =
    querySource === 'telegram' ||
    payment.order.source === 'telegram' ||
    Boolean(payment.order.telegramChatId)

  // 1. Idempotency Check: Already processed & paid/completed?
  if (
    payment.status === 'SUCCESS' ||
    payment.order.status === 'COMPLETED' ||
    payment.order.status === 'PAID'
  ) {
    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=success&orderId=${payment.orderId}`
      )
    }

    if (payment.order.status === 'PAID' && payment.order.fulfillmentStatus === 'PENDING') {
      return NextResponse.redirect(
        `${appUrl}/checkout/success?orderId=${payment.orderId}&status=stock_waiting`
      )
    }

    return NextResponse.redirect(
      `${appUrl}/checkout/success?orderId=${payment.orderId}`
    )
  }

  // 2. If bank/provider returned cancelled or error status
  if (status && status !== 'OK' && status !== 'success') {
    if (payment.status === 'PENDING') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'CANCELLED' },
        }),
        prisma.activationLink.updateMany({
          where: { orderId: payment.orderId, status: 'RESERVED' },
          data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
        }),
        prisma.inventoryItem.updateMany({
          where: { orderId: payment.orderId, status: 'RESERVED' },
          data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
        }),
      ])
    }

    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=cancelled&orderId=${payment.orderId}`
      )
    }

    return NextResponse.redirect(`${appUrl}/?payment=cancelled`)
  }

  // 3. Verify payment via PaymentService
  const verifyResult = await PaymentService.verifyPayment({
    transactionId: authority,
    amount: payment.amount,
    providerName: payment.gatewayName,
    extraParams: {
      Status: status || 'OK',
    },
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
      prisma.activationLink.updateMany({
        where: { orderId: payment.orderId, status: 'RESERVED' },
        data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
      }),
      prisma.inventoryItem.updateMany({
        where: { orderId: payment.orderId, status: 'RESERVED' },
        data: { status: 'AVAILABLE', orderId: null, assignedAt: null },
      }),
    ])

    const errorMsg = verifyResult.message || 'خطا در تایید تراکنش'
    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=failed&orderId=${payment.orderId}&msg=${encodeURIComponent(
          errorMsg
        )}`
      )
    }

    return NextResponse.redirect(
      `${appUrl}/?payment=failed&msg=${encodeURIComponent(errorMsg)}`
    )
  }

  // 4. Fulfill Order and assign Activation Link atomically
  try {
    const fulfillment = await FulfillmentService.fulfillOrder({
      orderId: payment.orderId,
      refId: verifyResult.refId,
      rawResponse: verifyResult.rawResponse,
    })

    const targetChatId =
      payment.order.telegramChatId || payment.order.user?.telegramId
    const productTitle =
      payment.order.product?.title ||
      payment.order.product?.name ||
      (payment.order.plan ? `${payment.order.plan.product.name} — ${payment.order.plan.name}` : 'محصول')

    // If stock ran out:
    if (fulfillment.status === 'STOCK_EXHAUSTED') {
      if (targetChatId) {
        await sendTelegramNotification(
          targetChatId,
          MESSAGES.paymentSuccessStockWaiting(payment.orderId, productTitle)
        ).catch((err) => console.error('Telegram notification error:', err))
      }

      if (isTelegram) {
        return NextResponse.redirect(
          `${appUrl}/telegram-return?status=stock_waiting&orderId=${payment.orderId}`
        )
      }

      return NextResponse.redirect(
        `${appUrl}/checkout/success?orderId=${payment.orderId}&status=stock_waiting`
      )
    }

    // If manual fulfillment awaiting admin:
    if (fulfillment.status === 'AWAITING_MANUAL_DELIVERY') {
      if (targetChatId) {
        const manualMsg =
          `🎉 **پرداخت سفارش #${payment.orderId.slice(-6).toUpperCase()} با موفقیت انجام شد!**\n\n` +
          `📦 **محصول:** ${productTitle}\n\n` +
          `⏳ این محصول نیازمند تحویل دستی توسط پشتیبانی است. به زودی اطلاعات دسترسی برای شما ارسال و در پنل کاربری درج خواهد شد.`

        await sendTelegramNotification(targetChatId, manualMsg).catch((err) =>
          console.error('Telegram notification error:', err)
        )
      }

      if (isTelegram) {
        return NextResponse.redirect(
          `${appUrl}/telegram-return?status=awaiting_manual&orderId=${payment.orderId}`
        )
      }

      return NextResponse.redirect(
        `${appUrl}/checkout/success?orderId=${payment.orderId}&status=awaiting_manual`
      )
    }

    // Success with generic delivery!
    const delivery = fulfillment.delivery
    const deliveryType = delivery?.type || 'ACTIVATION_LINK'
    const deliveryData = (delivery?.data as Record<string, any>) || {}

    if (targetChatId) {
      if (deliveryType === 'ACTIVATION_LINK') {
        const assignedLinkUrl = deliveryData.url || fulfillment.activationLink?.url
        if (assignedLinkUrl) {
          await sendTelegramNotification(
            targetChatId,
            MESSAGES.paymentSuccess(payment.orderId, productTitle, assignedLinkUrl),
            new InlineKeyboard()
              .url('🔗 فعال‌سازی اشتراک در گوگل', assignedLinkUrl)
              .row()
              .text('📖 راهنمای فعال‌سازی', 'guide')
          ).catch((err) => console.error('Telegram notification error:', err))
        }
      } else if (deliveryType === 'PRE_CREATED_ACCOUNT') {
        const accountMsg =
          `🎉 **سفارش #${payment.orderId.slice(-6).toUpperCase()} با موفقیت تکمیل شد!**\n\n` +
          `📦 **محصول:** ${productTitle}\n` +
          `👤 **نام کاربری / ایمیل:** \`${deliveryData.email || deliveryData.username}\`\n` +
          `🔑 **رمز عبور:** \`${deliveryData.password || '••••••'}\`\n\n` +
          `⚠️ ${deliveryData.note || 'لطفاً بلافاصله پس از ورود، کلمه عبور را تغییر دهید.'}`

        await sendTelegramNotification(targetChatId, accountMsg).catch((err) =>
          console.error('Telegram notification error:', err)
        )
      } else {
        const successMsg =
          `🎉 **سفارش #${payment.orderId.slice(-6).toUpperCase()} با موفقیت تکمیل شد!**\n\n` +
          `📦 **محصول:** ${productTitle}\n` +
          `✅ اشتراک شما آماده است و جزئیات آن در پنل کاربری در دسترس می‌باشد.`

        await sendTelegramNotification(targetChatId, successMsg).catch((err) =>
          console.error('Telegram notification error:', err)
        )
      }
    }

    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=success&orderId=${payment.orderId}`
      )
    }

    // Redirect user to the immediate delivery success page
    return NextResponse.redirect(
      `${appUrl}/checkout/success?orderId=${payment.orderId}`
    )
  } catch (err: unknown) {
    console.error('Error in callback fulfillment:', err)
    if (isTelegram) {
      return NextResponse.redirect(
        `${appUrl}/telegram-return?status=failed&orderId=${payment.orderId}&msg=processing_error`
      )
    }
    return NextResponse.redirect(`${appUrl}/?payment=processing_error`)
  }
}
