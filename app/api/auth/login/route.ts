import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, setSecureCookie, checkRateLimit, sanitizeInput } from '@/lib/auth';
import { findUserByEmailOrUsername, initializeUsers } from '@/lib/mockData';
import { z } from 'zod';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(request: NextRequest) {
  try {
    // Initialize demo users with proper password hashes
    await initializeUsers();
    
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`login:${clientIP}`)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { usernameOrEmail, password } = validation.data;
    
    // Sanitize input
    const sanitizedInput = sanitizeInput(usernameOrEmail);
    
    // Find user
    const user = findUserByEmailOrUsername(sanitizedInput);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = createSession(user.id);
    
    // Create response with user data (excluding password hash)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });

    // Set secure cookie
    setSecureCookie(response, sessionToken);
    console.log('Login successful - Session token created and cookie set');

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}