// User management service
// Requirements: 2.1, 2.2

import { createSupabaseClient } from './supabase'
import { User, Role } from '@/types'
import { logAction, logRoleChange } from './audit'

/**
 * Creates a new user with the specified role
 * Note: This is for admin user creation, not registration
 * @param email - User's email address
 * @param username - User's username
 * @param passwordHash - Pre-hashed password
 * @param role - User's role (organizer, officer, admin)
 * @returns Promise resolving to the created user
 * @throws Error if email or username already exists
 */
export async function createUser(
  email: string,
  username: string,
  passwordHash: string,
  role: Role
): Promise<User> {
  // Validate inputs
  if (!email || !username || !passwordHash || !role) {
    throw new Error('All fields are required')
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

  // Create the user
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email,
      username,
      password_hash: passwordHash,
      role,
    })
    .select('id, email, username, role, organization_name, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  const createdUser: User = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as Role,
    organizationName: user.organization_name ?? null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }

  // Log the user creation to the audit trail
  logAction({
    action: 'user_created',
    entityType: 'user',
    entityId: createdUser.id,
    userId: createdUser.id,
    details: { email, username, role },
  }).catch(() => {})

  return createdUser
}

/**
 * Gets a user by their ID
 * @param id - User's ID
 * @returns Promise resolving to the user or null if not found
 */
export async function getUserById(id: string): Promise<User | null> {
  if (!id) {
    throw new Error('User ID is required')
  }

  const supabase = createSupabaseClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, role, organization_name, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as Role,
    organizationName: user.organization_name ?? null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }
}

/**
 * Gets a user by their email address
 * @param email - User's email address
 * @returns Promise resolving to the user or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!email) {
    throw new Error('Email is required')
  }

  const supabase = createSupabaseClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, role, organization_name, created_at, updated_at')
    .eq('email', email)
    .single()

  if (error || !user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as Role,
    organizationName: user.organization_name ?? null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }
}

/**
 * Updates a user's role
 * @param userId - ID of the user to update
 * @param role - New role to assign
 * @param adminId - ID of the admin performing the role change (for audit)
 * @returns Promise resolving to the updated user
 * @throws Error if user not found or role is invalid
 */
export async function updateUserRole(userId: string, role: Role, adminId?: string): Promise<User> {
  if (!userId || !role) {
    throw new Error('User ID and role are required')
  }

  if (!['organizer', 'officer', 'admin'].includes(role)) {
    throw new Error('Invalid role')
  }

  const supabase = createSupabaseClient()

  // Fetch current role for audit trail
  const currentUser = await getUserById(userId)
  const oldRole = currentUser?.role ?? 'organizer'

  // Update the user's role
  const { data: user, error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, email, username, role, organization_name, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }

  if (!user) {
    throw new Error('User not found')
  }

  const updatedUser: User = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as Role,
    organizationName: user.organization_name ?? null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }

  // Log the role change to the audit trail
  logRoleChange(userId, oldRole, role, adminId ?? userId).catch(() => {})

  return updatedUser
}

/**
 * Lists all users in the system
 * @returns Promise resolving to an array of all users
 */
export async function listUsers(): Promise<User[]> {
  const supabase = createSupabaseClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, username, role, organization_name, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`)
  }

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as Role,
    organizationName: user.organization_name ?? null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }))
}
