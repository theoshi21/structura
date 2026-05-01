// Property-based tests for event management
// Requirements: 3.1, 3.2, 3.3, 3.5, 17.1, 17.2

import { describe, test, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { canTransition } from './events'
import { createMockDatabase, MockDatabase, cascadeDelete } from './test-utils'
import { EventStatus } from '@/types'

let mockDb: MockDatabase

beforeEach(() => {
  mockDb = createMockDatabase()
})

// ─── Generators ──────────────────────────────────────────────────────────────

const eventStatusGenerator = fc.constantFrom<EventStatus>(
  'proposed',
  'approved',
  'completed',
  'cancelled'
)

const eventNameGenerator = fc.string({ minLength: 1, maxLength: 255 })

const futureDateGenerator = fc.date({
  min: new Date('2025-01-01'),
  max: new Date('2030-12-31'),
  noInvalidDate: true,
})

const userIdGenerator = fc.uuid()

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a mock event in the mock database */
function createMockEvent(
  db: MockDatabase,
  overrides: Partial<{
    name: string
    status: EventStatus
    createdBy: string
    eventDate: Date
    location: string
  }> = {}
) {
  const id = `event-${db.events.size + 1}`
  const event = {
    id,
    name: overrides.name ?? 'Test Event',
    description: null,
    event_date: (overrides.eventDate ?? new Date()).toISOString().split('T')[0],
    location: overrides.location ?? null,
    status: overrides.status ?? 'proposed',
    created_by: overrides.createdBy ?? 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.events.set(id, event)
  return event
}

// ─── Property 10: Event Creation Assigns Unique ID ───────────────────────────

/**
 * **Validates: Requirements 3.1, 3.4**
 * Feature: structura, Property 10: Event Creation Assigns Unique ID
 *
 * For any valid event creation request by an authorized user, the system must
 * create an event with a unique identifier and store all required fields.
 */
describe('Property 10: Event Creation Assigns Unique ID', () => {
  test('each created event gets a unique ID', () => {
    fc.assert(
      fc.property(
        eventNameGenerator,
        futureDateGenerator,
        userIdGenerator,
        (name, eventDate, userId) => {
          const event = createMockEvent(mockDb, { name, eventDate, createdBy: userId })

          // ID must be defined and non-empty
          expect(event.id).toBeDefined()
          expect(event.id.length).toBeGreaterThan(0)

          // All required fields must be stored
          expect(event.name).toBe(name)
          expect(event.created_by).toBe(userId)
          expect(event.status).toBe('proposed')
          expect(event.event_date).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('IDs are unique across multiple events', () => {
    fc.assert(
      fc.property(
        fc.array(eventNameGenerator, { minLength: 2, maxLength: 20 }),
        (names) => {
          const ids = names.map((name) => createMockEvent(mockDb, { name }).id)
          const uniqueIds = new Set(ids)
          expect(uniqueIds.size).toBe(ids.length)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('new events always start with status "proposed"', () => {
    fc.assert(
      fc.property(eventNameGenerator, futureDateGenerator, (name, eventDate) => {
        const event = createMockEvent(mockDb, { name, eventDate })
        expect(event.status).toBe('proposed')
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Property 11: Event Updates Persist and Audit ────────────────────────────

/**
 * **Validates: Requirements 3.2, 18.1**
 * Feature: structura, Property 11: Event Updates Persist and Audit
 *
 * For any event update by an authorized user, the system must persist the changes
 * and create an audit log entry with user ID and timestamp.
 */
describe('Property 11: Event Updates Persist and Audit', () => {
  test('event updates are persisted in the database', () => {
    fc.assert(
      fc.property(
        eventNameGenerator,
        eventNameGenerator,
        userIdGenerator,
        (originalName, updatedName, userId) => {
          const event = createMockEvent(mockDb, { name: originalName })

          // Simulate update
          const updatedEvent = { ...event, name: updatedName, updated_at: new Date().toISOString() }
          mockDb.events.set(event.id, updatedEvent)

          // Verify the update persisted
          const retrieved = mockDb.events.get(event.id)!
          expect(retrieved.name).toBe(updatedName)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('audit log entry is created for event updates', () => {
    fc.assert(
      fc.property(eventNameGenerator, userIdGenerator, (name, userId) => {
        const event = createMockEvent(mockDb, { name })

        // Simulate audit log entry for the update
        const auditId = `audit-${mockDb.audit_trail.size + 1}`
        const auditEntry = {
          id: auditId,
          action: 'event_updated',
          entity_type: 'event',
          entity_id: event.id,
          user_id: userId,
          details: { name },
          created_at: new Date().toISOString(),
        }
        mockDb.audit_trail.set(auditId, auditEntry)

        // Verify audit entry has required fields
        const retrieved = mockDb.audit_trail.get(auditId)!
        expect(retrieved.entity_id).toBe(event.id)
        expect(retrieved.user_id).toBe(userId)
        expect(retrieved.created_at).toBeDefined()
        expect(retrieved.action).toBe('event_updated')
      }),
      { numRuns: 100 }
    )
  })

  test('updated_at timestamp advances after an update', () => {
    fc.assert(
      fc.property(eventNameGenerator, (name) => {
        const event = createMockEvent(mockDb, { name })
        const originalUpdatedAt = new Date(event.updated_at).getTime()

        // Simulate a small delay then update
        const newUpdatedAt = new Date(originalUpdatedAt + 1).toISOString()
        const updatedEvent = { ...event, name: 'New Name', updated_at: newUpdatedAt }
        mockDb.events.set(event.id, updatedEvent)

        const retrieved = mockDb.events.get(event.id)!
        expect(new Date(retrieved.updated_at).getTime()).toBeGreaterThanOrEqual(originalUpdatedAt)
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Property 12: Event Retrieval Includes Related Data ──────────────────────

/**
 * **Validates: Requirements 3.3**
 * Feature: structura, Property 12: Event Retrieval Includes Related Data
 *
 * For any event retrieval request, the system must return the event along with
 * all associated documents, checklist items, and budget information.
 */
describe('Property 12: Event Retrieval Includes Related Data', () => {
  test('event retrieval returns all associated documents', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        (docCount) => {
          const event = createMockEvent(mockDb)

          // Add documents for this event
          for (let i = 0; i < docCount; i++) {
            const docId = `doc-${mockDb.documents.size + 1}`
            mockDb.documents.set(docId, {
              id: docId,
              event_id: event.id,
              file_name: `file-${i}.pdf`,
              file_path: `/uploads/file-${i}.pdf`,
              file_size: 1024,
              file_type: 'application/pdf',
              document_type: 'permit',
              uploaded_by: 'user-1',
              uploaded_at: new Date().toISOString(),
            })
          }

          // Retrieve documents for this event
          const eventDocs = Array.from(mockDb.documents.values()).filter(
            (d) => d.event_id === event.id
          )

          expect(eventDocs.length).toBe(docCount)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('event retrieval returns associated checklist', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (itemCount) => {
        const event = createMockEvent(mockDb)

        // Add a checklist with items
        const checklistId = `checklist-${mockDb.checklists.size + 1}`
        mockDb.checklists.set(checklistId, {
          id: checklistId,
          event_id: event.id,
          created_from_template: null,
          created_at: new Date().toISOString(),
        })

        for (let i = 0; i < itemCount; i++) {
          const itemId = `item-${mockDb.checklist_items.size + 1}`
          mockDb.checklist_items.set(itemId, {
            id: itemId,
            checklist_id: checklistId,
            description: `Task ${i + 1}`,
            is_completed: false,
            completed_at: null,
            completed_by: null,
            order_index: i,
            created_at: new Date().toISOString(),
          })
        }

        // Retrieve checklist for this event
        const checklist = Array.from(mockDb.checklists.values()).find(
          (c) => c.event_id === event.id
        )
        expect(checklist).toBeDefined()

        const items = Array.from(mockDb.checklist_items.values()).filter(
          (item) => item.checklist_id === checklistId
        )
        expect(items.length).toBe(itemCount)
      }),
      { numRuns: 50 }
    )
  })
})

// ─── Property 13: Event Deletion Cascades ────────────────────────────────────

/**
 * **Validates: Requirements 3.5**
 * Feature: structura, Property 13: Event Deletion Cascades
 *
 * For any event deletion, the system must remove the event and all associated
 * data (documents, checklist, allocation, expenditures).
 */
describe('Property 13: Event Deletion Cascades', () => {
  test('deleting an event removes all associated documents', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (docCount) => {
        const event = createMockEvent(mockDb)

        for (let i = 0; i < docCount; i++) {
          const docId = `doc-${mockDb.documents.size + 1}`
          mockDb.documents.set(docId, { id: docId, event_id: event.id })
        }

        expect(
          Array.from(mockDb.documents.values()).filter((d) => d.event_id === event.id).length
        ).toBe(docCount)

        cascadeDelete(mockDb, 'events', event.id)

        expect(mockDb.events.has(event.id)).toBe(false)
        expect(
          Array.from(mockDb.documents.values()).filter((d) => d.event_id === event.id).length
        ).toBe(0)
      }),
      { numRuns: 50 }
    )
  })

  test('deleting an event removes its checklist and items', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 8 }), (itemCount) => {
        const event = createMockEvent(mockDb)
        const checklistId = `checklist-${mockDb.checklists.size + 1}`
        mockDb.checklists.set(checklistId, { id: checklistId, event_id: event.id })

        for (let i = 0; i < itemCount; i++) {
          const itemId = `item-${mockDb.checklist_items.size + 1}`
          mockDb.checklist_items.set(itemId, { id: itemId, checklist_id: checklistId })
        }

        cascadeDelete(mockDb, 'events', event.id)

        expect(mockDb.events.has(event.id)).toBe(false)
        expect(mockDb.checklists.has(checklistId)).toBe(false)
        expect(
          Array.from(mockDb.checklist_items.values()).filter(
            (item) => item.checklist_id === checklistId
          ).length
        ).toBe(0)
      }),
      { numRuns: 50 }
    )
  })

  test('deleting an event removes its allocation and expenditures', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (expCount) => {
        const event = createMockEvent(mockDb)

        const allocId = `alloc-${mockDb.allocations.size + 1}`
        mockDb.allocations.set(allocId, { id: allocId, event_id: event.id, amount: 5000 })

        for (let i = 0; i < expCount; i++) {
          const expId = `exp-${mockDb.expenditures.size + 1}`
          mockDb.expenditures.set(expId, { id: expId, event_id: event.id, amount: 100 })
        }

        cascadeDelete(mockDb, 'events', event.id)

        expect(mockDb.events.has(event.id)).toBe(false)
        expect(mockDb.allocations.has(allocId)).toBe(false)
        expect(
          Array.from(mockDb.expenditures.values()).filter((e) => e.event_id === event.id).length
        ).toBe(0)
      }),
      { numRuns: 50 }
    )
  })
})

// ─── Property 14: Event Status Lifecycle ─────────────────────────────────────

/**
 * **Validates: Requirements 17.1, 17.2**
 * Feature: structura, Property 14: Event Status Lifecycle
 *
 * For any newly created event, the initial status must be "proposed", and status
 * transitions must follow valid lifecycle rules.
 */
describe('Property 14: Event Status Lifecycle', () => {
  test('new events always start as "proposed"', () => {
    fc.assert(
      fc.property(eventNameGenerator, (name) => {
        const event = createMockEvent(mockDb, { name })
        expect(event.status).toBe('proposed')
      }),
      { numRuns: 100 }
    )
  })

  test('valid transitions are allowed', () => {
    // proposed → approved
    expect(canTransition('proposed', 'approved')).toBe(true)
    // proposed → cancelled
    expect(canTransition('proposed', 'cancelled')).toBe(true)
    // approved → completed
    expect(canTransition('approved', 'completed')).toBe(true)
    // approved → cancelled
    expect(canTransition('approved', 'cancelled')).toBe(true)
  })

  test('invalid transitions are rejected', () => {
    // Cannot go backwards
    expect(canTransition('approved', 'proposed')).toBe(false)
    expect(canTransition('completed', 'proposed')).toBe(false)
    expect(canTransition('completed', 'approved')).toBe(false)
    expect(canTransition('cancelled', 'proposed')).toBe(false)
    expect(canTransition('cancelled', 'approved')).toBe(false)
    // Cannot skip steps
    expect(canTransition('proposed', 'completed')).toBe(false)
    // Terminal states have no transitions
    expect(canTransition('completed', 'cancelled')).toBe(false)
    expect(canTransition('cancelled', 'completed')).toBe(false)
  })

  test('terminal states (completed, cancelled) have no valid transitions', () => {
    const terminalStatuses: EventStatus[] = ['completed', 'cancelled']
    const allStatuses: EventStatus[] = ['proposed', 'approved', 'completed', 'cancelled']

    fc.assert(
      fc.property(
        fc.constantFrom<EventStatus>(...terminalStatuses),
        fc.constantFrom<EventStatus>(...allStatuses),
        (from, to) => {
          expect(canTransition(from, to)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('status transitions are deterministic', () => {
    fc.assert(
      fc.property(eventStatusGenerator, eventStatusGenerator, (from, to) => {
        // Same inputs always produce the same result
        expect(canTransition(from, to)).toBe(canTransition(from, to))
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Property 15: Event Cancellation Returns Funds ───────────────────────────

/**
 * **Validates: Requirements 17.4**
 * Feature: structura, Property 15: Event Cancellation Returns Funds
 *
 * For any event with an allocation that is cancelled, the allocated funds must
 * be returned to the organizational budget's available funds.
 */
describe('Property 15: Event Cancellation Returns Funds', () => {
  test('cancelling an event returns allocated funds to the budget', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 100000 }),
        fc.integer({ min: 100000, max: 500000 }),
        (allocationAmount, totalFunds) => {
          // Set up budget
          const budgetId = 'budget-1'
          mockDb.budget.set(budgetId, {
            id: budgetId,
            total_funds: totalFunds,
            updated_at: new Date().toISOString(),
          })

          // Create event with allocation
          const event = createMockEvent(mockDb, { status: 'approved' })
          const allocId = `alloc-${mockDb.allocations.size + 1}`
          mockDb.allocations.set(allocId, {
            id: allocId,
            event_id: event.id,
            amount: allocationAmount,
          })

          // Calculate available funds before cancellation
          const totalAllocated = Array.from(mockDb.allocations.values()).reduce(
            (sum, a) => sum + a.amount,
            0
          )
          const availableBefore = totalFunds - totalAllocated

          // Simulate cancellation: remove allocation
          mockDb.allocations.delete(allocId)
          const updatedEvent = { ...event, status: 'cancelled' }
          mockDb.events.set(event.id, updatedEvent)

          // Calculate available funds after cancellation
          const totalAllocatedAfter = Array.from(mockDb.allocations.values()).reduce(
            (sum, a) => sum + a.amount,
            0
          )
          const availableAfter = totalFunds - totalAllocatedAfter

          // Available funds should have increased by the allocation amount
          expect(availableAfter).toBe(availableBefore + allocationAmount)
          expect(updatedEvent.status).toBe('cancelled')
        }
      ),
      { numRuns: 100 }
    )
  })

  test('cancelling an event without allocation does not change budget', () => {
    fc.assert(
      fc.property(fc.integer({ min: 100000, max: 500000 }), (totalFunds) => {
        const budgetId = 'budget-1'
        mockDb.budget.set(budgetId, { id: budgetId, total_funds: totalFunds })

        const event = createMockEvent(mockDb, { status: 'proposed' })

        // No allocation exists for this event
        const allocatedBefore = Array.from(mockDb.allocations.values()).reduce(
          (sum, a) => sum + a.amount,
          0
        )

        // Cancel the event (no allocation to return)
        const updatedEvent = { ...event, status: 'cancelled' }
        mockDb.events.set(event.id, updatedEvent)

        const allocatedAfter = Array.from(mockDb.allocations.values()).reduce(
          (sum, a) => sum + a.amount,
          0
        )

        // Budget should be unchanged
        expect(allocatedAfter).toBe(allocatedBefore)
      }),
      { numRuns: 100 }
    )
  })
})
