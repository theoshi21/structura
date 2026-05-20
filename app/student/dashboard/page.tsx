'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import ProgressBar from '@/components/ProgressBar'
import { realtimeService } from '@/lib/realtime'
import type { Subscription } from '@/lib/realtime'
import { BudgetSummary, EventStatus } from '@/types'

/** Slim event shape — only what the dashboard renders */
interface DashboardEvent {
  id: string
  name: string
  eventDate: string
  status: EventStatus
}

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

/** Formats a date string to a readable date */
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Student Dashboard page.
 * Uses a single /api/dashboard endpoint to fetch all data in one round trip.
 * Subscribes to real-time event and budget changes so stats refresh automatically.
 */
export default function StudentDashboardPage() {
  const [orgName, setOrgName] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  /** Fetches all dashboard data in a single request */
  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (res.ok && json.success) {
        const d = json.data
        setOrgName(d.orgName ?? null)
        setPendingCount(d.pendingCount)
        setActiveCount(d.activeCount)
        setRecentEvents(d.recentEvents)
        setSummary(d.budget ?? null)
      }
    } catch {
      // Dashboard is best-effort; silently ignore fetch errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Real-time subscriptions — re-fetch on any event or budget change
  useEffect(() => {
    const subscriptions: Subscription[] = []

    setConnected(false)
    subscriptions.push(realtimeService.subscribeToEvents(() => fetchData()))
    realtimeService.subscribeToBudget(() => fetchData()).forEach((s) => subscriptions.push(s))
    setConnected(true)

    return () => subscriptions.forEach((s) => realtimeService.unsubscribe(s))
  }, [])

  const percentUsed = summary && summary.totalFunds > 0
    ? Math.round((summary.allocatedFunds / summary.totalFunds) * 100)
    : 0

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
        <div className="flex flex-col gap-2 rounded-xl bg-dark-navy border border-light-gray/20 p-5">
          <span className="text-2xl">🏢</span>
          <span
            className="text-lg font-bold text-off-white font-body leading-tight truncate"
            title={orgName ?? 'No organization'}
          >
            {loading ? '—' : (orgName ?? '—')}
          </span>
          <span className="text-sm text-mid-gray font-body">Your Organization</span>
        </div>
        <StatCard icon="🕐" value={loading ? '—' : String(pendingCount)} label="Pending Reviews" />
        <StatCard icon="💰" value={loading ? '—' : (summary ? formatPeso(summary.totalFunds) : '—')} label="Total Fund" />
        <StatCard icon="📅" value={loading ? '—' : String(activeCount)} label="Active Events" />
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
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-mid-gray">Loading…</td>
                  </tr>
                ) : recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-mid-gray">No events yet.</td>
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
            {loading ? (
              <p className="text-sm text-mid-gray italic">Loading…</p>
            ) : !summary ? (
              <p className="text-sm text-mid-gray italic">
                No budget has been set for your organization yet. Contact your admin.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Allocated', value: formatPeso(summary.allocatedFunds) },
                    { label: 'Remaining', value: formatPeso(summary.availableFunds) },
                    { label: 'Total', value: formatPeso(summary.totalFunds) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-mid-gray font-body">{label}</span>
                      <span className="text-sm font-semibold text-off-white font-body">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <ProgressBar percent={percentUsed} />
                  <span className="text-xs text-mid-gray font-body">{percentUsed}% of the budget allocated</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
