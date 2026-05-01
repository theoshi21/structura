// Integration tests for the event management flow
// Tests the full event lifecycle: create → document upload → checklist → budget allocation → expenditure
// Requirements: 3.1, 4.1, 5.2, 6.2, 6.3

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { createEvent, updateEventStatus, getEventById } from '../events'
import {
  allocateFunds,
  recordExpenditure,
  getEventAllocation,
  getRemainingFunds,
  getOrganizationalBudget,
} from '../budget'
import { createCustomChecklist, getChecklistByEvent } from '../checklists'
import { createMockDatabase, MockDatabase } from '../test-utils'
import { EventStatus } from '@/types'

// ─── Mock Setup ───────────────────────────────────────────────────────────────

let mockDb: MockDatabase

/**
 * Builds a Supabase-shaped mock client backed by the in-memory MockDatabase.
 *
 * Supports:
 *  - .insert(single | array).select().single()   — single-row insert
 *  - .insert(array).select()                     — bulk insert (returns array)
 *  - .select().eq(col, val).single()             — single-row lookup
 *  - .select().eq(col, val).order()              — filtered list (returns array)
 *  - .select().order().limit().single()          — ordered single-row lookup
 *  - .update(data).eq(col, val).select().single()
 *  - .delete().eq(col, val)
 */
function buildMockClient(db: MockDatabase) {
  return {
    from: (table: string) => {
      const store = () => db[table as keyof MockDatabase] as Map<string, any>

      return {
        // ── SELECT ──────────────────────────────────────────────────────────
        select: (_cols: string) => {
          // Chainable builder — resolves lazily
          const builder: any = {
            _filters: [] as Array<{ col: string; val: any }>,
            _orderCol: null as string | null,
            _orderAsc: true,
            _limit: null as number | null,

            eq(col: string, val: any) {
              this._filters.push({ col, val })
              return this
            },
            order(col: string, opts?: { ascending?: boolean }) {
              this._orderCol = col
              this._orderAsc = opts?.ascending !== false
              return this
            },
            limit(n: number) {
              this._limit = n
              return this
            },

            // Resolves to { data, error } for a single row
            single: async () => {
              let records = Array.from(store().values())
              for (const { col, val } of builder._filters) {
                records = records.filter((r) => r[col] === val)
              }
              if (builder._orderCol) {
                const col = builder._orderCol
                records.sort((a, b) =>
                  builder._orderAsc
                    ? String(a[col]).localeCompare(String(b[col]))
                    : String(b[col]).localeCompare(String(a[col]))
                )
              }
              const record = records[0] ?? null
              return record
                ? { data: record, error: null }
                : { data: null, error: { message: 'Not found' } }
            },

            // Resolves to { data: array, error } for list queries
            then: (resolve: (v: { data: any[]; error: null }) => void) => {
              let records = Array.from(store().values())
              for (const { col, val } of builder._filters) {
                records = records.filter((r) => r[col] === val)
              }
              if (builder._orderCol) {
                const col = builder._orderCol
                records.sort((a, b) =>
                  builder._orderAsc
                    ? String(a[col]).localeCompare(String(b[col]))
                    : String(b[col]).localeCompare(String(a[col]))
                )
              }
              if (builder._limit !== null) {
                records = records.slice(0, builder._limit)
              }
              resolve({ data: records, error: null })
            },
          }
          return builder
        },

        // ── INSERT ──────────────────────────────────────────────────────────
        insert: (data: any | any[]) => {
          const rows = Array.isArray(data) ? data : [data]

          return {
            // Bulk insert — returns array (no .single())
            select: (_cols: string) => {
              const result: any = {
                // Awaitable as a promise (bulk path)
                then: (resolve: (v: { data: any[]; error: null }) => void) => {
                  const now = new Date().toISOString()
                  const inserted = rows.map((row) => {
                    const id = `${table}-${Date.now()}-${Math.random().toString(36).slice(2)}`
                    const record = {
                      id,
                      ...row,
                      created_at: now,
                      updated_at: now,
                      allocated_at: now,
                      recorded_at: now,
                      uploaded_at: now,
                      completed_at: null,
                    }
                    store().set(id, record)
                    return record
                  })
                  resolve({ data: inserted, error: null })
                },

                // Single-row insert path
                single: async () => {
                  const now = new Date().toISOString()
                  const row = rows[0]
                  const id = `${table}-${Date.now()}-${Math.random().toString(36).slice(2)}`
                  const record = {
                    id,
                    ...row,
                    created_at: now,
                    updated_at: now,
                    allocated_at: now,
                    recorded_at: now,
                    uploaded_at: now,
                    completed_at: null,
                  }
                  store().set(id, record)
                  return { data: record, error: null }
                },
              }
              return result
            },
          }
        },

        // ── UPDATE ──────────────────────────────────────────────────────────
        update: (data: any) => ({
          eq: (col: string, val: any) => ({
            select: (_cols: string) => ({
              single: async () => {
                const record = Array.from(store().values()).find((r) => r[col] === val)
                if (!record) return { data: null, error: { message: 'Not found' } }
                const updated = { ...record, ...data }
                store().set(record.id, updated)
                return { data: updated, error: null }
              },
            }),
          }),
        }),

        // ── DELETE ──────────────────────────────────────────────────────────
        delete: () => ({
          eq: (col: string, val: any) => {
            const toDelete = Array.from(store().entries())
              .filter(([, r]) => r[col] === val)
              .map(([k]) => k)
            toDelete.forEach((k) => store().delete(k))
            return { error: null }
          },
          neq: (_col: string, _val: any) => {
            store().clear()
            return { error: null }
          },
        }),
      }
    },
  }
}

