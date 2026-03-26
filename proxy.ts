import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Check for EITHER the non-secure (dev) or secure (prod) cookie
  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token');

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // 2. Redirect logged-in users AWAY from auth pages (Login/Register)
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Redirect logged-in users who hit the root '/' straight to dashboard
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Protect the Dashboard (Redirect non-logged-in users to Login)
  // We explicitly check /dashboard here to avoid accidental infinite loops on public pages
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. If root '/' and NOT logged in, let them fall through (to the Landing Page)
  // OR if you want '/' to be strictly private, add it to step 4.
  
  return NextResponse.next();
}

export const config = {
  // Apply to root, dashboard, and auth pages
  matcher: ['/', '/dashboard/:path*', '/login', '/register'],
};