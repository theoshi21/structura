'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Select from '@/components/Select'

/** Account type options for the toggle */
type AccountType = 'student' | 'employee'

const schoolOptions = [
  { value: '', label: 'Select a school' },
  { value: 'university-of-the-philippines', label: 'University of the Philippines' },
  { value: 'ateneo-de-manila', label: 'Ateneo de Manila University' },
  { value: 'de-la-salle-university', label: 'De La Salle University' },
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
 * Used to separate form sections (e.g. "Personal Information").
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
 * Student registration form — personal info, organization details, and password sections.
 * All handlers are placeholders until Phase 9 auth backend is wired up.
 */
function StudentForm() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    school: '', orgName: '', department: '',
    role: '', studentNumber: '',
    password: '', confirmPassword: '',
    terms: false,
  })

  /** Updates a single field in the form state */
  function setField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  /** Placeholder handler — replaced with real API call in Phase 9 */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Student register placeholder:', form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <SectionDivider label="Personal Information" />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          placeholder="Juan"
          value={form.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          required
        />
        <Input
          label="Last Name"
          type="text"
          placeholder="dela Cruz"
          value={form.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          required
        />
      </div>

      <Input
        label="E-mail Address"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(e) => setField('email', e.target.value)}
        required
      />

      <SectionDivider label="Organization Details" />

      <Select
        label="School"
        options={schoolOptions}
        value={form.school}
        onChange={(e) => setField('school', e.target.value)}
        required
      />

      <Input
        label="Organization Name"
        type="text"
        placeholder="e.g. Computer Science Society"
        value={form.orgName}
        onChange={(e) => setField('orgName', e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Department / College"
          type="text"
          placeholder="e.g. College of Engineering"
          value={form.department}
          onChange={(e) => setField('department', e.target.value)}
          required
        />
        <Select
          label="Your Role"
          options={studentRoleOptions}
          value={form.role}
          onChange={(e) => setField('role', e.target.value)}
          required
        />
      </div>

      <Input
        label="Student #"
        type="text"
        placeholder="e.g. 2021-12345"
        value={form.studentNumber}
        onChange={(e) => setField('studentNumber', e.target.value)}
        required
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
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => setField('confirmPassword', e.target.value)}
          required
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer mt-1">
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(e) => setField('terms', e.target.checked)}
          required
          className="mt-0.5 w-4 h-4 rounded border-light-gray/30 bg-dark-navy accent-primary cursor-pointer flex-shrink-0"
        />
        <span className="font-body text-sm text-mid-gray leading-relaxed">
          I agree to the{' '}
          <Link href="#" className="text-accent hover:underline">Terms of Use</Link>
          {' '}and{' '}
          <Link href="#" className="text-accent hover:underline">Privacy Policy</Link>
        </span>
      </label>

      <Button type="submit" variant="primary" size="lg" className="w-full rounded-lg mt-1">
        Create Account
      </Button>
    </form>
  )
}

/**
 * Employee registration form — personal info, office details, and password sections.
 * All handlers are placeholders until Phase 9 auth backend is wired up.
 */
function EmployeeForm() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    school: '', officeName: '', position: '',
    employeeNumber: '', accessCode: '',
    password: '', confirmPassword: '',
    terms: false,
  })

  /** Updates a single field in the form state */
  function setField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  /** Placeholder handler — replaced with real API call in Phase 9 */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Employee register placeholder:', form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <SectionDivider label="Personal Information" />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          placeholder="Maria"
          value={form.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          required
        />
        <Input
          label="Last Name"
          type="text"
          placeholder="Santos"
          value={form.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          required
        />
      </div>

      <Input
        label="E-mail Address"
        type="email"
        placeholder="you@school.edu.ph"
        value={form.email}
        onChange={(e) => setField('email', e.target.value)}
        required
      />

      <SectionDivider label="Office Details" />

      <Select
        label="School"
        options={schoolOptions}
        value={form.school}
        onChange={(e) => setField('school', e.target.value)}
        required
      />

      <Input
        label="Office / Department Name"
        type="text"
        placeholder="e.g. Office of Student Affairs"
        value={form.officeName}
        onChange={(e) => setField('officeName', e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Position / Title"
          type="text"
          placeholder="e.g. Student Affairs Officer"
          value={form.position}
          onChange={(e) => setField('position', e.target.value)}
          required
        />
        <Input
          label="Employee #"
          type="text"
          placeholder="e.g. EMP-00123"
          value={form.employeeNumber}
          onChange={(e) => setField('employeeNumber', e.target.value)}
          required
        />
      </div>

      <Input
        label="Admin Access Code"
        type="password"
        placeholder="Provided by your institution"
        value={form.accessCode}
        onChange={(e) => setField('accessCode', e.target.value)}
        required
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
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => setField('confirmPassword', e.target.value)}
          required
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer mt-1">
        <input
          type="checkbox"
          checked={form.terms}
          onChange={(e) => setField('terms', e.target.checked)}
          required
          className="mt-0.5 w-4 h-4 rounded border-light-gray/30 bg-dark-navy accent-primary cursor-pointer flex-shrink-0"
        />
        <span className="font-body text-sm text-mid-gray leading-relaxed">
          I agree to the{' '}
          <Link href="#" className="text-accent hover:underline">Terms of Use</Link>
          {' '}and{' '}
          <Link href="#" className="text-accent hover:underline">Privacy Policy</Link>
        </span>
      </label>

      <Button type="submit" variant="primary" size="lg" className="w-full rounded-lg mt-1">
        Create Account
      </Button>
    </form>
  )
}

/**
 * Register page — shared layout with account type toggle that conditionally
 * renders the StudentForm or EmployeeForm based on the selected account type.
 */
export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('student')

  return (
    <div className="min-h-screen bg-near-black flex flex-col">
      <AuthNavbar />

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-body text-sm text-mid-gray hover:text-off-white transition-colors mb-8"
          >
            ← Back to home
          </Link>

          {/* Heading */}
          <h1 className="font-heading text-4xl text-off-white mb-2">Create a new account</h1>
          <p className="font-body text-sm text-mid-gray mb-8">
            Choose your account type to get started.
          </p>

          {/* Account type toggle */}
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

          {/* Conditionally render the correct form */}
          {accountType === 'student' ? <StudentForm /> : <EmployeeForm />}

          {/* Sign in link */}
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
