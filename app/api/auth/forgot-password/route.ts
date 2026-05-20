// API route for initiating the forgot-password flow
// Sends a reset email if the address exists; always returns 200 to prevent enumeration

import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/password-reset'

/**
 * POST /api/auth/forgot-password
 * Accepts an email address and sends a password reset link if the account exists.
 * Always returns 200 regardless of whether the email was found.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email is required' },
        },
        { status: 400 }
      )
    }

    await requestPasswordReset(email)

    // Always return the same message to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Forgot password error:', message)

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: `Failed to process request: ${message}` },
      },
      { status: 500 }
    )
  }
}
