// API route for listing all checklists for the current user's events
// Replaces the N+1 fan-out of GET /api/events/[id]/checklist per event

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { listEvents } from '@/lib/events'
import { getChecklistsByEventIds } from '@/lib/checklists'
import { EventFilters } from '@/types'

/**
 * GET /api/checklists
 * Returns all checklists (with items) for the current user's events.
 * Admins get checklists across all events; organizers/officers are scoped to their org.
 * Uses a single batched DB query instead of one query per event.
 */
export async function GET() {
  try {
    const user = await requireAuth()

    // Scope events the same way the events route does
    const filters: EventFilters = {}
    if (user.role !== 'admin') {
      if (user.organizationId) {
        filters.organizationId = user.organizationId
        filters.createdBy = user.id
      } else {
        filters.createdBy = user.id
      }
    }

    const events = await listEvents(filters)
    const eventIds = events.map((e) => e.id)

    const checklists = await getChecklistsByEventIds(eventIds)

    return NextResponse.json({ success: true, data: checklists })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
