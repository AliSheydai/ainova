import { PrismaClient, Role } from '@prisma/client'
import { verifyOtpCode } from '../src/lib/auth/otp'
import { verifyToken } from '../src/lib/auth/jwt'
import { getOrCreateUserWithRole } from '../src/lib/auth/user-role'

const prisma = new PrismaClient()

async function runTests() {
  console.log('🧪 Starting Auth & First-User Admin Flow Test...')

  // Step 0: Ensure DB has 0 users
  await prisma.payment.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.supportTicket.deleteMany({})
  await prisma.otpToken.deleteMany({})
  await prisma.user.deleteMany({})

  const initialUserCount = await prisma.user.count()
  console.log(`Initial user count: ${initialUserCount} (expected: 0)`)
  if (initialUserCount !== 0) throw new Error('DB is not empty!')

  // Step 1: Create an OTP for User 1 (09121111111)
  const phone1 = '09121111111'
  const code1 = '12345'
  await prisma.otpToken.create({
    data: {
      phone: phone1,
      code: code1,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  // Verify OTP for User 1
  const res1 = await verifyOtpCode(phone1, code1)
  console.log('User 1 verifyOtp result:', {
    success: res1.success,
    role: res1.user?.role,
    phone: res1.user?.phone,
  })

  if (!res1.success || res1.user?.role !== 'ADMIN') {
    throw new Error(`FAIL: First user did not get ADMIN role! Got: ${res1.user?.role}`)
  }

  // Check JWT token of User 1
  const tokenPayload1 = await verifyToken(res1.token!)
  console.log('User 1 JWT payload role:', tokenPayload1?.role)
  if (tokenPayload1?.role !== 'ADMIN') {
    throw new Error('FAIL: JWT payload role is not ADMIN!')
  }

  // Step 2: Create an OTP for User 2 (09122222222)
  const phone2 = '09122222222'
  const code2 = '54321'
  await prisma.otpToken.create({
    data: {
      phone: phone2,
      code: code2,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  // Verify OTP for User 2
  const res2 = await verifyOtpCode(phone2, code2)
  console.log('User 2 verifyOtp result:', {
    success: res2.success,
    role: res2.user?.role,
    phone: res2.user?.phone,
  })

  if (!res2.success || res2.user?.role !== 'USER') {
    throw new Error(`FAIL: Second user did not get USER role! Got: ${res2.user?.role}`)
  }

  // Check JWT token of User 2
  const tokenPayload2 = await verifyToken(res2.token!)
  console.log('User 2 JWT payload role:', tokenPayload2?.role)
  if (tokenPayload2?.role !== 'USER') {
    throw new Error('FAIL: JWT payload role is not USER!')
  }

  // Step 3: Test subsequent user (Telegram or web)
  const user3 = await getOrCreateUserWithRole({
    phone: '09123333333',
    name: 'کاربر تستی سوم',
  })
  console.log('User 3 direct create role:', user3.role)
  if (user3.role !== Role.USER) {
    throw new Error('FAIL: Third user is not USER!')
  }

  console.log('✅ PASS: First user = ADMIN, Subsequent users = USER logic works flawlessly!')

  // Cleanup all test users so DB is 100% clean for user's real test
  console.log('🧹 Cleaning up test users from DB...')
  await prisma.otpToken.deleteMany({})
  await prisma.user.deleteMany({})
  const finalUserCount = await prisma.user.count()
  console.log(`🎉 DB Cleaned! Final user count in database: ${finalUserCount}`)
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed with error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
