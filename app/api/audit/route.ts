// API route for audit trail: GET /api/audit
// Requirements: 18.2

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { listAuditEntries } from '@/lib/audit'

/**
 * GET /api/audit
 * Returns audit trail entries, optionally filtered by entity type (category).
 * Supports ?entityType=event|budget|document|user query parameter.
 * Requires admin role.
 */
export async function GET(request: NextRequest) {
  try {
    // Only admins can view the audit trail
    await requireRole(['admin'])

    const params = request.nextUrl.searchParams
    const entityType = params.get('entityType') ?? undefined

    // Validate entityType if provided
    const validEntityTypes = ['event', 'budget', 'document', 'user', 'checklist']
    if (entityType && !validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ENTITY_TYPE',
            message: `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`,
          },
        },
        { status: 400 }
      )
    }

    const entries = await listAuditEntries(entityType)

    return NextResponse.json({ success: true, data: entries })
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
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin privileges required' } },
        { status: 403 }
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
