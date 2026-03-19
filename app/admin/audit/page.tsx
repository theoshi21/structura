'use client'

import { useState } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'

/** Tab definitions for the audit trail filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Budget', value: 'Budget' },
  { label: 'Events', value: 'Events' },
  { label: 'Documents', value: 'Documents' },
]

type AuditCategory = 'Budget' | 'Events' | 'Documents'
type BadgeColor = 'green' | 'amber' | 'blue'

/** Maps audit category to badge color */
const categoryColor: Record<AuditCategory, BadgeColor> = {
  Budget: 'green',
  Events: 'amber',
  Documents: 'blue',
}

/** Mock audit log entries */
const auditEntries: { action: string; user: string; date: string; time: string; category: AuditCategory }[] = [
  {
    action: 'Allocated ₱50,000 to Computer Science Society',
    user: 'Admin',
    date: 'Mar 10, 2025',
    time: '09:14 AM',
    category: 'Budget',
  },
  {
    action: 'Approved event "Foundation Week 2025"',
    user: 'Admin',
    date: 'Mar 11, 2025',
    time: '10:32 AM',
    category: 'Events',
  },
  {
    action: 'Uploaded permit for "Leadership Summit"',
    user: 'Maria Santos',
    date: 'Mar 12, 2025',
    time: '02:05 PM',
    category: 'Documents',
  },
  {
    action: 'Returned submission for "Acquaintance Party"',
    user: 'Admin',
    date: 'Mar 13, 2025',
    time: '11:48 AM',
    category: 'Events',
  },
  {
    action: 'Allocated ₱40,000 to Business Administration Club',
    user: 'Admin',
    date: 'Mar 14, 2025',
    time: '03:20 PM',
    category: 'Budget',
  },
  {
    action: 'Deleted document "draft-proposal.pdf"',
    user: 'Juan dela Cruz',
    date: 'Mar 15, 2025',
    time: '04:01 PM',
    category: 'Documents',
  },
]

/**
 * Audit Trail page for the admin portal.
 * Displays a filterable log of all system actions with category badges.
 */
export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState('all')

  /** Filter entries by category tab; 'all' shows every entry */
  const filtered =
    activeTab === 'all' ? auditEntries : auditEntries.filter((e) => e.category === activeTab)

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Page title */}
      <h1 className="font-heading text-3xl text-near-black">Audit Trail</h1>

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Log entries */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-mid-gray font-body py-8 text-center">No entries found.</p>
        ) : (
          filtered.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-xl border border-light-gray/30 bg-white px-5 py-4"
            >
              {/* Action + meta */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-near-black font-body">{entry.action}</span>
                <span className="text-xs text-mid-gray font-body">
                  By {entry.user} · {entry.date} · {entry.time}
                </span>
              </div>
              {/* Category badge */}
              <Badge label={entry.category} color={categoryColor[entry.category]} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
