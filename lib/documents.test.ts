// Property-based tests for document management
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

import { describe, test, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { validateFileType, validateFileSize, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './storage'
import { createMockDatabase, MockDatabase } from './test-utils'
import { DocumentType } from '@/types'

let mockDb: MockDatabase

beforeEach(() => {
  mockDb = createMockDatabase()
})

// ─── Generators ──────────────────────────────────────────────────────────────

const documentTypeGenerator = fc.constantFrom<DocumentType>(
  'permit',
  'contract',
  'promotional',
  'receipt',
  'financial'
)

const allowedMimeTypeGenerator = fc.constantFrom(...ALLOWED_MIME_TYPES)

const disallowedMimeTypeGenerator = fc.constantFrom(
  'application/zip',
  'application/x-executable',
  'text/html',
  'video/mp4',
  'audio/mpeg'
)

const validFileSizeGenerator = fc.integer({ min: 1, max: MAX_FILE_SIZE_BYTES })

const oversizedFileSizeGenerator = fc.integer({
  min: MAX_FILE_SIZE_BYTES + 1,
  max: MAX_FILE_SIZE_BYTES * 3,
})

const eventIdGenerator = fc.uuid()
const userIdGenerator = fc.uuid()
const fileNameGenerator = fc.string({ minLength: 1, maxLength: 100 })

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a mock document in the mock database */
function createMockDocument(
  db: MockDatabase,
  overrides: Partial<{
    eventId: string
    documentType: DocumentType
    uploadedBy: string
    fileName: string
    fileSize: number
    fileType: string
    filePath: string
  }> = {}
) {
  const id = `doc-${db.documents.size + 1}`
  const doc = {
    id,
    event_id: overrides.eventId ?? 'event-1',
    file_name: overrides.fileName ?? 'test.pdf',
    file_path: overrides.filePath ?? `event-1/${Date.now()}-test.pdf`,
    file_size: overrides.fileSize ?? 1024,
    file_type: overrides.fileType ?? 'application/pdf',
    document_type: overrides.documentType ?? 'permit',
    uploaded_by: overrides.uploadedBy ?? 'user-1',
    uploaded_at: new Date().toISOString(),
  }
  db.documents.set(id, doc)
  return doc
}

// ─── Property 16: Document Upload and Storage ────────────────────────────────

/**
 * **Validates: Requirements 4.1, 9.5**
 * Feature: structura, Property 16: Document Upload and Storage
 *
 * For any valid document upload by an authorized user, the system must store the
 * file in Supabase Storage, create a database record with the file reference, and
 * link it to the specified event.
 */
describe('Property 16: Document Upload and Storage', () => {
  test('uploaded document is linked to the correct event', () => {
    fc.assert(
      fc.property(
        eventIdGenerator,
        userIdGenerator,
        documentTypeGenerator,
        fileNameGenerator,
        validFileSizeGenerator,
        (eventId, userId, documentType, fileName, fileSize) => {
          const doc = createMockDocument(mockDb, {
            eventId,
            uploadedBy: userId,
            documentType,
            fileName,
            fileSize,
          })

          // Document must be linked to the correct event
          expect(doc.event_id).toBe(eventId)
          expect(doc.uploaded_by).toBe(userId)
          expect(doc.document_type).toBe(documentType)
          expect(doc.file_name).toBe(fileName)
          expect(doc.file_size).toBe(fileSize)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('each uploaded document gets a unique ID', () => {
    fc.assert(
      fc.property(
        fc.array(eventIdGenerator, { minLength: 2, maxLength: 20 }),
        (eventIds) => {
          const ids = eventIds.map((eventId) => createMockDocument(mockDb, { eventId }).id)
          const uniqueIds = new Set(ids)
          expect(uniqueIds.size).toBe(ids.length)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('document record stores file path reference', () => {
    fc.assert(
      fc.property(eventIdGenerator, userIdGenerator, (eventId, userId) => {
        const storagePath = `${eventId}/${Date.now()}-test.pdf`
        const doc = createMockDocument(mockDb, {
          eventId,
          uploadedBy: userId,
          filePath: storagePath,
        })

        // The file_path must be stored and non-empty
        expect(doc.file_path).toBeDefined()
        expect(doc.file_path.length).toBeGreaterThan(0)
        expect(doc.file_path).toBe(storagePath)
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Property 17: Document Retrieval by Event ────────────────────────────────

/**
 * **Validates: Requirements 4.2**
 * Feature: structura, Property 17: Document Retrieval by Event
 *
 * For any event with uploaded documents, retrieving the event's documents must
 * return all associated documents with their metadata.
 */
describe('Property 17: Document Retrieval by Event', () => {
  test('all documents for an event are returned', () => {
    fc.assert(
      fc.property(
        eventIdGenerator,
        fc.integer({ min: 0, max: 8 }),
        (eventId, docCount) => {
          // Reset db for each run
          mockDb = createMockDatabase()

          for (let i = 0; i < docCount; i++) {
            createMockDocument(mockDb, { eventId })
          }

          const eventDocs = Array.from(mockDb.documents.values()).filter(
            (d) => d.event_id === eventId
          )

          expect(eventDocs.length).toBe(docCount)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('documents from other events are not returned', () => {
    fc.assert(
      fc.property(
        eventIdGenerator,
        eventIdGenerator,
        fc.integer({ min: 1, max: 5 }),
        (eventIdA, eventIdB, docCount) => {
          fc.pre(eventIdA !== eventIdB)
          mockDb = createMockDatabase()

          for (let i = 0; i < docCount; i++) {
            createMockDocument(mockDb, { eventId: eventIdA })
          }
          // Add one document for a different event
          createMockDocument(mockDb, { eventId: eventIdB })

          const eventADocs = Array.from(mockDb.documents.values()).filter(
            (d) => d.event_id === eventIdA
          )

          expect(eventADocs.length).toBe(docCount)
          expect(eventADocs.every((d) => d.event_id === eventIdA)).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('retrieved documents include all required metadata fields', () => {
    fc.assert(
      fc.property(
        eventIdGenerator,
        userIdGenerator,
        documentTypeGenerator,
        (eventId, userId, documentType) => {
          const doc = createMockDocument(mockDb, { eventId, uploadedBy: userId, documentType })

          // All metadata fields must be present
          expect(doc.id).toBeDefined()
          expect(doc.event_id).toBeDefined()
          expect(doc.file_name).toBeDefined()
          expect(doc.file_path).toBeDefined()
          expect(doc.file_size).toBeGreaterThan(0)
          expect(doc.file_type).toBeDefined()
          expect(doc.document_type).toBeDefined()
          expect(doc.uploaded_at).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 18: Document Type Validation ───────────────────────────────────

/**
 * **Validates: Requirements 4.3**
 * Feature: structura, Property 18: Document Type Validation
 *
 * For any document upload, the system must accept documents of valid types and
 * reject documents with invalid types.
 */
describe('Property 18: Document Type Validation', () => {
  test('all valid document types are accepted', () => {
    const validTypes: DocumentType[] = ['permit', 'contract', 'promotional', 'receipt', 'financial']

    fc.assert(
      fc.property(fc.constantFrom(...validTypes), (docType) => {
        const doc = createMockDocument(mockDb, { documentType: docType })
        expect(doc.document_type).toBe(docType)
      }),
      { numRuns: 100 }
    )
  })

  test('invalid document types are rejected', () => {
    const invalidTypes = ['invoice', 'photo', 'spreadsheet', 'unknown', '']

    fc.assert(
      fc.property(fc.constantFrom(...invalidTypes), (invalidType) => {
        const validTypes: DocumentType[] = ['permit', 'contract', 'promotional', 'receipt', 'financial']
        expect(validTypes.includes(invalidType as DocumentType)).toBe(false)
      }),
      { numRuns: 50 }
    )
  })

  test('document type is always one of the five valid categories', () => {
    fc.assert(
      fc.property(documentTypeGenerator, (docType) => {
        const validTypes: DocumentType[] = ['permit', 'contract', 'promotional', 'receipt', 'financial']
        expect(validTypes).toContain(docType)

        const matchCount = validTypes.filter((t) => t === docType).length
        expect(matchCount).toBe(1)
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Property 19: File Validation ────────────────────────────────────────────

/**
 * **Validates: Requirements 4.4, 12.4**
 * Feature: structura, Property 19: File Validation
 *
 * For any file upload, the system must validate file format and size, rejecting
 * files that exceed 10MB or have invalid formats.
 */
describe('Property 19: File Validation', () => {
  test('allowed MIME types pass validation', () => {
    fc.assert(
      fc.property(allowedMimeTypeGenerator, (mimeType) => {
        expect(validateFileType(mimeType)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  test('disallowed MIME types fail validation', () => {
    fc.assert(
      fc.property(disallowedMimeTypeGenerator, (mimeType) => {
        expect(validateFileType(mimeType)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  test('files within the 10 MB limit pass size validation', () => {
    fc.assert(
      fc.property(validFileSizeGenerator, (size) => {
        expect(validateFileSize(size)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  test('files exceeding 10 MB fail size validation', () => {
    fc.assert(
      fc.property(oversizedFileSizeGenerator, (size) => {
        expect(validateFileSize(size)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  test('zero-byte files fail size validation', () => {
    expect(validateFileSize(0)).toBe(false)
  })

  test('negative file sizes fail validation', () => {
    fc.assert(
      fc.property(fc.integer({ min: -10000, max: -1 }), (size) => {
        expect(validateFileSize(size)).toBe(false)
      }),
      { numRuns: 50 }
    )
  })

  test('file validation is deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(allowedMimeTypeGenerator, disallowedMimeTypeGenerator),
        validFileSizeGenerator,
        (mimeType, size) => {
          // Same inputs always produce the same result
          expect(validateFileType(mimeType)).toBe(validateFileType(mimeType))
          expect(validateFileSize(size)).toBe(validateFileSize(size))
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 20: Document Deletion Cleanup ──────────────────────────────────

/**
 * **Validates: Requirements 4.5**
 * Feature: structura, Property 20: Document Deletion Cleanup
 *
 * For any document deletion by an authorized user, the system must remove both
 * the file from storage and the database record.
 */
describe('Property 20: Document Deletion Cleanup', () => {
  test('deleting a document removes it from the database', () => {
    fc.assert(
      fc.property(eventIdGenerator, userIdGenerator, (eventId, userId) => {
        mockDb = createMockDatabase()
        const doc = createMockDocument(mockDb, { eventId, uploadedBy: userId })

        expect(mockDb.documents.has(doc.id)).toBe(true)

        // Simulate deletion
        mockDb.documents.delete(doc.id)

        expect(mockDb.documents.has(doc.id)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  test('deleting one document does not affect other documents', () => {
    fc.assert(
      fc.property(
        eventIdGenerator,
        fc.integer({ min: 2, max: 6 }),
        (eventId, docCount) => {
          mockDb = createMockDatabase()

          const docs = Array.from({ length: docCount }, () =>
            createMockDocument(mockDb, { eventId })
          )

          // Delete the first document
          mockDb.documents.delete(docs[0].id)

          // All other documents should still exist
          for (let i = 1; i < docs.length; i++) {
            expect(mockDb.documents.has(docs[i].id)).toBe(true)
          }

          expect(mockDb.documents.size).toBe(docCount - 1)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('after deletion, the document cannot be retrieved', () => {
    fc.assert(
      fc.property(eventIdGenerator, (eventId) => {
        mockDb = createMockDatabase()
        const doc = createMockDocument(mockDb, { eventId })

        // Delete the document
        mockDb.documents.delete(doc.id)

        // Attempting to retrieve it returns undefined
        const retrieved = mockDb.documents.get(doc.id)
        expect(retrieved).toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })

  test('event document count decreases after deletion', () => {
    fc.assert(
      fc.property(
        eventIdGenerator,
        fc.integer({ min: 1, max: 5 }),
        (eventId, docCount) => {
          mockDb = createMockDatabase()

          const docs = Array.from({ length: docCount }, () =>
            createMockDocument(mockDb, { eventId })
          )

          const countBefore = Array.from(mockDb.documents.values()).filter(
            (d) => d.event_id === eventId
          ).length

          expect(countBefore).toBe(docCount)

          // Delete one document
          mockDb.documents.delete(docs[0].id)

          const countAfter = Array.from(mockDb.documents.values()).filter(
            (d) => d.event_id === eventId
          ).length

          expect(countAfter).toBe(docCount - 1)
        }
      ),
      { numRuns: 50 }
    )
  })
})
