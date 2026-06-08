import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, Dumbbell, Hammer, ListChecks, Skull, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import {
  addDays,
  MONTHS,
  sameDay,
  startOfToday,
  startOfWeekMonday,
  WEEKDAY_LABELS,
} from '@/mockups/data/calendar'

// ============================================================================
// Scheduling a future day = writing a `scheduled_workout` row:
//   { scheduled_date, workout_id, status: 'scheduled', notes }
// A "rest day" is the same row with no workout_id (REST_ID sentinel here).
// Plans below are mock `workout` rows kept inline; `lastUsedDaysAgo` drives the
// most-recent sort, and `exercises` is the snapshot of `workout_exercise` rows.
// ============================================================================
interface PlanExercise {
  name: string
  scheme: string
}
interface MockPlan {
  id: string
  name: string
  bodyGroups: string[]
  durationMin: number
  lastUsedDaysAgo?: number // undefined = never performed
  exercises: PlanExercise[]
}

const PLANS: MockPlan[] = [
  {
    id: 'pln_relentless_pull',
    name: 'Relentless Pull',
    bodyGroups: ['Back', 'Biceps'],
    durationMin: 50,
    lastUsedDaysAgo: 2,
    exercises: [
      { name: 'Barbell Deadlift', scheme: '4 × 5 · 225 lb' },
      { name: 'Pull Up', scheme: '4 × 8 · BW' },
      { name: 'Barbell Row', scheme: '4 × 8 · 135 lb' },
      { name: 'Lat Pulldown', scheme: '3 × 10 · 120 lb' },
      { name: 'Barbell Curl', scheme: '3 × 10 · 60 lb' },
      { name: 'Hammer Curl', scheme: '3 × 12 · 30 lb' },
    ],
  },
  {
    id: 'pln_iron_crusade',
    name: 'Iron Crusade — Push',
    bodyGroups: ['Chest', 'Shoulders', 'Triceps'],
    durationMin: 52,
    lastUsedDaysAgo: 4,
    exercises: [
      { name: 'Barbell Bench Press', scheme: '4 × 8 · 135 lb' },
      { name: 'Incline Dumbbell Press', scheme: '4 × 10 · 65 lb' },
      { name: 'Overhead Press', scheme: '3 × 8 · 75 lb' },
      { name: 'Cable Fly', scheme: '3 × 12 · 25 lb' },
      { name: 'Lateral Raise', scheme: '3 × 15 · 15 lb' },
      { name: 'Triceps Pushdown', scheme: '3 × 12 · 50 lb' },
    ],
  },
  {
    id: 'pln_bastion_legs',
    name: 'Bastion Legs',
    bodyGroups: ['Quads', 'Hamstrings', 'Calves'],
    durationMin: 64,
    lastUsedDaysAgo: 6,
    exercises: [
      { name: 'Barbell Back Squat', scheme: '4 × 6 · 185 lb' },
      { name: 'Leg Press', scheme: '4 × 12 · 270 lb' },
      { name: 'Romanian Deadlift', scheme: '4 × 10 · 135 lb' },
      { name: 'Leg Extension', scheme: '3 × 12 · 90 lb' },
      { name: 'Seated Leg Curl', scheme: '3 × 12 · 90 lb' },
      { name: 'Walking Lunge', scheme: '3 × 12 · 40 lb' },
      { name: 'Standing Calf Raise', scheme: '4 × 15 · 150 lb' },
    ],
  },
  {
    id: 'pln_sentinel_core',
    name: 'Sentinel Core',
    bodyGroups: ['Core', 'Abs'],
    durationMin: 34,
    lastUsedDaysAgo: 9,
    exercises: [
      { name: 'Plank', scheme: '3 × 45s' },
      { name: 'Hanging Leg Raise', scheme: '3 × 12 · BW' },
      { name: 'Cable Woodchopper', scheme: '3 × 15 · 30 lb' },
      { name: 'Russian Twist', scheme: '3 × 20 · BW' },
      { name: 'Crunch', scheme: '3 × 20 · BW' },
    ],
  },
  {
    id: 'pln_oathbound_arms',
    name: 'Oathbound Arms',
    bodyGroups: ['Biceps', 'Triceps'],
    durationMin: 40,
    lastUsedDaysAgo: 13,
    exercises: [
      { name: 'Barbell Curl', scheme: '3 × 10 · 60 lb' },
      { name: 'Dumbbell Curl', scheme: '3 × 12 · 30 lb' },
      { name: 'Hammer Curl', scheme: '3 × 12 · 30 lb' },
      { name: 'Triceps Pushdown', scheme: '3 × 12 · 50 lb' },
      { name: 'Overhead Tricep Extension', scheme: '3 × 12 · 40 lb' },
    ],
  },
  {
    id: 'pln_warforged_full',
    name: 'Warforged — Full Body',
    bodyGroups: ['Chest', 'Back', 'Legs'],
    durationMin: 70,
    lastUsedDaysAgo: undefined,
    exercises: [
      { name: 'Barbell Back Squat', scheme: '4 × 6 · 185 lb' },
      { name: 'Barbell Bench Press', scheme: '4 × 8 · 135 lb' },
      { name: 'Barbell Row', scheme: '4 × 8 · 135 lb' },
      { name: 'Overhead Press', scheme: '3 × 8 · 75 lb' },
      { name: 'Romanian Deadlift', scheme: '3 × 10 · 135 lb' },
      { name: 'Pull Up', scheme: '3 × 8 · BW' },
      { name: 'Leg Press', scheme: '3 × 12 · 270 lb' },
      { name: 'Lateral Raise', scheme: '3 × 15 · 15 lb' },
    ],
  },
]

