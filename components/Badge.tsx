type BadgeColor = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'teal' | 'gray'

interface BadgeProps {
  label: string
  color?: BadgeColor
  className?: string
}

/** Maps color names to Tailwind background + text class pairs */
const colorClasses: Record<BadgeColor, string> = {
  green: 'bg-green-500/15 text-green-400',
  amber: 'bg-amber-500/15 text-amber-400',
  red: 'bg-red-500/15 text-red-400',
  blue: 'bg-blue-500/15 text-blue-400',
  purple: 'bg-primary/15 text-accent',
  teal: 'bg-teal-500/15 text-teal-400',
  gray: 'bg-light-gray/15 text-mid-gray',
}

/**
 * Pill-shaped badge/status indicator.
 * Accepts a label string and a semantic color name.
 */
export default function Badge({ label, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5
        text-xs font-semibold font-body uppercase tracking-wide
        ${colorClasses[color]}
        ${className}
      `}
    >
      {label}
    </span>
  )
}
