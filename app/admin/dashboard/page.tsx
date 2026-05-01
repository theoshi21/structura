'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { Event, BudgetSummary } from '@/types'

/** Formats a number as Philippine Peso */
function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/** Formats a Date or ISO string to a readable date */
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Admin Dashboard page.
 * Shows an overview heading, stat cards, a pending approvals table, and a fund allocation panel.
 * Subscribes to real-time event and budget changes so stats refresh automatically.
 */
export default function AdminDashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [orgCount, setOrgCount] = useState<number | null>(null)

  /** Fetches events and budget summary from the API */
  async function fetchData() {
    setLoading(true)
    try {
      const [eventsRes, budgetRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/budget'),
      ])

      const [eventsJson, budgetJson] = await Promise.all([
        eventsRes.json(),
        budgetRes.json(),
      ])

      if (eventsRes.ok && eventsJson.success) {
        setEvents(eventsJson.data)
      }
      if (budgetRes.ok && budgetJson.success) {
        setSummary(budgetJson.data)
      }
    } catch {
      // Dashboard is best-effort; silently ignore fetch errors
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => { fetchData() }, [])

  // Fetch distinct organization count from registered organizer users
  useEffect(() => {
    fetch('/api/users?role=organizer')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          // Count unique non-null organization names
          const names = new Set(
            (json.data as { organizationName: string | null }[])
              .map((u) => u.organizationName)
              .filter(Boolean)
          )
          setOrgCount(names.size)
        }
      })
      .catch(() => {})
  }, [])

  // Set up real-time subscriptions to events and budget tables
  useEffect(() => {
    const subscriptions: Subscription[] = []

    /** Subscribes to events and budget tables and re-fetches on any change */
    function setupSubscriptions() {
      setConnected(false)

      // Subscribe to events table
      subscriptions.push(
        realtimeService.subscribeToEvents(() => { fetchData() })
      )

      // Subscribe to budget-related tables
      const budgetSubs = realtimeService.subscribeToBudget(() => { fetchData() })
      subscriptions.push(...budgetSubs)

      setConnected(true)
    }

    setupSubscriptions()

    return () => {
      subscriptions.forEach((sub) => realtimeService.unsubscribe(sub))
    }
  }, [])

  // Derived stats
  const pendingCount = events.filter((e) => e.status === 'proposed').length
  const activeCount = events.filter((e) => e.status === 'approved').length
  const percentAllocated = summary && summary.totalFunds > 0
    ? Math.round((summary.allocatedFunds / summary.totalFunds) * 100)
    : 0

  // Show proposed events in the pending approvals table
  const pendingEvents = events.filter((e) => e.status === 'proposed').slice(0, 5)

  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Page heading with connection status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl text-off-white">Admin Overview</h1>
          <p className="font-body text-sm text-mid-gray mt-1">
            Here&apos;s a summary of your organization&apos;s activity.
          </p>
        </div>
        <span
          title={connected ? 'Real-time connected' : 'Connecting…'}
          className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2 ${
            connected ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏛️" value={orgCount !== null ? String(orgCount) : '—'} label="Organizations" />
        <StatCard icon="🕐" value={String(pendingCount)} label="Pending Reviews" />
        <StatCard icon="💰" value={formatPeso(summary?.totalFunds ?? 0)} label="Total Fund" />
        <StatCard icon="📅" value={String(activeCount)} label="Active Events" />
      </div>

      {/* Bottom two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending Approvals table */}
        <div className="xl:col-span-2 flex flex-col gap-3">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
            Pending Approvals
          </span>
          <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-light-gray/30 bg-surface-raised">
                  {['Event', 'Date', 'Submitted', 'Action'].map((col) => (
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
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-mid-gray">
                      Loading…
                    </td>
                  </tr>
                ) : pendingEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-mid-gray">
                      No pending approvals.
                    </td>
                  </tr>
                ) : (
                  pendingEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors"
                    >
                      <td className="px-5 py-3.5 text-off-white font-medium">{event.name}</td>
                      <td className="px-5 py-3.5 text-mid-gray">{formatDate(event.eventDate)}</td>
                      <td className="px-5 py-3.5 text-mid-gray">{formatDate(event.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <a
                          href={`/admin/submissions`}
                          className="text-accent hover:underline font-medium"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fund Allocation panel */}
        <div className="flex flex-col gap-3">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
            Fund Allocation
          </span>
          <div className="rounded-xl border border-light-gray/30 bg-surface p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {[
                { label: 'Total Fund', value: formatPeso(summary?.totalFunds ?? 0) },
                { label: 'Allocated', value: formatPeso(summary?.allocatedFunds ?? 0) },
                { label: 'Remaining', value: formatPeso(summary?.availableFunds ?? 0) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-mid-gray font-body">{label}</span>
                  <span className="text-sm font-semibold text-off-white font-body">{value}</span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <ProgressBar percent={percentAllocated} />
              <span className="text-xs text-mid-gray font-body">{percentAllocated}% allocated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
