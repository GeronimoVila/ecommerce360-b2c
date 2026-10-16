import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const tag = request.nextUrl.searchParams.get('tag');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ error: 'Falta el parámetro tag' }, { status: 400 });
  }

  try {
    revalidateTag(tag, 'max');
    
    return NextResponse.json({ revalidated: true, tag, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: 'Error al revalidar la caché' }, { status: 500 });
  }
}