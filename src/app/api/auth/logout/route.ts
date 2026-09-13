import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, getCurrentUser, revokeUserTokens } from '@/lib/auth/jwt'

export async function POST() {
  try {
    const session = await getCurrentUser()
    if (session?.userId) {
      await revokeUserTokens(session.userId)
    }
  } catch (error) {
    console.error('Error revoking user session during logout:', error)
  }

  const response = NextResponse.json({
    success: true,
    message: 'خروج با موفقیت انجام شد.',
  })

  response.cookies.delete(AUTH_COOKIE_NAME)

  return response
}
