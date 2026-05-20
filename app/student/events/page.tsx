'use client'

import { useState, useEffect, useRef } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'
import Pagination from '@/components/Pagination'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { Event, EventStatus, Role } from '@/types'

/** Number of events shown per page */
const PAGE_SIZE = 10

/** Tab definitions for the events filter */
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

/** Modal for proposing a new event */
function ProposeEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    eventDate: '',
    location: '',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Focus the first field when the modal opens
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  /** Validates the form and returns true if valid */
  function validate(): boolean {
    const next: Partial<typeof form> = {}
    if (!form.name.trim()) next.name = 'Event name is required'
    if (!form.eventDate) next.eventDate = 'Event date is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  /** Submits the new event proposal to the API */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          eventDate: form.eventDate,
          location: form.location.trim() || undefined,
        }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Failed to create event')
      }

      toast.success('Event proposal submitted successfully')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  /** Closes the modal when clicking the backdrop */
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface border border-light-gray/30 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-light-gray/20">
          <h2 className="font-heading text-xl text-off-white">Propose New Event</h2>
          <button
            onClick={onClose}
            className="text-mid-gray hover:text-off-white transition-colors text-xl leading-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Event Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                Event Name <span className="text-red-400">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Annual General Assembly"
                className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white placeholder-mid-gray/60 outline-none focus:ring-2 focus:ring-accent/50 transition ${
                  errors.name ? 'border-red-400' : 'border-light-gray/30'
                }`}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the event (optional)"
                rows={3}
                className="w-full bg-surface-raised border border-light-gray/30 rounded-lg px-4 py-2.5 text-sm text-off-white placeholder-mid-gray/60 outline-none focus:ring-2 focus:ring-accent/50 transition resize-none"
              />
            </div>

            {/* Date + Location side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                  Event Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                  className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${
                    errors.eventDate ? 'border-red-400' : 'border-light-gray/30'
                  }`}
                />
                {errors.eventDate && <p className="text-xs text-red-400">{errors.eventDate}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Main Auditorium"
                  className="w-full bg-surface-raised border border-light-gray/30 rounded-lg px-4 py-2.5 text-sm text-off-white placeholder-mid-gray/60 outline-none focus:ring-2 focus:ring-accent/50 transition"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-light-gray/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-mid-gray hover:text-off-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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
 * My Events page for the student portal.
 * Fetches real events from the API and displays a filterable table.
 * Subscribes to real-time event changes so the list updates automatically.
 */
export default function StudentEventsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [userRole, setUserRole] = useState<Role | null>(null)

  // Delete confirmation
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)

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
        throw new Error(json.error?.message ?? 'Failed to load events')
      }

      setEvents(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  // Reset to page 1 when tab changes
  useEffect(() => {
    setPage(1)
    fetchEvents()
  }, [activeTab])

  // Fetch the current user's role once on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => { if (json.success) setUserRole(json.data.role) })
      .catch(() => {})
  }, [])

  // Set up real-time subscription to the events table
  useEffect(() => {
    let subscription: Subscription | null = null

    /** Subscribes to the events table and re-fetches on any change */
    function setupSubscription() {
      setConnected(false)
      subscription = realtimeService.subscribeToEvents(() => {
        // Re-fetch the full list when any event changes
        fetchEvents()
      })
      setConnected(true)
    }

    setupSubscription()

    return () => {
      if (subscription) {
        realtimeService.unsubscribe(subscription)
      }
    }
  }, [])

  /** Sends the DELETE request and refreshes the list on success */
  async function handleDeleteEvent() {
    if (!deletingEvent) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${deletingEvent.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to delete event')
      toast.success(`"${deletingEvent.name}" has been deleted.`)
      setDeletingEvent(null)
      await fetchEvents()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Page title with connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl text-off-white">My Events</h1>
          <span
            title={connected ? 'Real-time connected' : 'Connecting…'}
            className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              connected ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Propose Event
        </button>
      </div>

      {/* Create event modal */}
      {showModal && (
        <ProposeEventModal
          onClose={() => setShowModal(false)}
          onCreated={fetchEvents}
        />
      )}

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Events table */}
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
                  No events found.
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
                    <div className="flex items-center gap-3">
                      <a
                        href={`/student/events/${event.id}`}
                        className="text-accent hover:underline font-medium"
                      >
                        View
                      </a>
                      {event.status === 'proposed' && userRole === 'organizer' && (
                        <button
                          onClick={() => setDeletingEvent(event)}
                          className="text-red-400 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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

      {/* Delete confirmation */}
      {deletingEvent && (
        <ConfirmDialog
          title="Delete Event?"
          message={`"${deletingEvent.name}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          loading={deleting}
          onConfirm={handleDeleteEvent}
          onCancel={() => setDeletingEvent(null)}
        />
      )}
    </div>
  )
}
