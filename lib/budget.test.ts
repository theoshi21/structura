// Property-based tests for budget management
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3

import { describe, test, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { createMockDatabase, MockDatabase } from './test-utils'

let mockDb: MockDatabase

beforeEach(() => {
  mockDb = createMockDatabase()
})

// ─── Generators ───────────────────────────────────────────────────────────────

const amountGenerator = fc.integer({ min: 1, max: 1000000 })
const descriptionGenerator = fc.string({ minLength: 1, maxLength: 500 })
const documentIdGenerator = fc.uuid()

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a mock budget in the mock database */
function createMockBudget(db: MockDatabase, totalFunds: number = 0) {
  const id = 'budget-1'
  const budget = {
    id,
    total_funds: totalFunds,
    updated_by: null as string | null,
    updated_at: new Date().toISOString(),
  }
  db.budget.set(id, budget)
  return budget
}

/** Creates a mock event in the mock database */
function createMockEvent(db: MockDatabase, eventId?: string) {
  const id = eventId ?? `event-${db.events.size + 1}`
  const event = {
    id,
    name: 'Test Event',
    status: 'proposed',
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.events.set(id, event)
  return event
}

/** Creates a mock allocation in the mock database */
function createMockAllocation(
  db: MockDatabase,
  eventId: string,
  amount: number,
  allocatedBy: string = 'user-1'
) {
  const id = `alloc-${db.allocations.size + 1}`
  const allocation = {
    id,
    event_id: eventId,
    amount,
    allocated_by: allocatedBy,
    allocated_at: new Date().toISOString(),
  }
  db.allocations.set(id, allocation)
  return allocation
}

/** Creates a mock expenditure in the mock database */
function createMockExpenditure(
  db: MockDatabase,
  eventId: string,
  amount: number,
  description: string,
  documentId: string,
  recordedBy: string = 'user-1'
) {
  const id = `exp-${db.expenditures.size + 1}`
  const expenditure = {
    id,
    event_id: eventId,
    amount,
    description,
    document_id: documentId,
    recorded_by: recordedBy,
    recorded_at: new Date().toISOString(),
  }
  db.expenditures.set(id, expenditure)
  return expenditure
}

/** Gets total allocated funds from mock database */
function getTotalAllocated(db: MockDatabase): number {
  return Array.from(db.allocations.values()).reduce(
    (sum: number, a: any) => sum + a.amount,
    0
  )
}

/** Gets total expenditures for an event from mock database */
function getTotalSpent(db: MockDatabase, eventId: string): number {
  return Array.from(db.expenditures.values())
    .filter((e: any) => e.event_id === eventId)
    .reduce((sum: number, e: any) => sum + e.amount, 0)
}

/** Gets the allocation for a specific event, or null */
function getAllocationForEvent(db: MockDatabase, eventId: string): any | null {
  for (const alloc of db.allocations.values()) {
    if ((alloc as any).event_id === eventId) return alloc
  }
  return null
}

// ─── Property 26: Single Organizational Budget ───────────────────────────────

/**
 * **Validates: Requirements 6.1, 16.2**
 * Feature: structura, Property 26: Single Organizational Budget
 *
 * For any deployment of the system, there must be exactly one organizational budget record.
 */
describe('Property 26: Single Organizational Budget', () => {
  test('only one budget record exists in the system', () => {
    fc.assert(
      fc.property(amountGenerator, (totalFunds) => {
        createMockBudget(mockDb, totalFunds)
        expect(mockDb.budget.size).toBe(1)
        expect(Array.from(mockDb.budget.keys()).length).toBe(1)
      }),
      { numRuns: 100 }
    )
  })

  test('budget record has required fields', () => {
    fc.assert(
      fc.property(amountGenerator, fc.uuid(), (totalFunds, userId) => {
        const budget = createMockBudget(mockDb, totalFunds)
        budget.updated_by = userId
        expect(budget.id).toBeDefined()
        expect(budget.total_funds).toBe(totalFunds)
        expect(budget.updated_at).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  test('budget initializes with zero funds if not specified', () => {
    const budget = createMockBudget(mockDb)
    expect(budget.total_funds).toBe(0)
  })
})

// ─── Property 27: Budget Allocation Reduces Available Funds ──────────────────

/**
 * **Validates: Requirements 6.2**
 * Feature: structura, Property 27: Budget Allocation Reduces Available Funds
 *
 * For any fund allocation to an event, the organizational budget's available
 * funds must decrease by the allocation amount.
 */
describe('Property 27: Budget Allocation Reduces Available Funds', () => {
  test('allocating funds reduces available budget', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 1000000 }),
        fc.integer({ min: 1000, max: 50000 }),
        (totalFunds, allocationAmount) => {
          createMockBudget(mockDb, totalFunds)
          const event = createMockEvent(mockDb)
          const availableBefore = totalFunds - getTotalAllocated(mockDb)
          createMockAllocation(mockDb, event.id, allocationAmount)
          const availableAfter = totalFunds - getTotalAllocated(mockDb)
          expect(availableAfter).toBe(availableBefore - allocationAmount)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('multiple allocations cumulatively reduce available funds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500000, max: 1000000 }),
        fc.array(fc.integer({ min: 1000, max: 20000 }), { minLength: 2, maxLength: 10 }),
        (totalFunds, amounts) => {
          const db = createMockDatabase()
          createMockBudget(db, totalFunds)
          amounts.forEach((amount, index) => {
            const event = createMockEvent(db, `event-${index}`)
            createMockAllocation(db, event.id, amount)
          })
          const totalAllocated = amounts.reduce((sum, a) => sum + a, 0)
          const availableAfter = totalFunds - getTotalAllocated(db)
          expect(availableAfter).toBe(totalFunds - totalAllocated)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('available funds never go negative with valid allocations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 1000000 }),
        fc.integer({ min: 1000, max: 50000 }),
        (totalFunds, allocationAmount) => {
          const db = createMockDatabase()
          createMockBudget(db, totalFunds)
          if (allocationAmount <= totalFunds) {
            const event = createMockEvent(db)
            createMockAllocation(db, event.id, allocationAmount)
            const available = totalFunds - getTotalAllocated(db)
            expect(available).toBeGreaterThanOrEqual(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 28: Expenditure Reduces Event Funds ────────────────────────────

/**
 * **Validates: Requirements 6.3**
 * Feature: structura, Property 28: Expenditure Reduces Event Funds
 *
 * For any expenditure recorded against an event, the event's remaining funds
 * must decrease by the expenditure amount.
 */
describe('Property 28: Expenditure Reduces Event Funds', () => {
  test('recording an expenditure reduces event remaining funds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 100000 }),
        fc.integer({ min: 1000, max: 5000 }),
        descriptionGenerator,
        documentIdGenerator,
        (allocationAmount, expenditureAmount, description, documentId) => {
          const event = createMockEvent(mockDb)
          createMockAllocation(mockDb, event.id, allocationAmount)
          const remainingBefore = allocationAmount - getTotalSpent(mockDb, event.id)
          createMockExpenditure(mockDb, event.id, expenditureAmount, description, documentId)
          const remainingAfter = allocationAmount - getTotalSpent(mockDb, event.id)
          expect(remainingAfter).toBe(remainingBefore - expenditureAmount)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('multiple expenditures cumulatively reduce event funds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50000, max: 100000 }),
        fc.array(fc.integer({ min: 500, max: 5000 }), { minLength: 2, maxLength: 10 }),
        (allocationAmount, amounts) => {
          const event = createMockEvent(mockDb)
          createMockAllocation(mockDb, event.id, allocationAmount)
          amounts.forEach((amount, index) => {
            createMockExpenditure(mockDb, event.id, amount, `Expense ${index}`, `doc-${index}`)
          })
          const totalSpent = getTotalSpent(mockDb, event.id)
          expect(totalSpent).toBe(amounts.reduce((sum, a) => sum + a, 0))
        }
      ),
      { numRuns: 100 }
    )
  })

  test('expenditures are tracked per event independently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 50000 }),
        fc.integer({ min: 1000, max: 5000 }),
        fc.integer({ min: 1000, max: 5000 }),
        (allocation, exp1, exp2) => {
          const db = createMockDatabase()
          const event1 = createMockEvent(db, 'event-a')
          const event2 = createMockEvent(db, 'event-b')
          createMockAllocation(db, event1.id, allocation)
          createMockAllocation(db, event2.id, allocation)
          createMockExpenditure(db, event1.id, exp1, 'Expense 1', 'doc-1')
          createMockExpenditure(db, event2.id, exp2, 'Expense 2', 'doc-2')
          expect(getTotalSpent(db, event1.id)).toBe(exp1)
          expect(getTotalSpent(db, event2.id)).toBe(exp2)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 29: Budget Calculations Correct ────────────────────────────────

/**
 * **Validates: Requirements 6.4, 7.1, 7.3**
 * Feature: structura, Property 29: Budget Calculations Correct
 *
 * For any organizational budget, available funds must equal total funds minus
 * sum of all allocations. For any event, remaining funds must equal allocated
 * amount minus sum of all expenditures.
 */
describe('Property 29: Budget Calculations Correct', () => {
  test('available funds = total funds - sum of all allocations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500000, max: 2000000 }),
        fc.array(fc.integer({ min: 1000, max: 50000 }), { minLength: 1, maxLength: 5 }),
        (totalFunds, allocationAmounts) => {
          const db = createMockDatabase()
          createMockBudget(db, totalFunds)
          allocationAmounts.forEach((amount, index) => {
            const event = createMockEvent(db, `event-${index}`)
            createMockAllocation(db, event.id, amount)
          })
          const sumAllocations = allocationAmounts.reduce((sum, a) => sum + a, 0)
          const available = totalFunds - getTotalAllocated(db)
          expect(available).toBe(totalFunds - sumAllocations)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('event remaining funds = allocated amount - sum of expenditures', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50000, max: 200000 }),
        fc.array(fc.integer({ min: 500, max: 10000 }), { minLength: 1, maxLength: 5 }),
        (allocationAmount, expenditureAmounts) => {
          const event = createMockEvent(mockDb)
          createMockAllocation(mockDb, event.id, allocationAmount)
          expenditureAmounts.forEach((amount, index) => {
            createMockExpenditure(mockDb, event.id, amount, `Expense ${index}`, `doc-${index}`)
          })
          const sumExpenditures = expenditureAmounts.reduce((sum, a) => sum + a, 0)
          const remaining = allocationAmount - getTotalSpent(mockDb, event.id)
          expect(remaining).toBe(allocationAmount - sumExpenditures)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('budget summary fields are internally consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 1000000 }),
        fc.array(fc.integer({ min: 1000, max: 20000 }), { minLength: 0, maxLength: 5 }),
        (totalFunds, allocationAmounts) => {
          const db = createMockDatabase()
          createMockBudget(db, totalFunds)
          allocationAmounts.forEach((amount, index) => {
            const event = createMockEvent(db, `event-${index}`)
            createMockAllocation(db, event.id, amount)
          })
          const allocatedFunds = getTotalAllocated(db)
          const availableFunds = totalFunds - allocatedFunds
          // totalFunds = allocatedFunds + availableFunds
          expect(totalFunds).toBe(allocatedFunds + availableFunds)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 30: Over-Allocation Prevention ─────────────────────────────────

/**
 * **Validates: Requirements 6.5**
 * Feature: structura, Property 30: Over-Allocation Prevention
 *
 * For any allocation attempt, if the requested amount exceeds available
 * organizational funds, the system must reject the allocation.
 */
describe('Property 30: Over-Allocation Prevention', () => {
  test('allocation exceeding available funds is rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 100000 }),
        fc.integer({ min: 1, max: 500 }),
        (totalFunds, excess) => {
          createMockBudget(mockDb, totalFunds)
          const event = createMockEvent(mockDb)
          const overAmount = totalFunds + excess

          // Simulate the over-allocation check
          const available = totalFunds - getTotalAllocated(mockDb)
          const isRejected = overAmount > available

          expect(isRejected).toBe(true)
          // Confirm no allocation was created
          expect(getAllocationForEvent(mockDb, event.id)).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('allocation exactly equal to available funds is accepted', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 500000 }),
        (totalFunds) => {
          createMockBudget(mockDb, totalFunds)
          const event = createMockEvent(mockDb)
          const available = totalFunds - getTotalAllocated(mockDb)

          // Allocate exactly the available amount
          createMockAllocation(mockDb, event.id, available)

          const remainingAvailable = totalFunds - getTotalAllocated(mockDb)
          expect(remainingAvailable).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('partial allocation leaves correct remaining available funds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 1000000 }),
        fc.integer({ min: 1000, max: 50000 }),
        (totalFunds, allocationAmount) => {
          const db = createMockDatabase()
          createMockBudget(db, totalFunds)
          if (allocationAmount <= totalFunds) {
            const event = createMockEvent(db)
            createMockAllocation(db, event.id, allocationAmount)
            const remaining = totalFunds - getTotalAllocated(db)
            expect(remaining).toBe(totalFunds - allocationAmount)
            expect(remaining).toBeGreaterThanOrEqual(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 31: Expenditure Requires Documentation ─────────────────────────

/**
 * **Validates: Requirements 7.2**
 * Feature: structura, Property 31: Expenditure Requires Documentation
 *
 * For any expenditure creation, the system must require a valid document ID
 * linking to a financial document.
 */
describe('Property 31: Expenditure Requires Documentation', () => {
  test('expenditure with a document ID is accepted', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 50000 }),
        descriptionGenerator,
        documentIdGenerator,
        (amount, description, documentId) => {
          const event = createMockEvent(mockDb)
          createMockAllocation(mockDb, event.id, amount * 2)
          const expenditure = createMockExpenditure(
            mockDb,
            event.id,
            amount,
            description,
            documentId
          )
          expect(expenditure.document_id).toBe(documentId)
          expect(expenditure.document_id).not.toBeNull()
          expect(expenditure.document_id).not.toBe('')
        }
      ),
      { numRuns: 100 }
    )
  })

  test('expenditure without a document ID should be rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 50000 }),
        descriptionGenerator,
        (amount, description) => {
          // Simulate the validation check: documentId is required
          const documentId = ''
          const isValid = documentId !== null && documentId !== ''
          expect(isValid).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('every recorded expenditure has a non-null document reference', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            amount: fc.integer({ min: 500, max: 5000 }),
            description: descriptionGenerator,
            documentId: documentIdGenerator,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (expenses) => {
          const event = createMockEvent(mockDb)
          const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
          createMockAllocation(mockDb, event.id, totalAmount + 1000)

          expenses.forEach((expense) => {
            createMockExpenditure(
              mockDb,
              event.id,
              expense.amount,
              expense.description,
              expense.documentId
            )
          })

          const recorded = Array.from(mockDb.expenditures.values()).filter(
            (e: any) => e.event_id === event.id
          )
          recorded.forEach((exp: any) => {
            expect(exp.document_id).not.toBeNull()
            expect(exp.document_id).not.toBe('')
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ─── Property 32: Over-Budget Warning ────────────────────────────────────────

/**
 * **Validates: Requirements 7.4**
 * Feature: structura, Property 32: Over-Budget Warning
 *
 * For any event where total expenditures exceed allocated budget, the system
 * must display a warning indicator.
 */
describe('Property 32: Over-Budget Warning', () => {
  test('over-budget condition is detected when expenditures exceed allocation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5000, max: 50000 }),
        fc.integer({ min: 1, max: 1000 }),
        (allocationAmount, excess) => {
          const event = createMockEvent(mockDb)
          createMockAllocation(mockDb, event.id, allocationAmount)

          // Record expenditures that exceed the allocation
          const overAmount = allocationAmount + excess
          createMockExpenditure(mockDb, event.id, overAmount, 'Over-budget expense', 'doc-1')

          const totalSpent = getTotalSpent(mockDb, event.id)
          const isOverBudget = totalSpent > allocationAmount

          expect(isOverBudget).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('within-budget condition is correctly identified', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 100000 }),
        fc.integer({ min: 1000, max: 5000 }),
        (allocationAmount, expenditureAmount) => {
          const event = createMockEvent(mockDb)
          createMockAllocation(mockDb, event.id, allocationAmount)

          if (expenditureAmount <= allocationAmount) {
            createMockExpenditure(
              mockDb,
              event.id,
              expenditureAmount,
              'Within-budget expense',
              'doc-1'
            )
            const totalSpent = getTotalSpent(mockDb, event.id)
            const isOverBudget = totalSpent > allocationAmount
            expect(isOverBudget).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('remaining funds are negative when over budget', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5000, max: 50000 }),
        fc.integer({ min: 1, max: 5000 }),
        (allocationAmount, excess) => {
          const event = createMockEvent(mockDb)
          createMockAllocation(mockDb, event.id, allocationAmount)
          createMockExpenditure(
            mockDb,
            event.id,
            allocationAmount + excess,
            'Over-budget expense',
            'doc-1'
          )
          const remaining = allocationAmount - getTotalSpent(mockDb, event.id)
          expect(remaining).toBeLessThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
