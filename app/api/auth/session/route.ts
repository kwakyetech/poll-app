import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie, validateSession } from '@/lib/auth';
import { findUserById } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = getSessionFromCookie(request);
    console.log('Session validation - Token from cookie:', sessionToken ? 'present' : 'missing');
    
    if (!sessionToken) {
      console.log('Session validation failed: No session token found');
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Validate session
    const userId = validateSession(sessionToken);
    console.log('Session validation - User ID:', userId ? 'found' : 'not found');
    
    if (!userId) {
      console.log('Session validation failed: Invalid or expired session');
      // Clear the invalid cookie
      const response = NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
      response.cookies.delete('poll_session');
      return response;
    }

    // Get user data
    const user = findUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (excluding password hash)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}