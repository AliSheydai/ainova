import { prisma } from '@/lib/prisma'
import { Role, type User } from '@prisma/client'

// Unique 64-bit integer identifier for PostgreSQL advisory lock
const ADVISORY_LOCK_ID = 982341235

/**
 * Ensures the first registered user gets the ADMIN role, and all subsequent users
 * get the USER role in a race-safe manner using PostgreSQL advisory transaction locks.
 */
export async function getOrCreateUserWithRole(data: {
  phone?: string | null
  telegramId?: string | null
  telegramUsername?: string | null
  name?: string | null
}): Promise<User> {
  const { phone, telegramId, telegramUsername, name } = data

  // First check if user already exists
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) return existing
  } else if (telegramId) {
    const existing = await prisma.user.findUnique({ where: { telegramId } })
    if (existing) return existing
  }

  // User does not exist, run race-safe transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Acquire transaction-level advisory lock in PostgreSQL
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_ID});`

    // 2. Double-check if another concurrent transaction already created this user
    if (phone) {
      const existing = await tx.user.findUnique({ where: { phone } })
      if (existing) return existing
    } else if (telegramId) {
      const existing = await tx.user.findUnique({ where: { telegramId } })
      if (existing) return existing
    }

    // 3. Count existing admins in the system
    const adminCount = await tx.user.count({
      where: { role: Role.ADMIN },
    })

    // First user is ADMIN; all subsequent users are USER
    const assignedRole: Role = adminCount === 0 ? Role.ADMIN : Role.USER

    // 4. Create the new user with the determined role
    return await tx.user.create({
      data: {
        phone: phone || null,
        telegramId: telegramId || null,
        telegramUsername: telegramUsername || null,
        name: name || null,
        role: assignedRole,
      },
    })
  })
}
