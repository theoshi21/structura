'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

/**
 * Reusable input component for text, email, and password fields.
 * Renders an optional label above and an optional error message below.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', id, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-mid-gray font-body"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full rounded-lg bg-dark-navy border px-4 py-2.5 text-sm text-off-white
          placeholder:text-mid-gray font-body
          focus:outline-none focus:ring-2 focus:ring-primary
          transition-colors duration-150
          ${error ? 'border-red-500' : 'border-light-gray/30 hover:border-light-gray/60'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 font-body">{error}</p>
      )}
    </div>
  )
})

export default Input
