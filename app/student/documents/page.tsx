'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { Document, DocumentType } from '@/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderOpen, faSpinner } from '@fortawesome/free-solid-svg-icons'

/** Tab definitions for document type filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Permits', value: 'permit' },
  { label: 'Contracts', value: 'contract' },
  { label: 'Receipts', value: 'receipt' },
  { label: 'Promotional', value: 'promotional' },
  { label: 'Financial', value: 'financial' },
]

/** Valid document type options for the upload form */
const DOCUMENT_TYPES: { label: string; value: DocumentType }[] = [
  { label: 'Permit', value: 'permit' },
  { label: 'Contract', value: 'contract' },
  { label: 'Promotional', value: 'promotional' },
  { label: 'Receipt', value: 'receipt' },
  { label: 'Financial', value: 'financial' },
]

/** Maps a document type to a badge color */
function typeColor(type: DocumentType): 'green' | 'amber' | 'blue' | 'red' | 'gray' {
  switch (type) {
    case 'permit': return 'green'
    case 'contract': return 'blue'
    case 'receipt': return 'amber'
    case 'promotional': return 'gray'
    case 'financial': return 'red'
    default: return 'gray'
  }
}

/** Formats bytes to a human-readable size string */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Formats a Date or ISO string to a readable date */
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Documents page for the student portal.
 * Fetches real documents from the API, supports drag-and-drop upload, and wires the "View" action.
 * Documents are scoped to the first event the user has access to; a real implementation
 * would allow selecting an event — this page uses the eventId query param if present.
 */
export default function StudentDocumentsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Upload state
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('permit')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])

  // Delete confirmation
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  /** Fetches the list of events so the user can pick one for upload */
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events')
        const json = await res.json()
        if (res.ok && json.success) {
          setEvents(json.data)
          if (json.data.length > 0) setSelectedEventId(json.data[0].id)
        }
      } catch {
        // Non-critical — upload form will show no events
      }
    }
    fetchEvents()
  }, [])

  /** Fetches documents for the selected event */
  const fetchDocuments = useCallback(async () => {
    if (!selectedEventId) {
      setDocuments([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/events/${selectedEventId}/documents`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Failed to load documents')
      }
      setDocuments(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [selectedEventId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  /** Uploads a file to the selected event */
  async function handleUpload(file: File) {
    if (!selectedEventId) {
      toast.error('Please select an event before uploading.')
      return
    }

    // Client-side validation: max 10 MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10 MB.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', selectedDocType)

      const res = await fetch(`/api/events/${selectedEventId}/documents`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Upload failed')
      }

      toast.success(`"${file.name}" uploaded successfully.`)
      await fetchDocuments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  /** Opens the document URL in a new tab */
  async function handleView(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}`)
      const json = await res.json()
      if (res.ok && json.success && json.data.url) {
        window.open(json.data.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error('Could not retrieve document URL.')
      }
    } catch {
      toast.error('Failed to open document.')
    }
  }

  /** Sends the DELETE request and refreshes the list on success */
  async function handleDeleteDoc() {
    if (!deletingDoc) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/documents/${deletingDoc.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to delete document')
      toast.success(`"${deletingDoc.fileName}" deleted.`)
      setDeletingDoc(null)
      await fetchDocuments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }

  // Drag-and-drop handlers
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() {
    setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  /** Filter documents by type; 'all' shows every row */
  const filtered =
    activeTab === 'all' ? documents : documents.filter((d) => d.documentType === activeTab)

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-off-white">Documents</h1>
        <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : '+ Upload'}
        </Button>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={onFileInputChange}
          aria-label="Upload document"
        />
      </div>

      {/* Upload controls: event selector + document type */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-mid-gray uppercase tracking-wide">
            Event
          </label>
          <select
            className="rounded-lg border border-light-gray/50 px-3 py-2 text-sm font-body text-off-white bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
            value={selectedEventId ?? ''}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
            aria-label="Select event"
          >
            {events.length === 0 && <option value="">No events available</option>}
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-mid-gray uppercase tracking-wide">
            Document Type
          </label>
          <select
            className="rounded-lg border border-light-gray/50 px-3 py-2 text-sm font-body text-off-white bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
            aria-label="Select document type"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload feedback */}

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Drag & drop upload zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drag and drop upload zone"
        className={`rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-light-gray/50 bg-surface hover:border-accent/50'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <FontAwesomeIcon
          icon={uploading ? faSpinner : faFolderOpen}
          className={`text-4xl w-10 h-10 text-mid-gray ${uploading ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <p className="font-body font-semibold text-off-white text-sm">
          {uploading
            ? 'Uploading…'
            : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="font-body text-xs text-mid-gray">
          Supports PDF, DOCX, PNG, JPG up to 10 MB
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Documents table */}
      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-surface">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-surface-raised">
              {['File Name', 'Type', 'Size', 'Uploaded', 'Action'].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-mid-gray"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-mid-gray">
                  Loading documents…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-mid-gray">
                  No documents found.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-surface-raised transition-colors"
                >
                  <td className="px-5 py-3.5 text-off-white font-medium">{doc.fileName}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      label={doc.documentType.charAt(0).toUpperCase() + doc.documentType.slice(1)}
                      color={typeColor(doc.documentType)}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-mid-gray">{formatSize(doc.fileSize)}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{formatDate(doc.uploadedAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        className="text-accent hover:underline font-medium"
                        onClick={() => handleView(doc.id)}
                      >
                        View
                      </button>
                      <button
                        className="text-red-400 hover:underline font-medium"
                        onClick={() => setDeletingDoc(doc)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      {deletingDoc && (
        <ConfirmDialog
          title="Delete Document?"
          message={`"${deletingDoc.fileName}" will be permanently deleted from storage. This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          loading={deleting}
          onConfirm={handleDeleteDoc}
          onCancel={() => setDeletingDoc(null)}
        />
      )}
    </div>
  )
}
