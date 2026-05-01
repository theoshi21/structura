// Integration tests for role-based access control
// Verifies that each role can only perform the actions it is permitted to
// Requirements: 2.3, 2.4, 2.5, 2.6
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  hasPermission,
  canAccessRoute,
  requirePermission,
  requireAdmin,
  requireOfficerOrAdmin,
  getPermissions,
  hasAnyPermission,
  hasAllPermissions,
} from '../roles'
import { requireRole } from '../auth'
import { createMockDatabase, MockDatabase } from '../test-utils'
import { Role } from '@/types'
import type { Action } from '../roles'

// ─── Mock Setup ───────────────────────────────────────────────────────────────

let mockDb: MockDatabase

vi.mock('../supabase', () => ({
  createSupabaseClient: () => ({
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: (col: string, val: any) => ({
          single: async () => {
            const store = mockDb[table as keyof MockDatabase] as Map<string, any>
            if (!store) return { data: null, error: { message: 'Not found' } }
            const record = Array.from(store.values()).find((r) => r[col] === val)
            return record
              ? { data: record, error: null }
              : { data: null, error: { message: 'Not found' } }
          },
        }),
        order: (_col: string, _opts: any) => ({
          data: Array.from((mockDb[table as keyof MockDatabase] as Map<string, any>).values()),
          error: null,
        }),
      }),
    }),
  }),
}))

