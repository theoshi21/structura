'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/Logo'
import Button from '@/components/Button'

/**
 * Minimal navbar for auth pages — logo only, no nav links.
 */
function AuthNavbar() {
  return (
    <nav className="w-full bg-near-black border-b border-light-gray/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
        <Logo white />
      </div>
    </nav>
  )
}

/**
 * Inner component that reads the token from the URL and handles the reset form.
 * Wrapped in Suspense because useSearchParams requires it in Next.js 14+.
 */
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenError, setTokenError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  /** Validates the token on page load so we can show an error immediately if it's bad */
  useEffect(() => {
    if (!token) {
      setTokenError('No reset token found. Please request a new reset link.')
      setValidating(false)
      return
    }

    async function checkToken() {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
        const data = await response.json()

        if (!response.ok) {
          setTokenError(data.error?.message || 'Invalid or expired reset link.')
        }
      } catch {
        setTokenError('Could not validate the reset link. Please try again.')
      } finally {
        setValidating(false)
      }
    }

    checkToken()
  }, [token])

  /** Submits the new password to the API */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFormError(data.error?.message || 'Failed to reset password. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(true)
      // Redirect to sign-in after a short delay
      setTimeout(() => router.push('/sign-in'), 3000)
    } catch {
      setFormError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Loading state while validating token
  if (validating) {
    return (
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-sm text-mid-gray">Validating reset link...</p>
      </div>
    )
  }

  // Invalid / expired token
  if (tokenError) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl text-off-white mb-3">Link invalid</h1>
        <p className="font-body text-sm text-mid-gray mb-8 leading-relaxed">{tokenError}</p>
        <Link href="/forgot-password">
          <Button variant="primary" size="md" className="rounded-lg">
            Request a new link
          </Button>
        </Link>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl text-off-white mb-3">Password updated</h1>
        <p className="font-body text-sm text-mid-gray leading-relaxed">
          Your password has been reset. Redirecting you to sign in...
        </p>
      </div>
    )
  }

  // Reset form
  return (
    <>
      <h1 className="font-heading text-4xl text-off-white mb-2">Set new password</h1>
      <p className="font-body text-sm text-mid-gray mb-8">
        Choose a strong password for your account.
      </p>

      {formError && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="font-body text-sm text-red-400">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider text-mid-gray font-body"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
            className="w-full rounded-lg bg-dark-navy border border-light-gray/30 hover:border-light-gray/60 px-4 py-2.5 text-sm text-off-white placeholder:text-mid-gray font-body focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="font-body text-xs text-mid-gray">Minimum 8 characters</p>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm-password"
            className="text-xs font-semibold uppercase tracking-wider text-mid-gray font-body"
          >
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-lg bg-dark-navy border border-light-gray/30 hover:border-light-gray/60 px-4 py-2.5 text-sm text-off-white placeholder:text-mid-gray font-body focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full rounded-lg mt-1"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Reset Password'}
        </Button>
      </form>
    </>
  )
}

/**
 * Reset Password page — validates the token from the URL and lets the user set a new password.
 */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-near-black flex flex-col">
      <AuthNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 font-body text-sm text-mid-gray hover:text-off-white transition-colors mb-8"
          >
            ← Back to sign in
          </Link>

          <Suspense
            fallback={
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
