// Integration tests for the authentication flow
// Tests the full register → login → session → logout cycle
// Requirements: 1.1, 1.2, 1.3

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import * as auth from '../auth'
import * as session from '../session'
import { Role } from '@/types'

// ─── Mock Setup ───────────────────────────────────────────────────────────────

/**
 * In-memory user store that simulates the Supabase users table.
 * Keyed by user ID; each record mirrors the DB row shape.
 */
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
    }),
    insert: (data: any) => ({
      select: (_cols: string) => ({
        single: async () => {
          const id = `user-${Date.now()}-${Math.random()}`
          const now = new Date().toISOString()
          const user = { id, ...data, created_at: now, updated_at: now }
          mockUsers.set(id, user)
          return { data: user, error: null }
        },
      }),
    }),
  }),
}

vi.mock('../supabase', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}))

vi.mock('../session', async () => {
  const actual = await vi.importActual<typeof session>('../session')
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Registers a user and returns the created user record.
 * Uses unique email/username to avoid conflicts between tests.
 */
async function registerUser(
  suffix: string,
  role: Role = 'organizer',
  password = 'password123'
) {
  return auth.register(`user-${suffix}@test.com`, `user_${suffix}`, password, role)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Auth Integration: Registration Flow (Requirement 1.1)', () => {
  beforeEach(() => {
    mockUsers = new Map()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('registers a new organizer and returns user without password', async () => {
    const user = await registerUser('org1', 'organizer')

    expect(user.id).toBeDefined()
    expect(user.email).toBe('user-org1@test.com')
    expect(user.username).toBe('user_org1')
    expect(user.role).toBe('organizer')
    // Password must never be returned
    expect((user as any).password).toBeUndefined()
    expect((user as any).passwordHash).toBeUndefined()
    expect((user as any).password_hash).toBeUndefined()
  })

  test('registers a new officer successfully', async () => {
    const user = await registerUser('off1', 'officer')
    expect(user.role).toBe('officer')
  })

  test('registers a new admin successfully', async () => {
    const user = await registerUser('adm1', 'admin')
    expect(user.role).toBe('admin')
  })

  test('rejects duplicate email on second registration', async () => {
    await auth.register('dup@test.com', 'user_dup1', 'password123', 'organizer')

    await expect(
      auth.register('dup@test.com', 'user_dup2', 'password456', 'officer')
    ).rejects.toThrow('Email already exists')
  })

  test('rejects duplicate username on second registration', async () => {
    await auth.register('first@test.com', 'shared_name', 'password123', 'organizer')

    await expect(
      auth.register('second@test.com', 'shared_name', 'password456', 'officer')
    ).rejects.toThrow('Username already exists')
  })

  test('rejects registration when password is too short', async () => {
    await expect(
      auth.register('short@test.com', 'shortpw', 'abc', 'organizer')
    ).rejects.toThrow('Password must be at least 8 characters long')
  })

  test('rejects registration with an invalid role', async () => {
    await expect(
      auth.register('bad@test.com', 'badrole', 'password123', 'superuser' as Role)
    ).rejects.toThrow('Invalid role')
  })

  test('rejects registration when required fields are missing', async () => {
    await expect(auth.register('', 'user', 'password123', 'organizer')).rejects.toThrow(
      'All fields are required'
    )
    await expect(auth.register('a@b.com', '', 'password123', 'organizer')).rejects.toThrow(
      'All fields are required'
    )
    await expect(auth.register('a@b.com', 'user', '', 'organizer')).rejects.toThrow(
      'All fields are required'
    )
  })

  test('password is stored as a hash, not plaintext', async () => {
    const plaintext = 'mySecretPass1'
    await auth.register('hash@test.com', 'hashuser', plaintext, 'organizer')

    // Inspect the raw mock DB record
    const stored = Array.from(mockUsers.values()).find((u) => u.email === 'hash@test.com')
    expect(stored).toBeDefined()
    expect(stored.password_hash).not.toBe(plaintext)
    // bcrypt hashes start with $2b$
    expect(stored.password_hash).toMatch(/^\$2[ab]\$/)
  })
})

describe('Auth Integration: Login Flow (Requirement 1.2)', () => {
  beforeEach(() => {
    mockUsers = new Map()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('login with valid credentials creates a session', async () => {
    const user = await registerUser('login1', 'organizer', 'correctPass1')

    const sessionData = await auth.login('user-login1@test.com', 'correctPass1')

    expect(sessionData).toBeDefined()
    expect(sessionData.userId).toBe(user.id)
    expect(sessionData.role).toBe('organizer')
    expect(sessionData.createdAt).toBeDefined()
    expect(sessionData.expiresAt).toBeGreaterThan(sessionData.createdAt)
    expect(session.createSession).toHaveBeenCalledWith(user.id, 'organizer')
  })

  test('session expiry is set 30 minutes in the future', async () => {
    await registerUser('login2', 'admin', 'adminPass1')

    const before = Date.now()
    const sessionData = await auth.login('user-login2@test.com', 'adminPass1')
    const after = Date.now()

    const thirtyMinMs = 30 * 60 * 1000
    expect(sessionData.expiresAt).toBeGreaterThanOrEqual(before + thirtyMinMs)
    expect(sessionData.expiresAt).toBeLessThanOrEqual(after + thirtyMinMs)
  })

  test('login with wrong password is rejected', async () => {
    await registerUser('login3', 'organizer', 'rightPass1')

    await expect(
      auth.login('user-login3@test.com', 'wrongPass1')
    ).rejects.toThrow('Invalid credentials')
  })

  test('login with non-existent email is rejected', async () => {
    await expect(
      auth.login('nobody@test.com', 'password123')
    ).rejects.toThrow('Invalid credentials')
  })

  test('login with missing email or password is rejected', async () => {
    await expect(auth.login('', 'password123')).rejects.toThrow(
      'Email and password are required'
    )
    await expect(auth.login('a@b.com', '')).rejects.toThrow(
      'Email and password are required'
    )
  })

  test('login returns the correct role for each user type', async () => {
    await auth.register('org@test.com', 'org_user', 'password123', 'organizer')
    await auth.register('off@test.com', 'off_user', 'password123', 'officer')
    await auth.register('adm@test.com', 'adm_user', 'password123', 'admin')

    const orgSession = await auth.login('org@test.com', 'password123')
    const offSession = await auth.login('off@test.com', 'password123')
    const admSession = await auth.login('adm@test.com', 'password123')

    expect(orgSession.role).toBe('organizer')
    expect(offSession.role).toBe('officer')
    expect(admSession.role).toBe('admin')
  })
})

describe('Auth Integration: Invalid Credentials Rejected (Requirement 1.3)', () => {
  beforeEach(() => {
    mockUsers = new Map()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('wrong password always returns the same generic error (no enumeration)', async () => {
    await registerUser('enum1', 'organizer', 'realPass123')

    const err1 = await auth.login('user-enum1@test.com', 'wrongPass1').catch((e) => e)
    const err2 = await auth.login('nobody@test.com', 'wrongPass1').catch((e) => e)

    // Both errors must be identical to prevent user enumeration
    expect(err1.message).toBe(err2.message)
    expect(err1.message).toBe('Invalid credentials')
  })

  test('createSession is NOT called when credentials are invalid', async () => {
    await registerUser('nocall1', 'organizer', 'goodPass123')

    await auth.login('user-nocall1@test.com', 'badPass123').catch(() => {})

    expect(session.createSession).not.toHaveBeenCalled()
  })

  test('multiple failed login attempts all return the same error', async () => {
    await registerUser('multi1', 'organizer', 'correctPass1')

    const attempts = ['wrong1', 'wrong2', 'wrong3', 'wrong4', 'wrong5']
    for (const pw of attempts) {
      await expect(
        auth.login('user-multi1@test.com', pw)
      ).rejects.toThrow('Invalid credentials')
    }
  })
})

describe('Auth Integration: Logout Flow (Requirement 1.3)', () => {
  beforeEach(() => {
    mockUsers = new Map()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('logout calls destroySession', async () => {
    await auth.logout()
    expect(session.destroySession).toHaveBeenCalledOnce()
  })

  test('full register → login → logout cycle completes without error', async () => {
    await registerUser('cycle1', 'organizer', 'cyclePass1')
    await auth.login('user-cycle1@test.com', 'cyclePass1')
    await expect(auth.logout()).resolves.toBeUndefined()
    expect(session.destroySession).toHaveBeenCalledOnce()
  })
})
