// API routes for organizational budget: GET /api/budget, PATCH /api/budget
// Requirements: 6.1, 6.2, 6.3

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { getBudgetSummary, updateTotalFunds } from '@/lib/budget'

/**
 * GET /api/budget
 * Returns the organizational budget summary (total, allocated, available funds).
 * Accessible to all authenticated users with view_budget permission.
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

    const summary = await getBudgetSummary()
    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/budget
 * Updates the total funds in the organizational budget.
 * Admin only.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'allocate_funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { totalFunds } = body

    if (totalFunds === undefined || totalFunds === null) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'totalFunds is required' } },
        { status: 400 }
      )
    }

    if (typeof totalFunds !== 'number' || totalFunds < 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'totalFunds must be a non-negative number' } },
        { status: 400 }
      )
    }

    const budget = await updateTotalFunds(totalFunds, user.id)
    return NextResponse.json({ success: true, data: budget })
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
