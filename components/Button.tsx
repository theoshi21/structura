'use client'

import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

/** Maps variant names to Tailwind class strings */
const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-accent disabled:opacity-50',
  outline: 'border border-light-gray text-off-white hover:border-accent hover:text-accent disabled:opacity-50',
  ghost: 'text-off-white hover:text-accent disabled:opacity-50',
}

/** Maps size names to Tailwind class strings */
const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
}

/**
 * Reusable button component with primary, outline, and ghost variants.
 * Supports loading state and all native button attributes.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-full font-body font-semibold
        transition-colors duration-150 cursor-pointer
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
