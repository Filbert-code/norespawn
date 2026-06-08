import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PhoneFrameProps {
  children: ReactNode
  className?: string
}

/** A lightweight iPhone-ish bezel for presenting mobile-first mockups. */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        'relative h-[812px] w-[390px] shrink-0 rounded-[3rem] border-[10px] border-black bg-nr-black p-0 shadow-2xl shadow-black/60 ring-1 ring-nr-bronze/20',
        className,
      )}
    >
      {/* notch */}
      <div className="absolute left-1/2 top-0 z-30 h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-black" />
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.3rem] bg-nr-black">
        {children}
      </div>
    </div>
  )
}
