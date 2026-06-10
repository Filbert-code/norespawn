import { cn } from '@/lib/utils'

// A layered background for a UI panel: the art plus a dark scrim for legibility.
// Drop inside a container that is `relative isolate overflow-hidden`; both
// layers sit at -z-10 so the panel's normal content renders above them.
export function UiBackground({
  src,
  scrim = 70,
  className,
}: {
  src: string
  /** Scrim darkness as a percent (0-100). Higher = more readable foreground. */
  scrim?: number
  className?: string
}) {
  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden
        className={cn('absolute inset-0 -z-10 size-full object-cover', className)}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: `rgba(12, 12, 14, ${scrim / 100})` }}
      />
    </>
  )
}
