import { type CSSProperties } from 'react'

// ============================================================================
// Motion manifest — the single source of truth for the app's animations.
//
// The keyframes + utility classes live in src/index.css. This file exposes
// them as semantic names so screens stay consistent and we can retune timing
// in one place. All entrances respect prefers-reduced-motion (handled in CSS).
//
// Usage:
//   import { anim, staggerDelay } from '@/lib/animations'
//   <div className={anim.riseIn} />                       // single element
//   {items.map((it, i) => (
//     <Card className={anim.riseIn} style={staggerDelay(i)} />  // cascade
//   ))}
//
// For images, prefer <FadeInImage> (src/components/FadeInImage.tsx), which
// reveals on actual load instead of on mount.
// ============================================================================

export const anim = {
  /** Opacity only. Incidental elements appearing in place. */
  fadeIn: 'anim-fade-in',
  /** Fade + small upward rise. Default for cards, list items, sections. */
  riseIn: 'anim-rise-in',
  /** Fade + scale up from 96%. Dialogs, sheets, badges, popovers. */
  scaleIn: 'anim-scale-in',
} as const

export type AnimName = keyof typeof anim

/**
 * Per-item entrance delay for a staggered list/grid. Pair with `anim.riseIn`.
 * Caps the delay so long lists don't crawl in forever.
 */
export function staggerDelay(index: number, stepMs = 45, maxMs = 360): CSSProperties {
  return { animationDelay: `${Math.min(index * stepMs, maxMs)}ms` }
}
