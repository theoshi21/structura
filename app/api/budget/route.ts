// API routes for organizational budget: GET /api/budget, PATCH /api/budget
// GET returns the calling user's org budget (students/officers) or all org budgets (admin).
// PATCH sets the total fund for a specific organization. Admin only.

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/roles'
import { getOrgBudgetSummary, listOrgBudgets, setOrgBudget } from '@/lib/budget'
import { createSupabaseClient } from '@/lib/supabase'

/**
 * Resolves the organization for the current user.
 * Matches by name case-insensitively to handle registration inconsistencies.
 * Returns null if the user has no organization or no match is found.
 */
async function resolveUserOrg(organizationName: string | null): Promise<{ id: string; name: string } | null> {
  if (!organizationName) return null

  const supabase = createSupabaseClient()

  // Case-insensitive match using ilike
  const { data } = await supabase
    .from('organizations')
    .select('id, name')
    .ilike('name', organizationName.trim())
    .limit(1)
    .single()

  return data ?? null
}

/**
 * GET /api/budget
 * - Admin: returns all org budgets as an array
 * - Student/Officer: returns their own org's budget summary
 * Supports ?orgId= query param for admin to get a specific org's summary
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'view_budget')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    // Admin with ?orgId= → return that specific org's summary
    const orgIdParam = request.nextUrl.searchParams.get('orgId')
    if (orgIdParam && user.role === 'admin') {
      const supabase = createSupabaseClient()
      const { data: org } = await supabase.from('organizations').select('id, name').eq('id', orgIdParam).single()
      if (!org) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } },
          { status: 404 }
        )
      }
      const summary = await getOrgBudgetSummary(org.id, org.name)
      return NextResponse.json({ success: true, data: summary })
    }

    // Admin without ?orgId= → return all org budgets
    if (user.role === 'admin') {
      const budgets = await listOrgBudgets()
      return NextResponse.json({ success: true, data: budgets })
    }

    // Student/Officer → return their own org's budget
    const org = await resolveUserOrg(user.organizationName)
    if (!org) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORG', message: 'Your account is not linked to an organization. Contact your admin.' } },
        { status: 404 }
      )
    }

    const summary = await getOrgBudgetSummary(org.id, org.name)
    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/budget
 * Sets the total fund for a specific organization. Admin only.
 * Body: { organizationId, totalFunds }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasPermission(user.role, 'allocate_funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { organizationId, totalFunds } = body

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'organizationId is required' } },
        { status: 400 }
      )
    }

    if (totalFunds === undefined || totalFunds === null || typeof totalFunds !== 'number' || totalFunds < 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'totalFunds must be a non-negative number' } },
        { status: 400 }
      )
    }

    const budget = await setOrgBudget(organizationId, totalFunds, user.id)
    return NextResponse.json({ success: true, data: budget })
  } catch (error) {
    return handleError(error)
  }
}

function handleError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )
}
