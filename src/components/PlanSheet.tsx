import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PlanSheet({
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onClose: () => void
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-nr-black/80 backdrop-blur-sm"
      />
      <div className="relative mt-auto max-h-[85%] overflow-y-auto border-t border-nr-bronze/40 bg-nr-gunmetal px-4 pb-8 pt-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
            {title}
          </h3>
          <button onClick={onClose} className="shrink-0 text-nr-bone/50 hover:text-nr-bone">
            <X className="size-5" />
          </button>
        </div>
        {subtitle && (
          <p className="mb-3 text-[10px] uppercase tracking-wider text-nr-bone/35">{subtitle}</p>
        )}
        {children}
        {footer}
      </div>
    </div>
  )
}

export function PlanSheetRow({
  badge,
  name,
  meta,
  trailing,
  highlight,
}: {
  badge: React.ReactNode
  name: string
  meta: React.ReactNode
  trailing?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <li
      className={cn(
        'clip-bevel-sm flex items-center gap-2.5 border px-3 py-2',
        highlight ? 'border-nr-ember/60 bg-nr-crimson/10' : 'border-nr-bronze/25 bg-nr-black/30',
      )}
    >
      {badge}
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">{name}</p>
        <p className="text-[10px] uppercase tracking-wider text-nr-bone/40">{meta}</p>
      </div>
      {trailing}
    </li>
  )
}
