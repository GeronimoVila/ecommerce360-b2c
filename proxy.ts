import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const refId = url.searchParams.get('ref');
  const response = NextResponse.next();

  if (!refId) return response;

  try {
    const coreApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    const validationRes = await fetch(`${coreApiUrl}/api/v1/users/validate/${refId}`, {
      cache: 'no-store' 
    });

    if (validationRes.ok) {
      const data = await validationRes.json();
      
      response.cookies.set({
        name: 'seller_attribution',
        value: data.sellerId,
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.expiresIn || 86400, 
        path: '/',
      });
    } else {
      console.warn(`[Proxy] El Core rechazó el ID: ${refId}. Status: ${validationRes.status}`);
    }
  } catch (error) {
    console.error('[Proxy] Error de red al contactar al Core:', error);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};