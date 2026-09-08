import { prisma } from '../src/lib/prisma'
import {
  generatePhoneHashDeeplinkToken,
  verifyAndConsumePhoneHashToken,
  setBotLoginSession,
  getBotLoginSession,
  clearBotLoginSession,
  linkUserByVerifiedPhone,
} from '../src/lib/telegram/account-linking'
import { requestOtp, verifyOtpCode } from '../src/lib/auth/otp'

async function runTest() {
  console.log('🚀 Starting Telegram Deeplink & In-Bot Auth Tests...\n')
  const timestamp = Date.now()
  const testPhone = `0912${String(timestamp).slice(-7)}`
  const testTelegramId = `tg_user_${timestamp}`
  const testUsername = `user_${timestamp}`

  // ==========================================
  // Test 1: Phone Hash Deeplink Generation & Verification
  // ==========================================
  console.log('--- Test 1: Phone Hash Deeplink Generation & Verification ---')
  console.log(`Generating deeplink token for phone: ${testPhone}`)
  const deeplinkToken = await generatePhoneHashDeeplinkToken(testPhone)
  console.log(`Generated token: ${deeplinkToken}`)
  console.log(`Token length: ${deeplinkToken.length} chars (must be <= 64 for Telegram start param)`)

  if (deeplinkToken.length > 64) {
    throw new Error(`Token exceeds 64 chars limit: ${deeplinkToken.length}`)
  }

  // Verify and consume
  const verifiedPhone = await verifyAndConsumePhoneHashToken(deeplinkToken)
  console.log(`Verified phone from token: ${verifiedPhone}`)
  if (verifiedPhone !== testPhone) {
    throw new Error(`Expected ${testPhone}, got ${verifiedPhone}`)
  }
  console.log('✅ Test 1 Passed: Deeplink phone hash generated and verified successfully.\n')

  // ==========================================
  // Test 2: Direct Account Linking via Deeplink
  // ==========================================
  console.log('--- Test 2: Direct Account Linking via Deeplink ---')
  const linkResult = await linkUserByVerifiedPhone(
    verifiedPhone,
    testTelegramId,
    testUsername
  )
  console.log('Link Result:', linkResult.message)
  if (!linkResult.success || linkResult.user?.phone !== testPhone || linkResult.user?.telegramId !== testTelegramId) {
    throw new Error('Failed to link account directly with verified phone')
  }

  const dbUser = await prisma.user.findUnique({
    where: { telegramId: testTelegramId },
  })
  if (!dbUser || dbUser.phone !== testPhone) {
    throw new Error('Database check failed for linked user')
  }
  console.log('✅ Test 2 Passed: Direct deeplink linking connected user without separate login.\n')

  // ==========================================
  // Test 3: Bot Session Storage
  // ==========================================
  console.log('--- Test 3: Bot Session Storage ---')
  const sessionTgId = `tg_session_${timestamp}`
  await setBotLoginSession(sessionTgId, {
    step: 'AWAITING_OTP',
    phone: testPhone,
    lastSentAt: Date.now(),
  })

  const retrieved = await getBotLoginSession(sessionTgId)
  console.log('Retrieved session:', retrieved)
  if (!retrieved || retrieved.step !== 'AWAITING_OTP' || retrieved.phone !== testPhone) {
    throw new Error('Bot session storage failed')
  }

  await clearBotLoginSession(sessionTgId)
  const cleared = await getBotLoginSession(sessionTgId)
  if (cleared) {
    throw new Error('Bot session clear failed')
  }
  console.log('✅ Test 3 Passed: Bot session persistence and clearing work correctly.\n')

  // ==========================================
  // Test 4: In-Bot OTP Request and Verification Flow
  // ==========================================
  console.log('--- Test 4: In-Bot OTP Request and Verification Flow ---')
  const inBotPhone = `0935${String(timestamp + 1).slice(-7)}`
  const inBotTgId = `tg_inbot_${timestamp}`

  console.log(`Requesting OTP for phone: ${inBotPhone}`)
  const otpReq = await requestOtp(inBotPhone)
  console.log('OTP Request Result:', otpReq.message, `(devCode: ${otpReq.devCode})`)
  if (!otpReq.success) {
    throw new Error('OTP request failed')
  }

  // Get code from DB (since live SMS API was used)
  const otpRecord = await prisma.otpToken.findFirst({
    where: { phone: inBotPhone, used: false },
    orderBy: { createdAt: 'desc' },
  })
  const actualCode = otpReq.devCode || otpRecord?.code
  if (!actualCode) {
    throw new Error('Could not retrieve generated OTP code')
  }
  console.log(`Actual generated OTP code: ${actualCode}`)

  // Try wrong code
  console.log('Testing invalid OTP rejection...')
  const wrongRes = await verifyOtpCode(inBotPhone, '00000')
  if (wrongRes.success) {
    throw new Error('Wrong OTP was incorrectly accepted')
  }
  console.log('Correctly rejected invalid code.')

  // Try correct code
  console.log(`Testing correct OTP verification with code: ${actualCode}...`)
  const verifyRes = await verifyOtpCode(inBotPhone, actualCode)
  if (!verifyRes.success) {
    throw new Error(`Verification failed: ${verifyRes.message}`)
  }

  // Link account
  const inBotLink = await linkUserByVerifiedPhone(inBotPhone, inBotTgId, 'inbot_user')
  if (!inBotLink.success || inBotLink.user?.phone !== inBotPhone) {
    throw new Error('In-bot account linking failed')
  }
  console.log('✅ Test 4 Passed: In-bot OTP request, verification, and account linking succeeded.\n')

  // Clean up test users
  await prisma.user.deleteMany({
    where: {
      telegramId: { in: [testTelegramId, inBotTgId] },
    },
  }).catch(() => {})

  console.log('🎉 ALL TELEGRAM AUTH TESTS COMPLETED SUCCESSFULLY!')
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err)
    process.exit(1)
  })
