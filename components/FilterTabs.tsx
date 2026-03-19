'use client'

interface Tab {
  label: string
  value: string
}

interface FilterTabsProps {
  tabs: Tab[]
  active: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Pill-shaped horizontal tab row for filtering list views.
 * Highlights the active tab with the primary brand color.
 */
export default function FilterTabs({ tabs, active, onChange, className = '' }: FilterTabsProps) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            rounded-full px-4 py-1.5 text-sm font-semibold font-body transition-colors duration-150
            ${
              active === tab.value
                ? 'bg-primary text-white'
                : 'bg-dark-navy border border-light-gray/30 text-mid-gray hover:border-accent hover:text-accent'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
