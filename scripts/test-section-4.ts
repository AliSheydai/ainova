import { prisma } from '../src/lib/prisma'
import { CouponService } from '../src/lib/discounts/coupon-service'
import { OrderExpirationService } from '../src/lib/orders/order-expiration'
import { AdminNotificationService } from '../src/lib/notifications/admin-notification'
import { OrderStatus, PaymentStatus, DiscountType } from '@prisma/client'

async function runTests() {
  console.log('--- STARTING SECTION 4 BUSINESS LOGIC TESTS ---')

  // 1. Clean up or prepare test user and product
  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: '09120000000',
        name: 'Test Admin',
        role: 'ADMIN',
      },
    })
  }

  let product = await prisma.product.findFirst({
    where: { status: 'ACTIVE' },
    include: { plans: true },
  })

  if (!product) {
    product = await prisma.product.create({
      data: {
        title: 'اکانت تستی هوش مصنوعی',
        slug: 'test-ai-account-' + Date.now(),
        price: 100000,
        plans: {
          create: [
            {
              name: 'پلن ۱ ماهه',
              duration: 1,
              price: 100000,
            },
          ],
        },
      },
      include: { plans: true },
    })
  }

  const plan = product.plans[0]

  // ==========================================
  // Test 1: Coupon Creation, Validation & Calculation
  // ==========================================
  console.log('\n[Test 1] Testing Coupon Engine...')
  const testCode = 'TEST-OFF-' + Math.floor(Math.random() * 10000)

  // Create a 20% discount coupon with 30,000 Toman max discount
  const coupon = await prisma.coupon.create({
    data: {
      code: testCode,
      description: 'کوپن تستی ۲۰ درصد با سقف ۳۰ هزار',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minOrderAmount: 50000,
      maxDiscountAmount: 30000,
      maxUses: 5,
      active: true,
    },
  })

  // Test valid calculation on 100,000 Toman:
  // 20% of 100,000 = 20,000 Toman discount
  const result1 = await CouponService.validateAndCalculate(testCode, 100000, product.id)
  console.log('Coupon validation (100k):', {
    valid: result1.valid,
    discountAmount: result1.discountAmount,
    finalAmount: result1.finalAmount,
  })
  if (!result1.valid || result1.discountAmount !== 20000 || result1.finalAmount !== 80000) {
    throw new Error('Coupon calculation failed on 100k test!')
  }

  // Test max cap: 20% of 200,000 = 40,000, but capped at 30,000
  const result2 = await CouponService.validateAndCalculate(testCode, 200000, product.id)
  console.log('Coupon validation (200k capped at 30k):', {
    valid: result2.valid,
    discountAmount: result2.discountAmount,
    finalAmount: result2.finalAmount,
  })
  if (result2.discountAmount !== 30000) {
    throw new Error('Coupon max discount cap failed!')
  }

  // Test minimum order amount violation:
  const resultMin = await CouponService.validateAndCalculate(testCode, 40000, product.id)
  if (resultMin.valid) {
    throw new Error('Coupon should have failed minimum order amount check!')
  }
  console.log('Minimum order amount check successfully rejected below 50k:', resultMin.error)

  // Increment usage
  await CouponService.incrementCouponUsage(coupon.id)
  const updatedCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } })
  console.log('Coupon usage incremented:', updatedCoupon?.usedCount)
  if (updatedCoupon?.usedCount !== 1) {
    throw new Error('Coupon usage increment failed!')
  }

  // ==========================================
  // Test 2: Order Expiration and Inventory Release
  // ==========================================
  console.log('\n[Test 2] Testing Order Expiration & Inventory Release...')

  // Create an inventory item and mark it RESERVED for a dummy order
  const dummyInv = await prisma.inventoryItem.create({
    data: {
      productId: product.id,
      planId: plan.id,
      type: 'ACTIVATION_LINK',
      status: 'RESERVED',
      data: { url: 'https://test-link.com/' + Date.now() },
    },
  })

  // Create a stale order created 40 minutes ago
  const fortyMinsAgo = new Date(Date.now() - 40 * 60 * 1000)
  const staleOrder = await prisma.order.create({
    data: {
      userId: user.id,
      productId: product.id,
      planId: plan.id,
      amount: 100000,
      status: OrderStatus.PENDING_PAYMENT,
      createdAt: fortyMinsAgo,
    },
  })

  // Link inventory to order
  await prisma.inventoryItem.update({
    where: { id: dummyInv.id },
    data: { orderId: staleOrder.id },
  })

  // Run OrderExpirationService
  const expireResult = await OrderExpirationService.expirePendingOrders(30)
  console.log('Expiration result:', expireResult)

  const expiredOrderCheck = await prisma.order.findUnique({ where: { id: staleOrder.id } })
  const releasedInvCheck = await prisma.inventoryItem.findUnique({ where: { id: dummyInv.id } })

  console.log('Expired Order Status:', expiredOrderCheck?.status)
  console.log('Released Inventory Status:', releasedInvCheck?.status)

  if (expiredOrderCheck?.status !== OrderStatus.EXPIRED) {
    throw new Error('Order status was not set to EXPIRED!')
  }
  if (releasedInvCheck?.status !== 'AVAILABLE' || releasedInvCheck.orderId !== null) {
    throw new Error('Reserved inventory was not released back to AVAILABLE!')
  }

  // ==========================================
  // Test 3: Refund Flow & Metadata Audit
  // ==========================================
  console.log('\n[Test 3] Testing Refund Mechanism...')

  // Create a paid order
  const paidOrder = await prisma.order.create({
    data: {
      userId: user.id,
      productId: product.id,
      planId: plan.id,
      amount: 80000,
      discountAmount: 20000,
      couponId: coupon.id,
      status: OrderStatus.PAID,
    },
  })

  const payment = await prisma.payment.create({
    data: {
      orderId: paidOrder.id,
      amount: 80000,
      status: PaymentStatus.SUCCESS,
      refId: '12345678',
    },
  })

  // Simulate refund transaction
  const refundAmount = 80000
  const refundReason = 'عدم موجودی سرور'
  const refundRefId = 'IR980120000000012345678901'
  const refundedAt = new Date()

  const refundedOrder = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    })

    return await tx.order.update({
      where: { id: paidOrder.id },
      data: {
        status: OrderStatus.REFUNDED,
        refundAmount,
        refundReason,
        refundRefId,
        refundedAt,
      },
    })
  })

  console.log('Refunded Order Status:', refundedOrder.status)
  console.log('Refund Amount:', refundedOrder.refundAmount)
  console.log('Refund RefId:', refundedOrder.refundRefId)

  if (
    refundedOrder.status !== OrderStatus.REFUNDED ||
    refundedOrder.refundAmount !== 80000 ||
    refundedOrder.refundRefId !== refundRefId
  ) {
    throw new Error('Refund recording failed!')
  }

  // ==========================================
  // Test 4: Admin Notifications
  // ==========================================
  console.log('\n[Test 4] Testing Admin Notification Service...')
  const paidAlert = await AdminNotificationService.notifyOrderPaid({
    id: paidOrder.id,
    amount: paidOrder.amount,
    user,
    product,
    plan,
    payment,
  })
  console.log('Admin notifyOrderPaid triggered safely without errors (result):', paidAlert)

  const refundAlert = await AdminNotificationService.notifyOrderRefunded(paidOrder.id, {
    refundAmount: 80000,
    refundReason,
    refundRefId,
    adminUserName: 'مدیر تستی',
  })
  console.log('Admin notifyOrderRefunded triggered safely without errors (result):', refundAlert)

  const stockAlert = await AdminNotificationService.notifyStockExhausted(
    paidOrder.id,
    product.title,
    plan.name
  )
  console.log('Admin notifyStockExhausted triggered safely without errors (result):', stockAlert)

  // Clean up test data
  await prisma.inventoryItem.delete({ where: { id: dummyInv.id } }).catch(() => {})
  await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {})
  await prisma.order.delete({ where: { id: paidOrder.id } }).catch(() => {})
  await prisma.order.delete({ where: { id: staleOrder.id } }).catch(() => {})
  await prisma.coupon.delete({ where: { id: coupon.id } }).catch(() => {})

  console.log('\n✅ ALL SECTION 4 BUSINESS LOGIC TESTS PASSED SUCCESSFULLY!')
}

runTests()
  .catch((err) => {
    console.error('Test failed with error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