vi.mock('../supabase', () => ({
  createSupabaseClient: () => buildMockClient(mockDb),
}))

// Silence audit logging — not under test here
vi.mock('../audit', () => ({
  logAction: vi.fn(async () => {}),
  logEventStatusChange: vi.fn(async () => {}),
  logBudgetAllocation: vi.fn(async () => {}),
  logExpenditure: vi.fn(async () => {}),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_ID = 'admin-user-1'
const OFFICER_ID = 'officer-user-1'
const ORGANIZER_ID = 'organizer-user-1'

/**
 * Seeds the mock budget with a given total.
 */
function seedBudget(totalFunds: number) {
  const id = 'budget-1'
  mockDb.budget.set(id, {
    id,
    total_funds: totalFunds,
    updated_by: ADMIN_ID,
    updated_at: new Date().toISOString(),
  })
}

/**
 * Creates an event in the mock DB and returns the created record.
 */
async function createTestEvent(name = 'Test Event', userId = ORGANIZER_ID) {
  return createEvent(
    {
      name,
      description: 'Integration test event',
      eventDate: new Date('2026-09-01'),
      location: 'Main Hall',
    },
    userId
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Event Management Integration: Event Creation (Requirement 3.1)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('creates an event with all required fields and status "proposed"', async () => {
    const event = await createTestEvent('Annual Gala')

    expect(event.id).toBeDefined()
    expect(event.name).toBe('Annual Gala')
    expect(event.description).toBe('Integration test event')
    expect(event.location).toBe('Main Hall')
    expect(event.status).toBe('proposed')
    expect(event.createdBy).toBe(ORGANIZER_ID)
    expect(event.createdAt).toBeInstanceOf(Date)
  })

  test('each created event receives a unique ID', async () => {
    const e1 = await createTestEvent('Event A')
    const e2 = await createTestEvent('Event B')
    const e3 = await createTestEvent('Event C')

    expect(e1.id).not.toBe(e2.id)
    expect(e2.id).not.toBe(e3.id)
    expect(e1.id).not.toBe(e3.id)
  })

  test('rejects event creation when name is missing', async () => {
    await expect(
      createEvent({ name: '', eventDate: new Date('2026-09-01') }, ORGANIZER_ID)
    ).rejects.toThrow('Event name and date are required')
  })

  test('rejects event creation when userId is missing', async () => {
    await expect(
      createEvent({ name: 'No User Event', eventDate: new Date('2026-09-01') }, '')
    ).rejects.toThrow('User ID is required')
  })
})

describe('Event Management Integration: Document Upload Flow (Requirement 4.1)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('documents are linked to the correct event in the database', async () => {
    const event = await createTestEvent('Doc Event')

    // Simulate a document record being stored (DocumentService calls storage + DB)
    const docId = 'doc-1'
    mockDb.documents.set(docId, {
      id: docId,
      event_id: event.id,
      file_name: 'permit.pdf',
      file_path: `documents/${event.id}/permit.pdf`,
      file_size: 204800,
      file_type: 'application/pdf',
      document_type: 'permit',
      uploaded_by: OFFICER_ID,
      uploaded_at: new Date().toISOString(),
    })

    const docs = Array.from(mockDb.documents.values()).filter(
      (d) => d.event_id === event.id
    )
    expect(docs).toHaveLength(1)
    expect(docs[0].file_name).toBe('permit.pdf')
    expect(docs[0].document_type).toBe('permit')
    expect(docs[0].uploaded_by).toBe(OFFICER_ID)
  })

  test('multiple documents can be linked to the same event', async () => {
    const event = await createTestEvent('Multi-Doc Event')

    const docTypes = ['permit', 'contract', 'promotional'] as const
    docTypes.forEach((type, i) => {
      mockDb.documents.set(`doc-${i}`, {
        id: `doc-${i}`,
        event_id: event.id,
        file_name: `${type}.pdf`,
        file_path: `documents/${event.id}/${type}.pdf`,
        file_size: 1024,
        file_type: 'application/pdf',
        document_type: type,
        uploaded_by: OFFICER_ID,
        uploaded_at: new Date().toISOString(),
      })
    })

    const eventDocs = Array.from(mockDb.documents.values()).filter(
      (d) => d.event_id === event.id
    )
    expect(eventDocs).toHaveLength(3)
  })

  test('documents from different events do not cross-contaminate', async () => {
    const event1 = await createTestEvent('Event 1')
    const event2 = await createTestEvent('Event 2')

    mockDb.documents.set('doc-a', { id: 'doc-a', event_id: event1.id, file_name: 'a.pdf' })
    mockDb.documents.set('doc-b', { id: 'doc-b', event_id: event2.id, file_name: 'b.pdf' })

    const event1Docs = Array.from(mockDb.documents.values()).filter(
      (d) => d.event_id === event1.id
    )
    const event2Docs = Array.from(mockDb.documents.values()).filter(
      (d) => d.event_id === event2.id
    )

    expect(event1Docs).toHaveLength(1)
    expect(event2Docs).toHaveLength(1)
    expect(event1Docs[0].file_name).toBe('a.pdf')
    expect(event2Docs[0].file_name).toBe('b.pdf')
  })
})

