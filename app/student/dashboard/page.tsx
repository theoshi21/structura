'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import ProgressBar from '@/components/ProgressBar'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { Event, BudgetSummary } from '@/types'
/** Formats a number as Philippine Peso */
function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/** Maps an event status to a badge color */
function statusColor(status: string): 'green' | 'amber' | 'blue' | 'red' | 'gray' {
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

/**
 * Student Dashboard page.
 * Shows a welcome heading, stat cards, a submissions table, and a budget overview panel.
 * Subscribes to real-time event and budget changes so stats refresh automatically.
 */
export default function StudentDashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [orgName, setOrgName] = useState<string | null>(null)

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

  // Fetch the current user's organization name
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setOrgName(json.data.organizationName ?? null)
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
  const percentUsed = summary && summary.totalFunds > 0
    ? Math.round((summary.allocatedFunds / summary.totalFunds) * 100)
    : 0

  // Show the 5 most recent events as "submissions"
  const recentEvents = events.slice(0, 5)

  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Page heading with connection status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl text-off-white">Welcome Back!</h1>
          <p className="font-body text-sm text-mid-gray mt-1">
            Here&apos;s what&apos;s happening with your organization.
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
        {/* Organization card — shows the user's own org name */}
        <div className="flex flex-col gap-2 rounded-xl bg-dark-navy border border-light-gray/20 p-5">
          <span className="text-2xl">🏢</span>
          <span
            className="text-lg font-bold text-off-white font-body leading-tight truncate"
            title={orgName ?? 'No organization'}
          >
            {orgName ?? '—'}
          </span>
          <span className="text-sm text-mid-gray font-body">Your Organization</span>
        </div>
        <StatCard icon="🕐" value={String(pendingCount)} label="Pending Reviews" />
        <StatCard icon="💰" value={formatPeso(summary?.totalFunds ?? 0)} label="Total Fund" />
        <StatCard icon="📅" value={String(activeCount)} label="Active Events" />
      </div>

      {/* Bottom two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* My Submissions table */}
        <div className="xl:col-span-2 flex flex-col gap-3">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
            My Submissions
          </span>
          <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-light-gray/30 bg-surface-raised">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Event
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-mid-gray">
                      Loading…
                    </td>
                  </tr>
                ) : recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-mid-gray">
                      No events yet.
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors"
                    >
                      <td className="px-5 py-3.5 text-off-white font-medium">{event.name}</td>
                      <td className="px-5 py-3.5 text-mid-gray">{formatDate(event.eventDate)}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          color={statusColor(event.status)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Overview panel */}
        <div className="flex flex-col gap-3">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-mid-gray">
            Budget Overview
          </span>
          <div className="rounded-xl border border-light-gray/30 bg-surface p-5 flex flex-col gap-4">
            {/* Budget rows */}
            <div className="flex flex-col gap-3">
              {[
                { label: 'Allocated', value: formatPeso(summary?.allocatedFunds ?? 0) },
                { label: 'Remaining', value: formatPeso(summary?.availableFunds ?? 0) },
                { label: 'Total', value: formatPeso(summary?.totalFunds ?? 0) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-mid-gray font-body">{label}</span>
                  <span className="text-sm font-semibold text-off-white font-body">{value}</span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <ProgressBar percent={percentUsed} />
              <span className="text-xs text-mid-gray font-body">{percentUsed}% of the budget allocated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
