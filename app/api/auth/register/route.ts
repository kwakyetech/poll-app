import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, createSession, setSecureCookie, checkRateLimit, sanitizeInput } from '@/lib/auth';
import { findUserByEmail, findUserByUsername, addUser } from '@/lib/mockData';
import { z } from 'zod';
import crypto from 'crypto';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long')
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`register:${clientIP}`)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { username, email, password } = validation.data;
    
    // Sanitize input
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);
    
    // Check if user already exists
    const existingUserByEmail = findUserByEmail(sanitizedEmail);
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const existingUserByUsername = findUserByUsername(sanitizedUsername);
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create new user
    const newUser = {
      id: crypto.randomUUID(),
      username: sanitizedUsername,
      email: sanitizedEmail,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    // Add user to store
    addUser(newUser);

    // Create session
    const sessionToken = createSession(newUser.id);
    
    // Create response with user data (excluding password hash)
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });

    // Set secure cookie
    setSecureCookie(response, sessionToken);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}