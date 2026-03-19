'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

/**
 * Reusable select/dropdown component.
 * Renders an optional label, a native <select>, and an optional error message.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className = '', id, ...props },
  ref
) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold uppercase tracking-wider text-mid-gray font-body"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full appearance-none rounded-lg bg-dark-navy border px-4 py-2.5 pr-10
            text-sm text-off-white font-body
            focus:outline-none focus:ring-2 focus:ring-primary
            transition-colors duration-150
            ${error ? 'border-red-500' : 'border-light-gray/30 hover:border-light-gray/60'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Dropdown arrow indicator */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mid-gray text-xs">
          ▼
        </span>
      </div>
      {error && (
        <p className="text-xs text-red-400 font-body">{error}</p>
      )}
    </div>
  )
})

export default Select
