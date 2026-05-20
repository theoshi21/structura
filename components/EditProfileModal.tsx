'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'

interface EditProfileModalProps {
  /** Whether the modal is visible */
  open: boolean
  /** Current user data to pre-fill the form */
  user: { username: string; email: string } | null
  /** Called when the modal should close */
  onClose: () => void
  /** Called after a successful save so the sidebar can refresh */
  onSaved: (updated: { username: string; email: string }) => void
  /** Accent color for the avatar — matches the sidebar role color */
  accentColor?: string
}

/**
 * Slide-up modal panel for editing the current user's profile.
 * Allows changing username, email, and password.
 * Requires the current password to confirm any change.
 */
export default function EditProfileModal({
  open,
  user,
  onClose,
  onSaved,
  accentColor = 'bg-primary',
}: EditProfileModalProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  /** Pre-fill form fields whenever the modal opens with fresh user data */
  useEffect(() => {
    if (open && user) {
      setUsername(user.username)
      setEmail(user.email)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess(false)
      // Focus the first field after the panel animates in
      setTimeout(() => firstInputRef.current?.focus(), 150)
    }
  }, [open, user])

  /** Closes the modal when Escape is pressed */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  /** Submits the profile update to the API */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const payload: Record<string, string> = { currentPassword }
      if (username !== user?.username) payload.username = username
      if (email !== user?.email) payload.email = email
      if (newPassword) payload.newPassword = newPassword

      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to update profile.')
        setLoading(false)
        return
      }

      setSuccess(true)
      onSaved({ username, email })
      // Auto-close after a short success flash
      setTimeout(() => onClose(), 1200)
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const initial = (user?.username ?? '?').charAt(0).toUpperCase()

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides up from the bottom-left, anchored above the sidebar profile area */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
        className={`
          fixed bottom-0 left-0 z-50 w-72 bg-[#1a1a2e] border border-white/10 rounded-t-2xl
          shadow-2xl transition-transform duration-300 ease-out
          ${open ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pb-6 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${accentColor} flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm font-bold text-white font-body">{initial}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-off-white font-body">{user?.username}</p>
                <p className="text-xs text-mid-gray font-body">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-mid-gray hover:text-off-white transition-colors p-1 rounded"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success flash */}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-body text-xs text-green-400">Profile updated!</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="font-body text-xs text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Username */}
            <Input
              ref={firstInputRef}
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading || success}
              autoComplete="username"
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
              autoComplete="email"
            />

            {/* Divider */}
            <div className="border-t border-white/10 pt-1">
              <p className="text-xs text-mid-gray font-body mb-3">Change password (optional)</p>
              <div className="flex flex-col gap-3">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || success}
                  autoComplete="new-password"
                />
                {newPassword && (
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || success}
                    autoComplete="new-password"
                  />
                )}
              </div>
            </div>

            {/* Current password — always required */}
            <div className="border-t border-white/10 pt-1">
              <Input
                label="Current Password"
                type="password"
                placeholder="Required to save changes"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading || success}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full rounded-lg mt-1"
              disabled={loading || success || !currentPassword}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
