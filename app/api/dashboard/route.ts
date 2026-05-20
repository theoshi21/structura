// API route for the student dashboard summary
// Returns counts, recent events, and budget in a single request

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'
import { getOrgBudgetSummary } from '@/lib/budget'
import { EventStatus } from '@/types'

/**
 * GET /api/dashboard
 * Returns a lightweight summary for the student dashboard:
 * - pendingCount: number of proposed events
 * - activeCount: number of approved events
 * - recentEvents: 5 most recent events (id, name, eventDate, status only)
 * - budget: org budget summary (or null if not set)
 * - orgName: the user's organization name
 *
 * All data is scoped to the user's organization.
 * Single endpoint replaces 3 separate fetches on the dashboard.
 */
export async function GET() {
  try {
    const user = await requireAuth()

    const supabase = createSupabaseClient()

    // Resolve org — prefer organizationId FK, fall back to name lookup for legacy accounts
    let orgId = user.organizationId
    let orgName = user.organizationName

    if (!orgId && orgName) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', orgName.trim())
        .limit(1)
        .single()
      orgId = org?.id ?? null
      orgName = org?.name ?? orgName
    } else if (orgId && !orgName) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single()
      orgName = org?.name ?? null
    }

    // Build the org/creator filter for events
    const orgFilter = orgId
      ? { column: 'organization_id', value: orgId }
      : { column: 'created_by', value: user.id }

    // Run event queries and budget summary in parallel
    const [recentRes, proposedRes, approvedRes, budgetSummary] = await Promise.all([
      // 5 most recent events — only the columns the dashboard renders
      supabase
        .from('events')
        .select('id, name, event_date, status')
        .eq(orgFilter.column, orgFilter.value)
        .order('created_at', { ascending: false })
        .limit(5),

      // Count of proposed events
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq(orgFilter.column, orgFilter.value)
        .eq('status', 'proposed' as EventStatus),

      // Count of approved events
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq(orgFilter.column, orgFilter.value)
        .eq('status', 'approved' as EventStatus),

      // Budget summary — null if no org
      orgId && orgName
        ? getOrgBudgetSummary(orgId, orgName).catch(() => null)
        : Promise.resolve(null),
    ])

    const recentEvents = (recentRes.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      eventDate: row.event_date as string,
      status: row.status as EventStatus,
    }))

    return NextResponse.json({
      success: true,
      data: {
        orgName,
        pendingCount: proposedRes.count ?? 0,
        activeCount: approvedRes.count ?? 0,
        recentEvents,
        budget: budgetSummary,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load dashboard data' } },
      { status: 500 }
    )
  }
}
