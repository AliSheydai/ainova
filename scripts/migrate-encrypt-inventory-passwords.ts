import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { isEncryptedCredential, encryptCredential } from '../src/lib/security/crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔒 اجرای اسکریپت رمزنگاری پسوردهای اکانت‌ها در انبار...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // 1. Check Inventory Items
    const inventoryAccounts = await prisma.inventoryItem.findMany({
      where: {
        type: 'PRE_CREATED_ACCOUNT',
      },
    })

    console.log(`📦 تعداد کل اکانت‌های آماده انبار یافت‌شده: ${inventoryAccounts.length}`)

    let inventoryEncryptedCount = 0
    let inventoryAlreadyEncryptedCount = 0
    let inventorySkippedCount = 0

    for (const item of inventoryAccounts) {
      const data =
        typeof item.data === 'string' ? JSON.parse(item.data) : { ...(item.data as Record<string, any>) }

      if (!data || !data.password) {
        inventorySkippedCount++
        continue
      }

      const rawPassword = String(data.password).trim()
      if (!rawPassword) {
        inventorySkippedCount++
        continue
      }

      if (isEncryptedCredential(rawPassword)) {
        inventoryAlreadyEncryptedCount++
        continue
      }

      // Encrypt plaintext password
      const encrypted = encryptCredential(rawPassword)
      data.password = encrypted

      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          data,
        },
      })

      inventoryEncryptedCount++
      console.log(`  ✓ اکانت [${data.email || data.username || item.id}] در انبار با موفقیت رمزنگاری شد.`)
    }

    console.log('\n📊 خلاصه نتیجه انبار:')
    console.log(`  - قبلاً رمزنگاری‌شده: ${inventoryAlreadyEncryptedCount}`)
    console.log(`  - تازه رمزنگاری‌شده: ${inventoryEncryptedCount}`)
    console.log(`  - بدون پسورد/ردشده: ${inventorySkippedCount}`)

    // 2. Check Deliveries for pre-created accounts
    const deliveries = await prisma.delivery.findMany({
      where: {
        type: 'PRE_CREATED_ACCOUNT',
      },
    })

    console.log(`\n📬 بررسی تحویل‌های قبلی (${deliveries.length} مورد)...`)
    let deliveryEncryptedCount = 0
    let deliveryAlreadyEncrypted = 0

    for (const d of deliveries) {
      const data =
        typeof d.data === 'string' ? JSON.parse(d.data) : { ...(d.data as Record<string, any>) }

      if (data && data.password && typeof data.password === 'string') {
        const pass = data.password.trim()
        if (pass && !isEncryptedCredential(pass)) {
          data.password = encryptCredential(pass)
          await prisma.delivery.update({
            where: { id: d.id },
            data: { data },
          })
          deliveryEncryptedCount++
        } else if (pass && isEncryptedCredential(pass)) {
          deliveryAlreadyEncrypted++
        }
      }
    }

    console.log(`  - تحویل‌های تازه رمزنگاری‌شده: ${deliveryEncryptedCount}`)
    console.log(`  - تحویل‌های قبلاً ایمن: ${deliveryAlreadyEncrypted}`)

    console.log('\n🎉 عملیات مایگریشن و امن‌سازی پسوردها با موفقیت پایان یافت.')
  } catch (error) {
    console.error('❌ خطا در هنگام اجرای مایگریشن رمزنگاری:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
