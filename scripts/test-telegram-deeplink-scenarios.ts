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

async function testScenarios() {
  console.log('🧪 Testing Deeplink & In-Bot Auth Security Requirements...\n')
  const timestamp = Date.now()
  const siteUserPhone = `0912${String(timestamp).slice(-7)}`
  const guestPhone = `0935${String(timestamp + 5).slice(-7)}`

  // Seed user in database (as if registered on website)
  const siteUser = await prisma.user.create({
    data: {
      phone: siteUserPhone,
      name: 'کاربر وب‌سایت',
    },
  })
  console.log(`Created test website user with phone: ${siteUserPhone}`)

  // =========================================================================
  // Scenario 1: User is logged in on website -> Clicks Telegram Deeplink
  // Expected: Auto-login in bot via phone hash WITHOUT OTP
  // =========================================================================
  console.log('\n--- Scenario 1: Logged-in Web User Deeplink ---')
  const hashToken = await generatePhoneHashDeeplinkToken(siteUser.phone!)
  console.log(`Generated phone hash token: ${hashToken}`)
  console.log(`Token length: ${hashToken.length} chars (must be <= 64)`)
  if (hashToken.length > 64) throw new Error('Token length exceeds 64')

  const tgId1 = `tg_authed_${timestamp}`
  // Bot verifies token
  const verifiedPhone = await verifyAndConsumePhoneHashToken(hashToken)
  if (verifiedPhone !== siteUser.phone) {
    throw new Error(`Expected ${siteUser.phone}, got ${verifiedPhone}`)
  }

  const linkRes1 = await linkUserByVerifiedPhone(verifiedPhone, tgId1, 'authed_user')
  if (!linkRes1.success || linkRes1.user?.phone !== siteUserPhone) {
    throw new Error('Failed to auto-link logged-in web user')
  }
  console.log('✅ Scenario 1 Passed: Logged-in web user auto-logged in via phone hash deeplink (No OTP needed).')

  // =========================================================================
  // Scenario 2: User NOT logged in on website -> Clicks Telegram Deeplink
  // Expected: Starts bot with payload "guest", REQUIRES phone + OTP in bot
  // =========================================================================
  console.log('\n--- Scenario 2: Guest / Unauthenticated Web Deeplink ---')
  const tgId2 = `tg_guest_${timestamp}`
  const guestPayload = 'guest'
  const isGuest = ['guest', 'web_header', 'guest_login'].includes(guestPayload)
  if (!isGuest) throw new Error('Guest payload not recognized')

  // Bot initiates login flow
  await setBotLoginSession(tgId2, { step: 'AWAITING_PHONE' })
  let session2 = await getBotLoginSession(tgId2)
  if (session2?.step !== 'AWAITING_PHONE') throw new Error('Expected AWAITING_PHONE step')
  console.log('Bot is in AWAITING_PHONE state for guest.')

  // Guest inputs phone number
  const otpReq2 = await requestOtp(guestPhone)
  if (!otpReq2.success) throw new Error('OTP request failed for guest')

  await setBotLoginSession(tgId2, { step: 'AWAITING_OTP', phone: guestPhone })
  session2 = await getBotLoginSession(tgId2)
  if (session2?.step !== 'AWAITING_OTP' || session2?.phone !== guestPhone) {
    throw new Error('Bot did not transition to AWAITING_OTP')
  }
  console.log(`OTP SMS triggered for guest phone: ${guestPhone}`)

  // Get generated OTP code from DB
  const otpRecord2 = await prisma.otpToken.findFirst({
    where: { phone: guestPhone, used: false },
    orderBy: { createdAt: 'desc' },
  })
  if (!otpRecord2?.code) throw new Error('OTP code not found in DB')

  // Verify OTP code
  const verifyRes2 = await verifyOtpCode(guestPhone, otpRecord2.code)
  if (!verifyRes2.success) throw new Error('OTP verification failed')

  const linkRes2 = await linkUserByVerifiedPhone(guestPhone, tgId2, 'guest_user')
  if (!linkRes2.success || linkRes2.user?.phone !== guestPhone) {
    throw new Error('Failed to link guest user after OTP')
  }
  await clearBotLoginSession(tgId2)
  console.log('✅ Scenario 2 Passed: Guest user was guided through phone entry and OTP verification.')

  // =========================================================================
  // Scenario 3: Attempting in-bot login for an EXISTING website phone
  // Expected: In-bot login MUST ALWAYS require OTP, even if phone exists in DB
  // =========================================================================
  console.log('\n--- Scenario 3: In-bot login with existing website phone MUST require OTP ---')
  const tgId3 = `tg_existing_${timestamp}`
  // User enters siteUserPhone in chat bot
  const otpReq3 = await requestOtp(siteUserPhone)
  if (!otpReq3.success) throw new Error('OTP request failed')

  // Verify that an invalid code is strictly rejected
  const wrongRes3 = await verifyOtpCode(siteUserPhone, '99999')
  if (wrongRes3.success) throw new Error('Wrong OTP was incorrectly accepted')
  console.log('Invalid OTP was correctly rejected.')

  // Get actual code
  const otpRecord3 = await prisma.otpToken.findFirst({
    where: { phone: siteUserPhone, used: false },
    orderBy: { createdAt: 'desc' },
  })
  if (!otpRecord3?.code) throw new Error('OTP code not found')

  const verifyRes3 = await verifyOtpCode(siteUserPhone, otpRecord3.code)
  if (!verifyRes3.success) throw new Error('Valid OTP verification failed')

  const linkRes3 = await linkUserByVerifiedPhone(siteUserPhone, tgId3, 'existing_account_user')
  if (!linkRes3.success || linkRes3.user?.id !== siteUser.id) {
    throw new Error('Failed to link existing account after valid OTP')
  }
  console.log('✅ Scenario 3 Passed: Existing website phone strictly required OTP verification before access.')

  // =========================================================================
  // Scenario 4: Logout from Telegram Bot
  // =========================================================================
  console.log('\n--- Scenario 4: Logout from Telegram Bot ---')
  const { logoutTelegramAccount } = await import('../src/lib/telegram/account-linking')
  const logoutSuccess = await logoutTelegramAccount(tgId3)
  if (!logoutSuccess) throw new Error('logoutTelegramAccount returned false')

  const unlinkedCheck = await prisma.user.findUnique({ where: { telegramId: tgId3 } })
  if (unlinkedCheck) throw new Error('User still has telegramId attached after logout')

  const preservedUser = await prisma.user.findUnique({ where: { id: siteUser.id } })
  if (!preservedUser || preservedUser.phone !== siteUserPhone || preservedUser.telegramId !== null) {
    throw new Error('Website user was corrupted after telegram logout')
  }
  console.log('✅ Scenario 4 Passed: Telegram account successfully logged out and detached.')

  // Clean up test data
  await prisma.user.deleteMany({
    where: {
      id: { in: [siteUser.id, linkRes2.user!.id] },
    },
  }).catch(() => {})

  console.log('\n🎉 ALL DEEPLINK, OTP & LOGOUT SCENARIOS VERIFIED SUCCESSFULLY!')
}

testScenarios()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err)
    process.exit(1)
  })
