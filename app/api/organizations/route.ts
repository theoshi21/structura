// API routes for organizations: GET /api/organizations, POST /api/organizations
// GET is public (used by the register form dropdown).
// POST requires admin role.

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { listOrganizations, createOrganization } from '@/lib/organizations'

/**
 * GET /api/organizations
 * Returns all organizations alphabetically.
 * Public — no authentication required (needed for the register form).
 */
export async function GET() {
  try {
    const orgs = await listOrganizations()
    return NextResponse.json({ success: true, data: orgs })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/organizations
 * Creates a new organization. Admin only.
 * Body: { name, description?, contactEmail? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (!hasPermission(user.role, 'manage_users')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, contactEmail } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Organization name is required' } },
        { status: 400 }
      )
    }

    const org = await createOrganization({ name, description, contactEmail })
    return NextResponse.json({ success: true, data: org }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: error.message } },
        { status: 409 }
      )
    }
    return handleError(error)
  }
}

/** Shared error handler */
function handleError(error: unknown) {
  if (error instanceof Error) {
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
