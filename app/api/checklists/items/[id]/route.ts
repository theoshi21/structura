// API routes for a single checklist item: PATCH/DELETE /api/checklists/items/[id]
// Requirements: 5.4, 5.5

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { toggleChecklistItem, removeChecklistItem } from '@/lib/checklists'

/**
 * PATCH /api/checklists/items/[id]
 * Toggles the completion status of a checklist item.
 */
export async function PATCH(
  _request: NextRequest,
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

    const item = await toggleChecklistItem(params.id, user.id)

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/checklists/items/[id]
 * Removes a checklist item.
 */
export async function DELETE(
  _request: NextRequest,
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

    await removeChecklistItem(params.id, user.id)

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
    if (error.message === 'Checklist item not found') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
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