const today = startOfToday()

function lastUsedLabel(daysAgo?: number): string {
  if (daysAgo === undefined) return 'Never used'
  if (daysAgo === 0) return 'Used today'
  if (daysAgo === 1) return 'Used yesterday'
  return `Used ${daysAgo} days ago`
}

export function ScheduleWorkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as { date?: string; newPlan?: string } | null
  const stateDate = navState?.date
  // Target day comes from the calendar tap; fall back to a near-future default.
  const target = stateDate ? new Date(stateDate) : addDays(today, 4)

  // D8: a plan just built from scratch arrives here as a synthetic, pre-selected row.
  const freshPlan: MockPlan | null = navState?.newPlan
    ? {
        id: 'pln_fresh',
        name: navState.newPlan,
        bodyGroups: ['New'],
        durationMin: 50,
        lastUsedDaysAgo: undefined,
        exercises: [],
      }
    : null
  const allPlans = freshPlan ? [freshPlan, ...PLANS] : PLANS

  const [selected, setSelected] = useState<string | null>(freshPlan?.id ?? null)
  const [note, setNote] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const weekStart = startOfWeekMonday(target)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const targetLabel = `${WEEKDAY_LABELS[(target.getDay() + 6) % 7]}, ${MONTHS[target.getMonth()]} ${target.getDate()}`

  // Sort plans by most-recently used; never-used sinks to the bottom.
  const sortedPlans = [...allPlans].sort(
    (a, b) => (a.lastUsedDaysAgo ?? Infinity) - (b.lastUsedDaysAgo ?? Infinity),
  )

  const detailPlan = allPlans.find((p) => p.id === detailId) ?? null
  const canSchedule = selected !== null && !scheduled

  const select = (id: string) => {
    setSelected(id)
    setScheduled(false)
  }

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col bg-nr-black text-nr-bone">
        {/* faint atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(122,30,30,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.75)]" />

        {/* ---- header ---- */}
        <header className="relative border-b border-nr-bronze/15 px-5 pb-4 pt-9">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/mockups/calendar')}
              aria-label="Back"
              className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 transition-colors hover:border-nr-crimson hover:text-nr-ember"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
                NoRespawn
              </p>
              <h1 className="font-heading text-2xl font-bold uppercase tracking-[0.12em] text-nr-bone">
                Schedule · {targetLabel}
              </h1>
            </div>
          </div>
        </header>

        {/* ---- scrollable content ---- */}
        <div className="relative flex-1 space-y-6 overflow-y-auto px-5 py-5 pb-28">
          {/* week-strip context */}
          <div>
            <h2 className="mb-2 font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
              Target Day
            </h2>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d, i) => {
                const isTarget = sameDay(d, target)
                const isToday = sameDay(d, today)
                return (
                  <div
                    key={i}
                    className={cn(
                      'clip-bevel-sm flex flex-col items-center gap-1 border py-2',
                      isTarget
                        ? 'border-nr-ember bg-nr-crimson/15 shadow-[0_0_14px_-4px] shadow-nr-ember/70'
                        : 'border-nr-bronze/20',
                    )}
                  >
                    <span className="text-[9px] font-medium uppercase tracking-widest text-nr-bone/45">
                      {WEEKDAY_LABELS[i][0]}
                    </span>
                    <span
                      className={cn(
                        'font-heading text-base font-bold',
                        isTarget ? 'text-nr-ember' : isToday ? 'text-nr-bronze' : 'text-nr-bone',
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* build-from-scratch (carries the target date so we can return here) */}
          <button
            onClick={() =>
              navigate('/mockups/workout-builder', {
                state: { from: 'schedule', date: target.toISOString() },
              })
            }
            className="clip-bevel-sm flex w-full items-center justify-center gap-2 border border-dashed border-nr-bronze/40 py-3 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze transition-colors hover:border-nr-crimson hover:text-nr-crimson"
          >
            <Hammer className="size-4" /> Build New Plan from Scratch
          </button>

          {freshPlan && (
            <div className="clip-bevel-sm flex items-center gap-2 border border-nr-ember/40 bg-nr-crimson/10 px-3 py-2.5">
              <Check className="size-4 shrink-0 text-nr-ember" strokeWidth={3} />
              <p className="text-[11px] uppercase tracking-wider text-nr-bone/80">
                <span className="text-nr-bone">{freshPlan.name}</span> forged &amp; selected — pick the
                day below, then schedule.
              </p>
            </div>
          )}

          {/* plan selection */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
                Choose a Plan
              </h2>
              <span className="text-[9px] uppercase tracking-widest text-nr-bone/35">
                Most recent first
              </span>
            </div>
            <ul className="space-y-2">
              {sortedPlans.map((plan) => {
                const active = selected === plan.id
                return (
                  <li
                    key={plan.id}
                    className={cn(
                      'clip-bevel overflow-hidden border transition-all',
                      active
                        ? 'border-nr-crimson bg-nr-crimson/10 shadow-[0_0_18px_-4px] shadow-nr-ember/70'
                        : 'border-nr-bronze/25 bg-nr-gunmetal/40',
                    )}
                  >
                    <div className="flex items-stretch">
                      {/* select area */}
                      <button
                        onClick={() => select(plan.id)}
                        className="flex flex-1 items-center gap-3 px-4 py-3 text-left"
                      >
                        <span
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-sm border',
                            active
                              ? 'border-nr-crimson bg-nr-crimson/20 text-nr-ember'
                              : 'border-nr-bronze/30 bg-nr-black/50 text-nr-bronze',
                          )}
                        >
                          <Dumbbell className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-sm font-bold uppercase tracking-wide text-nr-bone">
                            {plan.name}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {plan.bodyGroups.map((g) => (
                              <span
                                key={g}
                                className="rounded-sm border border-nr-bronze/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-nr-bone/60"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                          <p className="mt-1.5 text-[10px] uppercase tracking-widest text-nr-bone/40">
                            {plan.exercises.length} exercises · ~{plan.durationMin} min ·{' '}
                            <span className={cn(plan.lastUsedDaysAgo === undefined && 'text-nr-bone/30')}>
                              {lastUsedLabel(plan.lastUsedDaysAgo)}
                            </span>
                          </p>
                        </div>
                        <span
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-full border',
                            active ? 'border-nr-crimson bg-nr-crimson text-nr-bone' : 'border-nr-bronze/40',
                          )}
                        >
                          {active && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                      </button>
                      {/* details */}
                      <button
                        onClick={() => setDetailId(plan.id)}
                        aria-label={`View ${plan.name} details`}
                        className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 border-l border-nr-bronze/20 text-nr-bone/50 transition-colors hover:bg-nr-bronze/10 hover:text-nr-bone"
                      >
                        <ListChecks className="size-4" />
                        <span className="text-[8px] uppercase tracking-wider">View</span>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* optional note */}
          <div>
            <h2 className="mb-2 font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
              Note
            </h2>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              className="clip-bevel-sm h-11 w-full border border-nr-bronze/30 bg-nr-black/40 px-3 text-sm text-nr-bone placeholder:text-nr-bone/30 focus:border-nr-crimson/60 focus:outline-none"
            />
          </div>
        </div>

        {/* ---- floating schedule button ---- */}
        {selected && (
          <div className="pointer-events-none absolute inset-x-0 bottom-7 z-30 flex justify-center px-6">
            {scheduled ? (
              <div className="clip-bevel pointer-events-auto flex items-center gap-2 border border-nr-crimson/50 bg-nr-black/90 px-6 py-3 shadow-[0_0_30px_-6px] shadow-nr-ember/70 backdrop-blur-sm">
                <Check className="size-5 text-nr-ember" strokeWidth={3} />
                <span className="font-heading text-sm font-bold uppercase tracking-widest text-nr-ember">
                  Scheduled · {targetLabel}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setScheduled(true)}
                disabled={!canSchedule}
                className="clip-bevel pointer-events-auto flex items-center gap-2 bg-nr-crimson px-10 py-3.5 font-heading text-base font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_30px_-4px] shadow-nr-ember/80 transition-colors hover:bg-nr-ember"
              >
                <Skull className="size-5" /> Schedule
              </button>
            )}
          </div>
        )}

        {/* ---- plan detail sheet ---- */}
        {detailPlan && (
          <div className="absolute inset-0 z-40 flex flex-col">
            <button
              aria-label="Close"
              onClick={() => setDetailId(null)}
              className="absolute inset-0 bg-nr-black/85 backdrop-blur-sm"
            />
            <div className="relative mt-auto flex max-h-[82%] flex-col border-t border-nr-bronze/40 bg-nr-gunmetal px-5 pb-7 pt-4">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
                    {detailPlan.name}
                  </h3>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-nr-bone/45">
                    {detailPlan.exercises.length} exercises · ~{detailPlan.durationMin} min ·{' '}
                    {lastUsedLabel(detailPlan.lastUsedDaysAgo)}
                  </p>
                </div>
                <button onClick={() => setDetailId(null)} className="text-nr-bone/50 hover:text-nr-bone">
                  <X className="size-5" />
                </button>
              </div>

              <div className="mb-3 mt-2 flex flex-wrap gap-1">
                {detailPlan.bodyGroups.map((g) => (
                  <span
                    key={g}
                    className="rounded-sm border border-nr-bronze/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-nr-bone/60"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <ul className="space-y-1.5 overflow-y-auto">
                {detailPlan.exercises.map((ex, i) => (
                  <li
                    key={ex.name}
                    className="clip-bevel-sm flex items-center gap-3 border border-nr-bronze/20 bg-nr-black/30 px-3 py-2.5"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-nr-bronze/30 text-[10px] font-bold text-nr-bone/50">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-heading text-sm uppercase tracking-wide text-nr-bone">
                      {ex.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-nr-ember/80">
                      {ex.scheme}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  select(detailPlan.id)
                  setDetailId(null)
                }}
                className="clip-bevel-sm mt-4 flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
              >
                <Check className="size-4" strokeWidth={3} /> Select This Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  )
}
