'use client'

import { useState } from 'react'
import FilterTabs from '@/components/FilterTabs'
import Badge from '@/components/Badge'
import Button from '@/components/Button'

/** Tab definitions for document type filter */
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Permits', value: 'Permit' },
  { label: 'Contracts', value: 'Contract' },
  { label: 'Receipts', value: 'Receipt' },
  { label: 'Promotional', value: 'Promotional' },
]

/** Mock document rows */
const documents = [
  {
    name: 'venue_permit.pdf',
    type: 'Permit',
    event: 'Foundation Week 2025',
    size: '245 KB',
    uploaded: 'Mar 1, 2025',
    status: 'Approved',
    color: 'green' as const,
  },
  {
    name: 'catering_contract.pdf',
    type: 'Contract',
    event: 'Foundation Week 2025',
    size: '1.2 MB',
    uploaded: 'Mar 3, 2025',
    status: 'Pending',
    color: 'amber' as const,
  },
  {
    name: 'event_poster.png',
    type: 'Promotional',
    event: 'Leadership Summit',
    size: '3.4 MB',
    uploaded: 'Mar 10, 2025',
    status: 'Approved',
    color: 'green' as const,
  },
  {
    name: 'receipt_001.pdf',
    type: 'Receipt',
    event: 'Acquaintance Party',
    size: '89 KB',
    uploaded: 'Mar 12, 2025',
    status: 'Pending',
    color: 'amber' as const,
  },
]

/**
 * Documents page for the student portal.
 * Shows a drag-and-drop upload zone and a filterable documents table.
 */
export default function StudentDocumentsPage() {
  const [activeTab, setActiveTab] = useState('all')

  /** Filter documents by type; 'all' shows every row */
  const filtered = activeTab === 'all' ? documents : documents.filter((d) => d.type === activeTab)

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-near-black">Documents</h1>
        <Button variant="primary" size="sm" onClick={() => {}}>
          + Upload
        </Button>
      </div>

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Drag & drop upload zone (UI only) */}
      <div className="rounded-xl border-2 border-dashed border-light-gray/50 bg-gray-50 p-10 flex flex-col items-center gap-3 text-center">
        <span className="text-4xl" aria-hidden="true">📁</span>
        <p className="font-body font-semibold text-near-black text-sm">
          Drag &amp; drop files here, or click to browse
        </p>
        <p className="font-body text-xs text-mid-gray">
          Supports PDF, DOCX, PNG, JPG up to 10MB
        </p>
      </div>

      {/* Documents table */}
      <div className="rounded-xl border border-light-gray/30 overflow-hidden bg-white">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-light-gray/30 bg-gray-50">
              {['File Name', 'Type', 'Event', 'Size', 'Uploaded', 'Status', 'Action'].map((col) => (
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-mid-gray">
                  No documents found.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-light-gray/20 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-near-black font-medium">{row.name}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.type}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.event}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.size}</td>
                  <td className="px-5 py-3.5 text-mid-gray">{row.uploaded}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={row.status} color={row.color} />
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href="#"
                      className="text-accent hover:underline font-medium"
                      onClick={(e) => e.preventDefault()}
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
