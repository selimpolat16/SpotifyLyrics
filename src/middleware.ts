import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: '/admin/:path*',
  runtime: 'nodejs'
}

export async function middleware(request: NextRequest) {
  // Admin sayfalarını kontrol et
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Login sayfasına erişime izin ver
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Auth token'ı kontrol et
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      // Token yoksa login sayfasına yönlendir
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
} 