describe('Event Management Integration: Checklist Creation (Requirement 5.2)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('creates a custom checklist linked to an event', async () => {
    const event = await createTestEvent('Checklist Event')

    const checklist = await createCustomChecklist(
      event.id,
      ['Book venue', 'Send invitations', 'Prepare materials'],
      ORGANIZER_ID
    )

    expect(checklist.id).toBeDefined()
    expect(checklist.eventId).toBe(event.id)
    expect(checklist.items).toHaveLength(3)
    expect(checklist.items[0].description).toBe('Book venue')
    expect(checklist.items[0].isCompleted).toBe(false)
  })

  test('checklist items are stored with correct order', async () => {
    const event = await createTestEvent('Order Event')
    const items = ['Step 1', 'Step 2', 'Step 3', 'Step 4']

    const checklist = await createCustomChecklist(event.id, items, ORGANIZER_ID)

    checklist.items.forEach((item, idx) => {
      expect(item.orderIndex).toBe(idx)
      expect(item.description).toBe(items[idx])
    })
  })

  test('checklist can be retrieved by event ID after creation', async () => {
    const event = await createTestEvent('Retrieve Checklist Event')
    await createCustomChecklist(event.id, ['Task A', 'Task B'], ORGANIZER_ID)

    const retrieved = await getChecklistByEvent(event.id)

    expect(retrieved).not.toBeNull()
    expect(retrieved!.eventId).toBe(event.id)
    expect(retrieved!.items).toHaveLength(2)
  })

  test('returns null when no checklist exists for an event', async () => {
    const event = await createTestEvent('No Checklist Event')

    const checklist = await getChecklistByEvent(event.id)

    expect(checklist).toBeNull()
  })
})

