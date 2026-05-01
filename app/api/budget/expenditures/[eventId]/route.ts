// API route for event expenditures: GET /api/budget/expenditures/[eventId]
// Requirements: 7.1

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getEventExpenditures, getEventFinancialSummary } from '@/lib/budget'

/**
 * GET /api/budget/expenditures/[eventId]
 * Returns all expenditures and financial summary for a specific event.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    await requireAuth()

    const [expenditures, summary] = await Promise.all([
      getEventExpenditures(params.eventId),
      getEventFinancialSummary(params.eventId),
    ])

    return NextResponse.json({ success: true, data: { expenditures, summary } })
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
