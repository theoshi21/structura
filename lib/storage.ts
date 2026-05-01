// StorageManager — Supabase Storage upload/delete
// Requirements: 4.1, 4.5, 9.5

import { createSupabaseClient } from './supabase'

/** Bucket name used for all document uploads */
const BUCKET = 'documents'

/** Allowed MIME types for document uploads */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
]

/** Maximum file size in bytes (10 MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Validates a file's MIME type against the allowed list.
 * @param mimeType - The file's MIME type string
 * @returns True if the type is allowed
 */
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}

/**
 * Validates a file's size against the 10 MB limit.
 * @param sizeBytes - File size in bytes
 * @returns True if the size is within the limit
 */
export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES
}

/**
 * Uploads a file to Supabase Storage and returns the storage path.
 * The path is structured as: {eventId}/{timestamp}-{fileName}
 * @param file - The File object to upload
 * @param eventId - The event this document belongs to
 * @returns Promise resolving to the storage path of the uploaded file
 * @throws Error if validation fails or upload fails
 */
export async function uploadFile(file: File, eventId: string): Promise<string> {
  if (!eventId) throw new Error('Event ID is required')

  if (!validateFileType(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: PDF, DOCX, PNG, JPG`)
  }

  if (!validateFileSize(file.size)) {
    throw new Error(`File size exceeds the 10 MB limit (received ${(file.size / 1024 / 1024).toFixed(2)} MB)`)
  }

  const supabase = createSupabaseClient()
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${eventId}/${timestamp}-${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  return storagePath
}

/**
 * Deletes a file from Supabase Storage by its storage path.
 * @param storagePath - The path returned by uploadFile
 * @returns Promise that resolves when deletion is complete
 * @throws Error if deletion fails
 */
export async function deleteFile(storagePath: string): Promise<void> {
  if (!storagePath) throw new Error('Storage path is required')

  const supabase = createSupabaseClient()

  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Returns a public URL for a stored file.
 * @param storagePath - The path returned by uploadFile
 * @returns The public URL string
 */
export function getPublicUrl(storagePath: string): string {
  const supabase = createSupabaseClient()
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}
