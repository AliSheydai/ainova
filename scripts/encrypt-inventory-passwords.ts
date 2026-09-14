import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { encryptCredential, decryptCredential } from '../src/lib/security/crypto'

const prisma = new PrismaClient()

async function main() {
  const items = await prisma.inventoryItem.findMany({
    where: { type: 'PRE_CREATED_ACCOUNT' },
  })

  let updated = 0
  let skipped = 0

  for (const item of items) {
    const data =
      typeof item.data === 'string' ? JSON.parse(item.data) : (item.data as Record<string, any>)

    if (!data?.password) {
      skipped++
      continue
    }

    // اگر فرمت iv:tag:cipher داره یعنی قبلاً encrypt شده
    const parts = String(data.password).split(':')
    if (parts.length === 3 && parts[0].length > 10) {
      skipped++
      continue
    }

    // Plaintext هست — encrypt کن
    const encrypted = encryptCredential(data.password)
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        data: {
          ...data,
          password: encrypted,
        },
      },
    })
    updated++
  }

  console.log(`✅ Migration complete: ${updated} encrypted, ${skipped} already encrypted/skipped`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
