import { prisma } from '../src/lib/prisma'
import { decryptCredential, encryptCredential, isEncryptedCredential } from '../src/lib/security/crypto'

async function migrate() {
  console.log('--- Starting Credentials Re-encryption Migration ---')

  // 1. Inventory Items
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { data: { not: undefined } },
  })

  let updatedInventoryCount = 0
  for (const item of inventoryItems) {
    const data = (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) as Record<string, any>
    if (data?.password && typeof data.password === 'string') {
      const plainPassword = decryptCredential(data.password)
      if (plainPassword) {
        // Re-encrypt with the current primary encryption key
        const newEncrypted = encryptCredential(plainPassword)
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            data: {
              ...data,
              password: newEncrypted,
            },
          },
        })
        updatedInventoryCount++
      }
    }
  }
  console.log(`Re-encrypted ${updatedInventoryCount} inventory item passwords.`)

  // 2. Orders (checkoutData)
  const orders = await prisma.order.findMany({
    where: { checkoutData: { not: undefined } },
  })

  let updatedOrdersCount = 0
  for (const order of orders) {
    const data = (typeof order.checkoutData === 'string'
      ? JSON.parse(order.checkoutData)
      : order.checkoutData) as Record<string, any>
    if (data?.customer_password && typeof data.customer_password === 'string') {
      const plainPassword = decryptCredential(data.customer_password)
      if (plainPassword) {
        const newEncrypted = encryptCredential(plainPassword)
        await prisma.order.update({
          where: { id: order.id },
          data: {
            checkoutData: {
              ...data,
              customer_password: newEncrypted,
            },
          },
        })
        updatedOrdersCount++
      }
    }
  }
  console.log(`Re-encrypted ${updatedOrdersCount} order customer passwords.`)

  // 3. Deliveries
  const deliveries = await prisma.delivery.findMany({
    where: { data: { not: undefined } },
  })

  let updatedDeliveriesCount = 0
  for (const delivery of deliveries) {
    const data = (typeof delivery.data === 'string'
      ? JSON.parse(delivery.data)
      : delivery.data) as Record<string, any>
    if (data?.password && typeof data.password === 'string') {
      const plainPassword = decryptCredential(data.password)
      if (plainPassword) {
        const newEncrypted = encryptCredential(plainPassword)
        await prisma.delivery.update({
          where: { id: delivery.id },
          data: {
            data: {
              ...data,
              password: newEncrypted,
            },
          },
        })
        updatedDeliveriesCount++
      }
    }
  }
  console.log(`Re-encrypted ${updatedDeliveriesCount} delivery passwords.`)

  console.log('--- Migration Completed Successfully ---')
  await prisma.$disconnect()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
