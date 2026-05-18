'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Select from '@/components/Select'

/** Account type options for the toggle */
type AccountType = 'student' | 'employee'

const schoolOptions = [
  { value: '', label: 'Select a school' },
  { value: 'adamson-university', label: 'Adamson University' },
  { value: 'ateneo-de-manila', label: 'Ateneo de Manila University' },
  { value: 'de-la-salle-university', label: 'De La Salle University' },
  { value: 'university-of-the-philippines', label: 'University of the Philippines' },
  { value: 'university-of-santo-tomas', label: 'University of Santo Tomas' },
  { value: 'other', label: 'Other' },
]

const studentRoleOptions = [
  { value: '', label: 'Select your role' },
  { value: 'president', label: 'President' },
  { value: 'vice-president', label: 'Vice President' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'member', label: 'Member' },
]

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
 * Horizontal rule divider with a small caps section label.
 */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-light-gray/15" />
    </div>
  )
}

/**
 * Student registration form.
 * Loads available organizations from the API and presents them as a dropdown.
 * Falls back to a free-text input if no organizations have been created yet.
 */
function StudentForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', username: '',
    school: '', orgId: '', department: '',
    role: '', studentNumber: '',
    password: '', confirmPassword: '',
    terms: false,
  })
  const [orgs, setOrgs] = useState<{ value: string; label: string }[]>([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /** Updates a single field in the form state */
  function setField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  /** Fetches available organizations from the API for the dropdown */
  useEffect(() => {
    fetch('/api/organizations')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const options = [
            { value: '', label: 'Select your organization' },
            ...json.data.map((o: { id: string; name: string }) => ({
              value: o.id,
              label: o.name,
            })),
          ]
          setOrgs(options)
        }
      })
      .catch(() => {})
      .finally(() => setOrgsLoading(false))
  }, [])

  /** Handles registration with real API call */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.username.trim()) {
      setError('Username is required')
      return
    }

    if (!form.orgId) {
      setError('Please select your organization')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      // Resolve the selected org name from the dropdown options
      const selectedOrg = orgs.find((o) => o.value === form.orgId)
      const organizationName = selectedOrg?.label ?? null

      // Members get officer role (elevated permissions within student portal).
      // All other positions (President, VP, Secretary, etc.) get organizer role.
      const isOfficer = form.role === 'member'

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          username: form.username.trim().toLowerCase(),
          password: form.password,
          role: isOfficer ? 'officer' : 'organizer',
          organizationName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to create account')
        setLoading(false)
        return
      }

      router.push('/sign-in')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="font-body text-sm text-red-400">{error}</p>
        </div>
      )}

      <SectionDivider label="Personal Information" />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          placeholder="Juan"
          value={form.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          required
          disabled={loading}
        />
        <Input
          label="Last Name"
          type="text"
          placeholder="dela Cruz"
          value={form.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Input
        label="E-mail Address"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(e) => setField('email', e.target.value)}
        required
        disabled={loading}
      />

      <Input
        label="Username"
        type="text"
        placeholder="e.g. juandc2025"
        value={form.username}
        onChange={(e) => setField('username', e.target.value)}
        required
        disabled={loading}
      />

      <SectionDivider label="Organization Details" />

      <Select
        label="School"
        options={schoolOptions}
        value={form.school}
        onChange={(e) => setField('school', e.target.value)}
        required
        disabled={loading}
      />

      {/* Organization dropdown — loaded from API */}
      {orgsLoading ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-mid-gray font-body">
            Organization
          </span>
          <div className="h-10 bg-dark-navy border border-light-gray/30 rounded-lg animate-pulse" />
        </div>
      ) : orgs.length <= 1 ? (
        /* No orgs created yet — show a notice */
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="font-body text-sm text-amber-400">
            No organizations are available yet. Please ask your admin to create your organization first.
          </p>
        </div>
      ) : (
        <Select
          label="Organization"
          options={orgs}
          value={form.orgId}
          onChange={(e) => setField('orgId', e.target.value)}
          required
          disabled={loading}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Department / College"
          type="text"
          placeholder="e.g. College of Engineering"
          value={form.department}
          onChange={(e) => setField('department', e.target.value)}
          required
          disabled={loading}
        />
        <Select
          label="Your Role"
          options={studentRoleOptions}
          value={form.role}
          onChange={(e) => setField('role', e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Input
        label="Student #"
        type="text"
        placeholder="e.g. 2021-12345"
        value={form.studentNumber}
        onChange={(e) => setField('studentNumber', e.target.value)}
        required
        disabled={loading}
      />

      <SectionDivider label="Password" />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Set Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
          required
          disabled={loading}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => setField('confirmPassword', e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer mt-1">
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(e) => setField('terms', e.target.checked)}
          required
          disabled={loading}
          className="mt-0.5 w-4 h-4 rounded border-light-gray/30 bg-dark-navy accent-primary cursor-pointer flex-shrink-0 disabled:opacity-50"
        />
        <span className="font-body text-sm text-mid-gray leading-relaxed">
          I agree to the{' '}
          <Link href="#" className="text-accent hover:underline">Terms of Use</Link>
          {' '}and{' '}
          <Link href="#" className="text-accent hover:underline">Privacy Policy</Link>
        </span>
      </label>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full rounded-lg mt-1"
        disabled={loading || orgsLoading || orgs.length <= 1}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}

/**
 * Employee registration form.
 * Sends the access code to the server for validation — the server checks it
 * against the ADMIN_ACCESS_CODE environment variable.
 */
function EmployeeForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', username: '',
    school: '', officeName: '', position: '',
    employeeNumber: '', accessCode: '',
    password: '', confirmPassword: '',
    terms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /** Updates a single field in the form state */
  function setField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  /** Handles registration with real API call */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.username.trim()) {
      setError('Username is required')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!form.accessCode) {
      setError('Admin access code is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          username: form.username.trim().toLowerCase(),
          password: form.password,
          role: 'admin',
          accessCode: form.accessCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to create account')
        setLoading(false)
        return
      }

      router.push('/sign-in')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="font-body text-sm text-red-400">{error}</p>
        </div>
      )}

      <SectionDivider label="Personal Information" />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          placeholder="Maria"
          value={form.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          required
          disabled={loading}
        />
        <Input
          label="Last Name"
          type="text"
          placeholder="Santos"
          value={form.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Input
        label="E-mail Address"
        type="email"
        placeholder="you@school.edu.ph"
        value={form.email}
        onChange={(e) => setField('email', e.target.value)}
        required
        disabled={loading}
      />

      <Input
        label="Username"
        type="text"
        placeholder="e.g. msantos_osa"
        value={form.username}
        onChange={(e) => setField('username', e.target.value)}
        required
        disabled={loading}
      />

      <SectionDivider label="Office Details" />

      <Select
        label="School"
        options={schoolOptions}
        value={form.school}
        onChange={(e) => setField('school', e.target.value)}
        required
        disabled={loading}
      />

      <Input
        label="Office / Department Name"
        type="text"
        placeholder="e.g. Office of Student Affairs"
        value={form.officeName}
        onChange={(e) => setField('officeName', e.target.value)}
        required
        disabled={loading}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Position / Title"
          type="text"
          placeholder="e.g. Student Affairs Officer"
          value={form.position}
          onChange={(e) => setField('position', e.target.value)}
          required
          disabled={loading}
        />
        <Input
          label="Employee #"
          type="text"
          placeholder="e.g. EMP-00123"
          value={form.employeeNumber}
          onChange={(e) => setField('employeeNumber', e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Input
        label="Admin Access Code"
        type="password"
        placeholder="Provided by your institution"
        value={form.accessCode}
        onChange={(e) => setField('accessCode', e.target.value)}
        required
        disabled={loading}
      />

      <SectionDivider label="Password" />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Set Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
          required
          disabled={loading}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => setField('confirmPassword', e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer mt-1">
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(e) => setField('terms', e.target.checked)}
          required
          disabled={loading}
          className="mt-0.5 w-4 h-4 rounded border-light-gray/30 bg-dark-navy accent-primary cursor-pointer flex-shrink-0 disabled:opacity-50"
        />
        <span className="font-body text-sm text-mid-gray leading-relaxed">
          I agree to the{' '}
          <Link href="#" className="text-accent hover:underline">Terms of Use</Link>
          {' '}and{' '}
          <Link href="#" className="text-accent hover:underline">Privacy Policy</Link>
        </span>
      </label>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full rounded-lg mt-1"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}

/**
 * Register page — shared layout with account type toggle.
 */
export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('student')

  return (
    <div className="min-h-screen bg-near-black flex flex-col">
      <AuthNavbar />

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-body text-sm text-mid-gray hover:text-off-white transition-colors mb-8"
          >
            ← Back to home
          </Link>

          <h1 className="font-heading text-4xl text-off-white mb-2">Create a new account</h1>
          <p className="font-body text-sm text-mid-gray mb-8">
            Choose your account type to get started.
          </p>

          <div className="flex gap-2 p-1 rounded-xl bg-dark-navy border border-light-gray/15 mb-8">
            <button
              type="button"
              onClick={() => setAccountType('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-body text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                accountType === 'student'
                  ? 'bg-primary text-white'
                  : 'text-mid-gray hover:text-off-white'
              }`}
            >
              🎓 Student Organization
            </button>
            <button
              type="button"
              onClick={() => setAccountType('employee')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-body text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                accountType === 'employee'
                  ? 'bg-primary text-white'
                  : 'text-mid-gray hover:text-off-white'
              }`}
            >
              🏛️ Administrative Office
            </button>
          </div>

          {accountType === 'student' ? <StudentForm /> : <EmployeeForm />}

          <p className="font-body text-sm text-mid-gray text-center mt-6">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-accent hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
