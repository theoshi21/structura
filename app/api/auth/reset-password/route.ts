// API route for completing the password reset
// Validates the token and updates the user's password

import { NextRequest, NextResponse } from 'next/server'
import { resetPassword, validateResetToken } from '@/lib/password-reset'

/**
 * GET /api/auth/reset-password?token=...
 * Validates a reset token without consuming it — used by the reset page on load
 * to show an error early if the token is already invalid.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Token is required' },
      },
      { status: 400 }
    )
  }

  try {
    await validateResetToken(token)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid or expired reset link'
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_TOKEN', message },
      },
      { status: 400 }
    )
  }
}

/**
 * POST /api/auth/reset-password
 * Accepts a token and new password, resets the user's password if the token is valid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Token and password are required' },
        },
        { status: 400 }
      )
    }

    await resetPassword(token, password)

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully. You can now sign in with your new password.',
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Reset password error:', error)

    const message = error instanceof Error ? error.message : 'Failed to reset password'
    const isTokenError =
      message.includes('expired') || message.includes('used') || message.includes('Invalid')

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isTokenError ? 'INVALID_TOKEN' : 'INTERNAL_ERROR',
          message,
        },
      },
      { status: isTokenError ? 400 : 500 }
    )
  }
}
