// API routes for event checklists: GET/POST /api/events/[id]/checklist
// Requirements: 5.1, 5.2, 5.4, 5.5

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { getEventById } from '@/lib/events'
import {
  getChecklistByEvent,
  createCustomChecklist,
  createChecklistFromTemplate,
} from '@/lib/checklists'

/**
 * GET /api/events/[id]/checklist
 * Returns the checklist for the given event, including all items.
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

    const checklist = await getChecklistByEvent(id)

    return NextResponse.json({ success: true, data: checklist })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/events/[id]/checklist
 * Creates a checklist for the event.
 * Body: { templateId?: string, items?: string[] }
 * If templateId is provided, copies items from the template.
 * Otherwise, creates a custom checklist with the given items.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!hasPermission(user.role, 'create_checklist')) {
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

    // Prevent duplicate checklists for the same event
    const existing = await getChecklistByEvent(id)
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Checklist already exists for this event' } },
        { status: 409 }
      )
    }

    const body = await request.json()
    const { templateId, items } = body

    let checklist
    if (templateId) {
      checklist = await createChecklistFromTemplate(id, templateId, user.id)
    } else {
      checklist = await createCustomChecklist(id, items ?? [], user.id)
    }

    return NextResponse.json({ success: true, data: checklist }, { status: 201 })
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
    if (error.message === 'Template not found') {
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
