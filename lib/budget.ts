// BudgetService, AllocationService, ExpenditureService
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3

import { createSupabaseClient } from './supabase'
import { Budget, Allocation, Expenditure, BudgetSummary, EventFinancialSummary } from '@/types'
import { logBudgetAllocation, logExpenditure } from './audit'

// ─── Mappers ─────────────────────────────────────────────────────────────────

/**
 * Maps a raw database row to the Budget interface.
 */
function mapBudget(row: any): Budget {
  return {
    id: row.id,
    totalFunds: Number(row.total_funds),
    updatedBy: row.updated_by ?? null,
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Maps a raw database row to the Allocation interface.
 */
function mapAllocation(row: any): Allocation {
  return {
    id: row.id,
    eventId: row.event_id,
    amount: Number(row.amount),
    allocatedBy: row.allocated_by ?? null,
    allocatedAt: new Date(row.allocated_at),
  }
}

/**
 * Maps a raw database row to the Expenditure interface.
 */
function mapExpenditure(row: any): Expenditure {
  return {
    id: row.id,
    eventId: row.event_id,
    amount: Number(row.amount),
    description: row.description,
    documentId: row.document_id ?? null,
    recordedBy: row.recorded_by ?? null,
    recordedAt: new Date(row.recorded_at),
  }
}

// ─── BudgetService ────────────────────────────────────────────────────────────

/**
 * Returns the single organizational budget record.
 * Creates one with zero funds if none exists.
 * @returns Promise resolving to the Budget record
 */
export async function getOrganizationalBudget(): Promise<Budget> {
  const supabase = createSupabaseClient()

  const { data: budget, error } = await supabase
    .from('budget')
    .select('id, total_funds, updated_by, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !budget) {
    // Initialize budget with zero funds if none exists
    const { data: created, error: createError } = await supabase
      .from('budget')
      .insert({ total_funds: 0 })
      .select('id, total_funds, updated_by, updated_at')
      .single()

    if (createError) throw new Error(`Failed to initialize budget: ${createError.message}`)
    return mapBudget(created)
  }

  return mapBudget(budget)
}

/**
 * Updates the total funds in the organizational budget.
 * @param amount - New total funds amount (must be >= 0)
 * @param userId - ID of the admin performing the update
 * @returns Promise resolving to the updated Budget
 * @throws Error if amount is negative or update fails
 */
export async function updateTotalFunds(amount: number, userId: string): Promise<Budget> {
  if (amount < 0) throw new Error('Total funds cannot be negative')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()
  const budget = await getOrganizationalBudget()

  const { data: updated, error } = await supabase
    .from('budget')
    .update({ total_funds: amount, updated_by: userId, updated_at: new Date().toISOString() })
    .eq('id', budget.id)
    .select('id, total_funds, updated_by, updated_at')
    .single()

  if (error) throw new Error(`Failed to update budget: ${error.message}`)
  return mapBudget(updated)
}

/**
 * Returns the total amount currently allocated across all events.
 * @returns Promise resolving to the sum of all allocations
 */
export async function getAllocatedFunds(): Promise<number> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('allocations')
    .select('amount')

  if (error) throw new Error(`Failed to get allocated funds: ${error.message}`)
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
}

/**
 * Returns the available (unallocated) funds from the organizational budget.
 * @returns Promise resolving to total funds minus all allocations
 */
export async function getAvailableFunds(): Promise<number> {
  const budget = await getOrganizationalBudget()
  const allocated = await getAllocatedFunds()
  return budget.totalFunds - allocated
}

/**
 * Returns a full budget summary: total, allocated, and available funds.
 * @returns Promise resolving to a BudgetSummary object
 */
export async function getBudgetSummary(): Promise<BudgetSummary> {
  const budget = await getOrganizationalBudget()
  const allocatedFunds = await getAllocatedFunds()
  return {
    totalFunds: budget.totalFunds,
    allocatedFunds,
    availableFunds: budget.totalFunds - allocatedFunds,
  }
}

// ─── AllocationService ────────────────────────────────────────────────────────

/**
 * Allocates funds from the organizational budget to a specific event.
 * Rejects if the amount exceeds available funds or if an allocation already exists.
 * @param eventId - The event to allocate funds to
 * @param amount - Amount to allocate (must be > 0)
 * @param userId - ID of the admin performing the allocation
 * @returns Promise resolving to the created Allocation
 * @throws Error if insufficient funds or allocation already exists
 */
export async function allocateFunds(
  eventId: string,
  amount: number,
  userId: string
): Promise<Allocation> {
  if (!eventId) throw new Error('Event ID is required')
  if (amount <= 0) throw new Error('Allocation amount must be greater than zero')
  if (!userId) throw new Error('User ID is required')

  const available = await getAvailableFunds()
  if (amount > available) {
    throw new Error(
      `Insufficient funds: requested ₱${amount.toLocaleString()} but only ₱${available.toLocaleString()} available`
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
    throw new Error('An allocation already exists for this event. Update or remove it first.')
  }

  const { data: allocation, error } = await supabase
    .from('allocations')
    .insert({ event_id: eventId, amount, allocated_by: userId })
    .select('id, event_id, amount, allocated_by, allocated_at')
    .single()

  if (error) throw new Error(`Failed to allocate funds: ${error.message}`)

  // Log the allocation to the audit trail
  logBudgetAllocation(eventId, amount, userId).catch(() => {})

  return mapAllocation(allocation)
}

/**
 * Removes a fund allocation from an event, returning the funds to the budget.
 * @param eventId - The event whose allocation should be removed
 * @param userId - ID of the admin performing the deallocation
 * @returns Promise that resolves when deallocation is complete
 * @throws Error if no allocation exists for the event
 */
export async function deallocateFunds(eventId: string, userId: string): Promise<void> {
  if (!eventId) throw new Error('Event ID is required')
  if (!userId) throw new Error('User ID is required')

  const supabase = createSupabaseClient()

  const { error } = await supabase
    .from('allocations')
    .delete()
    .eq('event_id', eventId)

  if (error) throw new Error(`Failed to deallocate funds: ${error.message}`)
}

/**
 * Returns the allocation for a specific event, or null if none exists.
 * @param eventId - The event's unique identifier
 * @returns Promise resolving to the Allocation or null
 */
export async function getEventAllocation(eventId: string): Promise<Allocation | null> {
  if (!eventId) throw new Error('Event ID is required')

  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('allocations')
    .select('id, event_id, amount, allocated_by, allocated_at')
    .eq('event_id', eventId)
    .single()

  if (error || !data) return null
  return mapAllocation(data)
}

/**
 * Returns all allocations in the system.
 * @returns Promise resolving to an array of Allocation records
 */
export async function listAllocations(): Promise<Allocation[]> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('allocations')
    .select('id, event_id, amount, allocated_by, allocated_at')
    .order('allocated_at', { ascending: false })

  if (error) throw new Error(`Failed to list allocations: ${error.message}`)
  return (data ?? []).map(mapAllocation)
}

// ─── ExpenditureService ───────────────────────────────────────────────────────

/**
 * Records an expenditure against an event's allocated budget.
 * Requires a valid document ID (financial document) per Requirement 7.2.
 * @param eventId - The event to record the expenditure against
 * @param amount - Amount spent (must be > 0)
 * @param description - Description of the expenditure
 * @param documentId - ID of the supporting financial document
 * @param userId - ID of the officer/admin recording the expenditure
 * @returns Promise resolving to the created Expenditure
 * @throws Error if required fields are missing or DB insert fails
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
    .insert({
      event_id: eventId,
      amount,
      description,
      document_id: documentId,
      recorded_by: userId,
    })
    .select('id, event_id, amount, description, document_id, recorded_by, recorded_at')
    .single()

  if (error) throw new Error(`Failed to record expenditure: ${error.message}`)

  // Log the expenditure to the audit trail
  logExpenditure(eventId, amount, userId).catch(() => {})

  return mapExpenditure(expenditure)
}

/**
 * Returns all expenditures for a specific event.
 * @param eventId - The event's unique identifier
 * @returns Promise resolving to an array of Expenditure records
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
 * Returns the total amount spent for a specific event.
 * @param eventId - The event's unique identifier
 * @returns Promise resolving to the sum of all expenditures for the event
 */
export async function getTotalSpent(eventId: string): Promise<number> {
  const expenditures = await getEventExpenditures(eventId)
  return expenditures.reduce((sum, e) => sum + e.amount, 0)
}

/**
 * Returns the remaining funds for a specific event (allocated minus spent).
 * Returns 0 if no allocation exists.
 * @param eventId - The event's unique identifier
 * @returns Promise resolving to the remaining funds
 */
export async function getRemainingFunds(eventId: string): Promise<number> {
  const [allocation, totalSpent] = await Promise.all([
    getEventAllocation(eventId),
    getTotalSpent(eventId),
  ])
  if (!allocation) return 0
  return allocation.amount - totalSpent
}

/**
 * Returns a financial summary for a specific event.
 * @param eventId - The event's unique identifier
 * @returns Promise resolving to an EventFinancialSummary
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

/**
 * Returns all expenditures across all events.
 * @returns Promise resolving to an array of all Expenditure records
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
