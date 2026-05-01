// API routes for a single event allocation: GET/DELETE /api/budget/allocations/[eventId]
// Requirements: 6.2, 6.3

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { getEventAllocation, deallocateFunds } from '@/lib/budget'

/**
 * GET /api/budget/allocations/[eventId]
 * Returns the allocation for a specific event.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    await requireAuth()

    const allocation = await getEventAllocation(params.eventId)

    if (!allocation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No allocation found for this event' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: allocation })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/budget/allocations/[eventId]
 * Removes the allocation for an event, returning funds to the budget. Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'allocate_funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    await deallocateFunds(params.eventId, user.id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return handleError(error)
  }
}

/** Shared error handler */
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
