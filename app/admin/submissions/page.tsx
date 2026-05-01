'use client'

import { useState, useEffect } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'
import Pagination from '@/components/Pagination'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { Event, EventStatus } from '@/types'

/** Number of submissions shown per page */
const PAGE_SIZE = 10

/** Tab definitions for the submissions filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Proposed', value: 'proposed' },
  { label: 'Approved', value: 'approved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

/** Maps an event status to a badge color */
function statusColor(status: EventStatus): 'green' | 'amber' | 'blue' | 'red' | 'gray' {
  switch (status) {
    case 'approved': return 'green'
    case 'proposed': return 'amber'
    case 'completed': return 'blue'
    case 'cancelled': return 'red'
    default: return 'gray'
  }
}

/** Formats a Date or ISO string to a readable date */
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Skeleton row for loading state */
function SkeletonRow() {
  return (
    <tr className="border-b border-light-gray/20">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-surface-raised rounded animate-pulse" style={{ width: `${50 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  )
}

/**
 * Submissions page for the admin portal.
 * Fetches all events from the API and displays a filterable review table.
 * Includes confirm dialog before approving events and toast feedback.
 */
export default function AdminSubmissionsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [approvingEvent, setApprovingEvent] = useState<Event | null>(null)
  const [approving, setApproving] = useState(false)
  const [page, setPage] = useState(1)

  /** Fetches events from the API, optionally filtered by status */
  async function fetchEvents() {
    setLoading(true)
    try {
      const url =
        activeTab === 'all'
          ? '/api/events'
          : `/api/events?status=${activeTab}`
      const res = await fetch(url)
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Failed to load submissions')
      }

      setEvents(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  // Fetch events whenever the active tab changes
  useEffect(() => {
    setPage(1)
    fetchEvents()
  }, [activeTab])

  // Set up real-time subscription to the events table
  useEffect(() => {
    let subscription: Subscription | null = null

    function setupSubscription() {
      setConnected(false)
      subscription = realtimeService.subscribeToEvents(() => {
        fetchEvents()
      })
      setConnected(true)
    }

    setupSubscription()

    return () => {
      if (subscription) realtimeService.unsubscribe(subscription)
    }
  }, [])

  /** Approves an event after confirmation */
  async function handleConfirmApprove() {
    if (!approvingEvent) return

    try {
      setApproving(true)
      const res = await fetch(`/api/events/${approvingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Failed to approve event')
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === approvingEvent.id ? { ...e, status: 'approved' } : e))
      )
      toast.success(`"${approvingEvent.name}" has been approved.`)
      setApprovingEvent(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve event')
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Page title with connection status */}
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-3xl text-off-white">Submissions</h1>
        <span
          title={connected ? 'Real-time connected' : 'Connecting…'}
          className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            connected ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </div>

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Submissions table */}
      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-surface-raised">
              {['Event Name', 'Date', 'Venue', 'Status', 'Action'].map((col) => (
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
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-mid-gray">
                  No submissions found.
                </td>
              </tr>
            ) : (
              events
                .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                .map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors"
                >
                  <td className="px-5 py-3.5 text-off-white font-medium">{event.name}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{formatDate(event.eventDate)}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{event.location ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      color={statusColor(event.status)}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    {event.status === 'proposed' ? (
                      <button
                        onClick={() => setApprovingEvent(event)}
                        className="text-accent hover:underline font-medium"
                      >
                        Review
                      </button>
                    ) : (
                      <a
                        href={`/admin/submissions/${event.id}`}
                        className="text-accent hover:underline font-medium"
                      >
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={Math.ceil(events.length / PAGE_SIZE)}
        onChange={setPage}
      />

      {/* Confirm approval dialog */}
      {approvingEvent && (
        <ConfirmDialog
          title="Approve Event?"
          message={`Are you sure you want to approve "${approvingEvent.name}"? This will change its status to Approved.`}
          confirmLabel="Approve"
          loading={approving}
          onConfirm={handleConfirmApprove}
          onCancel={() => setApprovingEvent(null)}
        />
      )}
    </div>
  )
}
