import { NavLink, Route, Routes } from 'react-router-dom'
import { CalendarDays, Dumbbell, LayoutGrid, LogIn, Palette, Skull, SlidersHorizontal, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DesignSystem } from '@/mockups/screens/DesignSystem'
import { WorkoutBuilder } from '@/mockups/screens/WorkoutBuilder'
import { ForgePlan } from '@/mockups/screens/ForgePlan'
import { CalendarHome } from '@/mockups/screens/CalendarHome'
import { Login } from '@/mockups/screens/Login'
import { LiveSession } from '@/mockups/screens/LiveSession'
import { TypographyLab } from '@/mockups/screens/TypographyLab'

interface MockupEntry {
  path: string
  label: string
  blurb: string
  status: 'ready' | 'wip'
  icon: typeof Dumbbell
}

const MOCKUPS: MockupEntry[] = [
  {
    path: 'typography',
    label: 'Typography Lab',
    blurb: 'Compare display fonts. Pick the grimdark headline face.',
    status: 'ready',
    icon: Palette,
  },
  {
    path: 'login',
    label: 'Login',
    blurb: 'Google sign-in. Floating ash, ember glow, grimdark emblem.',
    status: 'ready',
    icon: LogIn,
  },
  {
    path: 'calendar',
    label: 'Calendar (Home)',
    blurb: 'Landing page. Week strip, today highlight, discipline streak, day detail.',
    status: 'ready',
    icon: CalendarDays,
  },
  {
    path: 'live',
    label: 'Live Session',
    blurb: 'Four-quadrant ring timer, live set/rep/weight/rest edits, event log.',
    status: 'ready',
    icon: Timer,
  },
  {
    path: 'design-system',
    label: 'Design System',
    blurb: 'Palette, type, buttons, chips, meters.',
    status: 'ready',
    icon: Palette,
  },
  {
    path: 'workout-builder',
    label: 'Workout Builder',
    blurb: 'Catalog + plan builder. Sticky group nav, card grid, selection tray.',
    status: 'ready',
    icon: Dumbbell,
  },
  {
    path: 'forge-plan',
    label: 'Forge Plan',
    blurb: 'Tune sets, reps, weight per exercise + global rest timers, then launch.',
    status: 'ready',
    icon: SlidersHorizontal,
  },
]

function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-nr-bronze/20 bg-nr-black/60 p-4">
      <NavLink to="/mockups" end className="mb-6 flex items-center gap-2">
        <Skull className="size-7 text-nr-bronze" strokeWidth={1.5} />
        <div className="leading-none">
          <p className="font-heading text-lg font-bold uppercase tracking-wide text-nr-bone">
            NoRespawn
          </p>
          <p className="text-[10px] uppercase tracking-widest text-nr-bone/40">
            Mockups
          </p>
        </div>
      </NavLink>

      <NavLink
        to="/mockups"
        end
        className={({ isActive }) =>
          cn(
            'mb-1 flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium uppercase tracking-wider transition-colors',
            isActive
              ? 'bg-nr-crimson/15 text-nr-bone'
              : 'text-nr-bone/55 hover:bg-nr-gunmetal hover:text-nr-bone',
          )
        }
      >
        <LayoutGrid className="size-4" />
        Gallery
      </NavLink>

      <p className="mb-1 mt-4 px-3 text-[10px] uppercase tracking-widest text-nr-bone/30">
        Screens
      </p>
      {MOCKUPS.map((m) => (
        <NavLink
          key={m.path}
          to={`/mockups/${m.path}`}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium uppercase tracking-wider transition-colors',
              isActive
                ? 'bg-nr-crimson/15 text-nr-bone'
                : 'text-nr-bone/55 hover:bg-nr-gunmetal hover:text-nr-bone',
            )
          }
        >
          <m.icon className="size-4" />
          {m.label}
        </NavLink>
      ))}
    </aside>
  )
}

function Gallery() {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <header className="mb-8 space-y-1">
        <h1 className="font-heading text-4xl font-bold uppercase tracking-wide text-nr-bone">
          Mockup Gallery
        </h1>
        <p className="text-sm text-nr-bone/50">
          A living library of NoRespawn UI screens. Click in to view & iterate.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {MOCKUPS.map((m) => (
          <NavLink
            key={m.path}
            to={`/mockups/${m.path}`}
            className="clip-bevel group flex items-start gap-4 border border-nr-bronze/30 bg-nr-gunmetal/50 p-5 transition-all hover:border-nr-crimson hover:shadow-[0_0_22px_-6px] hover:shadow-nr-ember/60"
          >
            <span className="flex size-11 items-center justify-center rounded-sm border border-nr-bronze/30 bg-nr-black/60 text-nr-bronze">
              <m.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-nr-bone">
                  {m.label}
                </h2>
                <span
                  className={cn(
                    'rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-widest',
                    m.status === 'ready'
                      ? 'bg-nr-crimson/80 text-nr-bone'
                      : 'border border-nr-bronze/40 text-nr-bone/50',
                  )}
                >
                  {m.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-nr-bone/55">{m.blurb}</p>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

/** Centered stage for presenting a phone-sized mockup. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center overflow-auto bg-[radial-gradient(circle_at_50%_-10%,rgba(127,29,29,0.25),transparent_55%)] p-10">
      {children}
    </div>
  )
}

export function MockupsApp() {
  return (
    <div className="dark grimdark flex min-h-svh bg-nr-black font-sans text-nr-bone">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<Gallery />} />
          <Route path="typography" element={<TypographyLab />} />
          <Route
            path="login"
            element={
              <Stage>
                <Login />
              </Stage>
            }
          />
          <Route
            path="calendar"
            element={
              <Stage>
                <CalendarHome />
              </Stage>
            }
          />
          <Route
            path="live"
            element={
              <Stage>
                <LiveSession />
              </Stage>
            }
          />
          <Route path="design-system" element={<DesignSystem />} />
          <Route
            path="workout-builder"
            element={
              <Stage>
                <WorkoutBuilder />
              </Stage>
            }
          />
          <Route
            path="forge-plan"
            element={
              <Stage>
                <ForgePlan />
              </Stage>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
