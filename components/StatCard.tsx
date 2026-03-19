interface StatCardProps {
  icon: string
  value: string | number
  label: string
  className?: string
}

/**
 * Stat card displaying an emoji icon, a large numeric value, and a descriptive label.
 * Used on dashboard pages for key metrics.
 */
export default function StatCard({ icon, value, label, className = '' }: StatCardProps) {
  return (
    <div
      className={`
        flex flex-col gap-2 rounded-xl bg-dark-navy border border-light-gray/20 p-5
        ${className}
      `}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-2xl font-bold text-off-white font-body">{value}</span>
      <span className="text-sm text-mid-gray font-body">{label}</span>
    </div>
  )
}
