import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined!')
  }
  return new TextEncoder().encode(secret)
}

export const AUTH_COOKIE_NAME = 'auth_token'
export const TOKEN_EXPIRY = '30d'

export interface UserJwtPayload {
  userId: string
  phone: string
  name?: string | null
  role?: 'ADMIN' | 'USER'
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
    return await verifyToken(token)
  } catch {
    return null
  }
}
