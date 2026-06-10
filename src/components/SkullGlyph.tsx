import skullUrl from '@/assets/skull.webp'
import { cn } from '@/lib/utils'

/**
 * The grimdark war-skull glyph (generated bone-white skull with real alpha).
 * Drop-in replacement for the old Lucide `Skull` icon. Size it with the same
 * `size-*` utilities; use `opacity-*` for the faint watermark placements where
 * the icon was previously a low-alpha tint.
 */
export function SkullGlyph({ className }: { className?: string }) {
  return (
    <img
      src={skullUrl}
      alt=""
      aria-hidden
      draggable={false}
      className={cn('inline-block shrink-0 select-none object-contain', className)}
    />
  )
}
