// BudgetService, AllocationService, ExpenditureService — per-organization model
// Each organization has its own budget. Allocations are checked against the org's budget.
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3

import { createSupabaseClient } from './supabase'
import { Budget, Allocation, Expenditure, BudgetSummary, EventFinancialSummary } from '@/types'
import { logBudgetAllocation, logExpenditure } from './audit'

// ─── Mappers ──────────────────────────────────────────────────────────────────

/** Maps a raw database row to the Budget interface. */
function mapBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    totalFunds: Number(row.total_funds),
    updatedBy: (row.updated_by as string) ?? null,
    updatedAt: new Date(row.updated_at as string),
  }
}

/** Maps a raw database row to the Allocation interface. */
function mapAllocation(row: Record<string, unknown>): Allocation {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    organizationId: row.organization_id as string,
    amount: Number(row.amount),
    allocatedBy: (row.allocated_by as string) ?? null,
    allocatedAt: new Date(row.allocated_at as string),
  }
}

/** Maps a raw database row to the Expenditure interface. */
function mapExpenditure(row: Record<string, unknown>): Expenditure {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    amount: Number(row.amount),
    description: row.description as string,
    documentId: (row.document_id as string) ?? null,
    recordedBy: (row.recorded_by as string) ?? null,
    recordedAt: new Date(row.recorded_at as string),
  }
}

// ─── BudgetService ────────────────────────────────────────────────────────────

/**
 * Returns the budget record for a specific organization.
 * Creates one with zero funds if none exists yet.
 * @param organizationId - The organization's unique identifier
 */
export async function getOrgBudget(organizationId: string): Promise<Budget> {
  if (!organizationId) throw new Error('Organization ID is required')

  const supabase = createSupabaseClient()

  const { data: budget, error } = await supabase
    .from('budget')
    .select('id, organization_id, total_funds, updated_by, updated_at')
    .eq('organization_id', organizationId)
    .single()

  if (error || !budget) {
    // Initialize budget with zero funds for this org
    const { data: created, error: createError } = await supabase
      .from('budget')
      .insert({ organization_id: organizationId, total_funds: 0 })
      .select('id, organization_id, total_funds, updated_by, updated_at')
      .single()

    if (createError) throw new Error(`Failed to initialize budget: ${createError.message}`)
    return mapBudget(created)
  }

  return mapBudget(budget)
}

/**
 * Returns all organization budgets (for the admin overview).
 * Joins with the organizations table to include org names.
 */
export async function listOrgBudgets(): Promise<(Budget & { organizationName: string })[]> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('budget')
    .select('id, organization_id, total_funds, updated_by, updated_at, organizations(name)')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`Failed to list budgets: ${error.message}`)

  return (data ?? []).map((row) => ({
    ...mapBudget(row as unknown as Record<string, unknown>),
    organizationName: (row.organizations as { name?: string } | null)?.name ?? 'Unknown',
  }))
}

/**
 * Sets or updates the total funds for an organization's budget. Admin only.
 * Checks for an existing record first, then inserts or updates accordingly.
 * @param organizationId - The organization to update
 * @param amount - New total funds amount (must be >= 0)
 * @param userId - ID of the admin performing the update
 */
