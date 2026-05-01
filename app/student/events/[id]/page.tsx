'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Badge from '@/components/Badge'
import { useToast } from '@/components/Toast'
import { Event, EventStatus } from '@/types'

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

/**
 * Student event detail page.
 * Fetches and displays a single event's full details including
 * name, date, venue, status, description, and metadata.
 */
export default function StudentEventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  /** Fetches the event from the API by ID */
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`)
        const json = await res.json()

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? 'Event not found')
        }

        setEvent(json.data)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load event')
        router.push('/student/events')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchEvent()
  }, [id])

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

      {/* Event details card */}
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

        {/* Divider */}
        <div className="border-t border-light-gray/20" />

        {/* Last updated */}
        <p className="text-xs text-mid-gray font-body">
          Last updated: {formatDate(event.updatedAt)}
        </p>
      </div>
    </div>
  )
}
