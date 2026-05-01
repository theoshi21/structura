// User management service
// Requirements: 2.1, 2.2

import { createSupabaseClient } from './supabase'
import { User, Role } from '@/types'

/**
 * Gets a user by their ID
 * @param id - User's unique identifier
 * @returns Promise resolving to the user or null if not found
 */
export async function getUserById(id: string): Promise<User | null> {
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
 * Lists all users in the system
 * @param roleFilter - Optional role to filter by
 * @returns Promise resolving to array of users
 */
export async function listUsers(roleFilter?: Role): Promise<User[]> {
  const supabase = createSupabaseClient()

  let query = supabase
    .from('users')
    .select('id, email, username, role, organization_name, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (roleFilter) {
    query = query.eq('role', roleFilter)
  }

  const { data: users, error } = await query

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

/**
 * Updates a user's role
 * @param userId - User's unique identifier
 * @param newRole - New role to assign
 * @returns Promise resolving to the updated user
 * @throws Error if user not found or update fails
 */
export async function updateUserRole(userId: string, newRole: Role): Promise<User> {
  // Validate role
  if (!['organizer', 'officer', 'admin'].includes(newRole)) {
    throw new Error('Invalid role')
  }

  const supabase = createSupabaseClient()

  // Update the user's role
  const { data: user, error } = await supabase
    .from('users')
    .update({ 
      role: newRole,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('id, email, username, role, organization_name, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }

  if (!user) {
    throw new Error('User not found')
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
 * Deletes a user from the system
 * @param userId - User's unique identifier
 * @returns Promise that resolves when deletion is complete
 * @throws Error if deletion fails
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = createSupabaseClient()

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }
}

/**
 * Counts users by role
 * @returns Promise resolving to object with counts per role
 */
export async function countUsersByRole(): Promise<Record<Role, number>> {
  const supabase = createSupabaseClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('role')

  if (error) {
    throw new Error(`Failed to count users: ${error.message}`)
  }

  const counts: Record<Role, number> = {
    organizer: 0,
    officer: 0,
    admin: 0,
  }

  users.forEach((user) => {
    const role = user.role as Role
    counts[role] = (counts[role] || 0) + 1
  })

  return counts
}
