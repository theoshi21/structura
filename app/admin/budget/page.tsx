'use client'

import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import Badge from '@/components/Badge'
import Button from '@/components/Button'

/** Mock per-organization budget rows */
const orgBudgets = [
  {
    org: 'Computer Science Society',
    allocated: '₱50,000',
    spent: '₱32,000',
    remaining: '₱18,000',
    utilization: '64%',
    utilizationColor: 'amber' as const,
  },
  {
    org: 'Business Administration Club',
    allocated: '₱40,000',
    spent: '₱15,000',
    remaining: '₱25,000',
    utilization: '38%',
    utilizationColor: 'green' as const,
  },
  {
    org: 'Engineering Society',
    allocated: '₱30,000',
    spent: '₱28,500',
    remaining: '₱1,500',
    utilization: '95%',
    utilizationColor: 'red' as const,
  },
  {
    org: 'Nursing Students Association',
    allocated: '₱14,000',
    spent: '₱4,200',
    remaining: '₱9,800',
    utilization: '30%',
    utilizationColor: 'green' as const,
  },
]

/**
 * Admin Budget page.
 * Shows stat cards, a full-width progress bar, and a per-organization budget breakdown table.
 */
export default function AdminBudgetPage() {
  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-near-black">Budget</h1>
        <Button variant="primary" size="sm" onClick={() => {}}>
          + Allocate Funds
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="🏛️" value="₱200,000" label="Total Fund" />
        <StatCard icon="📤" value="₱134,000" label="Allocated" />
        <StatCard icon="💚" value="₱66,000" label="Remaining" />
      </div>

      {/* Full-width progress bar */}
      <div className="flex flex-col gap-2">
        <ProgressBar percent={67} />
        <span className="text-xs text-mid-gray font-body">67% of the budget used</span>
      </div>

      {/* Per-organization breakdown */}
      <div className="flex flex-col gap-3">
        <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
          Per Organization
        </span>
        <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-white">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-light-gray/30 bg-gray-50">
                {['Organization', 'Allocated', 'Spent', 'Remaining', 'Utilization'].map((col) => (
                  <th
                    key={col}
                    className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgBudgets.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-near-black font-medium">{row.org}</td>
                  <td className="px-5 py-3.5 text-near-black">{row.allocated}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.spent}</td>
                  <td className="px-5 py-3.5 text-near-black">{row.remaining}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={row.utilization} color={row.utilizationColor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
