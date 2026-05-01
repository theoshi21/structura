'use client'

import { useState, useEffect, useRef } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'
import Pagination from '@/components/Pagination'
import { useToast } from '@/components/Toast'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { Event, EventStatus, Document } from '@/types'

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
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

/** Formats bytes to a human-readable size string */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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
 * Review modal — shows full event details and uploaded documents.
 * Admin can approve or reject (cancel) the event from here.
 */
function ReviewModal({
  event,
  onClose,
  onApprove,
  onReject,
  acting,
}: {
  event: Event
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  acting: boolean
}) {
  const toast = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null)

  /** Fetches documents attached to this event */
  useEffect(() => {
    fetch(`/api/events/${event.id}/documents`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setDocuments(json.data)
      })
      .catch(() => {})
      .finally(() => setDocsLoading(false))
  }, [event.id])

  /** Opens a document in a new tab by fetching its URL */
  async function handleViewDoc(docId: string, fileName: string) {
    try {
      const res = await fetch(`/api/documents/${docId}`)
      const json = await res.json()
      if (res.ok && json.success && json.data.url) {
        window.open(json.data.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error('Could not retrieve document URL.')
      }
    } catch {
      toast.error(`Failed to open "${fileName}".`)
    }
  }

  /** Closes modal when clicking the backdrop */
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface border border-light-gray/30 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-light-gray/20 flex-shrink-0">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-xl text-off-white">{event.name}</h2>
            <Badge
              label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              color={statusColor(event.status)}
            />
          </div>
          <button
            onClick={onClose}
            className="text-mid-gray hover:text-off-white transition-colors text-xl leading-none ml-4 flex-shrink-0"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">

          {/* Event details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray">Event Date</span>
              <span className="text-sm text-off-white">{formatDate(event.eventDate)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray">Venue</span>
              <span className="text-sm text-off-white">{event.location ?? '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray">Submitted</span>
              <span className="text-sm text-off-white">{formatDate(event.createdAt)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray">Last Updated</span>
              <span className="text-sm text-off-white">{formatDate(event.updatedAt)}</span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray">Description</span>
              <p className="text-sm text-off-white leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Documents section */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
              Uploaded Documents
            </span>

            {docsLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 bg-surface-raised rounded-lg animate-pulse" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-mid-gray italic">No documents uploaded for this event.</p>
            ) : (
              <div className="rounded-xl border border-light-gray/30 overflow-hidden">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-light-gray/20 bg-surface-raised">
                      {['File Name', 'Type', 'Size', 'Uploaded', ''].map((col) => (
                        <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-light-gray/10 last:border-0 hover:bg-surface-raised transition-colors">
                        <td className="px-4 py-2.5 text-off-white font-medium truncate max-w-[180px]" title={doc.fileName}>
                          {doc.fileName}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-mid-gray capitalize">{doc.documentType}</span>
                        </td>
                        <td className="px-4 py-2.5 text-mid-gray text-xs">{formatSize(doc.fileSize)}</td>
                        <td className="px-4 py-2.5 text-mid-gray text-xs">{formatDate(doc.uploadedAt)}</td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => handleViewDoc(doc.id, doc.fileName)}
                            className="text-accent hover:underline text-xs font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer — action buttons (only shown for proposed events) */}
        {event.status === 'proposed' && (
          <div className="px-6 py-4 border-t border-light-gray/20 flex-shrink-0">
            {confirmAction === null ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-mid-gray">Review the details and documents above before deciding.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmAction('reject')}
                    disabled={acting}
                    className="px-4 py-2 text-sm font-semibold text-red-400 border border-red-400/40 rounded-lg hover:bg-red-400/10 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setConfirmAction('approve')}
                    disabled={acting}
                    className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-off-white">
                  {confirmAction === 'approve'
                    ? `Confirm approval of "${event.name}"?`
                    : `Confirm rejection of "${event.name}"?`}
                </p>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={acting}
                    className="px-4 py-2 text-sm text-mid-gray hover:text-off-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction === 'approve' ? onApprove : onReject}
                    disabled={acting}
                    className={`px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${
                      confirmAction === 'approve'
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {acting
                      ? 'Processing…'
                      : confirmAction === 'approve'
                      ? 'Yes, Approve'
                      : 'Yes, Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Submissions page for the admin portal.
 * Fetches all events and displays a filterable review table.
 * Clicking "Review" opens a modal with full event details, documents, and approve/reject actions.
 */
export default function AdminSubmissionsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [reviewingEvent, setReviewingEvent] = useState<Event | null>(null)
  const [acting, setActing] = useState(false)
  const [page, setPage] = useState(1)

  /** Fetches events from the API, optionally filtered by status */
  async function fetchEvents() {
    setLoading(true)
    try {
      const url = activeTab === 'all' ? '/api/events' : `/api/events?status=${activeTab}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to load submissions')
      setEvents(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setPage(1); fetchEvents() }, [activeTab])

  useEffect(() => {
    let subscription: Subscription | null = null
    subscription = realtimeService.subscribeToEvents(() => fetchEvents())
    setConnected(true)
    return () => { if (subscription) realtimeService.unsubscribe(subscription) }
  }, [])

  /** Updates an event's status to approved or cancelled */
  async function handleStatusChange(eventId: string, newStatus: 'approved' | 'cancelled') {
    setActing(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Action failed')

      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e)))
      const label = newStatus === 'approved' ? 'approved' : 'rejected'
      toast.success(`"${reviewingEvent?.name}" has been ${label}.`)
      setReviewingEvent(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-3xl text-off-white">Submissions</h1>
        <span
          title={connected ? 'Real-time connected' : 'Connecting…'}
          className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${connected ? 'bg-green-500' : 'bg-gray-400'}`}
        />
      </div>

      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Submissions table */}
      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-surface-raised">
              {['Event Name', 'Date', 'Venue', 'Status', 'Action'].map((col) => (
                <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-mid-gray">No submissions found.</td>
              </tr>
            ) : (
              events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((event) => (
                <tr key={event.id} className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors">
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
                    <button
                      onClick={() => setReviewingEvent(event)}
                      className="text-accent hover:underline font-medium"
                    >
                      {event.status === 'proposed' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={Math.ceil(events.length / PAGE_SIZE)}
        onChange={setPage}
      />

      {/* Review modal */}
      {reviewingEvent && (
        <ReviewModal
          event={reviewingEvent}
          onClose={() => setReviewingEvent(null)}
          onApprove={() => handleStatusChange(reviewingEvent.id, 'approved')}
          onReject={() => handleStatusChange(reviewingEvent.id, 'cancelled')}
          acting={acting}
        />
      )}
    </div>
  )
}
