// API route for listing users
// Requirements: 2.2

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { listUsers } from '@/lib/user'
import { Role } from '@/types'

/**
 * GET /api/users
 * Lists all users in the system
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole(['admin'])

    // Get optional role filter from query params
    const searchParams = request.nextUrl.searchParams
    const roleFilter = searchParams.get('role') as Role | null

    // Validate role filter if provided
    if (roleFilter && !['organizer', 'officer', 'admin'].includes(roleFilter)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid role filter',
          },
        },
        { status: 400 }
      )
    }

    // List users
    const users = await listUsers(roleFilter || undefined)

    return NextResponse.json({
      success: true,
      data: users,
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
