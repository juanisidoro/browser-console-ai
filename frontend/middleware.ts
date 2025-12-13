/**
 * Next.js Middleware
 *
 * Handles routing rules and security headers.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: Add noindex headers to prevent search engine indexing
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next();

    // Prevent indexing by search engines
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

    // Additional security headers for admin
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match admin routes
    '/admin/:path*',
  ],
};
