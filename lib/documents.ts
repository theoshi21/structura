// DocumentService — upload, list, delete documents linked to events
// Requirements: 4.1, 4.2, 4.5

import { createSupabaseClient } from './supabase'
import { uploadFile, deleteFile, getPublicUrl } from './storage'
import { Document, DocumentType } from '@/types'
import { logAction } from './audit'

/** Valid document type values */
const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'permit',
  'contract',
  'promotional',
  'receipt',
  'financial',
]

/**
 * Maps a raw database row to the Document interface.
 */
function mapDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    fileName: row.file_name as string,
    filePath: row.file_path as string,
    fileSize: row.file_size as number,
    fileType: row.file_type as string,
    documentType: row.document_type as DocumentType,
    uploadedBy: (row.uploaded_by as string) ?? null,
    uploadedAt: new Date(row.uploaded_at as string),
  }
}

/**
 * Uploads a document file to storage and creates a database record linked to an event.
 * @param file - The File object to upload
 * @param eventId - The event this document belongs to
 * @param documentType - Category of the document (permit, contract, etc.)
 * @param userId - ID of the user uploading the document
 * @returns Promise resolving to the created Document record
 * @throws Error if validation fails, upload fails, or DB insert fails
 */
export async function uploadDocument(
  file: File,
  eventId: string,
  documentType: DocumentType,
  userId: string
): Promise<Document> {
  if (!file) throw new Error('File is required')
  if (!eventId) throw new Error('Event ID is required')
  if (!userId) throw new Error('User ID is required')

  if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
    throw new Error(
      `Invalid document type: ${documentType}. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`
    )
  }

  // Upload file to Supabase Storage (validates type and size internally)
  const storagePath = await uploadFile(file, eventId)

  const supabase = createSupabaseClient()

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({
      event_id: eventId,
      file_name: file.name,
      file_path: storagePath,
      file_size: file.size,
      file_type: file.type,
      document_type: documentType,
      uploaded_by: userId,
    })
    .select('id, event_id, file_name, file_path, file_size, file_type, document_type, uploaded_by, uploaded_at')
    .single()

  if (error) {
    // Clean up the uploaded file if DB insert fails
    await deleteFile(storagePath).catch(() => {})
    throw new Error(`Failed to save document record: ${error.message}`)
  }

  const document = mapDocument(doc)

  // Log the upload to the audit trail
  logAction({
    action: 'document_uploaded',
    entityType: 'document',
    entityId: document.id,
    userId,
    details: { eventId, fileName: file.name, documentType },
  }).catch(() => {})

  return document
}

/**
 * Returns all documents associated with a given event.
 * @param eventId - The event's unique identifier
 * @returns Promise resolving to an array of Document records
 * @throws Error if the query fails
 */
export async function listDocumentsByEvent(eventId: string): Promise<Document[]> {
  if (!eventId) throw new Error('Event ID is required')

  const supabase = createSupabaseClient()

  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, event_id, file_name, file_path, file_size, file_type, document_type, uploaded_by, uploaded_at')
    .eq('event_id', eventId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to list documents: ${error.message}`)
  }

  return docs.map(mapDocument)
}

/**
 * Returns a single document by its ID.
 * @param id - Document's unique identifier
 * @returns Promise resolving to the Document or null if not found
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  if (!id) throw new Error('Document ID is required')

  const supabase = createSupabaseClient()

  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, event_id, file_name, file_path, file_size, file_type, document_type, uploaded_by, uploaded_at')
    .eq('id', id)
    .single()

  if (error || !doc) return null

  return mapDocument(doc)
}

/**
 * Deletes a document from both Supabase Storage and the database.
 * @param id - Document's unique identifier
 * @param userId - ID of the user performing the deletion (for permission checks upstream)
 * @returns Promise that resolves when deletion is complete
 * @throws Error if document not found or deletion fails
 */
export async function deleteDocument(id: string, userId: string): Promise<void> {
  if (!id) throw new Error('Document ID is required')
  if (!userId) throw new Error('User ID is required')

  const doc = await getDocumentById(id)
  if (!doc) throw new Error('Document not found')

  // Remove file from storage first
  await deleteFile(doc.filePath)

  const supabase = createSupabaseClient()

  const { error } = await supabase.from('documents').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete document record: ${error.message}`)
  }

  // Log the deletion to the audit trail
  logAction({
    action: 'document_deleted',
    entityType: 'document',
    entityId: id,
    userId,
    details: { fileName: doc.fileName, eventId: doc.eventId },
  }).catch(() => {})
}

/**
 * Returns the public URL for a document's stored file.
 * @param id - Document's unique identifier
 * @returns Promise resolving to the public URL string
 * @throws Error if document not found
 */
export async function getDocumentUrl(id: string): Promise<string> {
  const doc = await getDocumentById(id)
  if (!doc) throw new Error('Document not found')
  return getPublicUrl(doc.filePath)
}
