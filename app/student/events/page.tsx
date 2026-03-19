'use client'

import { useState } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'

/** Tab definitions for the events filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Returned', value: 'Returned' },
  { label: 'Completed', value: 'Completed' },
]

/** Mock event rows */
const events = [
  {
    name: 'Foundation Week 2025',
    date: 'Mar 15, 2025',
    venue: 'Main Auditorium',
    budget: '₱20,000',
    status: 'Approved',
    color: 'green' as const,
  },
  {
    name: 'Leadership Summit',
    date: 'Apr 2, 2025',
    venue: 'Conference Room B',
    budget: '₱15,000',
    status: 'Pending',
    color: 'amber' as const,
  },
  {
    name: 'Acquaintance Party',
    date: 'Apr 20, 2025',
    venue: 'Covered Court',
    budget: '₱10,000',
    status: 'Returned',
    color: 'red' as const,
  },
  {
    name: 'Year-End Celebration',
    date: 'May 30, 2025',
    venue: 'Function Hall',
    budget: '₱25,000',
    status: 'Completed',
    color: 'blue' as const,
  },
]

/**
 * My Events page for the student portal.
 * Displays a filterable table of the student's events with status badges.
 */
export default function StudentEventsPage() {
  const [activeTab, setActiveTab] = useState('all')

  /** Filter events by active tab; 'all' shows every row */
  const filtered = activeTab === 'all' ? events : events.filter((e) => e.status === activeTab)

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Page title */}
      <h1 className="font-heading text-3xl text-near-black">My Events</h1>

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Events table */}
      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-white">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-gray-50">
              {['Event Name', 'Date', 'Venue', 'Budget Req.', 'Status', 'Action'].map((col) => (
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
                <td colSpan={6} className="px-5 py-8 text-center text-mid-gray">
                  No events found.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-near-black font-medium">{row.name}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.date}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.venue}</td>
                  <td className="px-5 py-3.5 text-near-black">{row.budget}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={row.status} color={row.color} />
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
