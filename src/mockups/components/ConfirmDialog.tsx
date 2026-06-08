import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Reusable themed confirmation modal (D14) for irreversible actions —
// delete a plan, sign out, abandon a session, etc.
// ============================================================================
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center px-6">
      <button
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-nr-black/85 backdrop-blur-sm"
      />
      <div className="clip-bevel relative w-full max-w-[320px] border border-nr-bronze/40 bg-nr-gunmetal p-5 shadow-[0_0_40px_-8px] shadow-nr-black">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-sm border',
              danger
                ? 'border-nr-crimson/50 bg-nr-crimson/15 text-nr-ember'
                : 'border-nr-bronze/40 text-nr-bronze',
            )}
          >
            <AlertTriangle className="size-5" />
          </span>
          <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-nr-bone">
            {title}
          </h3>
        </div>
        <p className="mt-3 text-[13px] leading-snug text-nr-bone/70">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="clip-bevel-sm flex-1 border border-nr-bronze/40 py-2.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bone/70 transition-colors hover:text-nr-bone"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'clip-bevel-sm flex-1 py-2.5 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone transition-colors',
              danger ? 'bg-nr-crimson hover:bg-nr-ember' : 'bg-nr-bronze/80 hover:bg-nr-bronze',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
