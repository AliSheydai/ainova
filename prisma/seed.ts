import { PrismaClient, InventoryType } from '@prisma/client'

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
        title: 'Google AI Pro ۱۸ ماهه',
        slug: 'google-ai-pro',
        shortDescription: 'اشتراک اختصاصی ۱۸ ماهه هوش مصنوعی گوگل — تحویل فوری',
        description:
          'اشتراک اختصاصی ۱۸ ماهه Google AI Pro را روی حساب گوگل شخصی خودتان فعال کنید. دسترسی به جمینای پیشرفته، ۲ ترابایت فضای ابری گوگل وان و ابزارهای پیشرفته هوش مصنوعی گوگل، کاملاً امن و بدون نیاز به رمز عبور.',
        price: 390000,
        status: 'ACTIVE',
        sortOrder: 1,
        image: '/images/gemini-banner.png',
        plans: {
          create: [
            {
              name: '۱۸ ماهه',
              duration: 18,
              price: 390000, // 390,000 Toman
              fulfillmentType: 'ACTIVATION_LINK',
              active: true,
            },
          ],
        },
      },
      include: { plans: true },
    })
  } else {
    product = await prisma.product.update({
      where: { id: product.id },
      data: {
        title: product.title || 'Google AI Pro ۱۸ ماهه',
        shortDescription: product.shortDescription || 'اشتراک اختصاصی ۱۸ ماهه هوش مصنوعی گوگل — تحویل فوری',
        description:
          product.description ||
          'اشتراک اختصاصی ۱۸ ماهه Google AI Pro را روی حساب گوگل شخصی خودتان فعال کنید. دسترسی به جمینای پیشرفته، ۲ ترابایت فضای ابری گوگل وان و ابزارهای پیشرفته هوش مصنوعی گوگل، کاملاً امن و بدون نیاز به رمز عبور.',
        price: product.price || 390000,
        status: 'ACTIVE',
        sortOrder: product.sortOrder || 1,
      },
      include: { plans: true },
    })
  }

  console.log('✅ Product ready:', product.title)
  console.log(`✅ Product Price: ${product.price.toLocaleString('fa-IR')} تومان`)

  const plan = product.plans[0]
  // 2. Idempotent Fake Activation Links (10 sample links) in inventory_items
  const sampleUrls = Array.from({ length: 10 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0')
    return `https://one.google.com/promo/offer/google-ai-pro-activation-demo-link-${num}`
  })

  let createdCount = 0
  for (const url of sampleUrls) {
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        type: InventoryType.ACTIVATION_LINK,
        productId: product.id,
      },
    })

    const allItems = await prisma.inventoryItem.findMany({
      where: {
        type: InventoryType.ACTIVATION_LINK,
        productId: product.id,
      },
    })

    const alreadyPresent = allItems.some((item) => {
      const dataObj =
        typeof item.data === 'string' ? JSON.parse(item.data) : item.data
      return dataObj?.url === url
    })

    if (!alreadyPresent) {
      await prisma.inventoryItem.create({
        data: {
          productId: product.id,
          planId: plan?.id,
          type: InventoryType.ACTIVATION_LINK,
          data: { url },
          status: 'AVAILABLE',
        },
      })
      createdCount++
    }
  }

  const availableCount = await prisma.inventoryItem.count({
    where: { productId: product.id, type: InventoryType.ACTIVATION_LINK, status: 'AVAILABLE' },
  })

  console.log(`✅ Seeded ${createdCount} new inventory activation links.`)
  console.log(`📊 Total AVAILABLE inventory links for product: ${availableCount}`)

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