export async function setOrgBudget(
  organizationId: string,
  amount: number,
  userId: string
): Promise<Budget> {
  if (!organizationId) throw new Error('Organization ID is required')
  if (amount < 0) throw new Error('Total funds cannot be negative')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  // Check if a budget record already exists for this org
  const { data: existing } = await supabase
    .from('budget')
    .select('id')
    .eq('organization_id', organizationId)
    .single()

  let data: Record<string, unknown> | null = null
  let error: { message: string } | null = null

  if (existing) {
    // Update the existing record
    const result = await supabase
      .from('budget')
      .update({ total_funds: amount, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .select('id, organization_id, total_funds, updated_by, updated_at')
      .single()
    data = result.data
    error = result.error
  } else {
    // Insert a new record
    const result = await supabase
      .from('budget')
      .insert({ organization_id: organizationId, total_funds: amount, updated_by: userId })
      .select('id, organization_id, total_funds, updated_by, updated_at')
      .single()
    data = result.data
    error = result.error
  }

  if (error) throw new Error(`Failed to set budget: ${error.message}`)
  return mapBudget(data!)
}

/**
 * Returns the total amount allocated to events for a specific organization.
 * @param organizationId - The organization's unique identifier
 */
export async function getOrgAllocatedFunds(organizationId: string): Promise<number> {
  if (!organizationId) throw new Error('Organization ID is required')

  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('allocations')
    .select('amount')
    .eq('organization_id', organizationId)

  if (error) throw new Error(`Failed to get allocated funds: ${error.message}`)
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
}

/**
 * Returns a full budget summary for a specific organization.
 * Runs both queries in parallel.
 * @param organizationId - The organization's unique identifier
 * @param organizationName - The organization's display name (for the summary)
 */
export async function getOrgBudgetSummary(
  organizationId: string,
  organizationName: string
): Promise<BudgetSummary> {
  const [budget, allocatedFunds] = await Promise.all([
    getOrgBudget(organizationId),
    getOrgAllocatedFunds(organizationId),
  ])
  return {
    organizationId,
    organizationName,
    totalFunds: budget.totalFunds,
    allocatedFunds,
    availableFunds: budget.totalFunds - allocatedFunds,
  }
}

// ─── AllocationService ────────────────────────────────────────────────────────

/**
 * Allocates funds from an organization's budget to a specific event.
 * Validates that the amount does not exceed the org's available funds.
 * Both admin and officer can allocate, but only within their org's budget.
 * @param eventId - The event to allocate funds to
 * @param organizationId - The organization this allocation belongs to
 * @param amount - Amount to allocate (must be > 0)
 * @param userId - ID of the user performing the allocation
 */
export async function allocateFunds(
  eventId: string,
  organizationId: string,
  amount: number,
  userId: string
): Promise<Allocation> {
  if (!eventId) throw new Error('Event ID is required')
  if (!organizationId) throw new Error('Organization ID is required')
  if (amount <= 0) throw new Error('Allocation amount must be greater than zero')
  if (!userId) throw new Error('User ID is required')

  // Check available funds for this org
  const [budget, allocated] = await Promise.all([
    getOrgBudget(organizationId),
    getOrgAllocatedFunds(organizationId),
  ])
  const available = budget.totalFunds - allocated

  if (amount > available) {
    throw new Error(
      `Insufficient funds: requested ₱${amount.toLocaleString()} but only ₱${available.toLocaleString()} available for this organization`
    )
  }

  const supabase = createSupabaseClient()

  // Check if an allocation already exists for this event
  const { data: existing } = await supabase
    .from('allocations')
    .select('id')
    .eq('event_id', eventId)
    .single()

  if (existing) {
    throw new Error('An allocation already exists for this event. Edit or remove it first.')
  }

  const { data: allocation, error } = await supabase
    .from('allocations')
    .insert({ event_id: eventId, organization_id: organizationId, amount, allocated_by: userId })
    .select('id, event_id, organization_id, amount, allocated_by, allocated_at')
    .single()

  if (error) throw new Error(`Failed to allocate funds: ${error.message}`)

  logBudgetAllocation(eventId, amount, userId).catch(() => {})

  return mapAllocation(allocation)
}

/**
 * Removes a fund allocation from an event.
 * @param eventId - The event whose allocation should be removed
 * @param userId - ID of the user performing the deallocation
 */
export async function deallocateFunds(eventId: string, userId: string): Promise<void> {
  if (!eventId) throw new Error('Event ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()
  const { error } = await supabase.from('allocations').delete().eq('event_id', eventId)
  if (error) throw new Error(`Failed to deallocate funds: ${error.message}`)
}

/**
 * Returns the allocation for a specific event, or null if none exists.
 * @param eventId - The event's unique identifier
 */
export async function getEventAllocation(eventId: string): Promise<Allocation | null> {
  if (!eventId) throw new Error('Event ID is required')

  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('allocations')
    .select('id, event_id, organization_id, amount, allocated_by, allocated_at')
    .eq('event_id', eventId)
    .single()

  if (error || !data) return null
  return mapAllocation(data)
}

/**
 * Returns all allocations for a specific organization.
 * @param organizationId - The organization's unique identifier
 */
export async function listOrgAllocations(organizationId: string): Promise<Allocation[]> {
  if (!organizationId) throw new Error('Organization ID is required')

  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('allocations')
    .select('id, event_id, organization_id, amount, allocated_by, allocated_at')
    .eq('organization_id', organizationId)
    .order('allocated_at', { ascending: false })

  if (error) throw new Error(`Failed to list allocations: ${error.message}`)
  return (data ?? []).map(mapAllocation)
}

/**
 * Returns all allocations across all organizations (admin view).
 */
export async function listAllAllocations(): Promise<Allocation[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('allocations')
    .select('id, event_id, organization_id, amount, allocated_by, allocated_at')
    .order('allocated_at', { ascending: false })

  if (error) throw new Error(`Failed to list allocations: ${error.message}`)
  return (data ?? []).map(mapAllocation)
}

// ─── ExpenditureService ───────────────────────────────────────────────────────

/**
 * Records an expenditure against an event's allocated budget.
 * Requires a valid document ID (receipt/financial document).
 * @param eventId - The event to record the expenditure against
 * @param amount - Amount spent (must be > 0)
 * @param description - Description of the expenditure
 * @param documentId - ID of the supporting financial document
 * @param userId - ID of the officer/admin recording the expenditure
 */
export async function recordExpenditure(
  eventId: string,
  amount: number,
  description: string,
  documentId: string,
  userId: string
): Promise<Expenditure> {
  if (!eventId) throw new Error('Event ID is required')
  if (amount <= 0) throw new Error('Expenditure amount must be greater than zero')
  if (!description) throw new Error('Description is required')
  if (!documentId) throw new Error('A supporting document is required for expenditures')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { data: expenditure, error } = await supabase
    .from('expenditures')
    .insert({ event_id: eventId, amount, description, document_id: documentId, recorded_by: userId })
    .select('id, event_id, amount, description, document_id, recorded_by, recorded_at')
    .single()

  if (error) throw new Error(`Failed to record expenditure: ${error.message}`)

  logExpenditure(eventId, amount, userId).catch(() => {})

  return mapExpenditure(expenditure)
}

/**
 * Returns all expenditures for a specific event.
 * @param eventId - The event's unique identifier
 */
export async function getEventExpenditures(eventId: string): Promise<Expenditure[]> {
  if (!eventId) throw new Error('Event ID is required')

  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('expenditures')
    .select('id, event_id, amount, description, document_id, recorded_by, recorded_at')
    .eq('event_id', eventId)
    .order('recorded_at', { ascending: false })

  if (error) throw new Error(`Failed to get expenditures: ${error.message}`)
  return (data ?? []).map(mapExpenditure)
}

/**
 * Returns all expenditures for events belonging to a specific organization.
 * Joins through the allocations table to find org-scoped expenditures.
 * @param organizationId - The organization's unique identifier
 */
export async function getOrgExpenditures(organizationId: string): Promise<Expenditure[]> {
  if (!organizationId) throw new Error('Organization ID is required')

  const supabase = createSupabaseClient()

  // Get all event IDs allocated to this org
  const { data: allocs } = await supabase
    .from('allocations')
    .select('event_id')
    .eq('organization_id', organizationId)

  if (!allocs || allocs.length === 0) return []

  const eventIds = allocs.map((a: { event_id: string }) => a.event_id)

  const { data, error } = await supabase
    .from('expenditures')
    .select('id, event_id, amount, description, document_id, recorded_by, recorded_at')
    .in('event_id', eventIds)
    .order('recorded_at', { ascending: false })

  if (error) throw new Error(`Failed to get expenditures: ${error.message}`)
  return (data ?? []).map(mapExpenditure)
}

/**
 * Returns all expenditures across all events (admin view).
 */
export async function listAllExpenditures(): Promise<Expenditure[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('expenditures')
    .select('id, event_id, amount, description, document_id, recorded_by, recorded_at')
    .order('recorded_at', { ascending: false })

  if (error) throw new Error(`Failed to list expenditures: ${error.message}`)
  return (data ?? []).map(mapExpenditure)
}

/**
 * Returns the total amount spent for a specific event.
 * @param eventId - The event's unique identifier
 */
export async function getTotalSpent(eventId: string): Promise<number> {
  const expenditures = await getEventExpenditures(eventId)
  return expenditures.reduce((sum, e) => sum + e.amount, 0)
}

/**
 * Returns a financial summary for a specific event.
 * @param eventId - The event's unique identifier
 */
export async function getEventFinancialSummary(eventId: string): Promise<EventFinancialSummary> {
  const [allocation, totalSpent] = await Promise.all([
    getEventAllocation(eventId),
    getTotalSpent(eventId),
  ])
  const allocatedAmount = allocation?.amount ?? 0
  return {
    eventId,
    allocatedAmount,
    totalSpent,
    remainingFunds: allocatedAmount - totalSpent,
  }
}
