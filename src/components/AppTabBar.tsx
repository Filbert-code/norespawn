import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Library,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { uiArt } from '@/lib/uiArt'
import { NavEmbers } from '@/components/NavEmbers'

// Persistent bottom navigation (D1). Real-app counterpart to
// `mockups/components/TabBar.tsx` — routes are real, not mockup paths.
const TABS = [
  { to: '/', label: 'Calendar', icon: CalendarDays },
  { to: '/plans', label: 'Plans', icon: Library },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

// A short-lived shower of sparks emitted from the tapped tab.
function SparkBurst() {
  const sparks = Array.from({ length: 7 }, (_, i) => {
    const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.7
    const dist = 13 + Math.random() * 11
    return { bx: Math.cos(angle) * dist, by: Math.sin(angle) * dist - 3 }
  })
  return (
    <span className="nav-burst" aria-hidden>
      <span className="nav-burst__flash" />
      {sparks.map((s, i) => (
        <span
          key={i}
          className="nav-burst__spark"
          style={{ '--bx': `${s.bx}px`, '--by': `${s.by}px` } as React.CSSProperties}
        />
      ))}
    </span>
  )
}

function TabButton({
  label,
  icon: Icon,
  active,
  onSelect,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onSelect: () => void
}) {
  // Bumping the key remounts SparkBurst so its CSS animation replays each tap.
  const [burst, setBurst] = useState(0)
  return (
    <button
      onClick={() => {
        setBurst((n) => n + 1)
        onSelect()
      }}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'nav-tab flex flex-1 flex-col items-center justify-center gap-1 font-heading text-[10px] uppercase tracking-widest',
        active ? 'text-nr-ember' : 'text-nr-bone/45 hover:text-nr-bone',
      )}
    >
      {burst > 0 && <SparkBurst key={burst} />}
      <Icon
        className={cn('size-5', active && 'drop-shadow-[0_0_6px] drop-shadow-nr-ember/70')}
      />
      {label}
      <span
        className={cn(
          'mt-0.5 h-0.5 w-6 rounded-full transition-colors',
          active ? 'bg-nr-crimson shadow-[0_0_6px] shadow-nr-ember/70' : 'bg-transparent',
        )}
      />
    </button>
  )
}

export function AppTabBar({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      className={cn(
        'relative isolate flex items-stretch gap-2 bg-nr-black px-[28px] pt-[26px] pb-[max(env(safe-area-inset-bottom),20px)]',
        className,
      )}
    >
      {/* Generated grimdark war-banner frame: the art *is* the border. Corners
          stay crisp while the ember-seam top edge and ornamental rails stretch
          across the bar (border-image); `fill` paints the dark center field. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          borderStyle: 'solid',
          borderWidth: '22px 26px 18px 26px',
          borderImageSource: `url(${uiArt.navFrame})`,
          borderImageSlice: '120 150 120 150 fill',
          borderImageRepeat: 'stretch',
        }}
      />
      {/* Living-ember motion: drifting cinders behind the slots + breathing seam. */}
      <NavEmbers />
      <span className="nav-ember-seam" aria-hidden />
      {TABS.map((t) => (
        <TabButton
          key={t.to}
          label={t.label}
          icon={t.icon}
          active={pathname === t.to}
          onSelect={() => navigate(t.to)}
        />
      ))}
    </nav>
  )
}

// Approximate tab bar height + safe area; screens use this to keep their
// trailing content scrollable above the floating tab bar.
//   1rem (pb baseline) + 0.5rem (pt) + 5-line button (icon + label + accent)
// Combined with safe-area-inset-bottom this lands ~80–96px on most devices.
// Tailwind classes — keep these in sync if the bar's vertical rhythm changes.
export const TAB_BAR_PB = 'pb-[calc(env(safe-area-inset-bottom,0px)+5.25rem)]'
