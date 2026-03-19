interface ProgressBarProps {
  /** Value between 0 and 100 */
  percent: number
  className?: string
  showLabel?: boolean
}

/**
 * Horizontal progress bar filled with the primary brand color.
 * Accepts a percent value (0–100) and an optional inline label.
 */
export default function ProgressBar({ percent, className = '', showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2 rounded-full bg-light-gray/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-mid-gray font-body whitespace-nowrap">{clamped}%</span>
      )}
    </div>
  )
}
