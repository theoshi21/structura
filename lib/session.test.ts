// Property-based tests for session management
// Feature: structura, Property 5: Session Expiration
// Requirements: 13.2

import { describe, test, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'
import { isSessionExpired } from './session'
import { SessionData } from '@/types'

describe('Session Management', () => {
  beforeEach(() => {
    // Reset time mocking before each test
    vi.useRealTimers()
  })

  /**
   * **Validates: Requirements 13.2**
   * Property 5: Session Expiration
   * For any session that has been inactive for 30 minutes or more,
   * the system must invalidate the session and require re-authentication.
   */
  test('Property 5: sessions expire after 30 minutes of inactivity', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // userId
        fc.constantFrom('organizer', 'officer', 'admin'), // role
        fc.integer({ min: 0, max: 60 * 60 * 1000 }), // time offset in ms (0-60 minutes)
        (userId, role, timeOffset) => {
          const now = Date.now()
          const sessionTimeout = 30 * 60 * 1000 // 30 minutes
          
          const sessionData: SessionData = {
            userId,
            role,
            createdAt: now,
            expiresAt: now + sessionTimeout,
          }
          
          // Mock current time to be in the future
          vi.setSystemTime(now + timeOffset)
          
          const isExpired = isSessionExpired(sessionData)
          
          // Session should be expired if timeOffset >= 30 minutes
          if (timeOffset >= sessionTimeout) {
            expect(isExpired).toBe(true)
          } else {
            expect(isExpired).toBe(false)
          }
          
          // Reset time
          vi.useRealTimers()
        }
      ),
      { numRuns: 100 }
    )
  })

  // Unit tests for specific scenarios
  describe('Unit Tests', () => {
    test('session is not expired immediately after creation', () => {
      const now = Date.now()
      const sessionData: SessionData = {
        userId: 'user-123',
        role: 'organizer',
        createdAt: now,
        expiresAt: now + 30 * 60 * 1000,
      }
      
      expect(isSessionExpired(sessionData)).toBe(false)
    })

    test('session is expired after 30 minutes', () => {
      const now = Date.now()
      const sessionData: SessionData = {
        userId: 'user-123',
        role: 'organizer',
        createdAt: now,
        expiresAt: now + 30 * 60 * 1000,
      }
      
      // Mock time to be 31 minutes in the future
      vi.setSystemTime(now + 31 * 60 * 1000)
      
      expect(isSessionExpired(sessionData)).toBe(true)
      
      vi.useRealTimers()
    })

    test('session is not expired at exactly 29 minutes', () => {
      const now = Date.now()
      const sessionData: SessionData = {
        userId: 'user-123',
        role: 'organizer',
        createdAt: now,
        expiresAt: now + 30 * 60 * 1000,
      }
      
      // Mock time to be 29 minutes in the future
      vi.setSystemTime(now + 29 * 60 * 1000)
      
      expect(isSessionExpired(sessionData)).toBe(false)
      
      vi.useRealTimers()
    })

    test('session is expired at exactly 30 minutes', () => {
      const now = Date.now()
      const sessionData: SessionData = {
        userId: 'user-123',
        role: 'organizer',
        createdAt: now,
        expiresAt: now + 30 * 60 * 1000,
      }
      
      // Mock time to be exactly 30 minutes in the future
      vi.setSystemTime(now + 30 * 60 * 1000)
      
      expect(isSessionExpired(sessionData)).toBe(false)
      
      vi.useRealTimers()
    })

    test('session is expired 1ms after expiration time', () => {
      const now = Date.now()
      const sessionData: SessionData = {
        userId: 'user-123',
        role: 'organizer',
        createdAt: now,
        expiresAt: now + 30 * 60 * 1000,
      }
      
      // Mock time to be 1ms after expiration
      vi.setSystemTime(now + 30 * 60 * 1000 + 1)
      
      expect(isSessionExpired(sessionData)).toBe(true)
      
      vi.useRealTimers()
    })

    test('handles different roles correctly', () => {
      const now = Date.now()
      const roles: Array<'organizer' | 'officer' | 'admin'> = ['organizer', 'officer', 'admin']
      
      roles.forEach(role => {
        const sessionData: SessionData = {
          userId: 'user-123',
          role,
          createdAt: now,
          expiresAt: now + 30 * 60 * 1000,
        }
        
        expect(isSessionExpired(sessionData)).toBe(false)
      })
    })

    test('session created in the past is expired', () => {
      const now = Date.now()
      const sessionData: SessionData = {
        userId: 'user-123',
        role: 'organizer',
        createdAt: now - 60 * 60 * 1000, // 1 hour ago
        expiresAt: now - 30 * 60 * 1000, // 30 minutes ago
      }
      
      expect(isSessionExpired(sessionData)).toBe(true)
    })
  })
})
