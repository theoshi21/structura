// Role-based permission management
// Requirements: 2.3, 2.4, 2.5, 2.6

import { Role } from '@/types'

/**
 * Action types that can be performed in the system
 */
export type Action =
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'approve_event'
  | 'upload_document'
  | 'delete_document'
  | 'create_checklist'
  | 'update_checklist'
  | 'view_budget'
  | 'allocate_funds'
  | 'record_expenditure'
  | 'manage_users'
  | 'update_roles'
  | 'view_audit_trail'

/**
 * Permission matrix defining what each role can do
 */
const PERMISSIONS: Record<Role, Action[]> = {
  organizer: [
    'create_event',
    'update_event',
    'upload_document',
    'delete_document',
    'create_checklist',
    'update_checklist',
    'view_budget',
  ],
  officer: [
    'create_event',
    'update_event',
    'delete_event',
    'create_checklist',
    'update_checklist',
    'view_budget',
    'record_expenditure',
  ],
  admin: [
    'create_event',
    'update_event',
    'delete_event',
    'approve_event',
    'upload_document',
    'delete_document',
    'create_checklist',
    'update_checklist',
    'view_budget',
    'allocate_funds',
    'record_expenditure',
    'manage_users',
    'update_roles',
    'view_audit_trail',
  ],
}

/**
 * Checks if a role has permission to perform an action
 * @param role - User's role
 * @param action - Action to check permission for
 * @returns True if the role has permission, false otherwise
 */
export function hasPermission(role: Role, action: Action): boolean {
  const permissions = PERMISSIONS[role]
  return permissions.includes(action)
}

/**
 * Checks if a role can access a specific route
 * @param role - User's role
 * @param path - Route path to check
 * @returns True if the role can access the route, false otherwise
 */
export function canAccessRoute(role: Role, path: string): boolean {
  // Public routes accessible to all
  if (path === '/' || path.startsWith('/sign-in') || path.startsWith('/register')) {
    return true
  }

  // Student portal routes — organizer and officer both belong here
  if (path.startsWith('/student')) {
    return role === 'organizer' || role === 'officer'
  }

  // Admin portal routes — admin only
  if (path.startsWith('/admin')) {
    return role === 'admin'
  }

  // API routes follow action-based permissions
  if (path.startsWith('/api')) {
    return true // API routes check permissions internally
  }

  // Default deny
  return false
}

/**
 * Gets all permissions for a role
 * @param role - User's role
 * @returns Array of actions the role can perform
 */
export function getPermissions(role: Role): Action[] {
  return [...PERMISSIONS[role]]
}

/**
 * Checks if a role has any of the specified permissions
 * @param role - User's role
 * @param actions - Array of actions to check
 * @returns True if the role has at least one of the permissions
 */
export function hasAnyPermission(role: Role, actions: Action[]): boolean {
  return actions.some((action) => hasPermission(role, action))
}

/**
 * Checks if a role has all of the specified permissions
 * @param role - User's role
 * @param actions - Array of actions to check
 * @returns True if the role has all of the permissions
 */
export function hasAllPermissions(role: Role, actions: Action[]): boolean {
  return actions.every((action) => hasPermission(role, action))
}

/**
 * Requires a specific permission, throws error if not authorized
 * @param role - User's role
 * @param action - Required action
 * @throws Error if the role doesn't have permission
 */
export function requirePermission(role: Role, action: Action): void {
  if (!hasPermission(role, action)) {
    throw new Error(`Insufficient permissions: ${action} requires higher privileges`)
  }
}

/**
 * Requires admin role, throws error if not admin
 * @param role - User's role
 * @throws Error if the role is not admin
 */
export function requireAdmin(role: Role): void {
  if (role !== 'admin') {
    throw new Error('Admin privileges required')
  }
}

/**
 * Requires officer or admin role, throws error if organizer
 * @param role - User's role
 * @throws Error if the role is organizer
 */
export function requireOfficerOrAdmin(role: Role): void {
  if (role === 'organizer') {
    throw new Error('Officer or Admin privileges required')
  }
}
