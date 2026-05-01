// API routes for a single event: GET/PATCH/DELETE /api/events/[id]
// Requirements: 3.1, 3.2, 3.5

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { getEventById, updateEvent, updateEventStatus, deleteEvent } from '@/lib/events'
import { EventStatus } from '@/types'

/**
 * GET /api/events/[id]
 * Returns a single event by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const event = await getEventById(params.id)

    if (!event) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/events/[id]
 * Updates event fields or transitions its status.
 * Body may contain: name, description, eventDate, location, status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const event = await getEventById(params.id)
    if (!event) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, eventDate, location, status } = body

    // Status transition — requires approve_event permission
    if (status !== undefined) {
      const validStatuses: EventStatus[] = ['proposed', 'approved', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status value' } },
          { status: 400 }
        )
      }

      if (!hasPermission(user.role, 'approve_event')) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions to change event status' } },
          { status: 403 }
        )
      }

      const updated = await updateEventStatus(params.id, status as EventStatus, user.id)
      return NextResponse.json({ success: true, data: updated })
    }

    // Field update — requires update_event permission
    if (!hasPermission(user.role, 'update_event')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const updated = await updateEvent(
      params.id,
      {
        name,
        description,
        location,
        eventDate: eventDate ? new Date(eventDate) : undefined,
      },
      user.id
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid status transition')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TRANSITION', message: error.message } },
        { status: 422 }
      )
    }
    return handleError(error)
  }
}

/**
 * DELETE /api/events/[id]
 * Deletes an event and all associated data (cascade)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'delete_event')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const event = await getEventById(params.id)
    if (!event) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    await deleteEvent(params.id, user.id)

    return NextResponse.json({ success: true, data: null })
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
