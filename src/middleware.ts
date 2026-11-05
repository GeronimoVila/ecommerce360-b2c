import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  
  if (request.nextUrl.pathname === '/checkout' && !token) {
    return NextResponse.redirect(new URL('/checkout/register', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/checkout/register') && token) {
    return NextResponse.redirect(new URL('/checkout', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/checkout/:path*'],
};