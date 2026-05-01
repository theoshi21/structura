'use client'

interface PaginationProps {
  /** Current page number (1-indexed) */
  page: number
  /** Total number of pages */
  totalPages: number
  /** Called when the user navigates to a different page */
  onChange: (page: number) => void
}

/**
 * Pagination component — renders Previous / page numbers / Next controls.
 * Shows up to 5 page buttons; hides itself when there is only one page.
 */
export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  /** Builds the list of page numbers to display (max 5, centered on current page) */
  function getPageNumbers(): number[] {
    const delta = 2
    const start = Math.max(1, page - delta)
    const end = Math.min(totalPages, page + delta)
    const pages: number[] = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 font-body text-sm"
    >
      {/* Previous */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="px-3 py-1.5 rounded-lg border border-light-gray/40 text-mid-gray hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>

      {/* First page + ellipsis */}
      {pages[0] > 1 && (
        <>
          <button
            onClick={() => onChange(1)}
            className="px-3 py-1.5 rounded-lg border border-light-gray/40 text-mid-gray hover:border-accent hover:text-accent transition-colors"
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className="px-2 text-mid-gray">…</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            p === page
              ? 'bg-primary border-primary text-white font-semibold'
              : 'border-light-gray/40 text-mid-gray hover:border-accent hover:text-accent'
          }`}
        >
          {p}
        </button>
      ))}

      {/* Last page + ellipsis */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-2 text-mid-gray">…</span>
          )}
          <button
            onClick={() => onChange(totalPages)}
            className="px-3 py-1.5 rounded-lg border border-light-gray/40 text-mid-gray hover:border-accent hover:text-accent transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="px-3 py-1.5 rounded-lg border border-light-gray/40 text-mid-gray hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </nav>
  )
}
