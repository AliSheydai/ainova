import { prisma } from './src/lib/prisma'

async function main() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      plans: true,
      inventoryItems: {
        where: { status: 'AVAILABLE' },
        select: {
          id: true,
          productId: true,
          planId: true,
          variantId: true,
          type: true,
          status: true,
          data: true,
        },
      },
    },
  })

  for (const p of products) {
    console.log(`=== PRODUCT: ${p.title} (slug: ${p.slug}, id: ${p.id}) ===`)
    console.log(`Variants (${p.variants.length}):`)
    for (const v of p.variants) {
      console.log(`  - Variant: id=${v.id}, name="${v.name}", price=${v.price}, active=${v.active}`)
    }
    console.log(`Plans (${p.plans.length}):`)
    for (const pl of p.plans) {
      console.log(`  - Plan: id=${pl.id}, name="${pl.name}", variantId=${pl.variantId}, fulfillmentType=${pl.fulfillmentType}, price=${pl.price}, active=${pl.active}`)
    }
    console.log(`Inventory Items Available (${p.inventoryItems.length}):`)
    for (const inv of p.inventoryItems) {
      console.log(`  - Inv: id=${inv.id}, type=${inv.type}, planId=${inv.planId}, variantId=${inv.variantId}, data=${JSON.stringify(inv.data)}`)
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
