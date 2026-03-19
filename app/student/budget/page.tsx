'use client'

import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import Badge from '@/components/Badge'
import Button from '@/components/Button'

/** Mock expenditure rows */
const expenditures = [
  {
    description: 'Venue Rental',
    event: 'Foundation Week 2025',
    date: 'Mar 5, 2025',
    amount: '₱8,000',
    receipt: 'Attached',
    receiptColor: 'green' as const,
  },
  {
    description: 'Catering Services',
    event: 'Foundation Week 2025',
    date: 'Mar 10, 2025',
    amount: '₱3,500',
    receipt: 'Attached',
    receiptColor: 'green' as const,
  },
  {
    description: 'Printing Materials',
    event: 'Leadership Summit',
    date: 'Mar 15, 2025',
    amount: '₱750',
    receipt: 'Missing',
    receiptColor: 'red' as const,
  },
  {
    description: 'Sound System Rental',
    event: 'Acquaintance Party',
    date: 'Mar 18, 2025',
    amount: '₱250',
    receipt: 'Attached',
    receiptColor: 'green' as const,
  },
]

/**
 * Budget page for the student portal.
 * Shows stat cards, a full-width progress bar, and an expenditures table.
 */
export default function StudentBudgetPage() {
  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-near-black">Budget</h1>
        <Button variant="primary" size="sm" onClick={() => {}}>
          + Add Expense
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="💰" value="₱45,000" label="Allocated" />
        <StatCard icon="📤" value="₱12,500" label="Spent" />
        <StatCard icon="💚" value="₱32,500" label="Remaining" />
      </div>

      {/* Full-width progress bar */}
      <div className="flex flex-col gap-2">
        <ProgressBar percent={28} />
        <span className="text-xs text-mid-gray font-body">28% of the budget used</span>
      </div>

      {/* Expenditures section */}
      <div className="flex flex-col gap-3">
        <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
          Expenditures
        </span>
        <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-white">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-light-gray/30 bg-gray-50">
                {['Description', 'Event', 'Date', 'Amount', 'Receipt'].map((col) => (
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
              {expenditures.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-near-black font-medium">{row.description}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.event}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.date}</td>
                  <td className="px-5 py-3.5 text-near-black font-semibold">{row.amount}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={row.receipt} color={row.receiptColor} />
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
