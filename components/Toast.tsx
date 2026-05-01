'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  /** Show a success toast */
  success: (message: string) => void
  /** Show an error toast */
  error: (message: string) => void
  /** Show an info toast */
  info: (message: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Individual Toast Item ────────────────────────────────────────────────────

/** Icon for each toast type */
const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

/** Tailwind classes for each toast type */
const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-[#4F46E8] text-white',
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

/**
 * Individual toast notification item.
 * Auto-dismisses after 4 seconds; can also be dismissed manually.
 */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false)

  // Animate in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[260px] max-w-sm
        font-body text-sm font-medium
        transition-all duration-300
        ${typeClasses[toast.type]}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {/* Icon */}
      <span className="w-5 h-5 rounded-full bg-surface/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {icons[toast.type]}
      </span>

      {/* Message */}
      <span className="flex-1">{toast.message}</span>

      {/* Dismiss button */}
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onDismiss(toast.id), 300)
        }}
        aria-label="Dismiss notification"
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity text-base leading-none cursor-pointer"
      >
        ×
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * ToastProvider — wraps the app and renders the toast stack.
 * Place this near the root layout so all pages can use toasts.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  /** Removes a toast by ID */
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /** Adds a new toast */
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const value: ToastContextValue = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    info: (msg) => addToast('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack — fixed bottom-right */}
      <div
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useToast — returns toast helpers (success, error, info).
 * Must be used inside a ToastProvider.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
