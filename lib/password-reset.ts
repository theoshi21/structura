// Password reset service — token generation, validation, and email dispatch
// Handles the full forgot-password flow using short-lived tokens stored in the DB

import crypto from 'crypto'
import { Resend } from 'resend'
import { createSupabaseClient } from './supabase'
import { hashPassword } from './password'

/** Token validity window in milliseconds (1 hour) */
const TOKEN_EXPIRY_MS = 60 * 60 * 1000

/**
 * Initiates the forgot-password flow for a given email address.
 * Generates a secure token, stores it in the DB, and sends a reset email via Resend.
 * Always returns successfully even if the email is not found (prevents enumeration).
 * @param email - The email address to send the reset link to
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (!email) {
    throw new Error('Email is required')
  }

  const supabase = createSupabaseClient()

  // Look up the user — silently do nothing if not found (prevents email enumeration)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, username')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (userError || !user) {
    // Return without error to avoid leaking whether the email exists
    return
  }

  // Invalidate any existing unused tokens for this user
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('used_at', null)

  // Generate a cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

  // Store the token in the database
  const { error: insertError } = await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (insertError) {
    throw new Error(`Failed to create reset token: ${insertError.message}`)
  }

  // Build the reset URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  // Send the email via Resend
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(resendApiKey)
  const fromAddress = process.env.RESEND_FROM ?? 'Structura <onboarding@resend.dev>'

  const { error: emailError } = await resend.emails.send({
    from: fromAddress,
    to: user.email,
    subject: 'Reset your Structura password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #333;">
        <h2 style="color: #111;">Reset your password</h2>
        <p>Hi <strong>${user.username}</strong>,</p>
        <p>You requested a password reset for your Structura account. Click the button below to set a new password.</p>
        <p style="margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">— The Structura Team</p>
      </div>
    `,
    text: `Hi ${user.username},\n\nYou requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\n— The Structura Team`,
  })

  if (emailError) {
    throw new Error(`Failed to send reset email: ${emailError.message}`)
  }
}

/**
 * Validates a password reset token and returns the associated user ID.
 * @param token - The reset token from the URL
 * @returns The user ID if the token is valid and unexpired
 * @throws Error if the token is invalid, expired, or already used
 */
export async function validateResetToken(token: string): Promise<string> {
  if (!token) {
    throw new Error('Token is required')
  }

  const supabase = createSupabaseClient()

  const { data: record, error } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used_at')
    .eq('token', token)
    .single()

  if (error || !record) {
    throw new Error('Invalid or expired reset link')
  }

  if (record.used_at) {
    throw new Error('This reset link has already been used')
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new Error('This reset link has expired')
  }

  return record.user_id
}

/**
 * Resets a user's password using a valid reset token.
 * Marks the token as used after a successful reset.
 * @param token - The reset token from the URL
 * @param newPassword - The new plaintext password to set
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }

  // Validate the token and get the user ID
  const userId = await validateResetToken(token)

  const supabase = createSupabaseClient()

  // Hash the new password
  const passwordHash = await hashPassword(newPassword)

  // Update the user's password
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`)
  }

  // Mark the token as used so it can't be reused
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
}
