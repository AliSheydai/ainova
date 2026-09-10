import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  console.log('🔄 Starting safe product data migration...')

  // 1. Find or create the primary Gemini product
  let product = await prisma.product.findUnique({
    where: { slug: 'google-ai-pro' },
    include: { plans: true },
  })

  if (!product) {
    console.log('Creating initial Gemini product...')
    product = await prisma.product.create({
      data: {
        title: 'Google AI Pro ۱۸ ماهه',
        name: 'Google AI Pro ۱۸ ماهه',
        slug: 'google-ai-pro',
        shortDescription: 'اشتراک اختصاصی ۱۸ ماهه هوش مصنوعی گوگل — تحویل فوری',
        description:
          'اشتراک اختصاصی ۱۸ ماهه Google AI Pro را روی حساب گوگل شخصی خودتان فعال کنید. دسترسی به جمینای پیشرفته، ۲ ترابایت فضای ابری گوگل وان و ابزارهای پیشرفته هوش مصنوعی گوگل، کاملاً امن و بدون نیاز به رمز عبور.',
        price: 390000,
        status: 'ACTIVE',
        active: true,
        fulfillmentType: 'ACTIVATION_LINK',
        sortOrder: 1,
        image: '/images/gemini-banner.png',
      },
      include: { plans: true },
    })
  } else {
    console.log('Updating existing Gemini product fields...')
    product = await prisma.product.update({
      where: { id: product.id },
      data: {
        title: 'Google AI Pro ۱۸ ماهه',
        name: 'Google AI Pro ۱۸ ماهه',
        shortDescription: 'اشتراک اختصاصی ۱۸ ماهه هوش مصنوعی گوگل — تحویل فوری',
        description:
          'اشتراک اختصاصی ۱۸ ماهه Google AI Pro را روی حساب گوگل شخصی خودتان فعال کنید. دسترسی به جمینای پیشرفته، ۲ ترابایت فضای ابری گوگل وان و ابزارهای پیشرفته هوش مصنوعی گوگل، کاملاً امن و بدون نیاز به رمز عبور.',
        price: 390000,
        status: 'ACTIVE',
        active: true,
        fulfillmentType: 'ACTIVATION_LINK',
        sortOrder: 1,
      },
      include: { plans: true },
    })
  }

  console.log(`✅ Product ready: ${product.title} (ID: ${product.id})`)

  // 2. Link all existing orders without productId to this product
  const ordersUpdated = await prisma.order.updateMany({
    where: { productId: null },
    data: { productId: product.id },
  })
  console.log(`✅ Linked ${ordersUpdated.count} orders to product ${product.title}.`)

  // 3. Link all existing activation links without productId to this product
  const linksUpdated = await prisma.activationLink.updateMany({
    where: { productId: null },
    data: { productId: product.id },
  })
  console.log(`✅ Linked ${linksUpdated.count} activation links to product ${product.title}.`)

  // 4. Verification counts
  const totalOrders = await prisma.order.count({ where: { productId: product.id } })
  const totalLinks = await prisma.activationLink.count({ where: { productId: product.id } })
  const availableLinks = await prisma.activationLink.count({
    where: { productId: product.id, status: 'AVAILABLE' },
  })

  console.log(`📊 Total orders for product: ${totalOrders}`)
  console.log(`📊 Total links for product: ${totalLinks} (Available: ${availableLinks})`)
  console.log('🎉 Migration finished successfully and safely!')
}

migrate()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
