'use client'

import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'

/** Mock pending approval rows for the "Pending Approvals" table */
const pendingApprovals = [
  { event: 'Foundation Week 2025', org: 'Computer Science Society', submitted: 'Mar 10, 2025' },
  { event: 'Leadership Summit', org: 'Business Administration Club', submitted: 'Mar 12, 2025' },
  { event: 'Acquaintance Party', org: 'Engineering Society', submitted: 'Mar 14, 2025' },
]

/**
 * Admin Dashboard page.
 * Shows an overview heading, 4 stat cards, a pending approvals table, and a fund allocation panel.
 */
export default function AdminDashboardPage() {
  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Page heading */}
      <div>
        <h1 className="font-heading text-3xl text-near-black">Admin Overview</h1>
        <p className="font-body text-sm text-mid-gray mt-1">
          Here&apos;s a summary of your organization&apos;s activity.
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏛️" value="4" label="Organizations" />
        <StatCard icon="🕐" value="3" label="Pending Reviews" />
        <StatCard icon="💰" value="₱200,000" label="Total Fund" />
        <StatCard icon="📅" value="5" label="Active Events" />
      </div>

      {/* Bottom two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending Approvals table */}
        <div className="xl:col-span-2 flex flex-col gap-3">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
            Pending Approvals
          </span>
          <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-white">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-light-gray/30 bg-gray-50">
                  {['Event', 'Org', 'Submitted', 'Action'].map((col) => (
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
                {pendingApprovals.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-light-gray/20 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-near-black font-medium">{row.event}</td>
                    <td className="px-5 py-3.5 text-mid-gray">{row.org}</td>
                    <td className="px-5 py-3.5 text-mid-gray">{row.submitted}</td>
                    <td className="px-5 py-3.5">
                      <a
                        href="#"
                        className="text-accent hover:underline font-medium"
                        onClick={(e) => e.preventDefault()}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fund Allocation panel */}
        <div className="flex flex-col gap-3">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
            Fund Allocation
          </span>
          <div className="rounded-xl border border-light-gray/30 bg-white p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {[
                { label: 'Total Fund', value: '₱200,000' },
                { label: 'Allocated', value: '₱134,000' },
                { label: 'Remaining', value: '₱66,000' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-mid-gray font-body">{label}</span>
                  <span className="text-sm font-semibold text-near-black font-body">{value}</span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <ProgressBar percent={67} />
              <span className="text-xs text-mid-gray font-body">67% allocated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
