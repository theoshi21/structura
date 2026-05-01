// Property tests for user management
// Requirements: 2.1, 2.2, 2.3
// Property 7: Every User Has Exactly One Role
// Property 8: Role Updates Persist
// Property 9: Role-Based Permissions Enforced

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { fc } from '@fast-check/vitest'
import { register } from './auth'
import { getUserById, updateUserRole, listUsers } from './user'
import { hasPermission, canAccessRoute } from './roles'
import { Role } from '@/types'

// ─── Mock Setup ───────────────────────────────────────────────────────────────

let mockUsers: Map<string, any>

const mockSupabaseClient = {
  from: (table: string) => ({
    select: (_cols: string) => ({
      eq: (col: string, val: any) => ({
        single: async () => {
          if (table !== 'users') return { data: null, error: { message: 'Not found' } }
          const user = Array.from(mockUsers.values()).find((u) => u[col] === val)
          return user
            ? { data: user, error: null }
            : { data: null, error: { message: 'Not found' } }
        },
      }),
      order: (_col: string, _opts?: any) => ({
        then: (resolve: (v: { data: any[]; error: null }) => void) => {
          resolve({ data: Array.from(mockUsers.values()), error: null })
        },
      }),
    }),
    insert: (data: any) => ({
      select: (_cols: string) => ({
        single: async () => {
          const id = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`
          const now = new Date().toISOString()
          const user = { id, ...data, created_at: now, updated_at: now }
          mockUsers.set(id, user)
          return { data: user, error: null }
        },
      }),
    }),
    update: (data: any) => ({
      eq: (col: string, val: any) => ({
        select: (_cols: string) => ({
          single: async () => {
            const user = Array.from(mockUsers.values()).find((u) => u[col] === val)
            if (!user) return { data: null, error: { message: 'Not found' } }
            const updated = { ...user, ...data }
            mockUsers.set(user.id, updated)
            return { data: updated, error: null }
          },
        }),
      }),
    }),
    delete: () => ({
      eq: (col: string, val: any) => {
        const toDelete = Array.from(mockUsers.entries())
          .filter(([, u]) => u[col] === val)
          .map(([k]) => k)
        toDelete.forEach((k) => mockUsers.delete(k))
        return { error: null }
      },
    }),
  }),
}

vi.mock('./supabase', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}))

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('User Management Property Tests', () => {
  beforeEach(() => {
    mockUsers = new Map()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Property 7: Every User Has Exactly One Role', () => {
    it('should assign exactly one role to every created user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.constantFrom<Role>('organizer', 'officer', 'admin'),
          async (email, username, password, role) => {
            // Reset mock state for each run to avoid cross-run email collisions
            mockUsers = new Map()

            // Create user with a specific role
            const user = await register(email, username, password, role)

            // Verify user has exactly one role
            expect(user.role).toBeDefined()
            expect(['organizer', 'officer', 'admin']).toContain(user.role)
            expect(user.role).toBe(role)

            // Retrieve user and verify role persists
            const retrievedUser = await getUserById(user.id)
            expect(retrievedUser).not.toBeNull()
            expect(retrievedUser!.role).toBe(role)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should maintain exactly one role after role updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.constantFrom<Role>('organizer', 'officer', 'admin'),
          fc.constantFrom<Role>('organizer', 'officer', 'admin'),
          async (email, username, password, initialRole, newRole) => {
            // Reset mock state for each run to avoid cross-run email collisions
            mockUsers = new Map()

            // Create user with initial role
            const user = await register(email, username, password, initialRole)

            // Update role
            const updatedUser = await updateUserRole(user.id, newRole)

            // Verify user still has exactly one role
            expect(updatedUser.role).toBeDefined()
            expect(['organizer', 'officer', 'admin']).toContain(updatedUser.role)
            expect(updatedUser.role).toBe(newRole)

            // Retrieve user and verify role persists
            const retrievedUser = await getUserById(user.id)
            expect(retrievedUser).not.toBeNull()
            expect(retrievedUser!.role).toBe(newRole)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Property 8: Role Updates Persist', () => {
    it('should persist role changes to the database', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.constantFrom<Role>('organizer', 'officer', 'admin'),
          fc.constantFrom<Role>('organizer', 'officer', 'admin'),
          async (email, username, password, initialRole, newRole) => {
            // Reset mock state for each run to avoid cross-run email collisions
            mockUsers = new Map()

            // Create user
            const user = await register(email, username, password, initialRole)
            expect(user.role).toBe(initialRole)

            // Update role
            const updatedUser = await updateUserRole(user.id, newRole)
            expect(updatedUser.role).toBe(newRole)

            // Retrieve user immediately and verify
            const retrievedUser1 = await getUserById(user.id)
            expect(retrievedUser1).not.toBeNull()
            expect(retrievedUser1!.role).toBe(newRole)

            // Retrieve user again to ensure persistence
            const retrievedUser2 = await getUserById(user.id)
            expect(retrievedUser2).not.toBeNull()
            expect(retrievedUser2!.role).toBe(newRole)

            // Verify in list query
            const allUsers = await listUsers()
            const userInList = allUsers.find((u) => u.id === user.id)
            expect(userInList).toBeDefined()
            expect(userInList!.role).toBe(newRole)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should reflect role changes in subsequent permission checks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (email, username, password) => {
            // Reset mock state for each run to avoid cross-run email collisions
            mockUsers = new Map()

            // Create user as organizer
            const user = await register(email, username, password, 'organizer')
            expect(user.role).toBe('organizer')

            // Organizer cannot allocate funds
            expect(hasPermission(user.role, 'allocate_funds')).toBe(false)

            // Update to admin
            const updatedUser = await updateUserRole(user.id, 'admin')
            expect(updatedUser.role).toBe('admin')

            // Admin can allocate funds
            expect(hasPermission(updatedUser.role, 'allocate_funds')).toBe(true)

            // Retrieve and verify permissions
            const retrievedUser = await getUserById(user.id)
            expect(retrievedUser).not.toBeNull()
            expect(hasPermission(retrievedUser!.role, 'allocate_funds')).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Property 9: Role-Based Permissions Enforced', () => {
    it('should enforce organizer permissions correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (email, username, password) => {
            mockUsers = new Map()
            const user = await register(email, username, password, 'organizer')

            // Organizer can create events
            expect(hasPermission(user.role, 'create_event')).toBe(true)

            // Organizer can update events
            expect(hasPermission(user.role, 'update_event')).toBe(true)

            // Organizer can view budget
            expect(hasPermission(user.role, 'view_budget')).toBe(true)

            // Organizer cannot allocate funds
            expect(hasPermission(user.role, 'allocate_funds')).toBe(false)

            // Organizer cannot manage users
            expect(hasPermission(user.role, 'manage_users')).toBe(false)

            // Organizer cannot approve events
            expect(hasPermission(user.role, 'approve_event')).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should enforce officer permissions correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (email, username, password) => {
            mockUsers = new Map()
            const user = await register(email, username, password, 'officer')

            // Officer can create events
            expect(hasPermission(user.role, 'create_event')).toBe(true)

            // Officer can upload documents
            expect(hasPermission(user.role, 'upload_document')).toBe(true)

            // Officer can record expenditures
            expect(hasPermission(user.role, 'record_expenditure')).toBe(true)

            // Officer cannot allocate funds
            expect(hasPermission(user.role, 'allocate_funds')).toBe(false)

            // Officer cannot manage users
            expect(hasPermission(user.role, 'manage_users')).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should enforce admin permissions correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (email, username, password) => {
            mockUsers = new Map()
            const user = await register(email, username, password, 'admin')

            // Admin can allocate funds
            expect(hasPermission(user.role, 'allocate_funds')).toBe(true)

            // Admin can manage users
            expect(hasPermission(user.role, 'manage_users')).toBe(true)

            // Admin can approve events
            expect(hasPermission(user.role, 'approve_event')).toBe(true)

            // Admin can view audit trail
            expect(hasPermission(user.role, 'view_audit_trail')).toBe(true)

            // Admin has all officer permissions
            expect(hasPermission(user.role, 'upload_document')).toBe(true)
            expect(hasPermission(user.role, 'record_expenditure')).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should enforce route access based on role', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<Role>('organizer', 'officer', 'admin'),
          async (role) => {
            // All roles can access public routes
            expect(canAccessRoute(role, '/')).toBe(true)
            expect(canAccessRoute(role, '/sign-in')).toBe(true)
            expect(canAccessRoute(role, '/register')).toBe(true)

            // All roles can access student portal
            expect(canAccessRoute(role, '/student/dashboard')).toBe(true)

            // Only officer and admin can access admin portal
            if (role === 'organizer') {
              expect(canAccessRoute(role, '/admin/dashboard')).toBe(false)
            } else {
              expect(canAccessRoute(role, '/admin/dashboard')).toBe(true)
            }
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