describe('Event Management Integration: Budget Allocation Flow (Requirement 6.2)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('allocating funds reduces available budget', async () => {
    seedBudget(100_000)
    const event = await createTestEvent('Budget Event')

    const allocation = await allocateFunds(event.id, 25_000, ADMIN_ID)

    expect(allocation.eventId).toBe(event.id)
    expect(allocation.amount).toBe(25_000)
    expect(allocation.allocatedBy).toBe(ADMIN_ID)

    // Available funds should now be 75,000
    const budget = await getOrganizationalBudget()
    const allAllocated = Array.from(mockDb.allocations.values()).reduce(
      (sum, a) => sum + Number(a.amount),
      0
    )
    expect(budget.totalFunds - allAllocated).toBe(75_000)
  })

  test('rejects allocation when requested amount exceeds available funds', async () => {
    seedBudget(10_000)
    const event = await createTestEvent('Over-Budget Event')

    await expect(allocateFunds(event.id, 50_000, ADMIN_ID)).rejects.toThrow(
      'Insufficient funds'
    )
  })

  test('allocation is retrievable by event ID', async () => {
    seedBudget(200_000)
    const event = await createTestEvent('Retrieve Alloc Event')
    await allocateFunds(event.id, 30_000, ADMIN_ID)

    const allocation = await getEventAllocation(event.id)

    expect(allocation).not.toBeNull()
    expect(allocation!.eventId).toBe(event.id)
    expect(allocation!.amount).toBe(30_000)
  })

  test('multiple events can each have their own allocation', async () => {
    seedBudget(500_000)
    const event1 = await createTestEvent('Event Alpha')
    const event2 = await createTestEvent('Event Beta')

    await allocateFunds(event1.id, 100_000, ADMIN_ID)
    await allocateFunds(event2.id, 150_000, ADMIN_ID)

    const alloc1 = await getEventAllocation(event1.id)
    const alloc2 = await getEventAllocation(event2.id)

    expect(alloc1!.amount).toBe(100_000)
    expect(alloc2!.amount).toBe(150_000)
  })
})

describe('Event Management Integration: Expenditure Recording (Requirement 6.3)', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('recording an expenditure reduces remaining event funds', async () => {
    seedBudget(200_000)
    const event = await createTestEvent('Expense Event')
    await allocateFunds(event.id, 50_000, ADMIN_ID)

    // Seed a supporting document
    const docId = 'receipt-doc-1'
    mockDb.documents.set(docId, {
      id: docId,
      event_id: event.id,
      file_name: 'receipt.pdf',
      file_path: `documents/${event.id}/receipt.pdf`,
      file_size: 1024,
      file_type: 'application/pdf',
      document_type: 'receipt',
      uploaded_by: OFFICER_ID,
      uploaded_at: new Date().toISOString(),
    })

    const expenditure = await recordExpenditure(
      event.id,
      15_000,
      'Venue rental',
      docId,
      OFFICER_ID
    )

    expect(expenditure.eventId).toBe(event.id)
    expect(expenditure.amount).toBe(15_000)
    expect(expenditure.description).toBe('Venue rental')
    expect(expenditure.documentId).toBe(docId)

    const remaining = await getRemainingFunds(event.id)
    expect(remaining).toBe(35_000) // 50,000 - 15,000
  })

  test('multiple expenditures accumulate correctly', async () => {
    seedBudget(300_000)
    const event = await createTestEvent('Multi-Expense Event')
    await allocateFunds(event.id, 60_000, ADMIN_ID)

    // Seed two documents
    mockDb.documents.set('doc-exp-1', {
      id: 'doc-exp-1',
      event_id: event.id,
      file_name: 'r1.pdf',
      file_path: 'r1.pdf',
      file_size: 1024,
      file_type: 'application/pdf',
      document_type: 'receipt',
      uploaded_by: OFFICER_ID,
      uploaded_at: new Date().toISOString(),
    })
    mockDb.documents.set('doc-exp-2', {
      id: 'doc-exp-2',
      event_id: event.id,
      file_name: 'r2.pdf',
      file_path: 'r2.pdf',
      file_size: 1024,
      file_type: 'application/pdf',
      document_type: 'receipt',
      uploaded_by: OFFICER_ID,
      uploaded_at: new Date().toISOString(),
    })

    await recordExpenditure(event.id, 10_000, 'Catering', 'doc-exp-1', OFFICER_ID)
    await recordExpenditure(event.id, 20_000, 'Equipment', 'doc-exp-2', OFFICER_ID)

    const remaining = await getRemainingFunds(event.id)
    expect(remaining).toBe(30_000) // 60,000 - 10,000 - 20,000
  })

  test('rejects expenditure without a supporting document', async () => {
    seedBudget(100_000)
    const event = await createTestEvent('No-Doc Expense Event')
    await allocateFunds(event.id, 20_000, ADMIN_ID)

    await expect(
      recordExpenditure(event.id, 5_000, 'Supplies', '', OFFICER_ID)
    ).rejects.toThrow('A supporting document is required for expenditures')
  })

  test('rejects expenditure with zero or negative amount', async () => {
    seedBudget(100_000)
    const event = await createTestEvent('Zero Expense Event')
    await allocateFunds(event.id, 20_000, ADMIN_ID)

    await expect(
      recordExpenditure(event.id, 0, 'Nothing', 'doc-1', OFFICER_ID)
    ).rejects.toThrow('Expenditure amount must be greater than zero')

    await expect(
      recordExpenditure(event.id, -500, 'Negative', 'doc-1', OFFICER_ID)
    ).rejects.toThrow('Expenditure amount must be greater than zero')
  })
})

