import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import ProgressBar from '@/components/ProgressBar'

/** Mock submission rows for the "My Submissions" table */
const submissions = [
  { event: 'Foundation Week 2025', date: 'Mar 15, 2025', status: 'Approved', color: 'green' as const },
  { event: 'Leadership Summit', date: 'Apr 2, 2025', status: 'Pending', color: 'amber' as const },
  { event: 'Acquaintance Party', date: 'Apr 20, 2025', status: 'Returned', color: 'red' as const },
]

/**
 * Student Dashboard page.
 * Shows a welcome heading, 4 stat cards, a submissions table, and a budget overview panel.
 */
export default function StudentDashboardPage() {
  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Page heading */}
      <div>
        <h1 className="font-heading text-3xl text-near-black">Welcome Back, Alex!</h1>
        <p className="font-body text-sm text-mid-gray mt-1">
          Here&apos;s what&apos;s happening with your organization.
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏛️" value="1" label="Organizations" />
        <StatCard icon="🕐" value="3" label="Pending Reviews" />
        <StatCard icon="💰" value="₱45,000" label="Total Fund" />
        <StatCard icon="📅" value="2" label="Active Events" />
      </div>

      {/* Bottom two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* My Submissions table */}
        <div className="xl:col-span-2 flex flex-col gap-3">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
            My Submissions
          </span>
          <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-white">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-light-gray/30 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Event
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-light-gray/20 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-near-black font-medium">{row.event}</td>
                    <td className="px-5 py-3.5 text-mid-gray">{row.date}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={row.status} color={row.color} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Overview panel */}
        <div className="flex flex-col gap-3">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
            Budget Overview
          </span>
          <div className="rounded-xl border border-light-gray/30 bg-white p-5 flex flex-col gap-4">
            {/* Budget rows */}
            <div className="flex flex-col gap-3">
              {[
                { label: 'Allocated', value: '₱45,000' },
                { label: 'Spent', value: '₱12,500' },
                { label: 'Remaining', value: '₱32,500' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-mid-gray font-body">{label}</span>
                  <span className="text-sm font-semibold text-near-black font-body">{value}</span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <ProgressBar percent={28} />
              <span className="text-xs text-mid-gray font-body">28% of the budget used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
