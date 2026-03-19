'use client'

import Button from '@/components/Button'
import ProgressBar from '@/components/ProgressBar'
import Badge from '@/components/Badge'

/** Checklist items for the mock populated card */
const checklistItems = [
  { label: 'Secure venue booking', done: true },
  { label: 'Submit event proposal', done: true },
  { label: 'Finalize program flow', done: true },
  { label: 'Coordinate with speakers', done: true },
  { label: 'Prepare materials', done: false },
  { label: 'Send invitations', done: false },
]

/**
 * Populated checklist card showing event name, progress badge, progress bar, and items.
 */
function ChecklistCard() {
  const doneCount = checklistItems.filter((i) => i.done).length
  const total = checklistItems.length
  const percent = Math.round((doneCount / total) * 100)

  return (
    <div className="rounded-xl border border-light-gray/30 bg-white p-5 flex flex-col gap-4">
      {/* Card header */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-body font-semibold text-near-black text-sm">Foundation Week 2025</span>
        <Badge label={`${doneCount}/${total} done`} color="amber" />
      </div>

      {/* Progress bar */}
      <ProgressBar percent={percent} showLabel />

      {/* Checklist items */}
      <ul className="flex flex-col gap-2">
        {checklistItems.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5">
            {/* Non-functional visual checkbox */}
            <span
              className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border text-xs
                ${item.done
                  ? 'bg-primary border-primary text-white'
                  : 'border-light-gray/50 bg-gray-50'
                }`}
              aria-hidden="true"
            >
              {item.done ? '✓' : ''}
            </span>
            <span
              className={`text-sm font-body ${item.done ? 'line-through text-mid-gray' : 'text-near-black'}`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Empty placeholder checklist card with dashed border styling.
 */
function EmptyChecklistCard() {
  return (
    <div className="rounded-xl border-2 border-dashed border-light-gray/40 bg-gray-50 p-5 flex items-center justify-center min-h-[180px]">
      <span className="text-sm font-body text-mid-gray">No checklist yet</span>
    </div>
  )
}

/**
 * Checklists page for the student portal.
 * Shows a 3-column card grid with one populated checklist and two empty placeholders.
 */
export default function StudentChecklistsPage() {
  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-near-black">Checklists</h1>
        <Button variant="primary" size="sm" onClick={() => {}}>
          + New Checklist
        </Button>
      </div>

      {/* 3-column card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <ChecklistCard />
        <EmptyChecklistCard />
        <EmptyChecklistCard />
      </div>
    </div>
  )
}
