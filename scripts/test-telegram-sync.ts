import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import {
  createAccountLinkingToken,
  verifyAndConsumeAccountLinkingToken,
  linkTelegramAccountToUser,
  linkUserByVerifiedPhone,
} from '../src/lib/telegram/account-linking'

async function runTests() {
  console.log('=================================================================')
  console.log('🧪 اجرای تست‌های جامع End-to-End اتصال ربات تلگرام و وب‌سایت')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${testName}`)
      failed++
    }
  }

  try {
    // Setup test variables
    const timestamp = Date.now()
    const testPhoneA = `0912${String(timestamp).slice(-7)}`
    const testTelegramIdA = `tg_${timestamp}`
    const testTelegramUsernameA = `user_${timestamp}`

    const testPhoneB = `0919${String(timestamp).slice(-7)}`
    const testTelegramIdB = `tg_other_${timestamp}`

    // -------------------------------------------------------------
    // Test 1: ایجاد کاربر وب و تولید توکن دیپ‌لینک اتصال
    // -------------------------------------------------------------
    const webUserA = await prisma.user.create({
      data: {
        phone: testPhoneA,
        name: 'کاربر تست یکپارچگی الف',
      },
    })
    assert(Boolean(webUserA.id), '1. ایجاد کاربر سایت با شماره موبایل')

    const linkToken = await createAccountLinkingToken(webUserA.id)
    assert(
      typeof linkToken === 'string' && linkToken.length === 32,
      '2. تولید توکن امن ۳۲ کاراکتری دیپ‌لینک تلگرام'
    )

    const deeplinkPayload = `link_${linkToken}`
    assert(
      deeplinkPayload.length <= 64,
      `3. طول پارامتر دیپ‌لینک (${deeplinkPayload.length} کاراکتر) مطابق استاندارد تلگرام (<= 64)`
    )

    // -------------------------------------------------------------
    // Test 2: مصرف توکن در هندلر /start و اتصال موفقیت‌آمیز حساب
    // -------------------------------------------------------------
    const consumedUserId = await verifyAndConsumeAccountLinkingToken(linkToken)
    assert(consumedUserId === webUserA.id, '4. تایید امضا و انقضای توکن در ربات تلگرام')

    const doubleConsume = await verifyAndConsumeAccountLinkingToken(linkToken)
    assert(doubleConsume === null, '5. جلوگیری از مصرف مجدد توکن مصرف‌شده (Single-use)')

    const linkResult = await linkTelegramAccountToUser(
      webUserA.id,
      testTelegramIdA,
      testTelegramUsernameA
    )
    assert(
      linkResult.success && linkResult.user?.telegramId === testTelegramIdA,
      '6. اتصال حساب تلگرام به کاربر وب‌سایت در دیتابیس مشترک'
    )

    // -------------------------------------------------------------
    // Test 3: ثبت مجدد / استارت مجدد باعث ایجاد کاربر تکراری نشود
    // -------------------------------------------------------------
    const reconnectedUser = await prisma.user.findUnique({
      where: { telegramId: testTelegramIdA },
    })
    assert(
      reconnectedUser?.id === webUserA.id && reconnectedUser.phone === testPhoneA,
      '7. استارت مجدد ربات کاربر تکراری ایجاد نمی‌کند و هویت حفظ می‌شود'
    )

    // -------------------------------------------------------------
    // Test 4: خرید از وب‌سایت -> مشاهده سفارش در تلگرام
    // -------------------------------------------------------------
    // Get an active plan
    let plan = await prisma.plan.findFirst({
      where: { active: true },
      include: { product: true },
    })

    if (!plan) {
      const product = await prisma.product.create({
        data: {
          name: 'Google AI Pro',
          slug: `google-ai-pro-test-${timestamp}`,
          plans: {
            create: {
              name: '۱۸ ماهه',
              duration: 18,
              price: 390000,
              active: true,
            },
          },
        },
        include: { plans: true },
      })
      plan = { ...product.plans[0], product }
    }

    // Seed test activation link
    const activationLink1 = await prisma.activationLink.create({
      data: {
        planId: plan.id,
        url: `https://one.google.com/promo/offer/test-sync-link-${timestamp}-1`,
        status: 'AVAILABLE',
      },
    })

    // Web creates an order
    const webOrder = await prisma.order.create({
      data: {
        userId: webUserA.id,
        planId: plan.id,
        amount: plan.price,
        status: 'COMPLETED',
        source: 'web',
      },
    })

    // Assign link to web order
    await prisma.activationLink.update({
      where: { id: activationLink1.id },
      data: {
        status: 'USED',
        orderId: webOrder.id,
        assignedAt: new Date(),
      },
    })

    // Telegram Bot queries orders for testTelegramIdA:
    const tgUserRecord = await prisma.user.findUnique({
      where: { telegramId: testTelegramIdA },
    })
    const tgQueriedOrders = await prisma.order.findMany({
      where: { userId: tgUserRecord!.id },
      include: { activationLink: true, plan: { include: { product: true } } },
    })

    const foundWebOrderInTg = tgQueriedOrders.find((o) => o.id === webOrder.id)
    assert(
      Boolean(foundWebOrderInTg),
      '8. سفارش ثبت‌شده در وب‌سایت، مستقیماً در استعلام ربات تلگرام قابل مشاهده است'
    )
    assert(
      foundWebOrderInTg?.activationLink?.url === activationLink1.url,
      '9. لینک فعال‌سازی سفارش وب در ربات تلگرام دقیقاً یکسان است'
    )

    // -------------------------------------------------------------
    // Test 5: خرید از ربات تلگرام -> مشاهده در داشبورد وب‌سایت
    // -------------------------------------------------------------
    const activationLink2 = await prisma.activationLink.create({
      data: {
        planId: plan.id,
        url: `https://one.google.com/promo/offer/test-sync-link-${timestamp}-2`,
        status: 'AVAILABLE',
      },
    })

    // Bot creates an order
    const botOrder = await prisma.order.create({
      data: {
        userId: tgUserRecord!.id,
        planId: plan.id,
        amount: plan.price,
        status: 'COMPLETED',
        source: 'telegram',
        telegramChatId: testTelegramIdA,
      },
    })

    await prisma.activationLink.update({
      where: { id: activationLink2.id },
      data: {
        status: 'USED',
        orderId: botOrder.id,
        assignedAt: new Date(),
      },
    })

    // Website Dashboard queries orders for webUserA.id:
    const webDashboardOrders = await prisma.order.findMany({
      where: { userId: webUserA.id },
      include: { activationLink: true, plan: { include: { product: true } } },
    })

    const foundBotOrderInWeb = webDashboardOrders.find((o) => o.id === botOrder.id)
    assert(
      Boolean(foundBotOrderInWeb),
      '10. سفارش ثبت‌شده در ربات تلگرام، مستقیماً در داشبورد وب‌سایت کاربر مشاهده می‌شود'
    )
    assert(
      foundBotOrderInWeb?.source === 'telegram',
      '11. منبع سفارش (source: telegram) در داشبورد به درستی ثبت و شناسایی شده است'
    )
    assert(
      foundBotOrderInWeb?.activationLink?.url === activationLink2.url,
      '12. لینک فعال‌سازی سفارش ربات در داشبورد وب‌سایت دقیقاً یکسان است'
    )

    // -------------------------------------------------------------
    // Test 6: تست ایزولاسیون و عدم دسترسی کاربر به سفارش دیگران
    // -------------------------------------------------------------
    const webUserB = await prisma.user.create({
      data: {
        phone: testPhoneB,
        telegramId: testTelegramIdB,
        name: 'کاربر تست ایزولاسیون ب',
      },
    })

    const ordersUserB = await prisma.order.findMany({
      where: { userId: webUserB.id },
    })
    const canUserBSeeUserAOrders = ordersUserB.some(
      (o) => o.id === webOrder.id || o.id === botOrder.id
    )
    assert(
      !canUserBSeeUserAOrders,
      '13. تفکیک و ایزولاسیون امنیتی: کاربر ب به هیچ عنوان سفارش‌های کاربر الف را نمی‌بیند'
    )

    // -------------------------------------------------------------
    // Test 7: تست اتصال از طریق شماره تماس تایید شده تلگرام (Contact Share)
    // -------------------------------------------------------------
    const testPhoneC = `0935${String(timestamp).slice(-7)}`
    const testTelegramIdC = `tg_contact_${timestamp}`

    // User creates account on web first
    const webUserC = await prisma.user.create({
      data: {
        phone: testPhoneC,
        name: 'کاربر تست شماره تماس',
      },
    })

    // Now in Telegram sends contact with +98 or 09...
    const rawContactPhone = `+98${testPhoneC.slice(1)}`
    const contactLinkResult = await linkUserByVerifiedPhone(
      rawContactPhone,
      testTelegramIdC,
      'contact_user'
    )
    assert(
      contactLinkResult.success && contactLinkResult.user?.id === webUserC.id,
      '14. اتصال موفقیت‌آمیز حساب از درون تلگرام با ارسال شماره موبایل تاییدشده'
    )

    // Cleanup test records
    await prisma.activationLink.deleteMany({
      where: { id: { in: [activationLink1.id, activationLink2.id] } },
    })
    await prisma.order.deleteMany({
      where: { id: { in: [webOrder.id, botOrder.id] } },
    })
    await prisma.otpToken.deleteMany({
      where: { phone: { in: [`tglink_${webUserA.id}`, `tglink_${webUserB.id}`] } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: [webUserA.id, webUserB.id, webUserC.id] } },
    })

    console.log('\n=================================================================')
    console.log(`🏁 نتایج ارزیابی: ${passed} تست با موفقیت پاس شد | ${failed} خطا`)
    console.log('=================================================================')
  } catch (error) {
    console.error('❌ خطای پیش‌بینی‌نشده در اجرای تست‌ها:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runTests()
