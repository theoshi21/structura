// API route for a single organization: DELETE /api/organizations/[id]
// Admin only.

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { deleteOrganization, getOrganizationById } from '@/lib/organizations'

/**
 * DELETE /api/organizations/[id]
 * Deletes an organization by ID. Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

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

    const existing = await getOrganizationById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } },
        { status: 404 }
      )
    }

    await deleteOrganization(id)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
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
}
