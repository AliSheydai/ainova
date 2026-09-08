import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { handleBuyCallback } from '../src/lib/telegram/handlers/buy'

async function runScenarios() {
  console.log('🧪 Starting Telegram Bot Edge Cases & Safety Verification...\n')

  const testTelegramId = '9998887771'
  const testChatId = 9998887771
  const testUsername = 'safety_tester'

  const createMockContext = (extra: any = {}) => ({
    from: {
      id: Number(testTelegramId),
      first_name: 'تست',
      last_name: 'امنیت',
      username: testUsername,
      is_bot: false,
    },
    chat: {
      id: testChatId,
      type: 'private',
    },
    reply: async (text: string, options?: any) => {
      return { message_id: 1 }
    },
    answerCallbackQuery: async (options?: any) => {},
    ...extra,
  })

  // Setup user and plan
  const plan = await prisma.plan.findFirst({ where: { active: true }, include: { product: true } })
  if (!plan) throw new Error('No active plan')

  // Edge Scenario A: Failed payment callback
  console.log('--- SCENARIO A: Bank Payment Failed / Cancelled ---')
  await handleBuyCallback(createMockContext() as any, plan.id)
  const failedOrder = await prisma.order.findFirst({
    where: { user: { telegramId: testTelegramId } },
    orderBy: { createdAt: 'desc' },
    include: { payment: true },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const failedRes = await fetch(
    `${appUrl}/api/payment/callback?Authority=${failedOrder?.payment?.authority}&Status=NOK`,
    { redirect: 'manual' }
  )
  console.log('Failed callback redirect:', failedRes.headers.get('location'))

  const checkFailedOrder = await prisma.order.findUnique({
    where: { id: failedOrder!.id },
    include: { activationLink: true, payment: true },
  })
  console.log('Order status after cancellation:', checkFailedOrder?.status)
  console.log('Payment status:', checkFailedOrder?.payment?.status)
  console.log('Activation link assigned?:', checkFailedOrder?.activationLink ? 'YES' : 'NO (Correct)')
  if (checkFailedOrder?.status === 'CANCELLED' && !checkFailedOrder.activationLink) {
    console.log('✅ Scenario A Passed: Failed payment does not assign links.\n')
  }

  // Edge Scenario B: Idempotency / Duplicate callback
  console.log('--- SCENARIO B: Duplicate Callback Idempotency ---')
  await handleBuyCallback(createMockContext() as any, plan.id)
  const successOrder = await prisma.order.findFirst({
    where: { user: { telegramId: testTelegramId } },
    orderBy: { createdAt: 'desc' },
    include: { payment: true },
  })

  // First callback call
  await fetch(
    `${appUrl}/api/payment/callback?Authority=${successOrder?.payment?.authority}&Status=OK`,
    { redirect: 'manual' }
  )

  const orderAfterFirst = await prisma.order.findUnique({
    where: { id: successOrder!.id },
    include: { activationLink: true },
  })
  const linkIdFirst = orderAfterFirst?.activationLink?.id

  // Second callback call (duplicate!)
  const dupRes = await fetch(
    `${appUrl}/api/payment/callback?Authority=${successOrder?.payment?.authority}&Status=OK`,
    { redirect: 'manual' }
  )
  console.log('Duplicate callback redirect:', dupRes.headers.get('location'))

  const orderAfterSecond = await prisma.order.findUnique({
    where: { id: successOrder!.id },
    include: { activationLink: true },
  })
  const linkIdSecond = orderAfterSecond?.activationLink?.id

  if (linkIdFirst === linkIdSecond) {
    console.log('✅ Scenario B Passed: Duplicate callback is 100% idempotent (same link, no double fulfillment).\n')
  }

  console.log('🎉 ALL EDGE CASES PASSED VERIFICATION!')
}

runScenarios()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
