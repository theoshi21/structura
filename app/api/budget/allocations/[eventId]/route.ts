// API routes for a single event allocation: GET/PATCH/DELETE /api/budget/allocations/[eventId]
// Requirements: 6.2, 6.3

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { getEventAllocation, deallocateFunds, allocateFunds } from '@/lib/budget'
import { createSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/budget/allocations/[eventId]
 * Returns the allocation for a specific event.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireAuth()
    const { eventId } = await params
    const allocation = await getEventAllocation(eventId)

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
 * PATCH /api/budget/allocations/[eventId]
 * Updates the allocated amount for an event. Admin only.
 * Body: { amount }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params

    if (!hasPermission(user.role, 'allocate_funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { amount } = body

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Amount must be a positive number' } },
        { status: 400 }
      )
    }

    const existing = await getEventAllocation(eventId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No allocation found for this event' } },
        { status: 404 }
      )
    }

    // Update the allocation amount directly
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('allocations')
      .update({ amount, allocated_by: user.id })
      .eq('event_id', eventId)
      .select('id, event_id, amount, allocated_by, allocated_at')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
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
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuth()
    const { eventId } = await params

    if (!hasPermission(user.role, 'allocate_funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    await deallocateFunds(eventId, user.id)
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
