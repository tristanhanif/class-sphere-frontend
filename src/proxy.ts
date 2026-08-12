import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JwtPayload {
  role?: string;
}

function decodeJWT(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString()) as JwtPayload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  if (pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/reset-password')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = decodeJWT(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  const { role } = payload;

  if (pathname.startsWith('/superadmin') && role !== 'SUPERADMIN') {
    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/admin') && role === 'USER') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/dashboard') && role !== 'USER') {
    if (role === 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
