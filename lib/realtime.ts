// RealtimeService — Supabase real-time subscriptions
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5

import { createSupabaseClientPublic } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Event, Budget } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Payload delivered by Supabase real-time on INSERT / UPDATE / DELETE.
 */
export interface RealtimePayload {
  /** The type of database change */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  /** The new row data (null on DELETE) */
  new: Record<string, unknown>
  /** The old row data (null on INSERT) */
  old: Record<string, unknown>
  /** The table that changed */
  table: string
  /** The database schema */
  schema: string
}

/**
 * A handle returned by every subscribe call.
 * Pass it to `unsubscribe()` to clean up the channel.
 */
export type Subscription = RealtimeChannel

// ─── RealtimeService ─────────────────────────────────────────────────────────

/**
 * Manages Supabase real-time subscriptions for the Structura application.
 * Uses the public (anon-key) Supabase client so it works safely in the browser.
 *
 * Usage:
 *   const sub = realtimeService.subscribeToEvents((event) => { ... })
 *   // later:
 *   realtimeService.unsubscribe(sub)
 */
class RealtimeService {
  /**
   * Subscribes to all INSERT, UPDATE, and DELETE changes on a given table.
   * Returns a Supabase channel that can be passed to `unsubscribe()`.
   *
   * @param table    - The Supabase table name to watch (e.g. 'events')
   * @param callback - Called with the change payload whenever the table changes
   * @returns A Subscription (RealtimeChannel) handle
   */
  subscribeToTable(
    table: string,
    callback: (payload: RealtimePayload) => void
  ): Subscription {
    const supabase = createSupabaseClientPublic()

    const channel = supabase
      .channel(`table-changes:${table}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          callback({
            eventType: payload.eventType as RealtimePayload['eventType'],
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
            table: payload.table,
            schema: payload.schema,
          })
        }
      )
      .subscribe()

    return channel
  }

  /**
   * Removes a previously created subscription and releases the channel.
   * Always call this in a useEffect cleanup to avoid memory leaks.
   *
   * @param subscription - The Subscription handle returned by a subscribe call
   */
  unsubscribe(subscription: Subscription): void {
    const supabase = createSupabaseClientPublic()
    supabase.removeChannel(subscription)
  }

  /**
   * Subscribes to all changes on the `events` table.
   * Calls `onUpdate` with the raw payload whenever any event row changes.
   * Use this to trigger a re-fetch of the events list in the UI.
   *
   * @param onUpdate - Callback invoked with the change payload
   * @returns A Subscription handle to pass to `unsubscribe()`
   */
  subscribeToEvents(onUpdate: (payload: RealtimePayload) => void): Subscription {
    return this.subscribeToTable('events', onUpdate)
  }

  /**
   * Subscribes to changes on a specific event row by its ID.
   * Calls `onUpdate` with the raw payload when that event changes.
   *
   * @param eventId  - The UUID of the event to watch
   * @param onUpdate - Callback invoked with the change payload
   * @returns A Subscription handle to pass to `unsubscribe()`
   */
  subscribeToEvent(
    eventId: string,
    onUpdate: (payload: RealtimePayload) => void
  ): Subscription {
    const supabase = createSupabaseClientPublic()

    const channel = supabase
      .channel(`event:${eventId}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        (payload) => {
          onUpdate({
            eventType: payload.eventType as RealtimePayload['eventType'],
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
            table: payload.table,
            schema: payload.schema,
          })
        }
      )
      .subscribe()

    return channel
  }

  /**
   * Subscribes to budget-related table changes: `budget`, `allocations`, and `expenditures`.
   * Calls `onUpdate` with the payload whenever any of these tables change.
   * Use this to trigger a re-fetch of budget data in the UI.
   *
   * @param onUpdate - Callback invoked with the change payload from any budget table
   * @returns An array of Subscription handles — pass each to `unsubscribe()` on cleanup
   */
  subscribeToBudget(onUpdate: (payload: RealtimePayload) => void): Subscription[] {
    const budgetTables = ['budget', 'allocations', 'expenditures'] as const
    return budgetTables.map((table) => this.subscribeToTable(table, onUpdate))
  }
}

/** Singleton instance of the RealtimeService */
export const realtimeService = new RealtimeService()

export default realtimeService
