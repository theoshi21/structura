// API routes for event collection: POST /api/events, GET /api/events
// Requirements: 3.1, 3.2, 3.5

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { createEvent, listEvents } from '@/lib/events'
import { EventFilters, EventStatus } from '@/types'

/**
 * POST /api/events
 * Creates a new event proposal (organizer, officer, admin).
 * Stores the user's organization_id directly on the event.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'create_event')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, eventDate, location } = body

    if (!name || !eventDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Event name and date are required',
            details: [
              ...(!name ? [{ field: 'name', message: 'Name is required' }] : []),
              ...(!eventDate ? [{ field: 'eventDate', message: 'Event date is required' }] : []),
            ],
          },
        },
        { status: 400 }
      )
    }

    const event = await createEvent(
      { name, description, eventDate: new Date(eventDate), location },
      user.id,
      user.organizationId
    )

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/events
 * Lists events. For organizers and officers, scopes results to their organization.
 * Admins see all events. Supports ?status=, ?dateFrom=, ?dateTo= filters.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const params = request.nextUrl.searchParams
    const filters: EventFilters = {}

    const status = params.get('status') as EventStatus | null
    if (status) {
      const validStatuses: EventStatus[] = ['proposed', 'approved', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status filter' } },
          { status: 400 }
        )
      }
      filters.status = status
    }

    const dateFrom = params.get('dateFrom')
    if (dateFrom) filters.dateFrom = new Date(dateFrom)

    const dateTo = params.get('dateTo')
    if (dateTo) filters.dateTo = new Date(dateTo)

    // Admins see all events; organizers and officers see their org's events.
    // Pass both organizationId and createdBy so listEvents uses an OR filter —
    // this ensures events created by the user are always visible even if the
    // event's organization_id wasn't backfilled (covers legacy production data).
    if (user.role !== 'admin') {
      if (user.organizationId) {
        filters.organizationId = user.organizationId
        filters.createdBy = user.id
      } else {
        filters.createdBy = user.id
      }
    }

    const events = await listEvents(filters)

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    return handleError(error)
  }
}

/** Shared error handler for this route */
function handleError(error: unknown) {
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
