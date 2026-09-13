import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '../prisma'

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined!')
  }
  return new TextEncoder().encode(secret)
}

export const AUTH_COOKIE_NAME = 'auth_token'
export const TOKEN_EXPIRY = '7d'

export interface UserJwtPayload {
  userId: string
  phone: string
  name?: string | null
  role?: 'ADMIN' | 'USER'
  tokenVersion?: number
}

export async function signToken(payload: UserJwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecretKey())
}

export async function verifyToken(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return {
      userId: payload.userId as string,
      phone: payload.phone as string,
      name: (payload.name as string) || null,
      role: (payload.role as 'ADMIN' | 'USER') || 'USER',
      tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : undefined,
    }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<UserJwtPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload?.userId) return null

    // Check tokenVersion in database to allow immediate session revocation on logout
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        tokenVersion: true,
      },
    })

    if (!user) return null

    // If token has a tokenVersion and it does not match DB, the token was revoked
    if (
      payload.tokenVersion !== undefined &&
      user.tokenVersion !== payload.tokenVersion
    ) {
      return null
    }

    return {
      userId: user.id,
      phone: user.phone || payload.phone,
      name: user.name ?? payload.name,
      role: user.role,
      tokenVersion: user.tokenVersion,
    }
  } catch {
    return null
  }
}

export async function revokeUserTokens(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  })
}