vi.mock('../session', () => ({
  getSessionData: vi.fn(async () => null),
  createSession: vi.fn(async (userId: string, role: string) => ({
    userId,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000,
  })),
  destroySession: vi.fn(async () => {}),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Seeds a user into the mock DB and returns a mock session getter.
 */
function seedUser(id: string, role: Role) {
  const now = new Date().toISOString()
  mockDb.users.set(id, {
    id,
    email: `${id}@test.com`,
    username: id,
    password_hash: '$2b$10$hashedpassword',
    role,
    created_at: now,
    updated_at: now,
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RBAC Integration: Organizer Permissions (Requirement 2.3)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('organizer can create, update, and view events', () => {
    expect(hasPermission('organizer', 'create_event')).toBe(true)
    expect(hasPermission('organizer', 'update_event')).toBe(true)
    expect(hasPermission('organizer', 'view_budget')).toBe(true)
  })

  test('organizer can manage checklists', () => {
    expect(hasPermission('organizer', 'create_checklist')).toBe(true)
    expect(hasPermission('organizer', 'update_checklist')).toBe(true)
  })

  test('organizer cannot delete events', () => {
    expect(hasPermission('organizer', 'delete_event')).toBe(false)
  })

  test('organizer cannot upload or delete documents', () => {
    expect(hasPermission('organizer', 'upload_document')).toBe(false)
    expect(hasPermission('organizer', 'delete_document')).toBe(false)
  })

  test('organizer cannot allocate funds', () => {
    expect(hasPermission('organizer', 'allocate_funds')).toBe(false)
  })

  test('organizer cannot record expenditures', () => {
    expect(hasPermission('organizer', 'record_expenditure')).toBe(false)
  })

  test('organizer cannot manage users or update roles', () => {
    expect(hasPermission('organizer', 'manage_users')).toBe(false)
    expect(hasPermission('organizer', 'update_roles')).toBe(false)
  })

  test('organizer cannot approve events', () => {
    expect(hasPermission('organizer', 'approve_event')).toBe(false)
  })

  test('organizer cannot view audit trail', () => {
    expect(hasPermission('organizer', 'view_audit_trail')).toBe(false)
  })

  test('requirePermission throws for organizer attempting admin-only action', () => {
    expect(() => requirePermission('organizer', 'allocate_funds')).toThrow(
      'Insufficient permissions'
    )
    expect(() => requirePermission('organizer', 'manage_users')).toThrow(
      'Insufficient permissions'
    )
  })

  test('requireOfficerOrAdmin throws for organizer', () => {
    expect(() => requireOfficerOrAdmin('organizer')).toThrow(
      'Officer or Admin privileges required'
    )
  })

  test('organizer can access student portal routes', () => {
    expect(canAccessRoute('organizer', '/student/dashboard')).toBe(true)
    expect(canAccessRoute('organizer', '/student/events')).toBe(true)
    expect(canAccessRoute('organizer', '/student/budget')).toBe(true)
    expect(canAccessRoute('organizer', '/student/documents')).toBe(true)
    expect(canAccessRoute('organizer', '/student/checklists')).toBe(true)
  })

  test('organizer cannot access admin portal routes', () => {
    expect(canAccessRoute('organizer', '/admin/dashboard')).toBe(false)
    expect(canAccessRoute('organizer', '/admin/users')).toBe(false)
    expect(canAccessRoute('organizer', '/admin/budget')).toBe(false)
    expect(canAccessRoute('organizer', '/admin/submissions')).toBe(false)
    expect(canAccessRoute('organizer', '/admin/audit')).toBe(false)
  })
})

describe('RBAC Integration: Officer Permissions (Requirement 2.4)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('officer can create, update, and delete events', () => {
    expect(hasPermission('officer', 'create_event')).toBe(true)
    expect(hasPermission('officer', 'update_event')).toBe(true)
    expect(hasPermission('officer', 'delete_event')).toBe(true)
  })

  test('officer can upload and delete documents', () => {
    expect(hasPermission('officer', 'upload_document')).toBe(true)
    expect(hasPermission('officer', 'delete_document')).toBe(true)
  })

  test('officer can record expenditures', () => {
    expect(hasPermission('officer', 'record_expenditure')).toBe(true)
  })

  test('officer can view budget', () => {
    expect(hasPermission('officer', 'view_budget')).toBe(true)
  })

  test('officer cannot allocate funds', () => {
    expect(hasPermission('officer', 'allocate_funds')).toBe(false)
  })

  test('officer cannot manage users or update roles', () => {
    expect(hasPermission('officer', 'manage_users')).toBe(false)
    expect(hasPermission('officer', 'update_roles')).toBe(false)
  })

  test('officer cannot approve events', () => {
    expect(hasPermission('officer', 'approve_event')).toBe(false)
  })

  test('requirePermission throws for officer attempting admin-only action', () => {
    expect(() => requirePermission('officer', 'allocate_funds')).toThrow(
      'Insufficient permissions'
    )
    expect(() => requirePermission('officer', 'manage_users')).toThrow(
      'Insufficient permissions'
    )
  })

  test('requireOfficerOrAdmin does NOT throw for officer', () => {
    expect(() => requireOfficerOrAdmin('officer')).not.toThrow()
  })

  test('officer can access admin portal routes', () => {
    expect(canAccessRoute('officer', '/admin/dashboard')).toBe(true)
    expect(canAccessRoute('officer', '/admin/submissions')).toBe(true)
    expect(canAccessRoute('officer', '/admin/budget')).toBe(true)
  })

  test('officer has all organizer permissions plus more', () => {
    const organizerPermissions = getPermissions('organizer')
    const officerPermissions = getPermissions('officer')

    // Every organizer permission should also be in officer permissions
    for (const perm of organizerPermissions) {
      expect(officerPermissions).toContain(perm)
    }

    // Officer should have additional permissions beyond organizer
    expect(officerPermissions.length).toBeGreaterThan(organizerPermissions.length)
  })
})

describe('RBAC Integration: Admin Permissions (Requirement 2.5)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('admin can perform all event operations', () => {
    expect(hasPermission('admin', 'create_event')).toBe(true)
    expect(hasPermission('admin', 'update_event')).toBe(true)
    expect(hasPermission('admin', 'delete_event')).toBe(true)
    expect(hasPermission('admin', 'approve_event')).toBe(true)
  })

  test('admin can manage documents', () => {
    expect(hasPermission('admin', 'upload_document')).toBe(true)
    expect(hasPermission('admin', 'delete_document')).toBe(true)
  })

  test('admin can manage budget and expenditures', () => {
    expect(hasPermission('admin', 'view_budget')).toBe(true)
    expect(hasPermission('admin', 'allocate_funds')).toBe(true)
    expect(hasPermission('admin', 'record_expenditure')).toBe(true)
  })

  test('admin can manage users and roles', () => {
    expect(hasPermission('admin', 'manage_users')).toBe(true)
    expect(hasPermission('admin', 'update_roles')).toBe(true)
  })

  test('admin can view audit trail', () => {
    expect(hasPermission('admin', 'view_audit_trail')).toBe(true)
  })

  test('requireAdmin does NOT throw for admin', () => {
    expect(() => requireAdmin('admin')).not.toThrow()
  })

  test('requireAdmin throws for organizer and officer', () => {
    expect(() => requireAdmin('organizer')).toThrow('Admin privileges required')
    expect(() => requireAdmin('officer')).toThrow('Admin privileges required')
  })

  test('requireOfficerOrAdmin does NOT throw for admin', () => {
    expect(() => requireOfficerOrAdmin('admin')).not.toThrow()
  })

  test('admin has all officer permissions plus more', () => {
    const officerPermissions = getPermissions('officer')
    const adminPermissions = getPermissions('admin')

    for (const perm of officerPermissions) {
      expect(adminPermissions).toContain(perm)
    }

    expect(adminPermissions.length).toBeGreaterThan(officerPermissions.length)
  })

  test('admin can access all portal routes', () => {
    expect(canAccessRoute('admin', '/admin/dashboard')).toBe(true)
    expect(canAccessRoute('admin', '/admin/users')).toBe(true)
    expect(canAccessRoute('admin', '/admin/budget')).toBe(true)
    expect(canAccessRoute('admin', '/admin/audit')).toBe(true)
    expect(canAccessRoute('admin', '/student/dashboard')).toBe(true)
  })
})

