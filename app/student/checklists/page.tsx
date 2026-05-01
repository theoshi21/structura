'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/Button'
import ProgressBar from '@/components/ProgressBar'
import Badge from '@/components/Badge'
import { Checklist, ChecklistItem } from '@/types'

/** Formats a completion count as "X/Y done" */
function doneLabel(items: ChecklistItem[]): string {
  const done = items.filter((i) => i.isCompleted).length
  return `${done}/${items.length} done`
}

/** Calculates completion percentage for a checklist */
function completionPercent(items: ChecklistItem[]): number {
  if (items.length === 0) return 0
  const done = items.filter((i) => i.isCompleted).length
  return Math.round((done / items.length) * 100)
}

/** Badge color based on completion percentage */
function progressColor(percent: number): 'green' | 'amber' | 'red' {
  if (percent === 100) return 'green'
  if (percent >= 50) return 'amber'
  return 'red'
}

interface ChecklistCardProps {
  checklist: Checklist
  eventName: string
  onToggle: (itemId: string) => Promise<void>
}

/**
 * Populated checklist card showing event name, progress badge, progress bar, and items.
 */
function ChecklistCard({ checklist, eventName, onToggle }: ChecklistCardProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const percent = completionPercent(items)

  /** Toggles a checklist item's completion status via the API */
  async function handleToggle(itemId: string) {
    setTogglingId(itemId)
    try {
      await onToggle(itemId)
      // Optimistically update local state
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isCompleted: !item.isCompleted,
                completedAt: !item.isCompleted ? new Date() : null,
              }
            : item
        )
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-light-gray/30 bg-surface p-5 flex flex-col gap-4">
      {/* Card header */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-body font-semibold text-off-white text-sm truncate">{eventName}</span>
        <Badge label={doneLabel(items)} color={progressColor(percent)} />
      </div>

      {/* Progress bar */}
      <ProgressBar percent={percent} showLabel />

      {/* Checklist items */}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={togglingId === item.id}
              onClick={() => handleToggle(item.id)}
              aria-label={item.isCompleted ? `Uncheck: ${item.description}` : `Check: ${item.description}`}
              className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border text-xs transition-colors
                ${item.isCompleted
                  ? 'bg-primary border-primary text-white'
                  : 'border-light-gray/50 bg-surface hover:border-accent'
                }
                ${togglingId === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {item.isCompleted ? '✓' : ''}
            </button>
            <span
              className={`text-sm font-body ${item.isCompleted ? 'line-through text-mid-gray' : 'text-off-white'}`}
            >
              {item.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Empty placeholder checklist card with dashed border styling.
 */
function EmptyChecklistCard() {
  return (
    <div className="rounded-xl border-2 border-dashed border-light-gray/40 bg-surface p-5 flex items-center justify-center min-h-[180px]">
      <span className="text-sm font-body text-mid-gray">No checklist yet</span>
    </div>
  )
}

interface NewChecklistModalProps {
  events: { id: string; name: string }[]
  onClose: () => void
  onCreated: () => void
}

/**
 * Modal for creating a new checklist for an event.
 * Allows entering a comma-separated list of items.
 */
function NewChecklistModal({ events, onClose, onCreated }: NewChecklistModalProps) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [itemsText, setItemsText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Submits the new checklist to the API */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEventId) {
      setError('Please select an event.')
      return
    }

    const items = itemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/events/${selectedEventId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Failed to create checklist')
      }

      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checklist')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-checklist-title"
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <h2 id="new-checklist-title" className="font-heading text-xl text-off-white">
          New Checklist
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Event selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-select" className="text-xs font-semibold text-mid-gray uppercase tracking-wide">
              Event
            </label>
            <select
              id="event-select"
              className="rounded-lg border border-light-gray/50 px-3 py-2 text-sm font-body text-off-white bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.length === 0 && <option value="">No events available</option>}
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>

          {/* Items textarea */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="items-input" className="text-xs font-semibold text-mid-gray uppercase tracking-wide">
              Checklist Items (one per line)
            </label>
            <textarea
              id="items-input"
              rows={6}
              placeholder={"Secure venue booking\nSubmit event proposal\nFinalize program flow"}
              className="rounded-lg border border-light-gray/50 px-3 py-2 text-sm font-body text-off-white bg-surface focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting || !selectedEventId}>
              {submitting ? 'Creating…' : 'Create Checklist'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Checklists page for the student portal.
 * Fetches real checklists from the API, enables "+ New Checklist", and wires checkbox toggles.
 */
export default function StudentChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [eventNames, setEventNames] = useState<Record<string, string>>({})
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  /** Fetches all events and their checklists */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const eventsRes = await fetch('/api/events')
      const eventsJson = await eventsRes.json()

      if (!eventsRes.ok || !eventsJson.success) {
        throw new Error(eventsJson.error?.message ?? 'Failed to load events')
      }

      const fetchedEvents: { id: string; name: string }[] = eventsJson.data
      setEvents(fetchedEvents)

      const nameMap: Record<string, string> = {}
      fetchedEvents.forEach((ev) => { nameMap[ev.id] = ev.name })
      setEventNames(nameMap)

      // Fetch checklists for each event in parallel
      const checklistResults = await Promise.all(
        fetchedEvents.map(async (ev) => {
          try {
            const res = await fetch(`/api/events/${ev.id}/checklist`)
            const json = await res.json()
            if (res.ok && json.success && json.data) return json.data as Checklist
            return null
          } catch {
            return null
          }
        })
      )

      setChecklists(checklistResults.filter((c): c is Checklist => c !== null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checklists')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /** Calls the toggle API for a checklist item */
  async function handleToggle(itemId: string) {
    const res = await fetch(`/api/checklists/items/${itemId}`, { method: 'PATCH' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message ?? 'Failed to update item')
    }
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-off-white">Checklists</h1>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + New Checklist
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-16 text-mid-gray font-body">Loading checklists…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              eventName={eventNames[checklist.eventId] ?? 'Unknown Event'}
              onToggle={handleToggle}
            />
          ))}

          {/* Fill remaining slots with empty placeholders (show at least 2 empty cards) */}
          {Array.from({ length: Math.max(0, 2 - checklists.length) }).map((_, i) => (
            <EmptyChecklistCard key={`empty-${i}`} />
          ))}
        </div>
      )}

      {/* New Checklist modal */}
      {showModal && (
        <NewChecklistModal
          events={events}
          onClose={() => setShowModal(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  )
}
