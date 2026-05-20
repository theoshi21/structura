// Event management service
// Requirements: 3.1, 3.2, 3.3, 3.5, 17.1, 17.2

import { createSupabaseClient } from './supabase'
import { Event, CreateEventInput, UpdateEventInput, EventFilters, EventStatus, Role } from '@/types'
import { logAction, logEventStatusChange } from './audit'

/** Valid event status transitions: from → allowed next statuses */
const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  proposed: ['approved', 'cancelled'],
  approved: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

/**
 * Maps a raw database row to the Event interface
 */
function mapEvent(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    eventDate: new Date(row.event_date as string),
    location: (row.location as string) ?? null,
    status: row.status as EventStatus,
    organizationId: (row.organization_id as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

/**
 * Checks whether a status transition is valid
 * @param from - Current event status
 * @param to - Target event status
 * @returns True if the transition is allowed
 */
export function canTransition(from: EventStatus, to: EventStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

/**
 * Creates a new event proposal with status "proposed"
 * @param data - Event creation input (name, description, eventDate, location)
 * @param userId - ID of the user creating the event
 * @param organizationId - ID of the organization this event belongs to
 * @returns Promise resolving to the created event
 * @throws Error if required fields are missing or DB insert fails
 */
export async function createEvent(data: CreateEventInput, userId: string, organizationId?: string | null): Promise<Event> {
  if (!data.name || !data.eventDate) {
    throw new Error('Event name and date are required')
  }

  if (!userId) {
    throw new Error('User ID is required')
  }

  const supabase = createSupabaseClient()

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      name: data.name,
      description: data.description ?? null,
      event_date: data.eventDate instanceof Date
        ? data.eventDate.toISOString().split('T')[0]
        : data.eventDate,
      location: data.location ?? null,
      status: 'proposed',
      created_by: userId,
      organization_id: organizationId ?? null,
    })
    .select('id, name, description, event_date, location, status, organization_id, created_by, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`)
  }

  // Log the creation to the audit trail (fire-and-forget; don't block on failure)
  logAction({
    action: 'event_created',
    entityType: 'event',
    entityId: event.id,
    userId,
    details: { name: data.name },
  }).catch(() => {})

  return mapEvent(event)
}

/**
 * Gets a single event by its ID
 * @param id - Event's unique identifier
 * @returns Promise resolving to the event or null if not found
 */
export async function getEventById(id: string): Promise<Event | null> {
  if (!id) {
    throw new Error('Event ID is required')
  }

  const supabase = createSupabaseClient()

  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, description, event_date, location, status, organization_id, created_by, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !event) {
    return null
  }

  return mapEvent(event)
}

/**
 * Updates an event's fields (name, description, date, location)
 * @param id - Event's unique identifier
 * @param data - Fields to update
 * @param userId - ID of the user performing the update (for audit)
 * @returns Promise resolving to the updated event
 * @throws Error if event not found or update fails
 */
export async function updateEvent(
  id: string,
  data: UpdateEventInput,
  userId: string
): Promise<Event> {
  if (!id) throw new Error('Event ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const updates: Record<string, string | null> = { updated_at: new Date().toISOString() }

  if (data.name !== undefined) updates.name = data.name
  if (data.description !== undefined) updates.description = data.description
  if (data.location !== undefined) updates.location = data.location
  if (data.eventDate !== undefined) {
    updates.event_date = data.eventDate instanceof Date
      ? data.eventDate.toISOString().split('T')[0]
      : data.eventDate
  }

  const { data: event, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('id, name, description, event_date, location, status, organization_id, created_by, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`)
  }

  if (!event) {
    throw new Error('Event not found')
  }

  // Log the update to the audit trail
  logAction({
    action: 'event_updated',
    entityType: 'event',
    entityId: id,
    userId,
    details: { updatedFields: Object.keys(data) },
  }).catch(() => {})

  return mapEvent(event)
}

/**
 * Updates an event's status, enforcing valid lifecycle transitions
 * @param id - Event's unique identifier
 * @param newStatus - Target status
 * @param userId - ID of the user performing the transition
 * @returns Promise resolving to the updated event
 * @throws Error if transition is invalid or event not found
 */
export async function updateEventStatus(
  id: string,
  newStatus: EventStatus,
  userId: string
): Promise<Event> {
  if (!id) throw new Error('Event ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  // Fetch current event to validate transition
  const existing = await getEventById(id)
  if (!existing) {
    throw new Error('Event not found')
  }

  if (!canTransition(existing.status, newStatus)) {
    throw new Error(
      `Invalid status transition: ${existing.status} → ${newStatus}`
    )
  }

  const { data: event, error } = await supabase
    .from('events')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, description, event_date, location, status, organization_id, created_by, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Failed to update event status: ${error.message}`)
  }

  // Log the status change to the audit trail
  logEventStatusChange(id, existing.status, newStatus, userId).catch(() => {})

  return mapEvent(event)
}

/**
 * Deletes an event and all its associated data (cascade)
 * @param id - Event's unique identifier
 * @param userId - ID of the user performing the deletion
 * @returns Promise that resolves when deletion is complete
 * @throws Error if event not found or deletion fails
 */
export async function deleteEvent(id: string, userId: string): Promise<void> {
  if (!id) throw new Error('Event ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`)
  }

  // Log the deletion to the audit trail
  logAction({
    action: 'event_deleted',
    entityType: 'event',
    entityId: id,
    userId,
    details: {},
  }).catch(() => {})
}

/**
 * Lists events with optional filters (status, createdBy, organizationId, date range)
 * @param filters - Optional filters to narrow results
 * @returns Promise resolving to an array of events
 */
export async function listEvents(filters?: EventFilters): Promise<Event[]> {
  const supabase = createSupabaseClient()

  let query = supabase
    .from('events')
    .select('id, name, description, event_date, location, status, organization_id, created_by, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  // Scope by organization and/or creator.
  // When both are provided, use OR: show events belonging to the org OR created
  // by this user. This covers:
  //   - Events created by any org member (org-scoped)
  //   - Events created by this user whose organization_id is still NULL (legacy)
  if (filters?.organizationId && filters?.createdBy) {
    query = query.or(
      `organization_id.eq.${filters.organizationId},and(organization_id.is.null,created_by.eq.${filters.createdBy})`
    )
  } else if (filters?.organizationId) {
    query = query.eq('organization_id', filters.organizationId)
  } else if (filters?.createdBy) {
    query = query.eq('created_by', filters.createdBy)
  }

  if (filters?.dateFrom) {
    query = query.gte('event_date', filters.dateFrom.toISOString().split('T')[0])
  }

  if (filters?.dateTo) {
    query = query.lte('event_date', filters.dateTo.toISOString().split('T')[0])
  }

  const { data: events, error } = await query

  if (error) {
    throw new Error(`Failed to list events: ${error.message}`)
  }

  return events.map(mapEvent)
}
