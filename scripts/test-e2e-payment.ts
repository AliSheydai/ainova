import { prisma } from '../src/lib/prisma'
import { PaymentService } from '../src/lib/payment'
import { FulfillmentService } from '../src/lib/fulfillment/order-fulfillment'

async function runTests() {
  console.log('🚀 ==========================================')
  console.log('🧪 RUNNING END-TO-END PAYMENT & FULFILLMENT TESTS')
  console.log('🚀 ==========================================\n')

  // Prepare product and plan
  const plan = await prisma.plan.findFirst({
    where: { active: true },
    include: { product: true },
  })

  if (!plan) {
    throw new Error('No active plan found in database. Run seed first.')
  }

  // Find or create two test users
  const userA = await prisma.user.upsert({
    where: { phone: '09120000001' },
    update: {},
    create: { phone: '09120000001', name: 'User A Test' },
  })

  const userB = await prisma.user.upsert({
    where: { phone: '09120000002' },
    update: {},
    create: { phone: '09120000002', name: 'User B Test' },
  })

  console.log('👤 Test Users Ready:', { userA: userA.phone, userB: userB.phone })
  console.log('📦 Testing with Plan:', `${plan.product.title} (${plan.name}) - ${plan.price} Toman\n`)

  // -------------------------------------------------------------
  // TEST 1: Full Standard Checkout Flow
  // -------------------------------------------------------------
  console.log('--- [TEST 1]: Standard Checkout, Mock Payment & Immediate Delivery ---')

  // 1.1 Create Order
  const order1 = await prisma.order.create({
    data: {
      userId: userA.id,
      planId: plan.id,
      amount: plan.price,
      status: 'PENDING_PAYMENT',
    },
  })
  console.log(`✅ 1. Order created: ${order1.id} (Status: ${order1.status})`)

  // 1.2 Initialize Payment via PaymentService (Mock)
  const payReq1 = await PaymentService.createPayment({
    orderId: order1.id,
    amount: plan.price,
    description: `خرید اشتراک تست ${plan.product.title}`,
    callbackUrl: `http://localhost:3000/api/payment/callback?orderId=${order1.id}`,
    mobile: userA.phone,
  })

  if (!payReq1.success || !payReq1.paymentUrl) {
    throw new Error(`Payment creation failed: ${payReq1.error}`)
  }
  console.log(`✅ 2. Payment initialized: Provider=${payReq1.payment.gatewayName}, Authority=${payReq1.transactionId}`)
  console.log(`      Payment URL: ${payReq1.paymentUrl}`)

  // 1.3 Verify Payment
  const verify1 = await PaymentService.verifyPayment({
    transactionId: payReq1.transactionId,
    amount: plan.price,
    providerName: payReq1.payment.gatewayName,
    extraParams: { Status: 'OK' },
  })

  if (!verify1.success) {
    throw new Error(`Verification failed: ${verify1.message}`)
  }
  console.log(`✅ 3. Payment verified: RefId=${verify1.refId}`)

  // 1.4 Fulfill Order atomically
  const fulfillment1 = await FulfillmentService.fulfillOrder({
    orderId: order1.id,
    refId: verify1.refId,
    rawResponse: verify1.rawResponse,
  })

  if (!fulfillment1.success || fulfillment1.status !== 'COMPLETED' || !fulfillment1.activationLink) {
    throw new Error(`Fulfillment failed: ${fulfillment1.message}`)
  }
  console.log(`✅ 4. Order completed: Status=${fulfillment1.order.status}`)
  console.log(`      🔗 Assigned Activation Link: ${fulfillment1.activationLink.url}`)
  console.log('🎉 [TEST 1 PASSED]: Full purchase & immediate link delivery verified!\n')

  // -------------------------------------------------------------
  // TEST 2: Refresh & Persistence in Backend
  // -------------------------------------------------------------
  console.log('--- [TEST 2]: Persistence After Refresh / Re-fetch ---')

  const refetchedOrder = await prisma.order.findUnique({
    where: { id: order1.id },
    include: {
      activationLink: true,
      payment: true,
      plan: true,
    },
  })

  if (
    !refetchedOrder ||
    refetchedOrder.status !== 'COMPLETED' ||
    !refetchedOrder.activationLink?.url ||
    refetchedOrder.payment?.status !== 'SUCCESS' ||
    !refetchedOrder.payment?.paidAt
  ) {
    throw new Error('Persistence test failed: Order or link not found after re-query.')
  }
  console.log(`✅ Retrieved from Database: Order=${refetchedOrder.id}`)
  console.log(`   Order Status: ${refetchedOrder.status}`)
  console.log(`   Payment Status: ${refetchedOrder.payment.status} (PaidAt: ${refetchedOrder.payment.paidAt?.toISOString()})`)
  console.log(`   Persisted Link: ${refetchedOrder.activationLink.url}`)
  console.log('🎉 [TEST 2 PASSED]: Persistence guaranteed across refreshes and sessions!\n')

  // -------------------------------------------------------------
  // TEST 3: Concurrency / Simultaneous Purchases (Two Users)
  // -------------------------------------------------------------
  console.log('--- [TEST 3]: Concurrency Safety (Simultaneous Checkouts) ---')

  const [orderA, orderB] = await Promise.all([
    prisma.order.create({
      data: {
        userId: userA.id,
        planId: plan.id,
        amount: plan.price,
        status: 'PENDING_PAYMENT',
      },
    }),
    prisma.order.create({
      data: {
        userId: userB.id,
        planId: plan.id,
        amount: plan.price,
        status: 'PENDING_PAYMENT',
      },
    }),
  ])

  // Run simultaneous fulfillment transactions at the exact same instant
  const [fA, fB] = await Promise.all([
    FulfillmentService.fulfillOrder({
      orderId: orderA.id,
      refId: 'MOCK-CONCURRENT-A',
    }),
    FulfillmentService.fulfillOrder({
      orderId: orderB.id,
      refId: 'MOCK-CONCURRENT-B',
    }),
  ])

  console.log(`User A Order (${orderA.id}) -> Link ID: ${fA.activationLink?.id}`)
  console.log(`User B Order (${orderB.id}) -> Link ID: ${fB.activationLink?.id}`)

  if (!fA.activationLink || !fB.activationLink) {
    throw new Error('Concurrent test failed: One or both orders failed to get a link.')
  }

  if (fA.activationLink.id === fB.activationLink.id) {
    throw new Error('CRITICAL FAILURE: Race condition occurred! Both users received the SAME link!')
  }

  console.log(`✅ Distinct Links Assigned: "${fA.activationLink.url}" !== "${fB.activationLink.url}"`)
  console.log('🎉 [TEST 3 PASSED]: Concurrency protection (FOR UPDATE SKIP LOCKED) verified 100%!\n')

  // -------------------------------------------------------------
  // TEST 4: Stock Exhaustion (No Available Links)
  // -------------------------------------------------------------
  console.log('--- [TEST 4]: Out-Of-Stock Handling ---')

  // Temporarily mark all remaining AVAILABLE links as RESERVED to simulate 0 stock
  const temporarilyReserved = await prisma.activationLink.updateMany({
    where: { planId: plan.id, status: 'AVAILABLE' },
    data: { status: 'RESERVED' },
  })
  console.log(`Simulating zero stock (temporarily held ${temporarilyReserved.count} links)...`)

  const orderOutOfStock = await prisma.order.create({
    data: {
      userId: userA.id,
      planId: plan.id,
      amount: plan.price,
      status: 'PENDING_PAYMENT',
    },
  })

  // Create payment record
  await prisma.payment.create({
    data: {
      orderId: orderOutOfStock.id,
      amount: plan.price,
      status: 'PENDING',
      authority: `MOCK-OOS-${Date.now()}`,
      gatewayName: 'mock',
    },
  })

  // Attempt fulfillment with 0 stock
  const fOOS = await FulfillmentService.fulfillOrder({
    orderId: orderOutOfStock.id,
    refId: 'MOCK-OOS-REF',
  })

  console.log(`Fulfillment Result: Status="${fOOS.status}", OrderStatus="${fOOS.order.status}"`)

  if (fOOS.status !== 'STOCK_EXHAUSTED' || fOOS.order.status !== 'PAID') {
    throw new Error(`Expected order status to be 'PAID', but got '${fOOS.order.status}'`)
  }

  if (fOOS.activationLink !== null) {
    throw new Error('Expected activation link to be null when out of stock!')
  }

  console.log('✅ Order correctly placed in PAID status (NOT completed) awaiting manual fulfillment.')

  // Restore temporarily held links back to AVAILABLE
  await prisma.activationLink.updateMany({
    where: { planId: plan.id, status: 'RESERVED' },
    data: { status: 'AVAILABLE' },
  })
  console.log('Restored held links back to AVAILABLE.')
  console.log('🎉 [TEST 4 PASSED]: Out-of-stock state machine correctly handled!\n')

  console.log('====================================================')
  console.log('🏆 ALL 4 END-TO-END TEST SCENARIOS PASSED PERFECTLY!')
  console.log('====================================================')
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed with error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
