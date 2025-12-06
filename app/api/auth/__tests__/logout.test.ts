import { POST } from '../logout/route'
import { NextRequest } from 'next/server'
import * as auth from '@/lib/auth'

// Mock the auth module
jest.mock('@/lib/auth')

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn()
  }))
}))

const mockAuth = auth as jest.Mocked<typeof auth>
const { cookies } = require('next/headers')

describe('/api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid session', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'valid-session-token' })
      }
      cookies.mockReturnValue(mockCookies)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1')
        }
      } as unknown as NextRequest

      // Mock auth functions
      mockAuth.checkRateLimit.mockReturnValue(true)
      mockAuth.validateSession.mockReturnValue({ user: { id: 'user-1' } } as any)
      mockAuth.destroySession.mockReturnValue(undefined)
      mockAuth.clearSecureCookie.mockReturnValue(undefined)

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Logged out successfully')
      expect(mockAuth.destroySession).toHaveBeenCalledWith('valid-session-token')
      expect(mockAuth.clearSecureCookie).toHaveBeenCalled()
    })

    it('should handle logout without session cookie', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(null)
      }
      cookies.mockReturnValue(mockCookies)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1')
        }
      } as unknown as NextRequest

      mockAuth.checkRateLimit.mockReturnValue(true)
      mockAuth.clearSecureCookie.mockReturnValue(undefined)

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Logged out successfully')
      expect(mockAuth.destroySession).not.toHaveBeenCalled()
      expect(mockAuth.clearSecureCookie).toHaveBeenCalled()
    })

    it('should handle logout with invalid session', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'invalid-session-token' })
      }
      cookies.mockReturnValue(mockCookies)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1')
        }
      } as unknown as NextRequest

      mockAuth.checkRateLimit.mockReturnValue(true)
      mockAuth.validateSession.mockReturnValue(null)
      mockAuth.destroySession.mockReturnValue(undefined)
      mockAuth.clearSecureCookie.mockReturnValue(undefined)

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Logged out successfully')
      expect(mockAuth.destroySession).toHaveBeenCalledWith('invalid-session-token')
      expect(mockAuth.clearSecureCookie).toHaveBeenCalled()
    })

    it('should reject logout when rate limited', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1')
        }
      } as unknown as NextRequest

      mockAuth.checkRateLimit.mockReturnValue(false)

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(429)
      expect(responseData.error).toBe('Rate limit exceeded. Please try again later.')
      expect(mockAuth.destroySession).not.toHaveBeenCalled()
      expect(mockAuth.clearSecureCookie).not.toHaveBeenCalled()
    })

    it('should handle errors during session destruction gracefully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'valid-session-token' })
      }
      cookies.mockReturnValue(mockCookies)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1')
        }
      } as unknown as NextRequest

      mockAuth.checkRateLimit.mockReturnValue(true)
      mockAuth.validateSession.mockReturnValue({ user: { id: 'user-1' } } as any)
      mockAuth.destroySession.mockImplementation(() => {
        throw new Error('Session destruction error')
      })
      mockAuth.clearSecureCookie.mockReturnValue(undefined)

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Logged out successfully')
      expect(mockAuth.clearSecureCookie).toHaveBeenCalled()
    })

    it('should handle missing IP address', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'valid-session-token' })
      }
      cookies.mockReturnValue(mockCookies)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null) // No IP address
        }
      } as unknown as NextRequest

      mockAuth.checkRateLimit.mockReturnValue(true)
      mockAuth.validateSession.mockReturnValue({ user: { id: 'user-1' } } as any)
      mockAuth.destroySession.mockReturnValue(undefined)
      mockAuth.clearSecureCookie.mockReturnValue(undefined)

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Logged out successfully')
      expect(mockAuth.checkRateLimit).toHaveBeenCalledWith(null)
    })

    it('should handle server errors gracefully', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockImplementation(() => {
            throw new Error('Header access error')
          })
        }
      } as unknown as NextRequest

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
    })

    it('should clear cookie even if session validation fails', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'corrupted-session-token' })
      }
      cookies.mockReturnValue(mockCookies)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1')
        }
      } as unknown as NextRequest

      mockAuth.checkRateLimit.mockReturnValue(true)
      mockAuth.validateSession.mockImplementation(() => {
        throw new Error('Session validation error')
      })
      mockAuth.destroySession.mockReturnValue(undefined)
      mockAuth.clearSecureCookie.mockReturnValue(undefined)

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Logged out successfully')
      expect(mockAuth.clearSecureCookie).toHaveBeenCalled()
    })

    it('should handle multiple logout attempts gracefully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'already-destroyed-session' })
      }
      cookies.mockReturnValue(mockCookies)

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1')
        }
      } as unknown as NextRequest

      mockAuth.checkRateLimit.mockReturnValue(true)
      mockAuth.validateSession.mockReturnValue(null) // Session already destroyed
      mockAuth.destroySession.mockReturnValue(undefined)
      mockAuth.clearSecureCookie.mockReturnValue(undefined)

      const response = await POST(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.message).toBe('Logged out successfully')
      expect(mockAuth.destroySession).toHaveBeenCalledWith('already-destroyed-session')
      expect(mockAuth.clearSecureCookie).toHaveBeenCalled()
    })
  })
})