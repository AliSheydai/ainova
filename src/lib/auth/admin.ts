import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import { Role, type User } from '@prisma/client'

/**
 * Server Component Guard for Admin Pages.
 * Verifies that the current request has a valid session and user has ADMIN role.
 * If unauthorized, immediately redirects to home ('/').
 */
export async function requireAdmin(): Promise<User> {
  const session = await getCurrentUser()

  if (!session || !session.userId) {
    redirect('/login?redirect=/dashboard')
  }

  // Double-check with the database for absolute security
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })

  if (!user || user.role !== Role.ADMIN) {
    redirect('/')
  }

  return user
}

/**
 * API Route Guard for Admin Endpoints.
 * Returns either the verified Admin User or a 401/403 NextResponse.
 */
export async function requireAdminApi(): Promise<
  | { user: User; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const session = await getCurrentUser()

  if (!session || !session.userId) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'احراز هویت انجام نشده است.' },
        { status: 401 }
      ),
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })

  if (!user || user.role !== Role.ADMIN) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز. این بخش فقط برای مدیران سیستم است.' },
        { status: 403 }
      ),
    }
  }

  return { user, errorResponse: null }
}
