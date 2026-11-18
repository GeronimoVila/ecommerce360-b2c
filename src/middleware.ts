import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');
  const refreshToken = request.cookies.get('refresh_token');
  const hasActiveSession = Boolean(accessToken || refreshToken);

  if (request.nextUrl.pathname === '/checkout' && !hasActiveSession) {
    return NextResponse.redirect(new URL('/checkout/register', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/checkout/register') && hasActiveSession) {
    return NextResponse.redirect(new URL('/checkout', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/checkout/:path*'],
};