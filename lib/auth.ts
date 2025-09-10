import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SALT_ROUNDS = 12;
const SESSION_COOKIE_NAME = 'poll_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory session store (replace with Redis/database in production)
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export interface SecureUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// Secure password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Secure session token generation
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Session management
export function createSession(userId: string): string {
  const sessionToken = generateSecureToken();
  const expiresAt = Date.now() + SESSION_DURATION;
  
  sessions.set(sessionToken, { userId, expiresAt });
  console.log('Session created - Token:', sessionToken.substring(0, 8) + '...', 'User ID:', userId, 'Total sessions:', sessions.size);
  return sessionToken;
}

export function validateSession(sessionToken: string): string | null {
  const session = sessions.get(sessionToken);
  console.log('Validating session - Token exists in store:', !!session, 'Store size:', sessions.size);
  
  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      console.log('Session expired, removing from store');
      sessions.delete(sessionToken);
    } else {
      console.log('Session not found in store - likely server restart');
    }
    return null;
  }
  
  return session.userId;
}

export function destroySession(sessionToken: string): void {
  sessions.delete(sessionToken);
}

// Cookie helpers
export function setSecureCookie(response: NextResponse, sessionToken: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/'
  });
}

export function getSessionFromCookie(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

// Rate limiting (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
}

// CSRF token generation and validation
const csrfTokens = new Set<string>();

export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.add(token);
  return token;
}

export function validateCSRFToken(token: string): boolean {
  const isValid = csrfTokens.has(token);
  if (isValid) {
    csrfTokens.delete(token); // One-time use
  }
  return isValid;
}