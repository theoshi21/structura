// AuditService — log and retrieve audit trail entries
// Requirements: 8.3, 18.1, 18.2

import { createSupabaseClient } from './supabase'
import { AuditEntry, AuditAction, CreateAuditEntryInput } from '@/types'

// ─── Mapper ──────────────────────────────────────────────────────────────────

/**
 * Maps a raw database row to the AuditEntry interface.
 */
function mapAuditEntry(row: any): AuditEntry {
  return {
    id: row.id,
    action: row.action as AuditAction,
    entityType: row.entity_type,
    entityId: row.entity_id,
    userId: row.user_id ?? null,
    details: row.details ?? null,
    createdAt: new Date(row.created_at),
  }
}

// ─── AuditService ─────────────────────────────────────────────────────────────

/**
 * Logs a critical action to the audit trail.
 * Audit entries are immutable once created — they cannot be updated or deleted.
 * @param input - Action type, entity info, user ID, and optional details
 * @returns Promise resolving to the created AuditEntry
 * @throws Error if required fields are missing or DB insert fails
 */
export async function logAction(input: CreateAuditEntryInput): Promise<AuditEntry> {
  if (!input.action) throw new Error('Action is required')
  if (!input.entityType) throw new Error('Entity type is required')
  if (!input.entityId) throw new Error('Entity ID is required')
  if (!input.userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { data: entry, error } = await supabase
    .from('audit_trail')
    .insert({
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      user_id: input.userId,
      details: input.details ?? null,
    })
    .select('id, action, entity_type, entity_id, user_id, details, created_at')
    .single()

  if (error) {
    throw new Error(`Failed to log audit action: ${error.message}`)
  }

  return mapAuditEntry(entry)
}

/**
 * Retrieves all audit log entries for a specific entity (event, budget, user, etc.).
 * Results are returned in chronological order (oldest first).
 * @param entityType - The type of entity (e.g. 'event', 'budget', 'user')
 * @param entityId - The entity's unique identifier
 * @returns Promise resolving to an array of AuditEntry records
 */
export async function getAuditTrail(entityType: string, entityId: string): Promise<AuditEntry[]> {
  if (!entityType) throw new Error('Entity type is required')
  if (!entityId) throw new Error('Entity ID is required')

  const supabase = createSupabaseClient()

  const { data: entries, error } = await supabase
    .from('audit_trail')
    .select('id, action, entity_type, entity_id, user_id, details, created_at')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to retrieve audit trail: ${error.message}`)
  }

  return (entries ?? []).map(mapAuditEntry)
}

/**
 * Retrieves all audit log entries performed by a specific user.
 * @param userId - The user's unique identifier
 * @param limit - Optional maximum number of entries to return (default: 100)
 * @returns Promise resolving to an array of AuditEntry records
 */
export async function getUserActions(userId: string, limit: number = 100): Promise<AuditEntry[]> {
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { data: entries, error } = await supabase
    .from('audit_trail')
    .select('id, action, entity_type, entity_id, user_id, details, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to retrieve user actions: ${error.message}`)
  }

  return (entries ?? []).map(mapAuditEntry)
}

/**
 * Retrieves all audit log entries, optionally filtered by entity type (category).
 * Results are returned in reverse chronological order (newest first).
 * @param entityType - Optional filter: 'event', 'budget', 'document', 'user', etc.
 * @param limit - Optional maximum number of entries to return (default: 200)
 * @returns Promise resolving to an array of AuditEntry records
 */
export async function listAuditEntries(
  entityType?: string,
  limit: number = 200
): Promise<AuditEntry[]> {
  const supabase = createSupabaseClient()

  let query = supabase
    .from('audit_trail')
    .select('id, action, entity_type, entity_id, user_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entityType) {
    query = query.eq('entity_type', entityType)
  }

  const { data: entries, error } = await query

  if (error) {
    throw new Error(`Failed to list audit entries: ${error.message}`)
  }

  return (entries ?? []).map(mapAuditEntry)
}

// ─── Convenience Loggers ──────────────────────────────────────────────────────

/**
 * Logs a budget allocation action.
 * @param eventId - The event funds were allocated to
 * @param amount - The amount allocated
 * @param userId - ID of the admin who performed the allocation
 */
export async function logBudgetAllocation(
  eventId: string,
  amount: number,
  userId: string
): Promise<void> {
  await logAction({
    action: 'funds_allocated',
    entityType: 'budget',
    entityId: eventId,
    userId,
    details: { eventId, amount },
  })
}

/**
 * Logs an expenditure recording action.
 * @param eventId - The event the expenditure was recorded against
 * @param amount - The amount spent
 * @param userId - ID of the officer/admin who recorded the expenditure
 */
export async function logExpenditure(
  eventId: string,
  amount: number,
  userId: string
): Promise<void> {
  await logAction({
    action: 'expenditure_recorded',
    entityType: 'budget',
    entityId: eventId,
    userId,
    details: { eventId, amount },
  })
}

/**
 * Logs an event status change action.
 * @param eventId - The event whose status changed
 * @param oldStatus - The previous status
 * @param newStatus - The new status
 * @param userId - ID of the user who changed the status
 */
export async function logEventStatusChange(
  eventId: string,
  oldStatus: string,
  newStatus: string,
  userId: string
): Promise<void> {
  await logAction({
    action: 'event_status_changed',
    entityType: 'event',
    entityId: eventId,
    userId,
    details: { oldStatus, newStatus },
  })
}

/**
 * Logs a user role change action.
 * @param targetUserId - The user whose role was changed
 * @param oldRole - The previous role
 * @param newRole - The new role
 * @param adminId - ID of the admin who performed the change
 */
export async function logRoleChange(
  targetUserId: string,
  oldRole: string,
  newRole: string,
  adminId: string
): Promise<void> {
  await logAction({
    action: 'user_role_updated',
    entityType: 'user',
    entityId: targetUserId,
    userId: adminId,
    details: { oldRole, newRole },
  })
}
