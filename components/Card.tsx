import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/**
 * Base card container with dark navy background, rounded corners, and a subtle border.
 * Accepts all standard div attributes for flexibility.
 */
export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-dark-navy border border-light-gray/20 p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
