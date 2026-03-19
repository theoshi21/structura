'use client'

import { useState } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'

/** Tab definitions for the submissions filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Returned', value: 'Returned' },
  { label: 'Rejected', value: 'Rejected' },
]

/** Mock submission rows */
const submissions = [
  {
    event: 'Foundation Week 2025',
    org: 'Computer Science Society',
    date: 'Mar 15, 2025',
    budget: '₱20,000',
    docs: 4,
    status: 'Pending',
    statusColor: 'amber' as const,
  },
  {
    event: 'Leadership Summit',
    org: 'Business Administration Club',
    date: 'Apr 2, 2025',
    budget: '₱15,000',
    docs: 2,
    status: 'Approved',
    statusColor: 'green' as const,
  },
  {
    event: 'Acquaintance Party',
    org: 'Engineering Society',
    date: 'Apr 20, 2025',
    budget: '₱10,000',
    docs: 1,
    status: 'Returned',
    statusColor: 'red' as const,
  },
  {
    event: 'Year-End Celebration',
    org: 'Computer Science Society',
    date: 'May 30, 2025',
    budget: '₱25,000',
    docs: 3,
    status: 'Rejected',
    statusColor: 'red' as const,
  },
]

/**
 * Submissions page for the admin portal.
 * Displays a filterable table of all event submissions with status badges and review actions.
 */
export default function AdminSubmissionsPage() {
  const [activeTab, setActiveTab] = useState('all')

  /** Filter submissions by active tab; 'all' shows every row */
  const filtered = activeTab === 'all' ? submissions : submissions.filter((s) => s.status === activeTab)

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Page title */}
      <h1 className="font-heading text-3xl text-near-black">Submissions</h1>

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Submissions table */}
      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-white">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-gray-50">
              {['Event Name', 'Organization', 'Date', 'Budget Req.', 'Docs', 'Status', 'Action'].map((col) => (
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-mid-gray">
                  No submissions found.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-near-black font-medium">{row.event}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.org}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.date}</td>
                  <td className="px-5 py-3.5 text-near-black">{row.budget}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={String(row.docs)} color="green" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge label={row.status} color={row.statusColor} />
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href="#"
                      className="text-accent hover:underline font-medium"
                      onClick={(e) => e.preventDefault()}
                    >
                      Review
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
