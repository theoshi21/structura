// Authentication service
// Requirements: 1.1, 1.2, 1.3

import { createSupabaseClient } from './supabase'
import { hashPassword, verifyPassword } from './password'
import { createSession, destroySession, getSessionData } from './session'
import { User, SessionData, Role } from '@/types'

/**
 * Registers a new user with hashed password
 * @param email - User's email address
 * @param username - User's username
 * @param password - User's plaintext password (will be hashed)
 * @param role - User's role (organizer, officer, admin)
 * @param organizationName - Student organization name (organizer only, optional for others)
 * @returns Promise resolving to the created user (without password)
 * @throws Error if email or username already exists
 */
export async function register(
  email: string,
  username: string,
  password: string,
  role: Role,
  organizationName?: string | null,
  organizationId?: string | null
): Promise<User> {
  // Validate inputs
  if (!email || !username || !password || !role) {
    throw new Error('All fields are required')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }

  if (!['organizer', 'officer', 'admin'].includes(role)) {
    throw new Error('Invalid role')
  }

  const supabase = createSupabaseClient()

  // Check if email already exists
  const { data: existingEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingEmail) {
    throw new Error('Email already exists')
  }

  // Check if username already exists
  const { data: existingUsername } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (existingUsername) {
    throw new Error('Username already exists')
  }

  // Hash the password
  const passwordHash = await hashPassword(password)

  // Create the user
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email,
      username,
      password_hash: passwordHash,
      role,
      organization_name: organizationName ?? null,
      organization_id: organizationId ?? null,
    })
    .select('id, email, username, role, organization_id, organization_name, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as Role,
    organizationId: user.organization_id ?? null,
    organizationName: user.organization_name ?? null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }
}

/**
 * Authenticates a user with email and password
 * @param email - User's email address
 * @param password - User's plaintext password
 * @returns Promise resolving to session data
 * @throws Error if credentials are invalid
 */
export async function login(email: string, password: string): Promise<SessionData> {
  // Validate inputs
  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  const supabase = createSupabaseClient()

  // Get user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, password_hash, role, organization_name')
    .eq('email', email)
    .single()

  if (error || !user) {
    throw new Error('Invalid credentials')
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash)

  if (!isValidPassword) {
    throw new Error('Invalid credentials')
  }

  // Create session
  const sessionData = await createSession(user.id, user.role as Role)

  return sessionData
}

/**
 * Logs out the current user by destroying their session
 * @returns Promise that resolves when logout is complete
 */
export async function logout(): Promise<void> {
  await destroySession()
}

/**
 * Gets the currently authenticated user
 * @returns Promise resolving to the user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const sessionData = await getSessionData()

  if (!sessionData) {
    return null
  }

  const supabase = createSupabaseClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, role, organization_id, organization_name, created_at, updated_at')
    .eq('id', sessionData.userId)
    .single()

  if (error || !user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as Role,
    organizationId: user.organization_id ?? null,
    organizationName: user.organization_name ?? null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }
}

/**
 * Checks if a user is authenticated
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const sessionData = await getSessionData()
  return sessionData !== null
}

/**
 * Requires authentication, throws error if not authenticated
 * @returns Promise resolving to the current user
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Requires a specific role, throws error if user doesn't have the role
 * @param allowedRoles - Array of allowed roles
 * @returns Promise resolving to the current user
 * @throws Error if not authenticated or doesn't have required role
 */
export async function requireRole(allowedRoles: Role[]): Promise<User> {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }

  return user
}
