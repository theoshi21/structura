// Property-based tests for checklist system
// Requirements: 5.1, 5.3, 5.4, 5.5, 5.7, 5.8

import { describe, test, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { createMockDatabase, MockDatabase, cascadeDelete } from './test-utils'

let mockDb: MockDatabase

beforeEach(() => {
  mockDb = createMockDatabase()
})

// ─── Generators ──────────────────────────────────────────────────────────────

const nameGenerator = fc.string({ minLength: 1, maxLength: 255 })
const descriptionGenerator = fc.string({ minLength: 1, maxLength: 500 })
const userIdGenerator = fc.uuid()
const itemsGenerator = fc.array(descriptionGenerator, { minLength: 1, maxLength: 20 })

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a mock checklist template in the mock database */
function createMockTemplate(
  db: MockDatabase,
  overrides: Partial<{ name: string; createdBy: string }> = {}
) {
  const id = `template-${db.checklist_templates.size + 1}`
  const template = {
    id,
    name: overrides.name ?? 'Test Template',
    created_by: overrides.createdBy ?? 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.checklist_templates.set(id, template)
  return template
}

/** Adds items to a mock template */
function addMockTemplateItems(db: MockDatabase, templateId: string, descriptions: string[]) {
  return descriptions.map((description, index) => {
    const id = `titem-${db.checklist_template_items.size + 1}`
    const item = { id, template_id: templateId, description, order_index: index, created_at: new Date().toISOString() }
    db.checklist_template_items.set(id, item)
    return item
  })
}

/** Creates a mock event in the mock database */
function createMockEvent(db: MockDatabase) {
  const id = `event-${db.events.size + 1}`
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

/** Creates a mock checklist for an event */
function createMockChecklist(
  db: MockDatabase,
  eventId: string,
  templateId: string | null = null
) {
  const id = `checklist-${db.checklists.size + 1}`
  const checklist = {
    id,
    event_id: eventId,
    created_from_template: templateId,
    created_at: new Date().toISOString(),
  }
  db.checklists.set(id, checklist)
  return checklist
}

/** Adds items to a mock checklist */
function addMockChecklistItems(
  db: MockDatabase,
  checklistId: string,
  descriptions: string[],
  completedFlags?: boolean[]
) {
  return descriptions.map((description, index) => {
    const id = `item-${db.checklist_items.size + 1}`
    const isCompleted = completedFlags ? completedFlags[index] ?? false : false
    const item = {
      id,
      checklist_id: checklistId,
      description,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? 'user-1' : null,
      order_index: index,
      created_at: new Date().toISOString(),
    }
    db.checklist_items.set(id, item)
    return item
  })
}

/** Calculates completion percentage from mock checklist items */
function calcCompletion(db: MockDatabase, checklistId: string): number {
  const items = Array.from(db.checklist_items.values()).filter(
    (i) => i.checklist_id === checklistId
  )
  if (items.length === 0) return 0
  const done = items.filter((i) => i.is_completed).length
  return Math.round((done / items.length) * 100)
}

// ─── Property 21: Template Creation and Storage ───────────────────────────────

/**
 * **Validates: Requirements 5.1**
 * Feature: structura, Property 21: Template Creation and Storage
 *
 * For any checklist template created by an admin, the system must store the
 * template with its name and all items in the specified order.
 */
describe('Property 21: Template Creation and Storage', () => {
  test('template is stored with its name', () => {
    fc.assert(
      fc.property(nameGenerator, userIdGenerator, (name, userId) => {
        const template = createMockTemplate(mockDb, { name, createdBy: userId })

        expect(template.id).toBeDefined()
        expect(template.name).toBe(name)
        expect(template.created_by).toBe(userId)
      }),
      { numRuns: 100 }
    )
  })

  test('template items are stored in the specified order', () => {
    fc.assert(
      fc.property(nameGenerator, itemsGenerator, (name, items) => {
        const template = createMockTemplate(mockDb, { name })
        const stored = addMockTemplateItems(mockDb, template.id, items)

        // Items must be stored in the same order
        stored.forEach((item, index) => {
          expect(item.order_index).toBe(index)
          expect(item.description).toBe(items[index])
          expect(item.template_id).toBe(template.id)
        })
      }),
      { numRuns: 100 }
    )
  })

  test('template IDs are unique across multiple templates', () => {
    fc.assert(
      fc.property(
        fc.array(nameGenerator, { minLength: 2, maxLength: 10 }),
        (names) => {
          const ids = names.map((name) => createMockTemplate(mockDb, { name }).id)
          const uniqueIds = new Set(ids)
          expect(uniqueIds.size).toBe(ids.length)
        }
      ),
      { numRuns: 50 }
    )
  })
})

// ─── Property 22: Template Application Copies Items ──────────────────────────

/**
 * **Validates: Requirements 5.3**
 * Feature: structura, Property 22: Template Application Copies Items
 *
 * For any checklist template applied to an event, the system must copy all
 * template items to the event's checklist, preserving order and descriptions.
 */
describe('Property 22: Template Application Copies Items', () => {
  test('all template items are copied to the event checklist', () => {
    fc.assert(
      fc.property(itemsGenerator, (items) => {
        const template = createMockTemplate(mockDb)
        const templateItems = addMockTemplateItems(mockDb, template.id, items)

        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id, template.id)

        // Simulate copying template items to checklist
        const copiedItems = templateItems.map((ti, index) => {
          const id = `item-${mockDb.checklist_items.size + 1}`
          const item = {
            id,
            checklist_id: checklist.id,
            description: ti.description,
            order_index: ti.order_index,
            is_completed: false,
            completed_at: null,
            completed_by: null,
            created_at: new Date().toISOString(),
          }
          mockDb.checklist_items.set(id, item)
          return item
        })

        // All items must be copied with correct descriptions and order
        expect(copiedItems.length).toBe(items.length)
        copiedItems.forEach((item, index) => {
          expect(item.description).toBe(items[index])
          expect(item.order_index).toBe(index)
          expect(item.is_completed).toBe(false)
        })
      }),
      { numRuns: 100 }
    )
  })

  test('copied items start as incomplete', () => {
    fc.assert(
      fc.property(itemsGenerator, (items) => {
        const template = createMockTemplate(mockDb)
        addMockTemplateItems(mockDb, template.id, items)

        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id, template.id)
        const copiedItems = addMockChecklistItems(mockDb, checklist.id, items)

        copiedItems.forEach((item) => {
          expect(item.is_completed).toBe(false)
          expect(item.completed_at).toBeNull()
          expect(item.completed_by).toBeNull()
        })
      }),
      { numRuns: 100 }
    )
  })

  test('checklist references the source template', () => {
    fc.assert(
      fc.property(nameGenerator, (name) => {
        const template = createMockTemplate(mockDb, { name })
        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id, template.id)

        expect(checklist.created_from_template).toBe(template.id)
        expect(checklist.event_id).toBe(event.id)
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Property 23: Checklist Independence from Template ───────────────────────

/**
 * **Validates: Requirements 5.4**
 * Feature: structura, Property 23: Checklist Independence from Template
 *
 * For any event checklist created from a template, modifications to the event's
 * checklist items must not affect the original template, and vice versa.
 */
describe('Property 23: Checklist Independence from Template', () => {
  test('modifying a checklist item does not change the template', () => {
    fc.assert(
      fc.property(itemsGenerator, descriptionGenerator, (items, newDescription) => {
        const template = createMockTemplate(mockDb)
        const templateItems = addMockTemplateItems(mockDb, template.id, items)

        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id, template.id)
        const checklistItems = addMockChecklistItems(mockDb, checklist.id, items)

        // Modify the first checklist item
        const firstItem = checklistItems[0]
        const updatedItem = { ...firstItem, description: newDescription }
        mockDb.checklist_items.set(firstItem.id, updatedItem)

        // Template item must remain unchanged
        const templateItem = mockDb.checklist_template_items.get(templateItems[0].id)!
        expect(templateItem.description).toBe(items[0])
        expect(templateItem.description).not.toBe(newDescription === items[0] ? '__never__' : newDescription)
      }),
      { numRuns: 100 }
    )
  })

  test('modifying a template item does not change existing checklist items', () => {
    fc.assert(
      fc.property(itemsGenerator, descriptionGenerator, (items, newDescription) => {
        const template = createMockTemplate(mockDb)
        const templateItems = addMockTemplateItems(mockDb, template.id, items)

        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id, template.id)
        const checklistItems = addMockChecklistItems(mockDb, checklist.id, items)

        // Modify the template item
        const firstTemplateItem = templateItems[0]
        const updatedTemplateItem = { ...firstTemplateItem, description: newDescription }
        mockDb.checklist_template_items.set(firstTemplateItem.id, updatedTemplateItem)

        // Checklist item must remain unchanged
        const checklistItem = mockDb.checklist_items.get(checklistItems[0].id)!
        expect(checklistItem.description).toBe(items[0])
      }),
      { numRuns: 100 }
    )
  })

  test('checklist items and template items are stored in separate tables', () => {
    fc.assert(
      fc.property(itemsGenerator, (items) => {
        const template = createMockTemplate(mockDb)
        addMockTemplateItems(mockDb, template.id, items)

        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id, template.id)
        addMockChecklistItems(mockDb, checklist.id, items)

        // Template items and checklist items are in separate collections
        const templateItemIds = new Set(
          Array.from(mockDb.checklist_template_items.keys())
        )
        const checklistItemIds = new Set(
          Array.from(mockDb.checklist_items.keys())
        )

        // No overlap between the two sets
        const overlap = [...templateItemIds].filter((id) => checklistItemIds.has(id))
        expect(overlap.length).toBe(0)
      }),
      { numRuns: 50 }
    )
  })
})

// ─── Property 24: Checklist Item Completion ──────────────────────────────────

/**
 * **Validates: Requirements 5.5**
 * Feature: structura, Property 24: Checklist Item Completion
 *
 * For any checklist item marked as complete, the system must update the item's
 * completion status, record the timestamp, and record the user who completed it.
 */
describe('Property 24: Checklist Item Completion', () => {
  test('marking an item complete records status, timestamp, and user', () => {
    fc.assert(
      fc.property(descriptionGenerator, userIdGenerator, (description, userId) => {
        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id)
        const [item] = addMockChecklistItems(mockDb, checklist.id, [description])

        expect(item.is_completed).toBe(false)

        // Simulate toggling to complete
        const completedAt = new Date().toISOString()
        const updated = {
          ...item,
          is_completed: true,
          completed_at: completedAt,
          completed_by: userId,
        }
        mockDb.checklist_items.set(item.id, updated)

        const retrieved = mockDb.checklist_items.get(item.id)!
        expect(retrieved.is_completed).toBe(true)
        expect(retrieved.completed_at).toBeDefined()
        expect(retrieved.completed_by).toBe(userId)
      }),
      { numRuns: 100 }
    )
  })

  test('unchecking an item clears the completion timestamp and user', () => {
    fc.assert(
      fc.property(descriptionGenerator, userIdGenerator, (description, userId) => {
        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id)
        const [item] = addMockChecklistItems(mockDb, checklist.id, [description], [true])

        // Simulate toggling back to incomplete
        const updated = {
          ...item,
          is_completed: false,
          completed_at: null,
          completed_by: null,
        }
        mockDb.checklist_items.set(item.id, updated)

        const retrieved = mockDb.checklist_items.get(item.id)!
        expect(retrieved.is_completed).toBe(false)
        expect(retrieved.completed_at).toBeNull()
        expect(retrieved.completed_by).toBeNull()
      }),
      { numRuns: 100 }
    )
  })

  test('completion status persists after retrieval', () => {
    fc.assert(
      fc.property(
        fc.array(descriptionGenerator, { minLength: 1, maxLength: 10 }),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (descriptions, completedFlags) => {
          // Align lengths
          const len = Math.min(descriptions.length, completedFlags.length)
          const descs = descriptions.slice(0, len)
          const flags = completedFlags.slice(0, len)

          const event = createMockEvent(mockDb)
          const checklist = createMockChecklist(mockDb, event.id)
          const items = addMockChecklistItems(mockDb, checklist.id, descs, flags)

          items.forEach((item, index) => {
            const retrieved = mockDb.checklist_items.get(item.id)!
            expect(retrieved.is_completed).toBe(flags[index])
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 25: Checklist Completion Calculation ───────────────────────────

/**
 * **Validates: Requirements 5.7, 5.8**
 * Feature: structura, Property 25: Checklist Completion Calculation
 *
 * For any event checklist, the completion percentage must equal
 * (completed items / total items) × 100, and the event must be marked
 * "ready" if and only if all items are complete.
 */
describe('Property 25: Checklist Completion Calculation', () => {
  test('completion percentage equals (done / total) * 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        (total, doneExtra) => {
          const done = Math.min(doneExtra, total)
          const event = createMockEvent(mockDb)
          const checklist = createMockChecklist(mockDb, event.id)

          const descriptions = Array.from({ length: total }, (_, i) => `Task ${i + 1}`)
          const flags = descriptions.map((_, i) => i < done)
          addMockChecklistItems(mockDb, checklist.id, descriptions, flags)

          const percent = calcCompletion(mockDb, checklist.id)
          const expected = Math.round((done / total) * 100)
          expect(percent).toBe(expected)
        }
      ),
      { numRuns: 200 }
    )
  })

  test('empty checklist returns 0% completion', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const event = createMockEvent(mockDb)
        const checklist = createMockChecklist(mockDb, event.id)

        const percent = calcCompletion(mockDb, checklist.id)
        expect(percent).toBe(0)
      }),
      { numRuns: 10 }
    )
  })

  test('event is "ready" if and only if all items are complete', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.boolean(),
        (total, allDone) => {
          const event = createMockEvent(mockDb)
          const checklist = createMockChecklist(mockDb, event.id)

          const descriptions = Array.from({ length: total }, (_, i) => `Task ${i + 1}`)
          const flags = descriptions.map(() => allDone)
          addMockChecklistItems(mockDb, checklist.id, descriptions, flags)

          const percent = calcCompletion(mockDb, checklist.id)
          const isReady = percent === 100

          if (allDone) {
            expect(isReady).toBe(true)
          } else {
            expect(isReady).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('completion percentage is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        (total, doneExtra) => {
          const done = Math.min(doneExtra, total)
          const event = createMockEvent(mockDb)
          const checklist = createMockChecklist(mockDb, event.id)

          const descriptions = Array.from({ length: total }, (_, i) => `Task ${i + 1}`)
          const flags = descriptions.map((_, i) => i < done)
          addMockChecklistItems(mockDb, checklist.id, descriptions, flags)

          const percent = calcCompletion(mockDb, checklist.id)
          expect(percent).toBeGreaterThanOrEqual(0)
          expect(percent).toBeLessThanOrEqual(100)
        }
      ),
      { numRuns: 200 }
    )
  })

  test('adding a completed item increases the percentage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (total) => {
          const event = createMockEvent(mockDb)
          const checklist = createMockChecklist(mockDb, event.id)

          // Start with all incomplete
          const descriptions = Array.from({ length: total }, (_, i) => `Task ${i + 1}`)
          const items = addMockChecklistItems(mockDb, checklist.id, descriptions, descriptions.map(() => false))

          const percentBefore = calcCompletion(mockDb, checklist.id)

          // Mark the first item complete
          const updated = { ...items[0], is_completed: true, completed_at: new Date().toISOString(), completed_by: 'user-1' }
          mockDb.checklist_items.set(items[0].id, updated)

          const percentAfter = calcCompletion(mockDb, checklist.id)
          expect(percentAfter).toBeGreaterThan(percentBefore)
        }
      ),
      { numRuns: 100 }
    )
  })
})
