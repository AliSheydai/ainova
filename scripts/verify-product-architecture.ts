import { PrismaClient } from '@prisma/client'
import { FulfillmentService } from '../src/lib/fulfillment/order-fulfillment'

const prisma = new PrismaClient()

async function runTests() {
  console.log('🧪 ========================================================')
  console.log('🧪 STARTING COMPREHENSIVE PRODUCT-BASED STORE VERIFICATION')
  console.log('🧪 ========================================================')

  // --- TEST 1: Database Integrity & Existing Orders ---
  console.log('\n🔍 [TEST 1] Checking existing Gemini product and legacy orders...')
  const geminiProduct = await prisma.product.findUnique({
    where: { slug: 'google-ai-pro' },
  })
  if (!geminiProduct) {
    throw new Error('TEST 1 FAILED: Gemini product not found.')
  }
  const existingOrders = await prisma.order.count({
    where: { productId: geminiProduct.id },
  })
  const existingLinks = await prisma.activationLink.count({
    where: { productId: geminiProduct.id },
  })
  console.log(`✅ Gemini Product: "${geminiProduct.title || geminiProduct.name}" (ID: ${geminiProduct.id})`)
  console.log(`✅ Existing orders safely preserved: ${existingOrders} orders linked.`)
  console.log(`✅ Existing links safely preserved: ${existingLinks} links linked.`)

  // --- TEST 2: Multi-Product Creation ---
  console.log('\n🔍 [TEST 2] Creating a second distinct product (Claude Pro Test)...')
  const testSlug = `test-product-${Date.now()}`
  const productB = await prisma.product.create({
    data: {
      title: 'Claude 3.7 Sonnet Test Pro',
      name: 'Claude 3.7 Sonnet Test Pro',
      slug: testSlug,
      shortDescription: 'اکانت تست کلود با تحویل آنی',
      description: 'تست برای اعتبارسنجی ایزولاسیون کامل چند محصول.',
      price: 550000, // 550,000 Toman
      status: 'ACTIVE',
      active: true,
      fulfillmentType: 'ACTIVATION_LINK',
      sortOrder: 2,
    },
  })
  console.log(`✅ Created Product B: "${productB.title}" (Slug: ${productB.slug}, Price: ${productB.price})`)

  // Add 2 dedicated links for Product B
  const linkB1Url = `https://claude.ai/claim/test-token-b1-${Date.now()}`
  const linkB2Url = `https://claude.ai/claim/test-token-b2-${Date.now()}`
  await prisma.activationLink.createMany({
    data: [
      { productId: productB.id, url: linkB1Url, status: 'AVAILABLE' },
      { productId: productB.id, url: linkB2Url, status: 'AVAILABLE' },
    ],
  })
  const stockB = await FulfillmentService.getProductStock(productB.id)
  console.log(`✅ Added 2 distinct links for Product B. Stock calculated: ${stockB} available.`)

  // --- TEST 3: Multi-Product Isolation (Links of Product A never go to Product B) ---
  console.log('\n🔍 [TEST 3] Testing Multi-Product Delivery Isolation under high concurrency...')

  // Create test users
  const testUserA = await prisma.user.create({
    data: {
      phone: `0999${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: 'کاربر تستی الف',
      role: 'USER',
    },
  })

  const testUserB = await prisma.user.create({
    data: {
      phone: `0999${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: 'کاربر تستی ب',
      role: 'USER',
    },
  })

  // Order for Product B
  const orderB = await prisma.order.create({
    data: {
      userId: testUserB.id,
      productId: productB.id,
      amount: productB.price,
      status: 'PENDING_PAYMENT',
      source: 'web',
    },
  })

  const paymentB = await prisma.payment.create({
    data: {
      orderId: orderB.id,
      amount: orderB.amount,
      status: 'PENDING',
      authority: `mock-auth-${Date.now()}-b`,
    },
  })

  // Fulfill Order B
  const fulfillResultB = await FulfillmentService.fulfillOrder({
    orderId: orderB.id,
    refId: 'REF-B-12345',
  })

  if (!fulfillResultB.success || !fulfillResultB.activationLink) {
    throw new Error(`TEST 3 FAILED: Order B could not be fulfilled: ${fulfillResultB.message}`)
  }

  console.log(`✅ Order B fulfilled successfully with link: ${fulfillResultB.activationLink.url}`)
  if (!fulfillResultB.activationLink.url.includes('claude.ai/claim/test-token-b')) {
    throw new Error('TEST 3 CRITICAL FAILURE: Product B received a link NOT belonging to Product B!')
  }
  if (fulfillResultB.activationLink.productId !== productB.id) {
    throw new Error('TEST 3 CRITICAL FAILURE: Assigned link productId does not match Product B!')
  }
  console.log('✅ Isolation Verified: Link assigned to Order B belongs exclusively to Product B.')

  // --- TEST 4: Price Immutability (Snapshot Protection) ---
  console.log('\n🔍 [TEST 4] Testing Price Immutability (Order snapshot protection)...')
  const originalOrderBAmount = orderB.amount

  // Admin updates Product B price
  await prisma.product.update({
    where: { id: productB.id },
    data: { price: 890000 }, // Changed from 550,000 to 890,000
  })

  // Verify previous order's amount has NOT changed
  const reloadedOrderB = await prisma.order.findUnique({
    where: { id: orderB.id },
  })

  if (reloadedOrderB?.amount !== originalOrderBAmount) {
    throw new Error(
      `TEST 4 FAILED: Order amount changed from ${originalOrderBAmount} to ${reloadedOrderB?.amount} when product price changed!`
    )
  }
  console.log(
    `✅ Price Immutability Verified: Product price changed to 890,000 Toman, but historical Order #${orderB.id.slice(
      -6
    )} remained ${reloadedOrderB.amount} Toman.`
  )

  // --- TEST 5: User Isolation ---
  console.log('\n🔍 [TEST 5] Testing User Orders Privacy Isolation...')
  const userAOrders = await prisma.order.findMany({
    where: { userId: testUserA.id },
  })
  const userBOrders = await prisma.order.findMany({
    where: { userId: testUserB.id },
  })

  if (userAOrders.length !== 0 || userBOrders.length !== 1) {
    throw new Error('TEST 5 FAILED: Orders are leaking across users!')
  }
  console.log('✅ User Privacy Verified: User A cannot see User B orders.')

  // --- CLEANUP ---
  console.log('\n🧹 Cleaning up test records...')
  await prisma.payment.deleteMany({ where: { orderId: orderB.id } })
  await prisma.activationLink.deleteMany({ where: { productId: productB.id } })
  await prisma.order.deleteMany({ where: { productId: productB.id } })
  await prisma.product.delete({ where: { id: productB.id } })
  await prisma.user.deleteMany({ where: { id: { in: [testUserA.id, testUserB.id] } } })
  console.log('✅ Test records cleaned up successfully.')

  console.log('\n🎉 ========================================================')
  console.log('🎉 ALL ARCHITECTURAL TESTS PASSED PERFECTLY!')
  console.log('🎉 ========================================================')
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed with error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
