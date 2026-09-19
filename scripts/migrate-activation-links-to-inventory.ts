import { PrismaClient, InventoryType } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * ONE-TIME MIGRATION SCRIPT (COMPLETED)
 * All legacy activation_links were migrated to inventory_items and the table was dropped in Phase 4.
 */
async function main() {
  const count = await prisma.inventoryItem.count({
    where: { type: InventoryType.ACTIVATION_LINK },
  })
  console.log(`✅ Migration completed in Phase 4. Currently ${count} ACTIVATION_LINK items in inventory_items.`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
