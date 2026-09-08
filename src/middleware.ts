import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_COOKIE_NAME = 'auth_token'
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-at-least-32-chars-long-for-google-ai-pro'
const secretKey = new TextEncoder().encode(JWT_SECRET)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  let isAuthenticated = false

  if (token) {
    try {
      await jwtVerify(token, secretKey)
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  // If user is logged in and trying to access /login, redirect to /dashboard
  if (pathname.startsWith('/login')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
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
