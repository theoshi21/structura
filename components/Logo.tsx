interface LogoProps {
  /** When true, renders the logo in white for dark backgrounds */
  white?: boolean
  className?: string
}

/**
 * Structura logo — SVG hexagon icon alongside the "Structura" wordmark.
 * Use the `white` prop on dark backgrounds (navbar, sidebar, auth pages).
 */
export default function Logo({ white = false, className = '' }: LogoProps) {
  const textColor = white ? 'text-white' : 'text-near-black'
  const iconColor = white ? '#ffffff' : '#4F46E8'
  const wordmarkColor = white ? '#ffffff' : '#0F0F1A'

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Hexagon icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon
          points="14,2 25,8 25,20 14,26 3,20 3,8"
          stroke={iconColor}
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
        <polygon
          points="14,7 21,11 21,17 14,21 7,17 7,11"
          fill={iconColor}
          opacity="0.25"
        />
      </svg>

      {/* Wordmark */}
      <span
        className={`font-heading text-lg leading-none tracking-wide ${textColor}`}
        style={{ color: wordmarkColor }}
      >
        Structura
      </span>
    </div>
  )
}
