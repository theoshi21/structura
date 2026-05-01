// API route for updating user roles
// Requirements: 2.2

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { updateUserRole, getUserById } from '@/lib/user'
import { Role } from '@/types'

/**
 * PATCH /api/users/[id]/role
 * Updates a user's role
 * Requires admin role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role and capture the admin's identity for audit logging
    const admin = await requireRole(['admin'])
    const { id } = await params

    // Parse request body
    const body = await request.json()
    const { role } = body

    // Validate role
    if (!role || !['organizer', 'officer', 'admin'].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid role. Must be one of: organizer, officer, admin',
          },
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await getUserById(id)
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      )
    }

    // Update user role, passing admin ID for audit trail
    const updatedUser = await updateUserRole(id, role as Role)

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
          { status: 401 }
        )
      }

      if (error.message === 'Insufficient permissions') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Admin privileges required',
            },
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
