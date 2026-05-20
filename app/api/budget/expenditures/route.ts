// API routes for expenditures: GET /api/budget/expenditures, POST /api/budget/expenditures
// Requirements: 6.3, 7.1, 7.2

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { listAllExpenditures, getOrgExpenditures, recordExpenditure } from '@/lib/budget'

/**
 * GET /api/budget/expenditures
 * Returns expenditures scoped to the user's organization.
 * Admins receive all expenditures across all events.
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

    // Admins see all expenditures; organizers and officers only see their org's
    const expenditures =
      user.role === 'admin'
        ? await listAllExpenditures()
        : user.organizationId
          ? await getOrgExpenditures(user.organizationId)
          : []

    return NextResponse.json({ success: true, data: expenditures })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/budget/expenditures
 * Records a new expenditure against an event. Officer or admin only.
 * Body: { eventId, amount, description, documentId }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'record_expenditure')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Officer or Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { eventId, amount, description, documentId } = body

    const missing: { field: string; message: string }[] = []
    if (!eventId) missing.push({ field: 'eventId', message: 'Event ID is required' })
    if (!amount) missing.push({ field: 'amount', message: 'Amount is required' })
    if (!description) missing.push({ field: 'description', message: 'Description is required' })
    if (!documentId) missing.push({ field: 'documentId', message: 'A supporting document is required' })

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields', details: missing } },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Amount must be a positive number' } },
        { status: 400 }
      )
    }

    const expenditure = await recordExpenditure(eventId, amount, description, documentId, user.id)
    return NextResponse.json({ success: true, data: expenditure }, { status: 201 })
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
