'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
 * Sign In page — email + password form with real authentication.
 * Includes "Forgot password?" link, "Remember me" checkbox, and register link.
 */
export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /** Handles sign in with real API call */
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to sign in')
        setLoading(false)
        return
      }

      // Redirect based on role
      const { role } = data.data
      if (role === 'organizer' || role === 'officer') {
        router.push('/student/dashboard')
      } else if (role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-near-black flex flex-col">
      <AuthNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-body text-sm text-mid-gray hover:text-off-white transition-colors mb-8"
          >
            ← Back to home
          </Link>

          {/* Heading */}
          <h1 className="font-heading text-4xl text-off-white mb-2">Welcome Back!</h1>
          <p className="font-body text-sm text-mid-gray mb-8">
            Sign in to your account to continue.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="flex flex-col gap-5">
            <Input
              label="E-mail Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            {/* Password field with "Forgot password?" inline */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-mid-gray font-body"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="font-body text-xs text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg bg-dark-navy border border-light-gray/30 hover:border-light-gray/60 px-4 py-2.5 text-sm text-off-white placeholder:text-mid-gray font-body focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-light-gray/30 bg-dark-navy accent-primary cursor-pointer disabled:opacity-50"
              />
              <span className="font-body text-sm text-mid-gray">Remember me for 30 days</span>
            </label>

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full rounded-lg mt-1"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-light-gray/15" />
            <span className="font-body text-xs text-mid-gray">or</span>
            <div className="flex-1 h-px bg-light-gray/15" />
          </div>

          {/* Register link */}
          <p className="font-body text-sm text-mid-gray text-center">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-accent hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
