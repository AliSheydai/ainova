import { PrismaClient, InventoryType, LinkStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting migration of activation_links to inventory_items...')

  const activationLinks = await prisma.activationLink.findMany()
  console.log(`📦 Found ${activationLinks.length} activation links in database.`)

  let migratedCount = 0
  let linkedOrdersCount = 0
  let skippedCount = 0

  for (const link of activationLinks) {
    // Check if an inventory item already exists with this exact URL for this product/plan
    const existing = await prisma.inventoryItem.findFirst({
      where: {
        type: InventoryType.ACTIVATION_LINK,
        OR: [
          { orderId: link.orderId ? link.orderId : undefined },
          {
            AND: [
              { productId: link.productId },
              { planId: link.planId },
            ],
          },
        ],
      },
    })

    // Parse existing data if any to check url match
    let isAlreadyMigrated = false
    if (existing) {
      const dataObj =
        typeof existing.data === 'string'
          ? JSON.parse(existing.data)
          : existing.data
      if (dataObj?.url === link.url) {
        isAlreadyMigrated = true
      }
    }

    if (isAlreadyMigrated) {
      skippedCount++
      continue
    }

    // Determine target status
    let status: LinkStatus = link.status
    if (link.orderId && status === LinkStatus.AVAILABLE) {
      status = LinkStatus.USED
    }

    // Check if orderId is already taken by another inventory item
    let orderIdToAssign: string | null = link.orderId
    if (orderIdToAssign) {
      const orderAlreadyHasInv = await prisma.inventoryItem.findUnique({
        where: { orderId: orderIdToAssign },
      })
      if (orderAlreadyHasInv) {
        orderIdToAssign = null
      }
    }

    const createdItem = await prisma.inventoryItem.create({
      data: {
        productId: link.productId,
        planId: link.planId,
        type: InventoryType.ACTIVATION_LINK,
        status: status,
        data: { url: link.url },
        orderId: orderIdToAssign,
        assignedAt: link.assignedAt,
        usedAt: link.usedAt,
        createdAt: link.createdAt,
      },
    })

    migratedCount++
    if (orderIdToAssign) {
      linkedOrdersCount++

      // Also ensure delivery record exists for this completed order if missing
      const existingDelivery = await prisma.delivery.findUnique({
        where: { orderId: orderIdToAssign },
      })
      if (!existingDelivery) {
        await prisma.delivery.create({
          data: {
            orderId: orderIdToAssign,
            type: 'ACTIVATION_LINK',
            status: 'DELIVERED',
            data: {
              url: link.url,
              instructions: 'روی لینک کلیک کنید و در حساب کاربری گوگل خود فعال‌سازی را تأیید فرمایید.',
            },
            deliveredAt: link.assignedAt || link.createdAt,
          },
        })
      }
    }
  }

  console.log(`✅ Migration complete:`)
  console.log(`   - Migrated items: ${migratedCount}`)
  console.log(`   - Linked orders: ${linkedOrdersCount}`)
  console.log(`   - Skipped (already migrated): ${skippedCount}`)

  const totalInventory = await prisma.inventoryItem.count({
    where: { type: InventoryType.ACTIVATION_LINK },
  })
  console.log(`📊 Total ACTIVATION_LINK inventory items now: ${totalInventory}`)
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
