// Test utilities for database testing
// This file provides mock database operations for testing referential integrity

import { createClient } from '@supabase/supabase-js'

// Mock database state for testing
export interface MockDatabase {
  users: Map<string, any>
  organizations: Map<string, any>
  events: Map<string, any>
  documents: Map<string, any>
  checklist_templates: Map<string, any>
  checklist_template_items: Map<string, any>
  checklists: Map<string, any>
  checklist_items: Map<string, any>
  budget: Map<string, any>
  allocations: Map<string, any>
  expenditures: Map<string, any>
  audit_trail: Map<string, any>
}

/**
 * Creates a fresh mock database for testing
 */
export function createMockDatabase(): MockDatabase {
  return {
    users: new Map(),
    organizations: new Map(),
    events: new Map(),
    documents: new Map(),
    checklist_templates: new Map(),
    checklist_template_items: new Map(),
    checklists: new Map(),
    checklist_items: new Map(),
    budget: new Map(),
    allocations: new Map(),
    expenditures: new Map(),
    audit_trail: new Map(),
  }
}

/**
 * Validates referential integrity constraints in the mock database
 * Returns an array of constraint violations
 */
export function validateReferentialIntegrity(db: MockDatabase): string[] {
  const violations: string[] = []

  // Check events.created_by references users.id
  for (const [eventId, event] of db.events) {
    if (event.created_by && !db.users.has(event.created_by)) {
      violations.push(`Event ${eventId} references non-existent user ${event.created_by}`)
    }
  }

  // Check documents.event_id references events.id
  for (const [docId, doc] of db.documents) {
    if (!db.events.has(doc.event_id)) {
      violations.push(`Document ${docId} references non-existent event ${doc.event_id}`)
    }
  }

  // Check documents.uploaded_by references users.id
  for (const [docId, doc] of db.documents) {
    if (doc.uploaded_by && !db.users.has(doc.uploaded_by)) {
      violations.push(`Document ${docId} references non-existent user ${doc.uploaded_by}`)
    }
  }

  // Check checklist_template_items.template_id references checklist_templates.id
  for (const [itemId, item] of db.checklist_template_items) {
    if (!db.checklist_templates.has(item.template_id)) {
      violations.push(`Checklist template item ${itemId} references non-existent template ${item.template_id}`)
    }
  }

  // Check checklists.event_id references events.id
  for (const [checklistId, checklist] of db.checklists) {
    if (!db.events.has(checklist.event_id)) {
      violations.push(`Checklist ${checklistId} references non-existent event ${checklist.event_id}`)
    }
  }

  // Check checklists.created_from_template references checklist_templates.id
  for (const [checklistId, checklist] of db.checklists) {
    if (checklist.created_from_template && !db.checklist_templates.has(checklist.created_from_template)) {
      violations.push(`Checklist ${checklistId} references non-existent template ${checklist.created_from_template}`)
    }
  }

  // Check checklist_items.checklist_id references checklists.id
  for (const [itemId, item] of db.checklist_items) {
    if (!db.checklists.has(item.checklist_id)) {
      violations.push(`Checklist item ${itemId} references non-existent checklist ${item.checklist_id}`)
    }
  }

  // Check checklist_items.completed_by references users.id
  for (const [itemId, item] of db.checklist_items) {
    if (item.completed_by && !db.users.has(item.completed_by)) {
      violations.push(`Checklist item ${itemId} references non-existent user ${item.completed_by}`)
    }
  }

  // Check allocations.event_id references events.id
  for (const [allocId, alloc] of db.allocations) {
    if (!db.events.has(alloc.event_id)) {
      violations.push(`Allocation ${allocId} references non-existent event ${alloc.event_id}`)
    }
  }

  // Check allocations.allocated_by references users.id
  for (const [allocId, alloc] of db.allocations) {
    if (alloc.allocated_by && !db.users.has(alloc.allocated_by)) {
      violations.push(`Allocation ${allocId} references non-existent user ${alloc.allocated_by}`)
    }
  }

  // Check expenditures.event_id references events.id
  for (const [expId, exp] of db.expenditures) {
    if (!db.events.has(exp.event_id)) {
      violations.push(`Expenditure ${expId} references non-existent event ${exp.event_id}`)
    }
  }

  // Check expenditures.document_id references documents.id
  for (const [expId, exp] of db.expenditures) {
    if (exp.document_id && !db.documents.has(exp.document_id)) {
      violations.push(`Expenditure ${expId} references non-existent document ${exp.document_id}`)
    }
  }

  // Check expenditures.recorded_by references users.id
  for (const [expId, exp] of db.expenditures) {
    if (exp.recorded_by && !db.users.has(exp.recorded_by)) {
      violations.push(`Expenditure ${expId} references non-existent user ${exp.recorded_by}`)
    }
  }

  // Check audit_trail.user_id references users.id
  for (const [auditId, audit] of db.audit_trail) {
    if (audit.user_id && !db.users.has(audit.user_id)) {
      violations.push(`Audit entry ${auditId} references non-existent user ${audit.user_id}`)
    }
  }

  return violations
}

/**
 * Simulates cascade delete behavior
 * When a parent record is deleted, all child records should also be deleted
 */
export function cascadeDelete(db: MockDatabase, table: string, id: string): void {
  if (table === 'events') {
    // Delete all documents for this event
    for (const [docId, doc] of db.documents) {
      if (doc.event_id === id) {
        db.documents.delete(docId)
      }
    }
    
    // Delete checklist for this event
    for (const [checklistId, checklist] of db.checklists) {
      if (checklist.event_id === id) {
        // Delete all checklist items
        for (const [itemId, item] of db.checklist_items) {
          if (item.checklist_id === checklistId) {
            db.checklist_items.delete(itemId)
          }
        }
        db.checklists.delete(checklistId)
      }
    }
    
    // Delete allocation for this event
    for (const [allocId, alloc] of db.allocations) {
      if (alloc.event_id === id) {
        db.allocations.delete(allocId)
      }
    }
    
    // Delete expenditures for this event
    for (const [expId, exp] of db.expenditures) {
      if (exp.event_id === id) {
        db.expenditures.delete(expId)
      }
    }
    
    // Finally delete the event
    db.events.delete(id)
  } else if (table === 'checklist_templates') {
    // Delete all template items
    for (const [itemId, item] of db.checklist_template_items) {
      if (item.template_id === id) {
        db.checklist_template_items.delete(itemId)
      }
    }
    db.checklist_templates.delete(id)
  } else if (table === 'checklists') {
    // Delete all checklist items
    for (const [itemId, item] of db.checklist_items) {
      if (item.checklist_id === id) {
        db.checklist_items.delete(itemId)
      }
    }
    db.checklists.delete(id)
  }
}

/**
 * Cleans up test data from the database
 * Deletes all records from all tables in reverse dependency order
 */
export async function cleanupTestData(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Skip cleanup if not configured (for unit tests that don't need real DB)
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Delete in reverse dependency order to avoid foreign key violations
  await supabase.from('audit_trail').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('expenditures').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('checklist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('checklists').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('checklist_template_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('checklist_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('budget').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('organization').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}
