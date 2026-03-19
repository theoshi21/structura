'use client'

import { useState } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'
import Button from '@/components/Button'

/** Tab definitions for the users filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Organizer', value: 'Organizer' },
  { label: 'Officer', value: 'Officer' },
]

/** Mock user rows */
const users = [
  {
    name: 'Alex Rivera',
    initial: 'A',
    org: 'Computer Science Society',
    role: 'Organizer',
    status: 'Active',
    statusColor: 'green' as const,
  },
  {
    name: 'Maria Santos',
    initial: 'M',
    org: 'Business Administration Club',
    role: 'Officer',
    status: 'Active',
    statusColor: 'green' as const,
  },
  {
    name: 'Juan dela Cruz',
    initial: 'J',
    org: 'Engineering Society',
    role: 'Organizer',
    status: 'Active',
    statusColor: 'green' as const,
  },
  {
    name: 'Sofia Reyes',
    initial: 'S',
    org: 'Computer Science Society',
    role: 'Officer',
    status: 'Active',
    statusColor: 'green' as const,
  },
]

/**
 * User Management page for the admin portal.
 * Displays a filterable table of all users with role and status info.
 */
export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('all')

  /** Filter users by role tab; 'all' shows every row */
  const filtered = activeTab === 'all' ? users : users.filter((u) => u.role === activeTab)

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-near-black">Users</h1>
        <Button variant="primary" size="sm" onClick={() => {}}>
          + Add User
        </Button>
      </div>

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Users table */}
      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-white">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-gray-50">
              {['Name', 'Organization', 'Role', 'Status', 'Action'].map((col) => (
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
                <td colSpan={5} className="px-5 py-8 text-center text-mid-gray">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  {/* Name with avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white font-body">{row.initial}</span>
                      </div>
                      <span className="text-near-black font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.org}</td>
                  <td className="px-5 py-3.5 text-near-black">{row.role}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={row.status} color={row.statusColor} />
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href="#"
                      className="text-accent hover:underline font-medium"
                      onClick={(e) => e.preventDefault()}
                    >
                      Edit
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
