// API routes for fund allocations: GET /api/budget/allocations, POST /api/budget/allocations
// Requirements: 6.2, 6.3

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { allocateFunds, listAllocations } from '@/lib/budget'

/**
 * GET /api/budget/allocations
 * Returns all fund allocations. Admin/officer only.
 */
export async function GET() {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'view_budget')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const allocations = await listAllocations()
    return NextResponse.json({ success: true, data: allocations })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/budget/allocations
 * Allocates funds to an event. Admin only.
 * Body: { eventId, amount }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'allocate_funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required to allocate funds' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { eventId, amount } = body

    if (!eventId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'eventId and amount are required',
            details: [
              ...(!eventId ? [{ field: 'eventId', message: 'Event ID is required' }] : []),
              ...(!amount ? [{ field: 'amount', message: 'Amount is required' }] : []),
            ],
          },
        },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Amount must be a positive number' } },
        { status: 400 }
      )
    }

    const allocation = await allocateFunds(eventId, amount, user.id)
    return NextResponse.json({ success: true, data: allocation }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Insufficient funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_FUNDS', message: error.message } },
        { status: 422 }
      )
    }
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
