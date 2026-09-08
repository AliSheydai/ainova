import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-at-least-32-chars-long-for-google-ai-pro'
const secretKey = new TextEncoder().encode(JWT_SECRET)

export const AUTH_COOKIE_NAME = 'auth_token'
export const TOKEN_EXPIRY = '30d'

export interface UserJwtPayload {
  userId: string
  phone: string
  name?: string | null
}

export async function signToken(payload: UserJwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secretKey)
}

export async function verifyToken(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return {
      userId: payload.userId as string,
      phone: payload.phone as string,
      name: (payload.name as string) || null,
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
