import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Dumbbell,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkullGlyph } from '@/components/SkullGlyph'
import { anim, staggerDelay } from '@/lib/animations'
import { getExerciseArt } from '@/lib/exerciseArt'
import { FadeInImage } from '@/components/FadeInImage'
import { ScreenError, ScreenSpinner, ScreenSurface } from '@/screens/_shared/screen'
import {
  exercisesByGroup,
  subGroupSlugsForGroup,
  useBodyGroups,
  useExercises,
} from '@/lib/queries/exercises'
import type { Exercise } from '@/lib/supabase'

// ============================================================================
// Live Workout Builder — exercise picker that doubles as the catalog browser.
// Selected slugs are kept in component state; they're handed off to ForgePlan
// (M2) where the user finalises sets/reps/weights and saves a `workout`.
// ============================================================================

type LocationState = { from?: string; date?: string; planId?: string } | null

export function WorkoutBuilderScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const sched = location.state as LocationState

  const { data: tax, isLoading: taxLoading, error: taxError } = useBodyGroups()
  const { data: exercises, isLoading: exLoading, error: exError } = useExercises()

  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [trayOpen, setTrayOpen] = useState(false)
  const [expandedSub, setExpandedSub] = useState<string[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Default to the first body group once data lands.
  useEffect(() => {
    if (!activeGroup && tax?.groups.length) setActiveGroup(tax.groups[0].slug)
  }, [tax, activeGroup])

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
    setExpandedSub([])
    scrollRef.current?.scrollTo({ top: 0 })
  }

  useEffect(() => {
    if (activeGroup) {
      chipRefs.current[activeGroup]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [activeGroup])

  const subSlugs = useMemo(
    () => (exercises && activeGroup ? subGroupSlugsForGroup(exercises, activeGroup) : []),
    [exercises, activeGroup],
  )
  const groupExercises = useMemo(
    () => (exercises && activeGroup ? exercisesByGroup(exercises, activeGroup) : []),
    [exercises, activeGroup],
  )

  // Map sub-slug -> label using the taxonomy.
  const subLabel = (slug: string) =>
    tax?.subs.find((s) => s.slug === slug)?.label ?? slug

  const selectedExercises = useMemo(
    () =>
      selected
        .map((s) => exercises?.find((e) => e.slug === s))
        .filter((e): e is Exercise => !!e),
    [selected, exercises],
  )

  const isLoading = taxLoading || exLoading
  const error = taxError || exError

  return (
    <ScreenSurface>
      <header className="relative z-30 flex items-center gap-3 border-b border-nr-bronze/25 bg-nr-black/95 px-4 pb-3 pt-10">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 hover:border-nr-crimson hover:text-nr-ember"
        >
          <ChevronLeft className="size-5" />
        </button>
        <SkullGlyph className="size-6" />
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-nr-bone">
          Build Workout
        </h1>
        <button
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          className="ml-auto flex size-9 items-center justify-center rounded-full border border-nr-bronze/40 text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
        >
          <Settings className="size-5" />
        </button>
      </header>

      {isLoading && <ScreenSpinner />}
      {error && <ScreenError message={(error as Error).message} />}

      {!isLoading && !error && tax && exercises && (
        <>
          {/* body-group filter strip */}
          <div className="relative z-30 border-b border-nr-bronze/15 bg-nr-black/95">
            <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tax.groups.map((g) => {
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
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-nr-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-nr-black to-transparent" />
          </div>

          {/* catalog */}
          <div
            ref={scrollRef}
            className="relative flex-1 overflow-y-auto scroll-smooth pb-24 [scrollbar-width:thin]"
          >
            {subSlugs.map((sub) => {
              const list = groupExercises.filter((e) => e.body_sub_group_slug === sub)
              const open = expandedSub.includes(sub)
              const chosen = list.filter((e) => selected.includes(e.slug)).length
              return (
                <section key={sub}>
                  <button
                    onClick={() => toggleSub(sub)}
                    className="sticky top-0 z-10 flex w-full items-center gap-2 border-y border-nr-bronze/25 bg-gradient-to-r from-nr-oxblood/40 via-nr-black/95 to-nr-black/95 px-4 py-2.5 backdrop-blur"
                  >
                    <SkullGlyph className="size-4" />
                    <h2 className="font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
                      {subLabel(sub)}
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
                      {list.map((ex, i) => (
                        <CatalogCard
                          key={ex.slug}
                          exercise={ex}
                          selected={selected.includes(ex.slug)}
                          onToggle={toggle}
                          index={i}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>

          {/* selection tray */}
          {trayOpen && (
            <button
              aria-label="Close plan"
              onClick={() => setTrayOpen(false)}
              className="absolute inset-0 z-30 bg-nr-black/60 backdrop-blur-sm"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col border-t border-nr-bronze/30 bg-nr-black/98">
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
                          {subLabel(ex.body_sub_group_slug ?? '')}
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
                onClick={() =>
                  navigate('/forge', {
                    state: { ...sched, slugs: selected },
                  })
                }
                className="clip-bevel flex shrink-0 items-center gap-1 bg-nr-crimson px-4 py-3 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_18px_-4px] shadow-nr-ember/80 hover:bg-nr-ember disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Forge Plan
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </ScreenSurface>
  )
}

function CatalogCard({
  exercise,
  selected,
  onToggle,
  index = 0,
}: {
  exercise: Exercise
  selected: boolean
  onToggle: (slug: string) => void
  index?: number
}) {
  const art = getExerciseArt(exercise.slug)
  return (
    <button
      type="button"
      onClick={() => onToggle(exercise.slug)}
      style={staggerDelay(index)}
      className={cn(
        anim.riseIn,
        'clip-bevel group relative flex flex-col overflow-hidden border bg-nr-gunmetal/80 p-px text-left transition-all duration-150',
        selected
          ? 'border-nr-ember shadow-[0_0_18px_-2px] shadow-nr-ember/60'
          : 'border-nr-bronze/40 hover:border-nr-bronze/80',
      )}
    >
      <div className="clip-bevel relative flex flex-col bg-nr-gunmetal/90">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.18),transparent_60%)]">
          {art ? (
            <FadeInImage
              src={art}
              alt={exercise.name}
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <>
              <SkullGlyph className="absolute size-20 opacity-[0.04]" />
              <Dumbbell className="size-10 text-nr-bronze/70" strokeWidth={1.5} />
            </>
          )}

          <span
            className={cn(
              'absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border transition-colors',
              selected
                ? 'border-nr-ember bg-nr-crimson text-nr-bone shadow-[0_0_12px] shadow-nr-ember/70'
                : 'border-nr-bronze/40 bg-nr-black/70 text-nr-bronze group-hover:border-nr-crimson group-hover:text-nr-crimson',
            )}
          >
            {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
          </span>

          <h3 className="absolute inset-x-0 bottom-0 bg-nr-black/75 px-2 py-1.5 text-center font-heading text-sm font-semibold uppercase leading-tight tracking-wide text-nr-bone">
            {exercise.name}
          </h3>
        </div>
      </div>
    </button>
  )
}
