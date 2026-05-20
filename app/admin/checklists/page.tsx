'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { ChecklistTemplate } from '@/types'

/**
 * Admin Checklists page.
 * Allows admins to create, view, and delete reusable checklist templates.
 * Organizers can apply these templates when creating event checklists.
 */
export default function AdminChecklistsPage() {
  const toast = useToast()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Create modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', itemsText: '' })
  const [formErrors, setFormErrors] = useState<{ name?: string; items?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deletingTemplate, setDeletingTemplate] = useState<ChecklistTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

  /** Fetches all checklist templates from the API */
  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checklists/templates')
      const json = await res.json()
      if (res.ok && json.success) setTemplates(json.data)
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  /** Validates and submits the create template form */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const errors: { name?: string; items?: string } = {}
    if (!form.name.trim()) errors.name = 'Template name is required.'
    const items = form.itemsText.split('\n').map((s) => s.trim()).filter(Boolean)
    if (items.length === 0) errors.items = 'Add at least one item.'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/checklists/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), items }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to create template')
      toast.success(`Template "${form.name.trim()}" created.`)
      setShowModal(false)
      setForm({ name: '', itemsText: '' })
      setFormErrors({})
      await fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  /** Deletes a checklist template */
  async function handleDelete() {
    if (!deletingTemplate) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/checklists/templates/${deletingTemplate.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed to delete template')
      toast.success(`"${deletingTemplate.name}" deleted.`)
      setDeletingTemplate(null)
      await fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-off-white">Checklist Templates</h1>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + New Template
        </Button>
      </div>

      <p className="text-sm text-mid-gray font-body -mt-2">
        Create reusable templates that organizers can apply when setting up event checklists.
      </p>

      {/* Templates list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-light-gray/30 bg-surface p-5 h-16 animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-light-gray/30 bg-surface p-10 text-center text-mid-gray font-body">
          No templates yet. Create one to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="rounded-xl border border-light-gray/30 bg-surface overflow-hidden">
              {/* Template header row */}
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-body font-semibold text-off-white truncate">{tmpl.name}</span>
                  <Badge label={`${tmpl.items.length} item${tmpl.items.length !== 1 ? 's' : ''}`} color="gray" />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === tmpl.id ? null : tmpl.id)}
                    className="text-xs text-mid-gray hover:text-off-white transition-colors"
                  >
                    {expandedId === tmpl.id ? 'Hide ▲' : 'Preview ▼'}
                  </button>
                  <button
                    onClick={() => setDeletingTemplate(tmpl)}
                    className="text-xs text-red-400 hover:underline font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expandable items preview */}
              {expandedId === tmpl.id && (
                <div className="border-t border-light-gray/20 px-5 py-4">
                  <ol className="flex flex-col gap-1.5 list-decimal list-inside">
                    {tmpl.items.map((item) => (
                      <li key={item.id} className="text-sm font-body text-mid-gray">
                        {item.description}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Template Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-light-gray/30 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-light-gray/20">
              <h2 className="font-heading text-xl text-off-white">New Template</h2>
              <button onClick={() => setShowModal(false)} className="text-mid-gray hover:text-off-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleCreate} noValidate>
              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Template name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Template Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    autoFocus
                    onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormErrors((p) => ({ ...p, name: undefined })) }}
                    placeholder="e.g. Event Readiness Checklist"
                    className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition ${formErrors.name ? 'border-red-400' : 'border-light-gray/30'}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
                    Items (one per line) <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={form.itemsText}
                    onChange={(e) => { setForm((f) => ({ ...f, itemsText: e.target.value })); setFormErrors((p) => ({ ...p, items: undefined })) }}
                    placeholder={'Book venue\nConfirm speakers\nSend invitations\nPrepare materials'}
                    className={`w-full bg-surface-raised border rounded-lg px-4 py-2.5 text-sm text-off-white outline-none focus:ring-2 focus:ring-accent/50 transition resize-none ${formErrors.items ? 'border-red-400' : 'border-light-gray/30'}`}
                  />
                  {formErrors.items && <p className="text-xs text-red-400">{formErrors.items}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-light-gray/20">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-mid-gray hover:text-off-white transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {submitting ? 'Creating…' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      {deletingTemplate && (
        <ConfirmDialog
          title="Delete Template?"
          message={`"${deletingTemplate.name}" will be permanently deleted. Existing checklists created from this template will not be affected.`}
          confirmLabel="Delete"
          destructive
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTemplate(null)}
        />
      )}
    </div>
  )
}
