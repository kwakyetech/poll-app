import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for handling authentication and route protection
 * Works with secure authentication system
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

  // Check for secure authentication session in cookies
  const sessionToken = req.cookies.get('poll_session');
  let isAuthenticated = false;

  if (sessionToken) {
    // For middleware, we'll do a simple token existence check
    // The actual session validation will happen in API routes
    isAuthenticated = sessionToken.value.length > 0;
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