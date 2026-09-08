import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create or ensure Google AI Pro product & plan exists
  let product = await prisma.product.findUnique({
    where: { slug: 'google-ai-pro' },
    include: { plans: true },
  })

  if (!product) {
    product = await prisma.product.create({
      data: {
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
  }

  console.log('✅ Product ready:', product.name)
  console.log(
    '✅ Plans:',
    product.plans.map((p) => `${p.name} — ${p.price.toLocaleString('fa-IR')} تومان`)
  )

  const plan = product.plans[0]
  if (plan) {
    // 2. Idempotent Fake Activation Links (10 sample links)
    const sampleUrls = Array.from({ length: 10 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0')
      return `https://one.google.com/promo/offer/google-ai-pro-activation-demo-link-${num}`
    })

    let createdCount = 0
    for (const url of sampleUrls) {
      const exists = await prisma.activationLink.findFirst({
        where: { url },
      })

      if (!exists) {
        await prisma.activationLink.create({
          data: {
            planId: plan.id,
            url,
            status: 'AVAILABLE',
          },
        })
        createdCount++
      }
    }

    const availableCount = await prisma.activationLink.count({
      where: { planId: plan.id, status: 'AVAILABLE' },
    })

    console.log(`✅ Seeded ${createdCount} new activation links.`)
    console.log(`📊 Total AVAILABLE activation links for plan: ${availableCount}`)
  }

  console.log('🎉 Seed complete and idempotent!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
