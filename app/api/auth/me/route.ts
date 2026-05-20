// API route for getting and updating the current authenticated user
// Requirements: 1.2

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'
import { hashPassword, verifyPassword } from '@/lib/password'

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Used by client-side layouts to display real user info.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get user' } },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/auth/me
 * Updates the current user's username, email, and/or password.
 * Requires the current password to confirm identity before any change.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { username, email, currentPassword, newPassword } = body

    // At least one field must be provided
    if (!username && !email && !newPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nothing to update' } },
        { status: 400 }
      )
    }

    const supabase = createSupabaseClient()

    // Fetch the stored password hash to verify identity
    const { data: dbUser, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single()

    if (fetchError || !dbUser) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user' } },
        { status: 500 }
      )
    }

    // Require current password whenever any change is made
    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Current password is required' } },
        { status: 400 }
      )
    }

    const passwordValid = await verifyPassword(currentPassword, dbUser.password_hash)
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } },
        { status: 400 }
      )
    }

    // Validate new password length if provided
    if (newPassword && newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters' } },
        { status: 400 }
      )
    }

    // Check username uniqueness if changing
    if (username && username !== user.username) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: 'Username is already taken' } },
          { status: 409 }
        )
      }
    }

    // Check email uniqueness if changing
    if (email && email !== user.email) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: 'Email is already in use' } },
          { status: 409 }
        )
      }
    }

    // Build the update payload
    const updates: Record<string, string> = { updated_at: new Date().toISOString() }
    if (username) updates.username = username
    if (email) updates.email = email
    if (newPassword) updates.password_hash = await hashPassword(newPassword)

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    )
  }
}
