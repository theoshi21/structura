/**
 * Property-based tests for database schema
 * Feature: structura
 */

import { describe, test, expect } from 'vitest'
import fc from 'fast-check'
import { createMockDatabase, validateReferentialIntegrity, cascadeDelete, type MockDatabase } from './test-utils'

// Custom generators for database records
const uuidArb = fc.uuid()

const userArb = fc.record({
  id: uuidArb,
  email: fc.emailAddress(),
  username: fc.string({ minLength: 3, maxLength: 50 }),
  password_hash: fc.string({ minLength: 60, maxLength: 60 }), // bcrypt hash length
  role: fc.constantFrom('organizer', 'officer', 'admin'),
  created_at: fc.date(),
  updated_at: fc.date(),
})

const eventArb = (userIds: string[]) => fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string({ maxLength: 1000 })),
  event_date: fc.date(),
  location: fc.option(fc.string({ maxLength: 255 })),
  status: fc.constantFrom('proposed', 'approved', 'completed', 'cancelled'),
  created_by: userIds.length > 0 ? fc.constantFrom(...userIds, null) : fc.constant(null),
  created_at: fc.date(),
  updated_at: fc.date(),
})

const documentArb = (eventIds: string[], userIds: string[]) => fc.record({
  id: uuidArb,
  event_id: fc.constantFrom(...eventIds),
  file_name: fc.string({ minLength: 1, maxLength: 255 }),
  file_path: fc.string({ minLength: 1, maxLength: 500 }),
  file_size: fc.integer({ min: 1, max: 10485760 }), // 10MB max
  file_type: fc.constantFrom('application/pdf', 'image/jpeg', 'image/png', 'application/msword'),
  document_type: fc.constantFrom('permit', 'contract', 'promotional', 'receipt', 'financial'),
  uploaded_by: userIds.length > 0 ? fc.constantFrom(...userIds, null) : fc.constant(null),
  uploaded_at: fc.date(),
})

const checklistTemplateArb = (userIds: string[]) => fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 255 }),
  created_by: userIds.length > 0 ? fc.constantFrom(...userIds, null) : fc.constant(null),
  created_at: fc.date(),
  updated_at: fc.date(),
})

const checklistArb = (eventIds: string[], templateIds: string[]) => fc.record({
  id: uuidArb,
  event_id: fc.constantFrom(...eventIds),
  created_from_template: templateIds.length > 0 ? fc.constantFrom(...templateIds, null) : fc.constant(null),
  created_at: fc.date(),
})

const allocationArb = (eventIds: string[], userIds: string[]) => fc.record({
  id: uuidArb,
  event_id: fc.constantFrom(...eventIds),
  amount: fc.double({ min: 0, max: 1000000, noNaN: true, noDefaultInfinity: true }),
  allocated_by: userIds.length > 0 ? fc.constantFrom(...userIds, null) : fc.constant(null),
  allocated_at: fc.date(),
})

const expenditureArb = (eventIds: string[], documentIds: string[], userIds: string[]) => fc.record({
  id: uuidArb,
  event_id: fc.constantFrom(...eventIds),
  amount: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  document_id: documentIds.length > 0 ? fc.constantFrom(...documentIds, null) : fc.constant(null),
  recorded_by: userIds.length > 0 ? fc.constantFrom(...userIds, null) : fc.constant(null),
  recorded_at: fc.date(),
})

