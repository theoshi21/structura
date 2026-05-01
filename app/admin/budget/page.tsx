'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import { useToast } from '@/components/Toast'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { BudgetSummary, Allocation } from '@/types'

/** Skeleton row for loading state */
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

/** Formats a number as Philippine Peso */
function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/** Returns a utilization badge color based on percentage */
function utilizationColor(percent: number): 'green' | 'amber' | 'red' {
  if (percent >= 90) return 'red'
  if (percent >= 60) return 'amber'
  return 'green'
}

/**
 * Admin Budget page.
 * Fetches real budget summary and allocations from the API.
 * Subscribes to real-time budget changes so data refreshes automatically.
 */
export default function AdminBudgetPage() {
  const toast = useToast()
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  // Allocate Funds modal state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ eventId: '', amount: '' })
  const [formErrors, setFormErrors] = useState<{ eventId?: string; amount?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  /** Fetches budget summary and all allocations */
  async function fetchData() {
    setLoading(true)
    try {
      const [budgetRes, allocRes] = await Promise.all([
        fetch('/api/budget'),
        fetch('/api/budget/allocations'),
      ])

      const [budgetJson, allocJson] = await Promise.all([budgetRes.json(), allocRes.json()])

      if (!budgetRes.ok || !budgetJson.success) {
        throw new Error(budgetJson.error?.message ?? 'Failed to load budget')
      }
      if (!allocRes.ok || !allocJson.success) {
        throw new Error(allocJson.error?.message ?? 'Failed to load allocations')
      }

      setSummary(budgetJson.data)
      setAllocations(allocJson.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => { fetchData() }, [])

  // Set up real-time subscriptions to budget, allocations, and expenditures tables
  useEffect(() => {
    let subscriptions: Subscription[] = []

    /** Subscribes to all budget-related tables and re-fetches on any change */
    function setupSubscriptions() {
      setConnected(false)
      subscriptions = realtimeService.subscribeToBudget(() => {
        fetchData()
      })
      setConnected(true)
    }

    setupSubscriptions()

    return () => {
      subscriptions.forEach((sub) => realtimeService.unsubscribe(sub))
    }
  }, [])

  /** Validates the allocate funds form; returns true if valid */
  function validateForm(): boolean {
    const errors: { eventId?: string; amount?: string } = {}
    if (!form.eventId.trim()) {
      errors.eventId = 'Event ID is required.'
    }
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) {
      errors.amount = 'Enter a valid amount greater than zero.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  /** Handles the Allocate Funds form submission */
  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)

    try {
      const res = await fetch('/api/budget/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: form.eventId.trim(),
          amount: parseFloat(form.amount),
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Failed to allocate funds')
      }

      toast.success(`₱${parseFloat(form.amount).toLocaleString()} allocated successfully.`)
      setShowModal(false)
      setForm({ eventId: '', amount: '' })
      setFormErrors({})
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to allocate funds')
    } finally {
      setSubmitting(false)
    }
  }

  const percentAllocated = summary
    ? summary.totalFunds > 0
      ? Math.round((summary.allocatedFunds / summary.totalFunds) * 100)
      : 0
    : 0

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar with connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl text-off-white">Budget</h1>
          <span
            title={connected ? 'Real-time connected' : 'Connecting…'}
            className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              connected ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + Allocate Funds
        </Button>
      </div>

      {/* Error state */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-light-gray/30 bg-surface p-5 h-24 animate-pulse" />
            ))}
          </div>
          <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
            <table className="w-full text-sm font-body">
              <tbody>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon="🏛️" value={formatPeso(summary?.totalFunds ?? 0)} label="Total Fund" />
            <StatCard icon="📤" value={formatPeso(summary?.allocatedFunds ?? 0)} label="Allocated" />
            <StatCard icon="💚" value={formatPeso(summary?.availableFunds ?? 0)} label="Remaining" />
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-2">
            <ProgressBar percent={percentAllocated} />
            <span className="text-xs text-mid-gray font-body">{percentAllocated}% of the budget allocated</span>
          </div>

          {/* Per-allocation breakdown */}
          <div className="flex flex-col gap-3">
            <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
              Allocations
            </span>
            <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-light-gray/30 bg-surface-raised">
                    {['Event ID', 'Allocated', 'Allocated By', 'Date', 'Utilization'].map((col) => (
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
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-mid-gray">
                        No allocations yet.
                      </td>
                    </tr>
                  ) : (
                    allocations.map((alloc) => {
                      const pct = summary && summary.totalFunds > 0
                        ? Math.round((alloc.amount / summary.totalFunds) * 100)
                        : 0
                      return (
                        <tr
                          key={alloc.id}
                          className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors"
                        >
                          <td className="px-5 py-3.5 text-off-white font-medium font-mono text-xs">
                            {alloc.eventId}
                          </td>
                          <td className="px-5 py-3.5 text-off-white">{formatPeso(alloc.amount)}</td>
                          <td className="px-5 py-3.5 text-mid-gray">{alloc.allocatedBy ?? '—'}</td>
                          <td className="px-5 py-3.5 text-mid-gray">
                            {new Date(alloc.allocatedAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              label={`${pct}%`}
                              color={utilizationColor(pct)}
                            />
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

      {/* Allocate Funds Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-5">
            <h2 className="font-heading text-xl text-off-white">Allocate Funds</h2>

            <form onSubmit={handleAllocate} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray font-body">
                  Event ID
                </label>
                <input
                  type="text"
                  value={form.eventId}
                  onChange={(e) => {
                    setForm({ ...form, eventId: e.target.value })
                    if (formErrors.eventId) setFormErrors((p) => ({ ...p, eventId: undefined }))
                  }}
                  placeholder="Event UUID"
                  className={`border rounded-lg px-3 py-2 text-sm font-body text-off-white bg-surface-raised focus:outline-none focus:ring-2 focus:ring-accent ${
                    formErrors.eventId ? 'border-red-400' : 'border-light-gray'
                  }`}
                />
                {formErrors.eventId && (
                  <p className="text-xs text-red-500">{formErrors.eventId}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray font-body">
                  Amount (₱)
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => {
                    setForm({ ...form, amount: e.target.value })
                    if (formErrors.amount) setFormErrors((p) => ({ ...p, amount: undefined }))
                  }}
                  placeholder="0.00"
                  className={`border rounded-lg px-3 py-2 text-sm font-body text-off-white bg-surface-raised focus:outline-none focus:ring-2 focus:ring-accent ${
                    formErrors.amount ? 'border-red-400' : 'border-light-gray'
                  }`}
                />
                {formErrors.amount && (
                  <p className="text-xs text-red-500">{formErrors.amount}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowModal(false)
                    setFormErrors({})
                    setForm({ eventId: '', amount: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={submitting}>
                  {submitting ? 'Allocating…' : 'Allocate Funds'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
