import { PrismaClient } from '@prisma/client'
import { FulfillmentService } from '../src/lib/fulfillment/order-fulfillment'
import { BotStoreService } from '../src/lib/bot/bot-store-service'
import { decryptCredential } from '../src/lib/security/crypto'

const prisma = new PrismaClient()

async function runAllTests() {
  console.log('🧪 ====================================================================')
  console.log('🧪 STARTING COMPREHENSIVE GENERIC FULFILLMENT & MULTI-PLAN VERIFICATION')
  console.log('🧪 ====================================================================')

  const timestamp = Date.now()

  // Create a shared test user
  const testUser = await prisma.user.create({
    data: {
      phone: `0999${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: 'کاربر ارزیابی سیستم',
      role: 'USER',
    },
  })
  console.log(`👤 Created Test User: ${testUser.name} (${testUser.phone})`)

  // --- TEST A: Activation Link Flow ---
  console.log('\n🔍 [TEST A] Testing Activation Link Fulfillment Flow...')
  const productA = await prisma.product.create({
    data: {
      title: `Gemini Pro Link Test ${timestamp}`,
      slug: `gemini-link-test-${timestamp}`,
      price: 350000,
      status: 'ACTIVE',
      active: true,
      plans: {
        create: [
          {
            name: 'پلن ۱۲ ماهه لینک',
            duration: 12,
            price: 350000,
            fulfillmentType: 'ACTIVATION_LINK',
            active: true,
          },
        ],
      },
    },
    include: { plans: true },
  })
  const planA = productA.plans[0]

  // Add 1 available activation link for Plan A
  const testLinkUrl = `https://one.google.com/promo/test-link-${timestamp}`
  await prisma.activationLink.create({
    data: {
      productId: productA.id,
      planId: planA.id,
      url: testLinkUrl,
      status: 'AVAILABLE',
    },
  })

  // Create Order for Plan A
  const orderA = await prisma.order.create({
    data: {
      userId: testUser.id,
      productId: productA.id,
      planId: planA.id,
      amount: planA.price,
      status: 'PENDING_PAYMENT',
      fulfillmentStatus: 'PENDING',
      source: 'web',
    },
  })

  await prisma.payment.create({
    data: {
      orderId: orderA.id,
      amount: orderA.amount,
      status: 'PENDING',
      authority: `auth-test-a-${timestamp}`,
    },
  })

  // Fulfill Order A
  const resultA = await FulfillmentService.fulfillOrder({
    orderId: orderA.id,
    refId: `ref-a-${timestamp}`,
  })

  if (resultA.status !== 'COMPLETED' || !resultA.delivery || resultA.order.status !== 'COMPLETED') {
    throw new Error(`TEST A FAILED: Expected COMPLETED, got ${resultA.status}`)
  }
  const deliveryAData = resultA.delivery.data as any
  if (deliveryAData.url !== testLinkUrl) {
    throw new Error(`TEST A FAILED: Link URL mismatch: ${deliveryAData.url}`)
  }
  console.log(`✅ [TEST A PASSED] Order completed with assigned activation link: ${deliveryAData.url}`)

  // --- TEST B: Pre-Created Account Flow ---
  console.log('\n🔍 [TEST B] Testing Pre-Created Account Fulfillment Flow...')
  const productB = await prisma.product.create({
    data: {
      title: `ChatGPT Plus PreCreated Test ${timestamp}`,
      slug: `chatgpt-precreated-test-${timestamp}`,
      price: 490000,
      status: 'ACTIVE',
      active: true,
      plans: {
        create: [
          {
            name: 'اکانت آماده ۱ ماهه',
            duration: 1,
            price: 490000,
            fulfillmentType: 'PRE_CREATED_ACCOUNT',
            active: true,
          },
        ],
      },
    },
    include: { plans: true },
  })
  const planB = productB.plans[0]

  // Add 1 pre-created account to inventory
  const testAccountEmail = `chatgpt_user_${timestamp}@example.com`
  const testAccountPass = `SecretPass!${timestamp}`
  await prisma.inventoryItem.create({
    data: {
      productId: productB.id,
      planId: planB.id,
      type: 'PRE_CREATED_ACCOUNT',
      status: 'AVAILABLE',
      data: {
        email: testAccountEmail,
        password: testAccountPass,
        username: testAccountEmail,
        note: 'رمز عبور را تغییر دهید',
      },
    },
  })

  // Create Order for Plan B
  const orderB = await prisma.order.create({
    data: {
      userId: testUser.id,
      productId: productB.id,
      planId: planB.id,
      amount: planB.price,
      status: 'PENDING_PAYMENT',
      fulfillmentStatus: 'PENDING',
      source: 'web',
    },
  })

  await prisma.payment.create({
    data: {
      orderId: orderB.id,
      amount: orderB.amount,
      status: 'PENDING',
      authority: `auth-test-b-${timestamp}`,
    },
  })

  const resultB = await FulfillmentService.fulfillOrder({
    orderId: orderB.id,
    refId: `ref-b-${timestamp}`,
  })

  if (resultB.status !== 'COMPLETED' || !resultB.delivery || resultB.order.status !== 'COMPLETED') {
    throw new Error(`TEST B FAILED: Expected COMPLETED, got ${resultB.status}`)
  }
  const deliveryBData = resultB.delivery.data as any
  if (deliveryBData.email !== testAccountEmail) {
    throw new Error(`TEST B FAILED: Account email mismatch: ${deliveryBData.email}`)
  }
  const decryptedPass = decryptCredential(deliveryBData.password)
  if (decryptedPass !== testAccountPass) {
    throw new Error(`TEST B FAILED: Decrypted password mismatch: ${decryptedPass}`)
  }
  console.log(`✅ [TEST B PASSED] Account allocated securely: ${deliveryBData.email}, password decrypted correctly.`)

  // --- TEST C: Customer Provisioning Flow ---
  console.log('\n🔍 [TEST C] Testing Customer Provisioning (Email Input) Flow...')
  const productC = await prisma.product.create({
    data: {
      title: `Claude Pro Provisioning Test ${timestamp}`,
      slug: `claude-provisioning-test-${timestamp}`,
      price: 600000,
      status: 'ACTIVE',
      active: true,
      plans: {
        create: [
          {
            name: 'پلن اختصاصی روی ایمیل شما',
            duration: 1,
            price: 600000,
            fulfillmentType: 'CUSTOMER_PROVISIONING',
            checkoutFields: [
              {
                key: 'email',
                label: 'ایمیل مشتری',
                type: 'email',
                required: true,
                order: 1,
              },
            ],
            active: true,
          },
        ],
      },
    },
    include: { plans: true },
  })
  const planC = productC.plans[0]

  const customerTargetEmail = `customer_target_${timestamp}@gmail.com`
  const orderC = await prisma.order.create({
    data: {
      userId: testUser.id,
      productId: productC.id,
      planId: planC.id,
      amount: planC.price,
      checkoutData: { email: customerTargetEmail },
      status: 'PENDING_PAYMENT',
      fulfillmentStatus: 'PENDING',
      source: 'web',
    },
  })

  await prisma.payment.create({
    data: {
      orderId: orderC.id,
      amount: orderC.amount,
      status: 'PENDING',
      authority: `auth-test-c-${timestamp}`,
    },
  })

  const resultC = await FulfillmentService.fulfillOrder({
    orderId: orderC.id,
    refId: `ref-c-${timestamp}`,
  })

  if (resultC.status !== 'COMPLETED' || !resultC.delivery || resultC.order.status !== 'COMPLETED') {
    throw new Error(`TEST C FAILED: Expected COMPLETED, got ${resultC.status}`)
  }
  const deliveryCData = resultC.delivery.data as any
  if (deliveryCData.email !== customerTargetEmail) {
    throw new Error(`TEST C FAILED: Provisioned email mismatch: ${deliveryCData.email}`)
  }
  console.log(`✅ [TEST C PASSED] Provisioning succeeded for customer email: ${deliveryCData.email}`)

  // --- TEST D: Manual Fulfillment Flow ---
  console.log('\n🔍 [TEST D] Testing Manual Fulfillment (Admin Completion) Flow...')
  const productD = await prisma.product.create({
    data: {
      title: `Custom Enterprise Manual Test ${timestamp}`,
      slug: `custom-manual-test-${timestamp}`,
      price: 1200000,
      status: 'ACTIVE',
      active: true,
      plans: {
        create: [
          {
            name: 'پلن اختصاصی با تحویل دستی',
            duration: 12,
            price: 1200000,
            fulfillmentType: 'MANUAL',
            active: true,
          },
        ],
      },
    },
    include: { plans: true },
  })
  const planD = productD.plans[0]

  const orderD = await prisma.order.create({
    data: {
      userId: testUser.id,
      productId: productD.id,
      planId: planD.id,
      amount: planD.price,
      status: 'PENDING_PAYMENT',
      fulfillmentStatus: 'PENDING',
      source: 'web',
    },
  })

  await prisma.payment.create({
    data: {
      orderId: orderD.id,
      amount: orderD.amount,
      status: 'PENDING',
      authority: `auth-test-d-${timestamp}`,
    },
  })

  // Customer pays: order should transition to PAID / AWAITING_MANUAL_DELIVERY, NOT COMPLETED!
  const resultD1 = await FulfillmentService.fulfillOrder({
    orderId: orderD.id,
    refId: `ref-d1-${timestamp}`,
  })

  if (resultD1.status !== 'AWAITING_MANUAL_DELIVERY' || resultD1.order.status !== 'PAID') {
    throw new Error(`TEST D FAILED: Expected PAID / AWAITING_MANUAL_DELIVERY, got ${resultD1.status}, orderStatus=${resultD1.order.status}`)
  }
  console.log(`✅ [TEST D Step 1 PASSED] Customer paid; Order correctly remains PAID / pending manual action.`)

  // Admin fulfills the order manually
  const adminManualNote = `لایسنس اختصاصی سرور شما ثبت و فعال شد. کلید: KEY-${timestamp}`
  const resultD2 = await FulfillmentService.fulfillManualOrder(
    orderD.id,
    { manualNote: adminManualNote },
    'ADMIN_USER'
  )

  if (resultD2.status !== 'COMPLETED' || resultD2.order.status !== 'COMPLETED') {
    throw new Error(`TEST D FAILED: Expected COMPLETED after admin fulfillment, got ${resultD2.status}`)
  }
  const deliveryDData = resultD2.delivery?.data as any
  if (deliveryDData.manualNote !== adminManualNote) {
    throw new Error(`TEST D FAILED: Manual note mismatch: ${deliveryDData.manualNote}`)
  }
  console.log(`✅ [TEST D Step 2 PASSED] Admin completed manual order; Delivery updated to DELIVERED and Order COMPLETED.`)

  // --- TEST E: Inventory Exhaustion Flow ---
  console.log('\n🔍 [TEST E] Testing Out-Of-Stock Protection Flow...')
  const productE = await prisma.product.create({
    data: {
      title: `No Stock Test Product ${timestamp}`,
      slug: `no-stock-test-${timestamp}`,
      price: 250000,
      status: 'ACTIVE',
      active: true,
      plans: {
        create: [
          {
            name: 'پلن بدون موجودی',
            duration: 1,
            price: 250000,
            fulfillmentType: 'ACTIVATION_LINK',
            active: true,
          },
        ],
      },
    },
    include: { plans: true },
  })
  const planE = productE.plans[0]

  const orderE = await prisma.order.create({
    data: {
      userId: testUser.id,
      productId: productE.id,
      planId: planE.id,
      amount: planE.price,
      status: 'PENDING_PAYMENT',
      source: 'web',
    },
  })

  await prisma.payment.create({
    data: {
      orderId: orderE.id,
      amount: orderE.amount,
      status: 'PENDING',
      authority: `auth-test-e-${timestamp}`,
    },
  })

  // Fulfill without inventory: should return STOCK_EXHAUSTED and order remain PAID
  const resultE = await FulfillmentService.fulfillOrder({
    orderId: orderE.id,
    refId: `ref-e-${timestamp}`,
  })

  if (resultE.status !== 'STOCK_EXHAUSTED' || resultE.order.status !== 'PAID') {
    throw new Error(`TEST E FAILED: Expected STOCK_EXHAUSTED & PAID, got status=${resultE.status}, orderStatus=${resultE.order.status}`)
  }
  console.log(`✅ [TEST E PASSED] Order safely placed in PAID status without premature completion due to stock exhaustion.`)

  // --- TEST F: BotStoreService & Telegram Integration ---
  console.log('\n🔍 [TEST F] Testing BotStoreService & Messenger Integration...')
  const botProducts = await BotStoreService.getActiveProducts()
  if (!botProducts || botProducts.length === 0) {
    throw new Error('TEST F FAILED: Bot products catalog returned empty')
  }

  const botProductDetail = await BotStoreService.getProductPlans(productC.id)
  if (!botProductDetail || botProductDetail.plans.length === 0) {
    throw new Error('TEST F FAILED: Bot product plans returned empty')
  }
  if (botProductDetail.plans[0].checkoutFields.length === 0) {
    throw new Error('TEST F FAILED: Bot product plans did not preserve checkoutFields')
  }

  // Create bot order through BotStoreService
  const botOrderResult = await BotStoreService.createBotOrder({
    userId: testUser.id,
    planId: planC.id,
    checkoutData: { email: 'tg_user@gmail.com' },
    source: 'telegram',
    chatId: '123456789',
    mobile: testUser.phone,
  })

  if (!botOrderResult.order || !botOrderResult.paymentUrl) {
    throw new Error('TEST F FAILED: Bot order creation failed')
  }
  console.log(`✅ [TEST F PASSED] BotStoreService correctly validates fields, creates order #${botOrderResult.order.id.slice(-6)}, and generates payment URL.`)

  console.log('\n🎉 ====================================================================')
  console.log('🎉 ALL 6 ARCHITECTURAL & INTEGRATION TESTS COMPLETED SUCCESSFULLY!')
  console.log('🎉 ====================================================================')
}

runAllTests()
  .catch((err) => {
    console.error('❌ TEST RUN FAILED:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
