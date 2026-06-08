import { cn } from '@/lib/utils'

// Shared visual primitives used across real screens. Bigger atmosphere/header
// composition (the "page chrome") lives here so individual screens stay focused
// on data + interaction logic.

export function ScreenSurface({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col bg-nr-black text-nr-bone',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(122,30,30,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.75)]" />
      {children}
    </div>
  )
}

export function ScreenSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="size-6 animate-spin rounded-full border-2 border-nr-bronze border-t-transparent" />
    </div>
  )
}

export function ScreenError({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="font-heading text-sm uppercase tracking-widest text-nr-ember">
        Something went wrong
      </p>
      <p className="text-[12px] text-nr-bone/55">{message}</p>
    </div>
  )
}
