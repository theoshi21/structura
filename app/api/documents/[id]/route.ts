// API routes for a single document: DELETE /api/documents/[id]
// Requirements: 4.5

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { getDocumentById, deleteDocument, getDocumentUrl } from '@/lib/documents'

/**
 * GET /api/documents/[id]
 * Returns a single document record and its public URL.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const doc = await getDocumentById(params.id)
    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      )
    }

    const url = await getDocumentUrl(params.id)

    return NextResponse.json({ success: true, data: { ...doc, url } })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/documents/[id]
 * Deletes a document from storage and the database.
 * Requires officer or admin role.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'delete_document')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const doc = await getDocumentById(params.id)
    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      )
    }

    await deleteDocument(params.id, user.id)

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
