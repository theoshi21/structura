'use client'

import { useState, useEffect, useCallback } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'
import { AuditEntry } from '@/types'

/** Tab definitions for the audit trail filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Budget', value: 'budget' },
  { label: 'Events', value: 'event' },
  { label: 'Documents', value: 'document' },
]

type BadgeColor = 'green' | 'amber' | 'blue' | 'red'

/** Maps entity type to badge label */
const entityTypeLabel: Record<string, string> = {
  budget: 'Budget',
  event: 'Events',
  document: 'Documents',
  user: 'Users',
  checklist: 'Checklists',
}

/** Maps entity type to badge color */
const entityTypeColor: Record<string, BadgeColor> = {
  budget: 'green',
  event: 'amber',
  document: 'blue',
  user: 'red',
  checklist: 'blue',
}

/** Maps action type to a human-readable description */
function formatAction(entry: AuditEntry): string {
  const details = entry.details ?? {}
  switch (entry.action) {
    case 'funds_allocated':
      return `Allocated ₱${Number(details.amount ?? 0).toLocaleString()} to event`
    case 'expenditure_recorded':
      return `Recorded expenditure of ₱${Number(details.amount ?? 0).toLocaleString()}`
    case 'event_created':
      return `Created event "${details.name ?? entry.entityId}"`
    case 'event_updated':
      return `Updated event`
    case 'event_status_changed':
      return `Changed event status from "${details.oldStatus}" to "${details.newStatus}"`
    case 'event_deleted':
      return `Deleted event`
    case 'document_uploaded':
      return `Uploaded document "${details.fileName ?? 'file'}"`
    case 'document_deleted':
      return `Deleted document "${details.fileName ?? 'file'}"`
    case 'user_created':
      return `Created user account "${details.username ?? entry.entityId}"`
    case 'user_role_updated':
      return `Changed user role from "${details.oldRole}" to "${details.newRole}"`
    case 'checklist_created':
      return `Created checklist for event`
    case 'checklist_item_completed':
      return `Completed checklist item`
    default:
      return (entry.action as string).replace(/_/g, ' ')
  }
}

/** Formats a Date to a readable date string */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/** Formats a Date to a readable time string */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Audit Trail page for the admin portal.
 * Fetches real audit entries from the API and displays them with category filter tabs.
 */
export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Fetches audit entries from the API, optionally filtered by entity type */
  const fetchEntries = useCallback(async (entityType?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url =
        entityType && entityType !== 'all'
          ? `/api/audit?entityType=${entityType}`
          : '/api/audit'
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Failed to load audit trail')
      }
      // Rehydrate Date objects from JSON strings
      const hydrated: AuditEntry[] = json.data.map((e: AuditEntry) => ({
        ...e,
        createdAt: new Date(e.createdAt),
      }))
      setEntries(hydrated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  /** Re-fetch whenever the active tab changes */
  useEffect(() => {
    fetchEntries(activeTab === 'all' ? undefined : activeTab)
  }, [activeTab, fetchEntries])

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Page title */}
      <h1 className="font-heading text-3xl text-off-white">Audit Trail</h1>

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Log entries */}
      <div className="flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-mid-gray font-body py-8 text-center">
            Loading audit trail…
          </p>
        ) : error ? (
          <p className="text-sm text-red-500 font-body py-8 text-center">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-mid-gray font-body py-8 text-center">No entries found.</p>
        ) : (
          entries.map((entry) => {
            const badgeLabel = entityTypeLabel[entry.entityType] ?? entry.entityType
            const badgeColor: BadgeColor = entityTypeColor[entry.entityType] ?? 'blue'
            const createdAt = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt)

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-light-gray/30 bg-surface px-5 py-4"
              >
                {/* Action + meta */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold text-off-white font-body">
                    {formatAction(entry)}
                  </span>
                  <span className="text-xs text-mid-gray font-body">
                    By {entry.userId ?? 'System'} · {formatDate(createdAt)} · {formatTime(createdAt)}
                  </span>
                </div>
                {/* Category badge */}
                <Badge label={badgeLabel} color={badgeColor} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
