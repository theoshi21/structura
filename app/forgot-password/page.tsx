'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import Input from '@/components/Input'
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
 * Forgot Password page — accepts an email and sends a reset link.
 * Always shows a success message after submission to prevent email enumeration.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  /** Submits the forgot-password request to the API */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-near-black flex flex-col">
      <AuthNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Back to sign in */}
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 font-body text-sm text-mid-gray hover:text-off-white transition-colors mb-8"
          >
            ← Back to sign in
          </Link>

          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-heading text-3xl text-off-white mb-3">Check your email</h1>
              <p className="font-body text-sm text-mid-gray mb-8 leading-relaxed">
                If an account with <span className="text-off-white">{email}</span> exists, we&apos;ve
                sent a password reset link. It expires in 1 hour.
              </p>
              <p className="font-body text-xs text-mid-gray">
                Didn&apos;t receive it?{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-accent hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="font-heading text-4xl text-off-white mb-2">Forgot password?</h1>
              <p className="font-body text-sm text-mid-gray mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="font-body text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Input
                  label="E-mail Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full rounded-lg mt-1"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