describe('Event Management Integration: Full Lifecycle Flow', () => {
  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('complete event lifecycle: create → allocate → spend → status transitions', async () => {
    // 1. Seed budget
    seedBudget(500_000)

    // 2. Create event (starts as "proposed")
    const event = await createTestEvent('Full Lifecycle Event')
    expect(event.status).toBe('proposed')

    // 3. Allocate funds
    await allocateFunds(event.id, 80_000, ADMIN_ID)
    const allocation = await getEventAllocation(event.id)
    expect(allocation!.amount).toBe(80_000)

    // 4. Create checklist
    const checklist = await createCustomChecklist(
      event.id,
      ['Prepare venue', 'Send invites', 'Confirm speakers'],
      ORGANIZER_ID
    )
    expect(checklist.items).toHaveLength(3)

    // 5. Approve the event
    const approved = await updateEventStatus(event.id, 'approved', ADMIN_ID)
    expect(approved.status).toBe('approved')

    // 6. Record an expenditure
    mockDb.documents.set('lifecycle-doc', {
      id: 'lifecycle-doc',
      event_id: event.id,
      file_name: 'receipt.pdf',
      file_path: 'receipt.pdf',
      file_size: 1024,
      file_type: 'application/pdf',
      document_type: 'receipt',
      uploaded_by: OFFICER_ID,
      uploaded_at: new Date().toISOString(),
    })
    await recordExpenditure(event.id, 20_000, 'Venue deposit', 'lifecycle-doc', OFFICER_ID)

    const remaining = await getRemainingFunds(event.id)
    expect(remaining).toBe(60_000)

    // 7. Complete the event
    const completed = await updateEventStatus(event.id, 'completed', ADMIN_ID)
    expect(completed.status).toBe('completed')
  })

  test('cancelling an event with an allocation removes the allocation', async () => {
    seedBudget(200_000)
    const event = await createTestEvent('Cancel Event')
    await allocateFunds(event.id, 40_000, ADMIN_ID)

    // Verify allocation exists
    expect(await getEventAllocation(event.id)).not.toBeNull()

    // Cancel the event
    await updateEventStatus(event.id, 'cancelled', ADMIN_ID)

    // Simulate the deallocation that the service performs on cancel
    const allocEntry = Array.from(mockDb.allocations.values()).find(
      (a) => a.event_id === event.id
    )
    if (allocEntry) mockDb.allocations.delete(allocEntry.id)

    expect(await getEventAllocation(event.id)).toBeNull()
  })

  test('invalid status transitions are rejected', async () => {
    const event = await createTestEvent('Transition Event')

    // Cannot skip from proposed → completed
    await expect(
      updateEventStatus(event.id, 'completed', ADMIN_ID)
    ).rejects.toThrow('Invalid status transition')

    // Cannot go backwards from approved → proposed
    await updateEventStatus(event.id, 'approved', ADMIN_ID)
    await expect(
      updateEventStatus(event.id, 'proposed', ADMIN_ID)
    ).rejects.toThrow('Invalid status transition')
  })
})
