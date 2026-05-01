// API route for user logout
// Requirements: 1.3

import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/lib/auth'

/**
 * POST /api/auth/logout
 * Logs out the current user by destroying their session
 */
export async function POST(request: NextRequest) {
  try {
    await logout()

    return NextResponse.json(
      {
        success: true,
        data: { message: 'Logged out successfully' },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Logout error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to logout',
        },
      },
      { status: 500 }
    )
  }
}
