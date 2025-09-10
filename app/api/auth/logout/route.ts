import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie, destroySession, clearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = getSessionFromCookie(request);
    
    if (sessionToken) {
      // Destroy session
      destroySession(sessionToken);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear session cookie
    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}