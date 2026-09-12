import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_COOKIE_NAME = 'auth_token'

function getSecretKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined!')
    return null
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  let payload: Record<string, unknown> | null = null

  const secretKey = getSecretKey()
  if (token && secretKey) {
    try {
      const verified = await jwtVerify(token, secretKey)
      payload = verified.payload as Record<string, unknown>
    } catch {
      payload = null
    }
  }

  const isAuthenticated = Boolean(payload)
  const isAdmin = payload?.role === 'ADMIN'

  // If user is already logged in and attempts to access /login:
  if (pathname.startsWith('/login')) {
    if (isAuthenticated) {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Strictly protect /dashboard routes: ONLY for ADMIN
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!isAdmin) {
      // Regular user trying to access admin dashboard -> redirect to home page
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
  ],
}
