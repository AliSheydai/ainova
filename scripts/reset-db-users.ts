import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Cleaning up database users, orders, payments, and tokens...')

  // Delete dependent records
  const deletedPayments = await prisma.payment.deleteMany({})
  console.log(`✓ Deleted ${deletedPayments.count} payments`)

  // Reset activation links
  const resetLinks = await prisma.activationLink.updateMany({
    data: {
      orderId: null,
      status: 'AVAILABLE',
      assignedAt: null,
      usedAt: null,
    },
  })
  console.log(`✓ Reset ${resetLinks.count} activation links to AVAILABLE`)

  // Delete support tickets
  const deletedTickets = await prisma.supportTicket.deleteMany({})
  console.log(`✓ Deleted ${deletedTickets.count} support tickets`)

  // Delete orders
  const deletedOrders = await prisma.order.deleteMany({})
  console.log(`✓ Deleted ${deletedOrders.count} orders`)

  // Delete OTP tokens
  const deletedOtps = await prisma.otpToken.deleteMany({})
  console.log(`✓ Deleted ${deletedOtps.count} OTP tokens`)

  // Delete users
  const deletedUsers = await prisma.user.deleteMany({})
  console.log(`✓ Deleted ${deletedUsers.count} users`)

  // Seed default System Settings if empty
  const defaultSettings = [
    {
      key: 'support_phone',
      value: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '021-91000000',
      description: 'شماره تماس پشتیبانی',
    },
    {
      key: 'support_telegram',
      value: process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || 'https://t.me/google_ai_pro_support',
      description: 'لینک پشتیبانی تلگرام',
    },
    {
      key: 'telegram_bot_username',
      value: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'arioaccountbot',
      description: 'یوزرنیم ربات تلگرام',
    },
    {
      key: 'telegram_bot_deeplink',
      value: `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'arioaccountbot'}?start=guest`,
      description: 'لینک شروع ربات تلگرام',
    },
    {
      key: 'sales_enabled',
      value: 'true',
      description: 'فعال یا غیرفعال بودن فروش عمومی',
    },
    {
      key: 'sales_notice',
      value: 'تحویل فوری لینک فعال‌سازی به‌صورت آنی پس از پرداخت موفق انجام می‌شود.',
      description: 'پیام اطلاع‌رسانی بالای فروشگاه',
    },
  ]

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }
  console.log('✓ Default system settings checked/seeded')

  // Check product & plan
  const productCount = await prisma.product.count()
  if (productCount === 0) {
    const p = await prisma.product.create({
      data: {
        name: 'Google AI Pro',
        slug: 'google-ai-pro',
        description: 'اشتراک اختصاصی جمینای روی حساب شخصی شما',
        active: true,
        plans: {
          create: {
            name: 'اشتراک ۱۸ ماهه',
            duration: 18,
            price: 390000,
            active: true,
          },
        },
      },
    })
    console.log(`✓ Created initial product: ${p.name}`)
  } else {
    console.log('✓ Products & plans already exist')
  }

  console.log('🎉 Database is now clean and ready! First registered user will be ADMIN.')
}

main()
  .catch((e) => {
    console.error('Error during reset:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
