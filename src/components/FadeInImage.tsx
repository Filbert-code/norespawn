import { useState, type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * An <img> that reveals once it actually loads (fade + settle from a slight
 * zoom/blur), instead of popping in. Handles already-cached images via the
 * ref's `complete` flag, and skips the motion under prefers-reduced-motion.
 */
export function FadeInImage({
  className,
  onLoad,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(prefersReducedMotion)
  return (
    <img
      {...props}
      ref={(el) => {
        if (el?.complete) setLoaded(true)
      }}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
      className={cn(
        'transition-[opacity,transform,filter] duration-700 ease-out motion-reduce:transition-none',
        loaded ? 'scale-100 opacity-100 blur-0' : 'scale-[1.03] opacity-0 blur-[2px]',
        className,
      )}
    />
  )
}
