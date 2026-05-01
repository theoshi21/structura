// Property-based tests for authentication
// Feature: structura, Property 2: Valid Credentials Grant Access
// Feature: structura, Property 3: Invalid Credentials Rejected
// Requirements: 1.2, 1.3

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import fc from 'fast-check'
import * as auth from './auth'
import * as password from './password'
import * as session from './session'

// Mock the Supabase client
vi.mock('./supabase', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}))

// Mock database state
let mockUsers: Map<string, any> = new Map()

// Mock Supabase client
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          if (table === 'users') {
            const user = Array.from(mockUsers.values()).find(
              (u) => u[column] === value
            )
            return user ? { data: user, error: null } : { data: null, error: { message: 'Not found' } }
          }
          return { data: null, error: { message: 'Not found' } }
        },
      }),
    }),
    insert: (data: any) => ({
      select: (columns: string) => ({
        single: async () => {
          const id = `user-${mockUsers.size + 1}`
          const now = new Date().toISOString()
          const user = {
            id,
            email: data.email,
            username: data.username,
            password_hash: data.password_hash,
            role: data.role,
            created_at: now,
            updated_at: now,
          }
          mockUsers.set(id, user)
          return { data: user, error: null }
        },
      }),
    }),
  }),
}

// Mock session functions
vi.mock('./session', async () => {
  const actual = await vi.importActual('./session')
  return {
    ...actual,
    createSession: vi.fn(async (userId: string, role: string) => ({
      userId,
      role,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    })),
    destroySession: vi.fn(async () => {}),
    getSessionData: vi.fn(async () => null),
  }
})

describe('Authentication', () => {
  beforeEach(() => {
    // Reset mock database before each test
    mockUsers.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * **Validates: Requirements 1.2**
   * Property 2: Valid Credentials Grant Access
   * For any user with valid credentials (correct email and password),
   * authentication must succeed and create a valid session.
   */
  test('Property 2: valid credentials grant access', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 3, maxLength: 50 }),
        fc.string({ minLength: 8, maxLength: 100 }),
        fc.constantFrom('organizer', 'officer', 'admin'),
        async (email, username, plainPassword, role) => {
          // Register a user
          const user = await auth.register(email, username, plainPassword, role)
          
          // Login with the same credentials should succeed
          const sessionData = await auth.login(email, plainPassword)
          
          expect(sessionData).toBeDefined()
          expect(sessionData.userId).toBe(user.id)
          expect(sessionData.role).toBe(role)
          expect(sessionData.createdAt).toBeDefined()
          expect(sessionData.expiresAt).toBeDefined()
          expect(sessionData.expiresAt).toBeGreaterThan(sessionData.createdAt)
        }
      ),
      { numRuns: 20 } // Reduced due to bcrypt cost
    )
  }, 30000)

  /**
   * **Validates: Requirements 1.3**
   * Property 3: Invalid Credentials Rejected
   * For any authentication attempt with invalid credentials (wrong password or
   * non-existent email), the system must reject the attempt and return an error.
   */
  test('Property 3: invalid credentials are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 3, maxLength: 50 }),
        fc.string({ minLength: 8, maxLength: 100 }),
        fc.string({ minLength: 8, maxLength: 100 }),
        fc.constantFrom('organizer', 'officer', 'admin'),
        async (email, username, correctPassword, wrongPassword, role) => {
          // Reset mock state for each run to avoid cross-run email collisions
          mockUsers.clear()

          // Skip if passwords are the same
          if (correctPassword === wrongPassword) {
            return
          }
          
          // Register a user
          await auth.register(email, username, correctPassword, role)
          
          // Login with wrong password should fail
          await expect(auth.login(email, wrongPassword)).rejects.toThrow('Invalid credentials')
        }
      ),
      { numRuns: 20 } // Reduced due to bcrypt cost
    )
  }, 30000)

  // Unit tests for specific scenarios
  describe('Unit Tests', () => {
    describe('register', () => {
      test('successfully registers a new user', async () => {
        const user = await auth.register(
          'test@example.com',
          'testuser',
          'password123',
          'organizer'
        )

        expect(user).toBeDefined()
        expect(user.email).toBe('test@example.com')
        expect(user.username).toBe('testuser')
        expect(user.role).toBe('organizer')
        expect(user.id).toBeDefined()
      })

      test('rejects registration with duplicate email', async () => {
        await auth.register('test@example.com', 'user1', 'password123', 'organizer')

        await expect(
          auth.register('test@example.com', 'user2', 'password456', 'officer')
        ).rejects.toThrow('Email already exists')
      })

      test('rejects registration with duplicate username', async () => {
        await auth.register('test1@example.com', 'testuser', 'password123', 'organizer')

        await expect(
          auth.register('test2@example.com', 'testuser', 'password456', 'officer')
        ).rejects.toThrow('Username already exists')
      })

      test('rejects registration with short password', async () => {
        await expect(
          auth.register('test@example.com', 'testuser', 'short', 'organizer')
        ).rejects.toThrow('Password must be at least 8 characters long')
      })

      test('rejects registration with invalid role', async () => {
        await expect(
          auth.register('test@example.com', 'testuser', 'password123', 'invalid' as any)
        ).rejects.toThrow('Invalid role')
      })

      test('rejects registration with missing fields', async () => {
        await expect(
          auth.register('', 'testuser', 'password123', 'organizer')
        ).rejects.toThrow('All fields are required')

        await expect(
          auth.register('test@example.com', '', 'password123', 'organizer')
        ).rejects.toThrow('All fields are required')

        await expect(
          auth.register('test@example.com', 'testuser', '', 'organizer')
        ).rejects.toThrow('All fields are required')
      })
    })

    describe('login', () => {
      test('successfully logs in with valid credentials', async () => {
        const user = await auth.register(
          'test@example.com',
          'testuser',
          'password123',
          'organizer'
        )

        const sessionData = await auth.login('test@example.com', 'password123')

        expect(sessionData).toBeDefined()
        expect(sessionData.userId).toBe(user.id)
        expect(sessionData.role).toBe('organizer')
      })

      test('rejects login with wrong password', async () => {
        await auth.register('test@example.com', 'testuser', 'password123', 'organizer')

        await expect(
          auth.login('test@example.com', 'wrongpassword')
        ).rejects.toThrow('Invalid credentials')
      })

      test('rejects login with non-existent email', async () => {
        await expect(
          auth.login('nonexistent@example.com', 'password123')
        ).rejects.toThrow('Invalid credentials')
      })

      test('rejects login with missing fields', async () => {
        await expect(
          auth.login('', 'password123')
        ).rejects.toThrow('Email and password are required')

        await expect(
          auth.login('test@example.com', '')
        ).rejects.toThrow('Email and password are required')
      })
    })

    describe('logout', () => {
      test('successfully logs out', async () => {
        await auth.logout()

        expect(session.destroySession).toHaveBeenCalled()
      })
    })
  })
})
