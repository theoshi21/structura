'use client'

import Button from './Button'

interface ConfirmDialogProps {
  /** Dialog title */
  title: string
  /** Descriptive message explaining the action */
  message: string
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string
  /** Whether the confirm action is destructive (renders button in red) */
  destructive?: boolean
  /** Whether the confirm action is in progress */
  loading?: boolean
  /** Called when the user confirms */
  onConfirm: () => void
  /** Called when the user cancels or clicks the backdrop */
  onCancel: () => void
}

/**
 * ConfirmDialog — a modal dialog for confirming destructive or irreversible actions.
 * Renders a backdrop overlay with a centered card containing title, message, and action buttons.
 * Accessible: uses role="dialog", aria-modal, and aria-labelledby.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        // Dismiss on backdrop click
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        {/* Title */}
        <h2
          id="confirm-dialog-title"
          className="font-heading text-xl text-off-white"
        >
          {title}
        </h2>

        {/* Message */}
        <p className="font-body text-sm text-mid-gray leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`
              inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full
              font-body font-semibold text-sm transition-colors duration-150 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${destructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary text-white hover:bg-accent'
              }
            `}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
