'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Badge from '@/components/Badge'
import { useToast } from '@/components/Toast'
import { Event, EventStatus, Role } from '@/types'

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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Converts a Date or ISO string to a yyyy-mm-dd string for <input type="date"> */
function toDateInputValue(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0]
}

/**
 * Student event detail page.
 * Displays full event details. Organizers can edit proposed events inline.
 */
export default function StudentEventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<Role | null>(null)

  // Edit mode state
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', eventDate: '', location: '' })
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({})
  const [saving, setSaving] = useState(false)

  /** Fetches the event and current user role in parallel */
  useEffect(() => {
    async function fetchData() {
      try {
        const [eventRes, meRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch('/api/auth/me'),
        ])
        const [eventJson, meJson] = await Promise.all([eventRes.json(), meRes.json()])

        if (!eventRes.ok || !eventJson.success) {
          throw new Error(eventJson.error?.message ?? 'Event not found')
        }

        setEvent(eventJson.data)
        if (meRes.ok && meJson.success) setUserRole(meJson.data.role)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load event')
        router.push('/student/events')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  /** Enters edit mode, pre-filling the form with current event values */
  function startEditing() {
    if (!event) return
    setForm({
      name: event.name,
      description: event.description ?? '',
      eventDate: toDateInputValue(event.eventDate),
      location: event.location ?? '',
    })
    setFormErrors({})
    setEditing(true)
  }

  /** Validates the edit form, returns true if valid */
  function validate(): boolean {
    const errors: Partial<typeof form> = {}
    if (!form.name.trim()) errors.name = 'Event name is required.'
    if (!form.eventDate) errors.eventDate = 'Event date is required.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  /** Submits the PATCH request with updated event fields */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !event) return

    setSaving(true)
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          eventDate: form.eventDate,
          location: form.location.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to update event')

      setEvent(json.data)
      setEditing(false)
      toast.success('Event updated successfully.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  // Only organizers can edit, and only proposed events are editable
  const canEdit = userRole === 'organizer' && event?.status === 'proposed'

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-raised rounded animate-pulse" />
        <div className="rounded-xl border border-light-gray/30 bg-surface p-6 flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 bg-surface-raised rounded animate-pulse" style={{ width: `${40 + i * 12}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="p-8 flex flex-col gap-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/student/events"
        className="inline-flex items-center gap-1.5 text-sm text-mid-gray hover:text-off-white transition-colors font-body"
      >
        ← Back to My Events
      </Link>

      {/* Page title + status badge */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-heading text-3xl text-off-white">{event.name}</h1>
        <Badge
          label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          color={statusColor(event.status)}
        />
      </div>

      {/* ── Read-only view ─────────────────────────────────────────────────── */}
      {!editing ? (
        <div className="rounded-xl border border-light-gray/30 bg-surface p-6 flex flex-col gap-5">
          {/* Description */}
          {event.description && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray font-body">
                Description
              </span>
              <p className="text-sm text-off-white font-body leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Two-column detail grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray font-body">
                Event Date
              </span>
              <span className="text-sm text-off-white font-body">{formatDate(event.eventDate)}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray font-body">
                Venue / Location
              </span>
              <span className="text-sm text-off-white font-body">{event.location ?? '—'}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray font-body">
                Status
              </span>
              <Badge
                label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                color={statusColor(event.status)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray font-body">
                Submitted
              </span>
              <span className="text-sm text-off-white font-body">{formatDate(event.createdAt)}</span>
            </div>
          </div>

          <div className="border-t border-light-gray/20" />

          {/* Footer: last updated + edit button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-mid-gray font-body">
              Last updated: {formatDate(event.updatedAt)}
            </p>
            {canEdit && (
              <button
                onClick={startEditing}
                className="px-4 py-2 text-sm font-semibold border border-light-gray/40 text-off-white rounded-lg hover:bg-surface-raised transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── Edit form ──────────────────────────────────────────────────────── */
        <form onSubmit={handleSave} noValidate className="rounded-xl border border-light-gray/30 bg-surface p-6 flex flex-col gap-5">
          {/* Event Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
              Event Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormErrors((p) => ({ ...p, name: '' })) }}
              className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${formErrors.name ? 'border-red-400' : 'border-light-gray/30'}`}
            />
            {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-surface-raised border border-light-gray/30 rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition resize-none"
            />
          </div>

          {/* Date + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                Event Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => { setForm((f) => ({ ...f, eventDate: e.target.value })); setFormErrors((p) => ({ ...p, eventDate: '' })) }}
                className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${formErrors.eventDate ? 'border-red-400' : 'border-light-gray/30'}`}
              />
              {formErrors.eventDate && <p className="text-xs text-red-400">{formErrors.eventDate}</p>}
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
                className="w-full bg-surface-raised border border-light-gray/30 rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition"
              />
            </div>
          </div>

          <div className="border-t border-light-gray/20" />

          {/* Form actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="px-4 py-2 text-sm text-mid-gray hover:text-off-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