describe('Database Schema Property Tests', () => {
  /**
   * Property 37: Referential Integrity Maintained
   * 
   * For any related data (event-document, event-checklist, event-allocation),
   * the system must maintain foreign key constraints and prevent orphaned records.
   * 
   * **Validates: Requirements 9.4**
   */
  test('Property 37: Referential Integrity Maintained', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(userArb, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 10 }),
        async (users, numEvents, numDocuments, numTemplates, numChecklists, numExpenditures) => {
          const db = createMockDatabase()
          
          // Add users to database
          const userIds: string[] = []
          for (const user of users) {
            db.users.set(user.id, user)
            userIds.push(user.id)
          }
          
          // Generate and add events
          const eventIds: string[] = []
          const events = await fc.sample(eventArb(userIds), numEvents)
          for (const event of events) {
            db.events.set(event.id, event)
            eventIds.push(event.id)
          }
          
          // Only proceed if we have events
          if (eventIds.length === 0) {
            // No events means no related data, integrity is trivially maintained
            const violations = validateReferentialIntegrity(db)
            expect(violations).toHaveLength(0)
            return
          }
          
          // Generate and add documents
          const documentIds: string[] = []
          if (numDocuments > 0) {
            const documents = await fc.sample(documentArb(eventIds, userIds), numDocuments)
            for (const doc of documents) {
              db.documents.set(doc.id, doc)
              documentIds.push(doc.id)
            }
          }
          
          // Generate and add checklist templates
          const templateIds: string[] = []
          if (numTemplates > 0) {
            const templates = await fc.sample(checklistTemplateArb(userIds), numTemplates)
            for (const template of templates) {
              db.checklist_templates.set(template.id, template)
              templateIds.push(template.id)
            }
          }
          
          // Generate and add checklists
          const checklistIds: string[] = []
          if (numChecklists > 0) {
            const checklists = await fc.sample(checklistArb(eventIds, templateIds), numChecklists)
            for (const checklist of checklists) {
              db.checklists.set(checklist.id, checklist)
              checklistIds.push(checklist.id)
            }
          }
          
          // Generate and add allocations
          if (eventIds.length > 0) {
            const numAllocations = Math.min(eventIds.length, 3) // Limit allocations
            const allocations = await fc.sample(allocationArb(eventIds, userIds), numAllocations)
            for (const allocation of allocations) {
              db.allocations.set(allocation.id, allocation)
            }
          }
          
          // Generate and add expenditures
          if (numExpenditures > 0 && documentIds.length > 0) {
            const expenditures = await fc.sample(expenditureArb(eventIds, documentIds, userIds), numExpenditures)
            for (const expenditure of expenditures) {
              db.expenditures.set(expenditure.id, expenditure)
            }
          }
          
          // Validate referential integrity - should have no violations
          const violations = validateReferentialIntegrity(db)
          expect(violations).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 37b: Cascade Delete Maintains Referential Integrity
   * 
   * When a parent record is deleted, all child records must be deleted
   * to maintain referential integrity (no orphaned records).
   * 
   * **Validates: Requirements 9.4**
   */
  test('Property 37b: Cascade Delete Maintains Referential Integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(userArb, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (users, numEvents, numDocuments) => {
          const db = createMockDatabase()
          
          // Add users
          const userIds: string[] = []
          for (const user of users) {
            db.users.set(user.id, user)
            userIds.push(user.id)
          }
          
          // Add events
          const eventIds: string[] = []
          const events = await fc.sample(eventArb(userIds), numEvents)
          for (const event of events) {
            db.events.set(event.id, event)
            eventIds.push(event.id)
          }
          
          // Add documents
          const documents = await fc.sample(documentArb(eventIds, userIds), numDocuments)
          for (const doc of documents) {
            db.documents.set(doc.id, doc)
          }
          
          // Add checklists
          for (const eventId of eventIds) {
            const checklist = {
              id: crypto.randomUUID(),
              event_id: eventId,
              created_from_template: null,
              created_at: new Date(),
            }
            db.checklists.set(checklist.id, checklist)
          }
          
          // Pick a random event to delete
          const eventToDelete = eventIds[0]
          
          // Perform cascade delete
          cascadeDelete(db, 'events', eventToDelete)
          
          // Validate referential integrity after cascade delete
          const violations = validateReferentialIntegrity(db)
          expect(violations).toHaveLength(0)
          
          // Verify the event was actually deleted
          expect(db.events.has(eventToDelete)).toBe(false)
          
          // Verify no documents reference the deleted event
          for (const [, doc] of db.documents) {
            expect(doc.event_id).not.toBe(eventToDelete)
          }
          
          // Verify no checklists reference the deleted event
          for (const [, checklist] of db.checklists) {
            expect(checklist.event_id).not.toBe(eventToDelete)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
