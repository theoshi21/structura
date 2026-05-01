// API route for user registration
// Requirements: 1.1

import { NextRequest, NextResponse } from 'next/server'
import { register } from '@/lib/auth'
import { Role } from '@/types'

/**
 * POST /api/auth/register
 * Registers a new user account.
 * Admin/officer registrations require a valid ADMIN_ACCESS_CODE in the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password, role, organizationName, accessCode } = body

    // Validate required fields
    if (!email || !username || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All fields are required',
            details: [
              { field: 'email', message: 'Email is required' },
              { field: 'username', message: 'Username is required' },
              { field: 'password', message: 'Password is required' },
              { field: 'role', message: 'Role is required' },
            ].filter(d => !body[d.field]),
          },
        },
        { status: 400 }
      )
    }

    // Admin/officer accounts require a valid access code
    if (role === 'admin' || role === 'officer') {
      const validCode = process.env.ADMIN_ACCESS_CODE
      if (!validCode) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Admin registration is not configured on this server.' },
          },
          { status: 500 }
        )
      }
      if (!accessCode || accessCode.trim() !== validCode.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_ACCESS_CODE', message: 'Invalid access code. Please check with your institution.' },
          },
          { status: 403 }
        )
      }
    }

    // Register the user
    const user = await register(email, username, password, role as Role, organizationName ?? null)

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Registration error:', error)

    // Handle specific errors
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ERROR',
            message: error.message,
          },
        },
        { status: 409 }
      )
    }

    if (error instanceof Error && error.message.includes('Password must be')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to register user',
        },
      },
      { status: 500 }
    )
  }
}
