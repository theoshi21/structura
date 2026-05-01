// API routes for checklist items: POST /api/checklists/[id]/items
// Requirements: 5.4, 5.5

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { addChecklistItem } from '@/lib/checklists'

/**
 * POST /api/checklists/[id]/items
 * Adds a new item to the checklist.
 * Body: { description: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'update_checklist')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { description } = body

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Item description is required',
            details: [{ field: 'description', message: 'Description is required' }],
          },
        },
        { status: 400 }
      )
    }

    const item = await addChecklistItem(params.id, description.trim(), user.id)

    return NextResponse.json({ success: true, data: item }, { status: 201 })
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
