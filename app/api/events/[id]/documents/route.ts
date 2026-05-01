// API routes for event documents: POST/GET /api/events/[id]/documents
// Requirements: 4.1, 4.2, 4.5

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { uploadDocument, listDocumentsByEvent } from '@/lib/documents'
import { getEventById } from '@/lib/events'
import { DocumentType } from '@/types'

const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'permit',
  'contract',
  'promotional',
  'receipt',
  'financial',
]

/**
 * POST /api/events/[id]/documents
 * Uploads a document and links it to the event.
 * Expects multipart/form-data with fields: file, documentType
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!hasPermission(user.role, 'upload_document')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const event = await getEventById(id)
    if (!event) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = formData.get('documentType') as string | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File is required',
            details: [{ field: 'file', message: 'File is required' }],
          },
        },
        { status: 400 }
      )
    }

    if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `documentType must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`,
            details: [{ field: 'documentType', message: 'Invalid document type' }],
          },
        },
        { status: 400 }
      )
    }

    const doc = await uploadDocument(file, id, documentType as DocumentType, user.id)

    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * GET /api/events/[id]/documents
 * Returns all documents associated with the event.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const event = await getEventById(id)
    if (!event) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    const docs = await listDocumentsByEvent(id)

    return NextResponse.json({ success: true, data: docs })
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
    if (
      error.message.startsWith('Invalid file type') ||
      error.message.startsWith('File size exceeds')
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
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
