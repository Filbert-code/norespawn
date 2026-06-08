import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, Library, Settings as SettingsIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Persistent bottom navigation (D1). Real-app counterpart to
// `mockups/components/TabBar.tsx` — routes are real, not mockup paths.
const TABS = [
  { to: '/', label: 'Calendar', icon: CalendarDays },
  { to: '/plans', label: 'Plans', icon: Library },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function AppTabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="relative z-20 flex shrink-0 border-t border-nr-bronze/25 bg-nr-black/95 px-2 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2 backdrop-blur">
      {TABS.map((t) => {
        const active = pathname === t.to
        return (
          <button
            key={t.to}
            onClick={() => navigate(t.to)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-1 font-heading text-[10px] uppercase tracking-widest transition-colors',
              active ? 'text-nr-ember' : 'text-nr-bone/45 hover:text-nr-bone',
            )}
          >
            <t.icon
              className={cn('size-5', active && 'drop-shadow-[0_0_6px] drop-shadow-nr-ember/60')}
            />
            {t.label}
            <span
              className={cn(
                'mt-0.5 h-0.5 w-6 rounded-full transition-colors',
                active ? 'bg-nr-crimson' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </nav>
  )
}
