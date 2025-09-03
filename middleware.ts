import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for handling authentication and route protection
 */
export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Skip middleware if Supabase is not configured (mock mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseUrl === 'your-supabase-url-here' ||
      supabaseAnonKey === 'placeholder-key' || 
      supabaseAnonKey === 'your-supabase-anon-key-here') {
    // In mock mode, allow all routes - no authentication required
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            // Update the request cookies
            req.cookies.set({
              name,
              value,
              ...options,
            });
            // Create a new response with updated cookies
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            // Set the cookie on the response
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: Record<string, unknown>) {
            // Remove from request cookies
            req.cookies.set({
              name,
              value: '',
              ...options,
            });
            // Create a new response
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            // Remove from response cookies
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession();

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

    // Redirect unauthenticated users away from protected routes
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from public-only routes
    if (isPublicOnlyRoute && session) {
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
          return response;
        }
        // Protect vote casting and poll creation
        if (pathname.includes('/vote') || pathname === '/api/polls') {
          if (!session) {
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

      if (!isPublicApiRoute && !session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
  } catch (error) {
    console.warn('Middleware error:', error);
    // If there's an error in middleware, allow the request to continue
    return response;
  }

  return response;
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