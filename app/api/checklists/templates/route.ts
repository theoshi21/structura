// API routes for checklist templates: GET/POST /api/checklists/templates
// Requirements: 5.1, 5.2

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { listTemplates, createTemplate } from '@/lib/checklists'

/**
 * GET /api/checklists/templates
 * Returns all checklist templates. Accessible to all authenticated users
 * so organizers can apply templates when creating checklists.
 */
export async function GET() {
  try {
    await requireAuth()
    const templates = await listTemplates()
    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/checklists/templates
 * Creates a new checklist template. Admin only.
 * Body: { name: string, items: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'create_checklist')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, items } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Template name is required',
            details: [{ field: 'name', message: 'Name is required' }],
          },
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Items must be an array of strings',
            details: [{ field: 'items', message: 'Items must be an array' }],
          },
        },
        { status: 400 }
      )
    }

    const filteredItems: string[] = items
      .filter((i): i is string => typeof i === 'string' && i.trim() !== '')
      .map((i) => i.trim())

    const template = await createTemplate({ name: name.trim(), items: filteredItems }, user.id)

    return NextResponse.json({ success: true, data: template }, { status: 201 })
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
