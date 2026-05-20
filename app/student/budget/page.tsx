'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import Badge from '@/components/Badge'
import { useToast } from '@/components/Toast'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { Expenditure, Event, Document } from '@/types'

interface OrgSummary {
  organizationId: string
  organizationName: string
  totalFunds: number
  allocatedFunds: number
  availableFunds: number
}

interface EventAllocation {
  eventId: string
  eventName: string
  allocated: number
  spent: number
  remaining: number
}

/** Formats a number as Philippine Peso */
function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/** Formats a Date or ISO string to a readable date */
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Skeleton row */
function SkeletonRow() {
  return (
    <tr className="border-b border-light-gray/20">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-surface-raised rounded animate-pulse" style={{ width: `${50 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  )
}

/**
 * Budget page for the student portal.
 * Shows the org's budget summary, per-event allocation breakdown, and expenditures.
 * Officers can record expenditures against their org's allocated events.
 */
export default function StudentBudgetPage() {
  const toast = useToast()
  const [summary, setSummary] = useState<OrgSummary | null>(null)
  const [eventAllocations, setEventAllocations] = useState<EventAllocation[]>([])
  const [expenditures, setExpenditures] = useState<Expenditure[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  // Add Expense modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ eventId: '', amount: '', description: '', documentId: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  /** Fetches all budget data for the current user's organization */
  async function fetchData() {
    setLoading(true)
    try {
      const [budgetRes, expRes, eventsRes] = await Promise.all([
        fetch('/api/budget'),
        fetch('/api/budget/expenditures'),
        fetch('/api/events'),
      ])
      const [budgetJson, expJson, eventsJson] = await Promise.all([
        budgetRes.json(), expRes.json(), eventsRes.json(),
      ])

      if (budgetRes.ok && budgetJson.success) setSummary(budgetJson.data)
      if (expRes.ok && expJson.success) setExpenditures(expJson.data)

      if (eventsRes.ok && eventsJson.success) {
        const allEvents: Event[] = eventsJson.data
        setEvents(allEvents)

        // Build per-event allocation breakdown
        if (budgetJson.success && budgetJson.data?.organizationId) {
          const allocRes = await fetch(`/api/budget/allocations?orgId=${budgetJson.data.organizationId}`)
          const allocJson = await allocRes.json()
          if (allocRes.ok && allocJson.success) {
            const allocs = allocJson.data
            const breakdown: EventAllocation[] = await Promise.all(
              allocs.map(async (alloc: { event_id?: string; eventId?: string; amount: number }) => {
                const ev = allEvents.find((e) => e.id === alloc.event_id || e.id === alloc.eventId)
                const expForEvent = expJson.success
                  ? expJson.data.filter((x: Expenditure) => x.eventId === (alloc.event_id ?? alloc.eventId))
                  : []
                const spent = expForEvent.reduce((s: number, x: Expenditure) => s + x.amount, 0)
                return {
                  eventId: alloc.event_id ?? alloc.eventId,
                  eventName: ev?.name ?? 'Unknown Event',
                  allocated: Number(alloc.amount),
                  spent,
                  remaining: Number(alloc.amount) - spent,
                }
              })
            )
            setEventAllocations(breakdown)
          }
        }
      }

      // Fetch documents for the event dropdown in the expense modal
      if (eventsJson.success && eventsJson.data.length > 0) {
        const firstEventId = eventsJson.data[0].id
        const docsRes = await fetch(`/api/events/${firstEventId}/documents`)
        const docsJson = await docsRes.json()
        if (docsRes.ok && docsJson.success) setDocuments(docsJson.data)
      }
    } catch {
      toast.error('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let subs: Subscription[] = []
    subs = realtimeService.subscribeToBudget(() => fetchData())
    setConnected(true)
    return () => subs.forEach((s) => realtimeService.unsubscribe(s))
  }, [])

  // When event selection changes in the modal, load that event's documents
  async function loadDocsForEvent(eventId: string) {
    if (!eventId) { setDocuments([]); return }
    try {
      const res = await fetch(`/api/events/${eventId}/documents`)
      const json = await res.json()
      if (res.ok && json.success) setDocuments(json.data)
    } catch { setDocuments([]) }
  }

  /** Validates and submits the add expense form */
  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!form.eventId) errors.eventId = 'Please select an event.'
    if (!form.description.trim()) errors.description = 'Description is required.'
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) errors.amount = 'Enter a valid amount greater than zero.'
    if (!form.documentId) errors.documentId = 'Please select a supporting document.'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/budget/expenditures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: form.eventId,
          amount: amt,
          description: form.description.trim(),
          documentId: form.documentId,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to record expense')
      toast.success(`Expense "${form.description}" recorded.`)
      setShowModal(false)
      setForm({ eventId: '', amount: '', description: '', documentId: '' })
      setFormErrors({})
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record expense')
    } finally {
      setSubmitting(false)
    }
  }

  const percentUsed = summary && summary.totalFunds > 0
    ? Math.round((summary.allocatedFunds / summary.totalFunds) * 100)
    : 0

  // Only events that have an allocation (can record expenses against them)
  const allocatedEventIds = new Set(eventAllocations.map((a) => a.eventId))
  const allocatedEvents = events.filter((e) => allocatedEventIds.has(e.id))

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl text-off-white">Budget</h1>
          <span
            title={connected ? 'Real-time connected' : 'Connecting…'}
            className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${connected ? 'bg-green-500' : 'bg-gray-400'}`}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={loading || allocatedEvents.length === 0}
          title={!loading && allocatedEvents.length === 0 ? 'No events with budget allocations yet' : undefined}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Add Expense
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-light-gray/30 bg-surface p-5 h-24 animate-pulse" />
            ))}
          </div>
        </div>
      ) : !summary ? (
        <div className="rounded-xl border border-light-gray/30 bg-surface p-8 text-center text-mid-gray">
          Your organization does not have a budget set yet. Contact your admin.
        </div>
      ) : (
        <>
          {/* Org name + stat cards */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-mid-gray">{summary.organizationName}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon="🏛️" value={formatPeso(summary.totalFunds)} label="Total Budget" />
            <StatCard icon="📤" value={formatPeso(summary.allocatedFunds)} label="Allocated to Events" />
            <StatCard icon="💚" value={formatPeso(summary.availableFunds)} label="Unallocated" />
          </div>

          <div className="flex flex-col gap-2">
            <ProgressBar percent={percentUsed} />
            <span className="text-xs text-mid-gray font-body">{percentUsed}% of the budget allocated to events</span>
          </div>

          {/* Per-event breakdown */}
          {eventAllocations.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
                Per-Event Breakdown
              </span>
              <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-light-gray/30 bg-surface-raised">
                      {['Event', 'Allocated', 'Spent', 'Remaining', 'Usage'].map((col) => (
                        <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eventAllocations.map((ea) => {
                      const usagePct = ea.allocated > 0 ? Math.round((ea.spent / ea.allocated) * 100) : 0
                      return (
                        <tr key={ea.eventId} className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors">
                          <td className="px-5 py-3.5 text-off-white font-medium">{ea.eventName}</td>
                          <td className="px-5 py-3.5 text-off-white">{formatPeso(ea.allocated)}</td>
                          <td className="px-5 py-3.5 text-mid-gray">{formatPeso(ea.spent)}</td>
                          <td className="px-5 py-3.5 text-green-400 font-semibold">{formatPeso(ea.remaining)}</td>
                          <td className="px-5 py-3.5">
                            <Badge
                              label={`${usagePct}%`}
                              color={usagePct >= 90 ? 'red' : usagePct >= 60 ? 'amber' : 'green'}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenditures table */}
          <div className="flex flex-col gap-3">
            <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
              Expenditures
            </span>
            <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-light-gray/30 bg-surface-raised">
                    {['Description', 'Event', 'Date', 'Amount', 'Receipt'].map((col) => (
                      <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenditures.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-mid-gray">No expenditures recorded yet.</td>
                    </tr>
                  ) : (
                    expenditures.map((exp) => {
                      const eventName = events.find((e) => e.id === exp.eventId)?.name ?? exp.eventId
                      return (
                        <tr key={exp.id} className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors">
                          <td className="px-5 py-3.5 text-off-white font-medium">{exp.description}</td>
                          <td className="px-5 py-3.5 text-mid-gray">{eventName}</td>
                          <td className="px-5 py-3.5 text-mid-gray">{formatDate(exp.recordedAt)}</td>
                          <td className="px-5 py-3.5 text-off-white font-semibold">{formatPeso(exp.amount)}</td>
                          <td className="px-5 py-3.5">
                            <Badge label={exp.documentId ? 'Attached' : 'Missing'} color={exp.documentId ? 'green' : 'red'} />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Add Expense Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-light-gray/30 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-light-gray/20">
              <h2 className="font-heading text-xl text-off-white">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-mid-gray hover:text-off-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAddExpense} noValidate>
              <div className="px-6 py-5 flex flex-col gap-4">

                {/* Event dropdown — only events with allocations */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Event <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.eventId}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, eventId: e.target.value, documentId: '' }))
                      setFormErrors((p) => ({ ...p, eventId: '' }))
                      loadDocsForEvent(e.target.value)
                    }}
                    className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${formErrors.eventId ? 'border-red-400' : 'border-light-gray/30'}`}
                  >
                    <option value="">Select an event…</option>
                    {allocatedEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                  {formErrors.eventId && <p className="text-xs text-red-400">{formErrors.eventId}</p>}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setFormErrors((p) => ({ ...p, description: '' })) }}
                    placeholder="e.g. Venue Rental"
                    className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${formErrors.description ? 'border-red-400' : 'border-light-gray/30'}`}
                  />
                  {formErrors.description && <p className="text-xs text-red-400">{formErrors.description}</p>}
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Amount (₱) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => { setForm((f) => ({ ...f, amount: e.target.value })); setFormErrors((p) => ({ ...p, amount: '' })) }}
                    placeholder="0.00"
                    className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${formErrors.amount ? 'border-red-400' : 'border-light-gray/30'}`}
                  />
                  {formErrors.amount && <p className="text-xs text-red-400">{formErrors.amount}</p>}
                </div>

                {/* Supporting document dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Supporting Document <span className="text-red-400">*</span>
                  </label>
                  {!form.eventId ? (
                    <div className="w-full bg-surface-raised border border-light-gray/30 rounded-lg px-4 py-2.5 text-sm text-mid-gray italic">
                      Select an event first
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="w-full bg-surface-raised border border-amber-400/30 rounded-lg px-4 py-2.5 text-sm text-amber-400">
                      No documents uploaded for this event yet
                    </div>
                  ) : (
                    <select
                      value={form.documentId}
                      onChange={(e) => { setForm((f) => ({ ...f, documentId: e.target.value })); setFormErrors((p) => ({ ...p, documentId: '' })) }}
                      className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${formErrors.documentId ? 'border-red-400' : 'border-light-gray/30'}`}
                    >
                      <option value="">Select a document…</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.fileName} ({doc.documentType})</option>
                      ))}
                    </select>
                  )}
                  {formErrors.documentId && <p className="text-xs text-red-400">{formErrors.documentId}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-light-gray/20">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-mid-gray hover:text-off-white transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving…' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