describe('RBAC Integration: Unauthorized Access Denied (Requirement 2.6)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('requirePermission throws for every role that lacks the permission', () => {
    const adminOnlyActions: Action[] = ['allocate_funds', 'manage_users', 'update_roles', 'approve_event']

    for (const action of adminOnlyActions) {
      expect(() => requirePermission('organizer', action)).toThrow('Insufficient permissions')
      expect(() => requirePermission('officer', action)).toThrow('Insufficient permissions')
      expect(() => requirePermission('admin', action)).not.toThrow()
    }
  })

  test('permission checks are deterministic — same inputs always produce same result', () => {
    const roles: Role[] = ['organizer', 'officer', 'admin']
    const actions: Action[] = [
      'create_event', 'delete_event', 'allocate_funds',
      'manage_users', 'upload_document', 'view_budget',
    ]

    for (const role of roles) {
      for (const action of actions) {
        const r1 = hasPermission(role, action)
        const r2 = hasPermission(role, action)
        const r3 = hasPermission(role, action)
        expect(r1).toBe(r2)
        expect(r2).toBe(r3)
      }
    }
  })

  test('hasAnyPermission returns true when at least one action is allowed', () => {
    // Organizer can create_event but not allocate_funds
    expect(hasAnyPermission('organizer', ['create_event', 'allocate_funds'])).toBe(true)
    // Organizer cannot do either of these
    expect(hasAnyPermission('organizer', ['allocate_funds', 'manage_users'])).toBe(false)
  })

  test('hasAllPermissions returns true only when every action is allowed', () => {
    // Admin can do all of these
    expect(hasAllPermissions('admin', ['create_event', 'allocate_funds', 'manage_users'])).toBe(true)
    // Officer cannot do allocate_funds
    expect(hasAllPermissions('officer', ['create_event', 'allocate_funds'])).toBe(false)
    // Organizer can do both of these
    expect(hasAllPermissions('organizer', ['create_event', 'update_event'])).toBe(true)
  })

  test('public routes are accessible to all roles', () => {
    const publicRoutes = ['/', '/sign-in', '/register']
    const roles: Role[] = ['organizer', 'officer', 'admin']

    for (const role of roles) {
      for (const route of publicRoutes) {
        expect(canAccessRoute(role, route)).toBe(true)
      }
    }
  })

  test('admin portal is inaccessible to organizers', () => {
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/budget',
      '/admin/submissions',
      '/admin/audit',
    ]

    for (const route of adminRoutes) {
      expect(canAccessRoute('organizer', route)).toBe(false)
    }
  })

  test('permission hierarchy is strictly ordered: organizer < officer < admin', () => {
    const organizerPerms = new Set(getPermissions('organizer'))
    const officerPerms = new Set(getPermissions('officer'))
    const adminPerms = new Set(getPermissions('admin'))

    // Organizer is a strict subset of officer
    for (const perm of organizerPerms) {
      expect(officerPerms.has(perm)).toBe(true)
    }

    // Officer is a strict subset of admin
    for (const perm of officerPerms) {
      expect(adminPerms.has(perm)).toBe(true)
    }

    // Each level has strictly more permissions than the one below
    expect(officerPerms.size).toBeGreaterThan(organizerPerms.size)
    expect(adminPerms.size).toBeGreaterThan(officerPerms.size)
  })
})

describe('RBAC Integration: requireRole Guard (Requirement 2.6)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('requireRole throws "Authentication required" when no session exists', async () => {
    const { getSessionData } = await import('../session')
    vi.mocked(getSessionData).mockResolvedValueOnce(null)

    await expect(requireRole(['admin'])).rejects.toThrow('Authentication required')
  })

  test('requireRole throws "Insufficient permissions" when role does not match', async () => {
    const { getSessionData } = await import('../session')
    vi.mocked(getSessionData).mockResolvedValueOnce({
      userId: 'organizer-1',
      role: 'organizer',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    })

    // Seed the user so getCurrentUser can find them
    seedUser('organizer-1', 'organizer')

    await expect(requireRole(['admin'])).rejects.toThrow('Insufficient permissions')
  })

  test('requireRole succeeds when role matches one of the allowed roles', async () => {
    const { getSessionData } = await import('../session')
    vi.mocked(getSessionData).mockResolvedValueOnce({
      userId: 'admin-1',
      role: 'admin',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    })

    seedUser('admin-1', 'admin')

    const user = await requireRole(['admin', 'officer'])
    expect(user.role).toBe('admin')
  })

  test('requireRole allows officer when both officer and admin are accepted', async () => {
    const { getSessionData } = await import('../session')
    vi.mocked(getSessionData).mockResolvedValueOnce({
      userId: 'officer-1',
      role: 'officer',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    })

    seedUser('officer-1', 'officer')

    const user = await requireRole(['admin', 'officer'])
    expect(user.role).toBe('officer')
  })
})
