// API route for user login
// Requirements: 1.2

import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'

/**
 * POST /api/auth/login
 * Authenticates a user and creates a session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
          },
        },
        { status: 400 }
      )
    }

    // Authenticate the user
    const sessionData = await login(email, password)

    return NextResponse.json(
      {
        success: true,
        data: sessionData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Login error:', error)

    // Handle invalid credentials
    if (error.message === 'Invalid credentials') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to authenticate',
        },
      },
      { status: 500 }
    )
  }
}
