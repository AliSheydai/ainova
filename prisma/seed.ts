import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Google AI Pro product
  const product = await prisma.product.upsert({
    where: { slug: 'google-ai-pro' },
    update: {},
    create: {
      name: 'Google AI Pro',
      slug: 'google-ai-pro',
      description:
        'Google AI Pro را روی حساب Google خودتان فعال کنید و از قابلیت‌های پیشرفته هوش مصنوعی Google استفاده کنید.',
      active: true,
      plans: {
        create: [
          {
            name: '۱۸ ماهه',
            duration: 18,
            price: 390000, // 390,000 Toman
            active: true,
          },
        ],
      },
    },
    include: { plans: true },
  })

  console.log('✅ Product created:', product.name)
  console.log('✅ Plans:', product.plans.map((p) => `${p.name} — ${p.price.toLocaleString()} تومان`))

  // Seed sample activation links for testing
  const plan = product.plans[0]
  if (plan) {
    const existingLinksCount = await prisma.activationLink.count({
      where: { planId: plan.id },
    })

    if (existingLinksCount === 0) {
      await prisma.activationLink.createMany({
        data: [
          {
            planId: plan.id,
            url: 'https://one.google.com/promo/offer/google-ai-pro-activation-demo-link-1',
          },
          {
            planId: plan.id,
            url: 'https://one.google.com/promo/offer/google-ai-pro-activation-demo-link-2',
          },
          {
            planId: plan.id,
            url: 'https://one.google.com/promo/offer/google-ai-pro-activation-demo-link-3',
          },
          {
            planId: plan.id,
            url: 'https://one.google.com/promo/offer/google-ai-pro-activation-demo-link-4',
          },
          {
            planId: plan.id,
            url: 'https://one.google.com/promo/offer/google-ai-pro-activation-demo-link-5',
          },
        ],
      })
      console.log('✅ 5 sample activation links seeded!')
    }
  }

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
