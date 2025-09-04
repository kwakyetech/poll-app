import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for handling authentication and route protection
 * Now works with mock authentication system
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/polls/create',
    '/profile',
    '/api/polls/create',
  ];

  // Public routes that should redirect to dashboard if user is authenticated
  const publicOnlyRoutes = [
    '/auth/login',
    '/auth/register',
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is a public-only route
  const isPublicOnlyRoute = publicOnlyRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check for mock authentication session in cookies
  const mockSession = req.cookies.get('mock-auth-session');
  let isAuthenticated = false;

  if (mockSession) {
    try {
      const sessionData = JSON.parse(mockSession.value);
      // Check if session is not expired
      if (sessionData.expires_at > Math.floor(Date.now() / 1000)) {
        isAuthenticated = true;
      }
    } catch (error) {
      // Invalid session data, treat as unauthenticated
      console.warn('Invalid session data in middleware:', error);
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from public-only routes
  if (isPublicOnlyRoute && isAuthenticated) {
    const redirectTo = req.nextUrl.searchParams.get('redirectTo');
    const redirectUrl = new URL(redirectTo || '/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle API routes authentication
  if (pathname.startsWith('/api/')) {
    // Skip auth check for public API routes
    const publicApiRoutes = [
      '/api/auth',
      '/api/health',
      '/api/polls/', // Allow public access to individual poll routes
    ];

    // Special handling for poll-related API routes
    if (pathname.startsWith('/api/polls/')) {
      // Allow public access to view polls and their data
      if (pathname.match(/^\/api\/polls\/[^/]+$/) || pathname.match(/^\/api\/polls\/[^/]+\/text-response$/)) {
        return NextResponse.next();
      }
      // Protect vote casting and poll creation
      if (pathname.includes('/vote') || pathname === '/api/polls') {
        if (!isAuthenticated) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
      }
    }

    const isPublicApiRoute = publicApiRoutes.some(route => 
      pathname.startsWith(route)
    );

    if (!isPublicApiRoute && !isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

/**
 * Configure which routes should run the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};