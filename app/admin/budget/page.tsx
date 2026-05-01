'use client'

import { useState, useEffect } from 'react'
import ProgressBar from '@/components/ProgressBar'
import { useToast } from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { Allocation, Event } from '@/types'

/** Formats a number as Philippine Peso */
function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/** Formats a Date or ISO string to a readable date */
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface OrgBudget {
  id: string
  organizationId: string
  organizationName: string
  totalFunds: number
  updatedAt: Date
}

interface OrgSummary {
  organizationId: string
  organizationName: string
  totalFunds: number
  allocatedFunds: number
  availableFunds: number
}

/**
 * Admin Budget page — per-organization model.
 *
 * Layout:
 * - Top: list of all organizations with their budget, a "Set Budget" button per org
 * - Per org: expandable allocations table with Edit / Remove per row
 * - "+ Allocate Funds" opens a modal with event dropdown scoped to that org
 */
export default function AdminBudgetPage() {
  const toast = useToast()
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [summaries, setSummaries] = useState<OrgSummary[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  // Which org's allocations are expanded
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null)

  // Set Budget modal
  const [budgetModal, setBudgetModal] = useState<{ orgId: string; orgName: string; current: number } | null>(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [budgetError, setBudgetError] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  // Allocate / Edit modal
  const [allocModal, setAllocModal] = useState<{ orgId: string; orgName: string; editing: Allocation | null } | null>(null)
  const [allocEventId, setAllocEventId] = useState('')
  const [allocAmount, setAllocAmount] = useState('')
  const [allocErrors, setAllocErrors] = useState<{ event?: string; amount?: string }>({})
  const [submittingAlloc, setSubmittingAlloc] = useState(false)

  // Remove confirmation
  const [removingAlloc, setRemovingAlloc] = useState<Allocation | null>(null)
  const [removing, setRemoving] = useState(false)

  /** Fetches all orgs, their budget summaries, allocations, and approved events */
  async function fetchData() {
    setLoading(true)
    try {
      const [orgsRes, allocRes, eventsRes] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/budget/allocations'),
        fetch('/api/events?status=approved'),
      ])
      const [orgsJson, allocJson, eventsJson] = await Promise.all([
        orgsRes.json(), allocRes.json(), eventsRes.json(),
      ])

      const orgList: { id: string; name: string }[] = orgsRes.ok && orgsJson.success ? orgsJson.data : []
      setOrgs(orgList)
      if (allocRes.ok && allocJson.success) setAllocations(allocJson.data)
      if (eventsRes.ok && eventsJson.success) setEvents(eventsJson.data)

      // Fetch budget summary for each org in parallel
      if (orgList.length > 0) {
        const summaryResults = await Promise.all(
          orgList.map((org) =>
            fetch(`/api/budget?orgId=${org.id}`)
              .then((r) => r.json())
              .then((j) => j.success ? j.data as OrgSummary : null)
              .catch(() => null)
          )
        )
        setSummaries(summaryResults.filter(Boolean) as OrgSummary[])
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

  // ── Set Budget ──────────────────────────────────────────────────────────────

  function openBudgetModal(org: { id: string; name: string }) {
    const current = summaries.find((s) => s.organizationId === org.id)?.totalFunds ?? 0
    setBudgetModal({ orgId: org.id, orgName: org.name, current })
    setBudgetInput(String(current))
    setBudgetError('')
  }

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault()
    if (!budgetModal) return
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val < 0) { setBudgetError('Enter a valid amount (0 or more).'); return }

    const allocated = summaries.find((s) => s.organizationId === budgetModal.orgId)?.allocatedFunds ?? 0
    if (val < allocated) {
      setBudgetError(`Cannot set below already-allocated amount (${formatPeso(allocated)}).`)
      return
    }

    setSavingBudget(true)
    try {
      const res = await fetch('/api/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: budgetModal.orgId, totalFunds: val }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to update budget')
      toast.success(`Budget for ${budgetModal.orgName} set to ${formatPeso(val)}.`)
      setBudgetModal(null)
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update budget')
    } finally {
      setSavingBudget(false)
    }
  }

  // ── Allocate / Edit ─────────────────────────────────────────────────────────

  function openNewAlloc(org: { id: string; name: string }) {
    setAllocModal({ orgId: org.id, orgName: org.name, editing: null })
    setAllocEventId('')
    setAllocAmount('')
    setAllocErrors({})
  }

  function openEditAlloc(alloc: Allocation) {
    const org = orgs.find((o) => o.id === alloc.organizationId)
    if (!org) return
    setAllocModal({ orgId: org.id, orgName: org.name, editing: alloc })
    setAllocEventId(alloc.eventId)
    setAllocAmount(String(alloc.amount))
    setAllocErrors({})
  }

  async function handleSubmitAlloc(e: React.FormEvent) {
    e.preventDefault()
    if (!allocModal) return
    const errors: { event?: string; amount?: string } = {}
    if (!allocEventId) errors.event = 'Please select an event.'
    const amt = parseFloat(allocAmount)
    if (isNaN(amt) || amt <= 0) errors.amount = 'Enter a valid amount greater than zero.'
    if (Object.keys(errors).length > 0) { setAllocErrors(errors); return }

    setSubmittingAlloc(true)
    try {
      let res: Response
      if (allocModal.editing) {
        res = await fetch(`/api/budget/allocations/${allocEventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amt }),
        })
      } else {
        res = await fetch('/api/budget/allocations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: allocEventId, organizationId: allocModal.orgId, amount: amt }),
        })
      }
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to save allocation')
      toast.success(allocModal.editing ? 'Allocation updated.' : `${formatPeso(amt)} allocated.`)
      setAllocModal(null)
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save allocation')
    } finally {
      setSubmittingAlloc(false)
    }
  }

  // ── Remove ──────────────────────────────────────────────────────────────────

  async function handleConfirmRemove() {
    if (!removingAlloc) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/budget/allocations/${removingAlloc.eventId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to remove allocation')
      toast.success('Allocation removed.')
      setRemovingAlloc(null)
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove allocation')
    } finally {
      setRemoving(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const eventNameMap = new Map(events.map((e) => [e.id, e.name]))
  const allocatedEventIds = new Set(allocations.map((a) => a.eventId))

  /** Events approved and not yet allocated, scoped to a specific org */
  function unallocatedEventsForOrg(orgId: string) {
    // We don't have org on events yet in the UI — show all unallocated approved events
    return events.filter((e) => !allocatedEventIds.has(e.id))
  }

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
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-light-gray/30 bg-surface p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="rounded-xl border border-light-gray/30 bg-surface p-8 text-center text-mid-gray">
          No organizations yet. Create organizations in the Users tab first.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orgs.map((org) => {
            const summary = summaries.find((s) => s.organizationId === org.id)
            const orgAllocs = allocations.filter((a) => a.organizationId === org.id)
            const isExpanded = expandedOrgId === org.id
            const pct = summary && summary.totalFunds > 0
              ? Math.round((summary.allocatedFunds / summary.totalFunds) * 100)
              : 0

            return (
              <div key={org.id} className="rounded-xl border border-light-gray/30 bg-surface overflow-hidden">
                {/* Org header row */}
                <div className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-heading text-lg text-off-white truncate">{org.name}</span>
                    <div className="flex items-center gap-4 text-sm text-mid-gray">
                      <span>Total: <span className="text-off-white font-semibold">{formatPeso(summary?.totalFunds ?? 0)}</span></span>
                      <span>Allocated: <span className="text-off-white font-semibold">{formatPeso(summary?.allocatedFunds ?? 0)}</span></span>
                      <span>Available: <span className="text-green-400 font-semibold">{formatPeso(summary?.availableFunds ?? 0)}</span></span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 max-w-xs">
                        <ProgressBar percent={pct} />
                      </div>
                      <span className="text-xs text-mid-gray">{pct}% allocated</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openBudgetModal(org)}
                      className="px-3 py-1.5 text-xs font-semibold border border-light-gray/40 text-off-white rounded-lg hover:bg-surface-raised transition-colors"
                    >
                      Set Budget
                    </button>
                    <button
                      onClick={() => openNewAlloc(org)}
                      disabled={unallocatedEventsForOrg(org.id).length === 0}
                      title={unallocatedEventsForOrg(org.id).length === 0 ? 'No approved events without an allocation' : undefined}
                      className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      + Allocate
                    </button>
                    <button
                      onClick={() => setExpandedOrgId(isExpanded ? null : org.id)}
                      className="px-3 py-1.5 text-xs text-mid-gray hover:text-off-white transition-colors"
                    >
                      {isExpanded ? 'Hide ▲' : `Allocations (${orgAllocs.length}) ▼`}
                    </button>
                  </div>
                </div>

                {/* Allocations table — shown when expanded */}
                {isExpanded && (
                  <div className="border-t border-light-gray/20">
                    <table className="w-full text-sm font-body">
                      <thead>
                        <tr className="border-b border-light-gray/20 bg-surface-raised">
                          {['Event', 'Allocated', 'Date', 'Actions'].map((col) => (
                            <th key={col} className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orgAllocs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-6 text-center text-mid-gray text-sm">
                              No allocations for this organization yet.
                            </td>
                          </tr>
                        ) : (
                          orgAllocs.map((alloc) => (
                            <tr key={alloc.id} className="border-b border-light-gray/10 last:border-0 hover:bg-surface-raised transition-colors">
                              <td className="px-5 py-3 text-off-white font-medium">
                                {eventNameMap.get(alloc.eventId) ?? alloc.eventId}
                              </td>
                              <td className="px-5 py-3 text-off-white">{formatPeso(alloc.amount)}</td>
                              <td className="px-5 py-3 text-mid-gray">{formatDate(alloc.allocatedAt)}</td>
                              <td className="px-5 py-3">
                                <div className="flex gap-3">
                                  <button onClick={() => openEditAlloc(alloc)} className="text-accent hover:underline text-sm font-medium">Edit</button>
                                  <button onClick={() => setRemovingAlloc(alloc)} className="text-red-400 hover:underline text-sm font-medium">Remove</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Set Budget Modal ─────────────────────────────────────────────────── */}
      {budgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-light-gray/30 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-light-gray/20">
              <div>
                <h2 className="font-heading text-xl text-off-white">Set Budget</h2>
                <p className="text-xs text-mid-gray mt-0.5">{budgetModal.orgName}</p>
              </div>
              <button onClick={() => setBudgetModal(null)} className="text-mid-gray hover:text-off-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSaveBudget}>
              <div className="px-6 py-5 flex flex-col gap-4">
                <p className="text-sm text-mid-gray">
                  Set the total budget allocated to this organization for the semester/period.
                </p>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Total Budget (₱) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={budgetInput}
                    onChange={(e) => { setBudgetInput(e.target.value); setBudgetError('') }}
                    placeholder="e.g. 100000"
                    autoFocus
                    className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${budgetError ? 'border-red-400' : 'border-light-gray/30'}`}
                  />
                  {budgetError && <p className="text-xs text-red-400">{budgetError}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-light-gray/20">
                <button type="button" onClick={() => setBudgetModal(null)} className="px-4 py-2 text-sm text-mid-gray hover:text-off-white transition-colors">Cancel</button>
                <button type="submit" disabled={savingBudget} className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {savingBudget ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Allocate / Edit Modal ────────────────────────────────────────────── */}
      {allocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-light-gray/30 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-light-gray/20">
              <div>
                <h2 className="font-heading text-xl text-off-white">
                  {allocModal.editing ? 'Edit Allocation' : 'Allocate Funds'}
                </h2>
                <p className="text-xs text-mid-gray mt-0.5">{allocModal.orgName}</p>
              </div>
              <button onClick={() => setAllocModal(null)} className="text-mid-gray hover:text-off-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSubmitAlloc}>
              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Available funds hint */}
                {(() => {
                  const s = summaries.find((x) => x.organizationId === allocModal.orgId)
                  return s ? (
                    <div className="rounded-lg bg-surface-raised border border-light-gray/20 px-4 py-3 text-sm">
                      <span className="text-mid-gray">Available for {allocModal.orgName}: </span>
                      <span className="text-off-white font-semibold">{formatPeso(s.availableFunds)}</span>
                    </div>
                  ) : null
                })()}

                {/* Event dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Event <span className="text-red-400">*</span>
                  </label>
                  {allocModal.editing ? (
                    <div className="w-full bg-surface-raised border border-light-gray/30 rounded-lg px-4 py-2.5 text-sm text-mid-gray">
                      {eventNameMap.get(allocModal.editing.eventId) ?? allocModal.editing.eventId}
                    </div>
                  ) : (
                    <select
                      value={allocEventId}
                      onChange={(e) => { setAllocEventId(e.target.value); setAllocErrors((p) => ({ ...p, event: undefined })) }}
                      className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${allocErrors.event ? 'border-red-400' : 'border-light-gray/30'}`}
                    >
                      <option value="">Select an approved event…</option>
                      {unallocatedEventsForOrg(allocModal.orgId).map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                  )}
                  {allocErrors.event && <p className="text-xs text-red-400">{allocErrors.event}</p>}
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
                    value={allocAmount}
                    onChange={(e) => { setAllocAmount(e.target.value); setAllocErrors((p) => ({ ...p, amount: undefined })) }}
                    placeholder="0.00"
                    className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${allocErrors.amount ? 'border-red-400' : 'border-light-gray/30'}`}
                  />
                  {allocErrors.amount && <p className="text-xs text-red-400">{allocErrors.amount}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-light-gray/20">
                <button type="button" onClick={() => setAllocModal(null)} className="px-4 py-2 text-sm text-mid-gray hover:text-off-white transition-colors">Cancel</button>
                <button type="submit" disabled={submittingAlloc} className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {submittingAlloc ? 'Saving…' : allocModal.editing ? 'Update' : 'Allocate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Remove Confirmation ──────────────────────────────────────────────── */}
      {removingAlloc && (
        <ConfirmDialog
          title="Remove Allocation?"
          message={`This will remove the ${formatPeso(removingAlloc.amount)} allocation for "${eventNameMap.get(removingAlloc.eventId) ?? removingAlloc.eventId}" and return the funds to the organization's available budget.`}
          confirmLabel="Remove"
          loading={removing}
          onConfirm={handleConfirmRemove}
          onCancel={() => setRemovingAlloc(null)}
        />
      )}
    </div>
  )
}
