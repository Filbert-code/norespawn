import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, ChevronUp, Settings, Skull, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { ExerciseCard } from '@/mockups/components/ExerciseCard'
import {
  BODY_GROUPS,
  EXERCISES,
  EXERCISES_BY_GROUP,
  subGroupsForGroup,
} from '@/mockups/data/exercises'

export function WorkoutBuilder() {
  const navigate = useNavigate()
  const location = useLocation()
  // D8: pass any in-flight scheduling context straight through to Forge Plan.
  const sched = location.state as { from?: string; date?: string } | null
  const [activeGroup, setActiveGroup] = useState(BODY_GROUPS[0].slug)
  const [selected, setSelected] = useState<string[]>([
    'barbell_bench_press',
    'incline_dumbbell_press',
    'cable_fly',
    'chest_dip',
    'barbell_overhead_press',
  ])
  const [trayOpen, setTrayOpen] = useState(false)
  const [expandedSub, setExpandedSub] = useState<string[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const toggle = (slug: string) =>
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )

  const toggleSub = (sub: string) =>
    setExpandedSub((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub],
    )

  const selectGroup = (slug: string) => {
    setActiveGroup(slug)
    setExpandedSub([]) // collapse all subgroups so the user lands on a quick index
    scrollRef.current?.scrollTo({ top: 0 })
  }

  // keep the active chip centered in the horizontal strip
  useEffect(() => {
    chipRefs.current[activeGroup]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeGroup])

  const subGroups = useMemo(() => subGroupsForGroup(activeGroup), [activeGroup])
  const groupExercises = EXERCISES_BY_GROUP[activeGroup] ?? []

  const selectedExercises = useMemo(
    () => selected.map((s) => EXERCISES.find((e) => e.slug === s)!).filter(Boolean),
    [selected],
  )

  return (
    <PhoneFrame>
      {/* ---- Header ---- */}
      <header className="relative z-30 flex items-center gap-3 border-b border-nr-bronze/25 bg-nr-black/95 px-4 pb-3 pt-10">
        <Skull className="size-6 text-nr-bronze" strokeWidth={1.5} />
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-nr-bone">
          Build Workout
        </h1>
        <button
          onClick={() => navigate('/mockups/settings')}
          aria-label="Settings"
          className="ml-auto flex size-9 items-center justify-center rounded-full border border-nr-bronze/40 text-nr-bronze transition-colors hover:border-nr-crimson hover:text-nr-crimson"
        >
          <Settings className="size-5" />
        </button>
      </header>

      {/* ---- Body-group filter strip (scrollable, single-select) ---- */}
      <div className="relative z-30 border-b border-nr-bronze/15 bg-nr-black/95">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {BODY_GROUPS.map((g) => {
            const active = g.slug === activeGroup
            return (
              <button
                key={g.slug}
                ref={(el) => {
                  chipRefs.current[g.slug] = el
                }}
                onClick={() => selectGroup(g.slug)}
                className={cn(
                  'clip-bevel-sm shrink-0 px-3.5 py-1.5 font-heading text-xs font-semibold uppercase tracking-widest transition-all',
                  active
                    ? 'bg-nr-crimson text-nr-bone shadow-[0_0_14px_-2px] shadow-nr-ember/70'
                    : 'border border-nr-bronze/30 text-nr-bone/55 hover:text-nr-bone',
                )}
              >
                {g.label}
              </button>
            )
          })}
        </div>
        {/* edge fades hint scrollability */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-nr-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-nr-black to-transparent" />
      </div>

      {/* ---- Catalog (selected group, grouped by subgroup) ---- */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto scroll-smooth pb-24 [scrollbar-width:thin]"
      >
        {subGroups.map((sub) => {
          const list = groupExercises.filter((e) => e.subGroup === sub)
          const open = expandedSub.includes(sub)
          const chosen = list.filter((e) => selected.includes(e.slug)).length
          return (
            <section key={sub}>
              {/* collapsible sticky subgroup band */}
              <button
                onClick={() => toggleSub(sub)}
                className="sticky top-0 z-10 flex w-full items-center gap-2 border-y border-nr-bronze/25 bg-gradient-to-r from-nr-oxblood/40 via-nr-black/95 to-nr-black/95 px-4 py-2.5 backdrop-blur"
              >
                <Skull className="size-4 text-nr-bronze" />
                <h2 className="font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
                  {sub}
                </h2>
                {chosen > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-nr-crimson font-mono text-[10px] text-nr-bone">
                    {chosen}
                  </span>
                )}
                <span className="ml-auto text-[10px] uppercase tracking-widest text-nr-bone/45">
                  {list.length} {list.length === 1 ? 'Exercise' : 'Exercises'}
                </span>
                <ChevronDown
                  className={cn(
                    'size-4 text-nr-bronze transition-transform',
                    open && 'rotate-180',
                  )}
                />
              </button>

              {open && (
                <div className="grid grid-cols-2 gap-2.5 p-3">
                  {list.map((ex) => (
                    <ExerciseCard
                      key={ex.slug}
                      exercise={ex}
                      selected={selected.includes(ex.slug)}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* ---- Expandable selection sheet ---- */}
      {trayOpen && (
        <button
          aria-label="Close plan"
          onClick={() => setTrayOpen(false)}
          className="absolute inset-0 z-30 bg-nr-black/60 backdrop-blur-sm"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col border-t border-nr-bronze/30 bg-nr-black/98">
        {/* expanded list */}
        {trayOpen && (
          <div className="flex max-h-[60vh] flex-col">
            <div className="flex items-center gap-2 border-b border-nr-bronze/20 px-4 py-3">
              <h3 className="font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
                Your Plan
              </h3>
              <span className="flex size-6 items-center justify-center rounded-full bg-nr-crimson font-mono text-xs text-nr-bone">
                {selectedExercises.length}
              </span>
              <button
                onClick={() => setSelected([])}
                className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-widest text-nr-bone/45 hover:text-nr-crimson"
              >
                <Trash2 className="size-3.5" /> Clear
              </button>
              <button
                onClick={() => setTrayOpen(false)}
                className="flex size-7 items-center justify-center rounded-full border border-nr-bronze/30 text-nr-bone/60 hover:text-nr-bone"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
              {selectedExercises.length === 0 && (
                <p className="px-4 py-8 text-center text-sm italic text-nr-bone/30">
                  No exercises yet — tap cards to forge your plan.
                </p>
              )}
              {selectedExercises.map((ex, i) => (
                <div
                  key={ex.slug}
                  className="flex items-center gap-3 border-b border-nr-bronze/10 px-4 py-2.5"
                >
                  <span className="w-5 text-center font-mono text-xs text-nr-bronze">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm font-semibold uppercase tracking-wide text-nr-bone">
                      {ex.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-nr-bone/45">
                      {ex.subGroup}
                    </p>
                  </div>
                  <button
                    onClick={() => toggle(ex.slug)}
                    className="flex size-7 items-center justify-center rounded-full border border-nr-bronze/30 text-nr-bone/50 hover:border-nr-crimson hover:text-nr-crimson"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* persistent bottom bar */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button
            onClick={() => setTrayOpen((o) => !o)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-nr-bronze/40 bg-nr-gunmetal text-nr-bronze">
              <ChevronUp
                className={cn(
                  'size-5 transition-transform',
                  trayOpen && 'rotate-180',
                )}
              />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-sm font-bold uppercase tracking-widest text-nr-bone">
                {selectedExercises.length} Exercises
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-nr-bone/45">
                tap to {trayOpen ? 'hide' : 'review & edit'}
              </span>
            </span>
          </button>

          <button
            disabled={selectedExercises.length === 0}
            onClick={() => navigate('/mockups/forge-plan', { state: sched })}
            className="clip-bevel flex shrink-0 items-center gap-1 bg-nr-crimson px-4 py-3 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_18px_-4px] shadow-nr-ember/80 transition-all hover:bg-nr-ember disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Forge Plan
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </PhoneFrame>
  )
}
