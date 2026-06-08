import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  Dumbbell,
  Hammer,
  ListChecks,
  Skull,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScreenError, ScreenSpinner, ScreenSurface } from '@/screens/_shared/screen'
import { usePlan, usePlans, type PlanSummary } from '@/lib/queries/plans'
import { useExercises } from '@/lib/queries/exercises'
import { useScheduleWorkout } from '@/lib/queries/schedule'

type LocationState = {
  date?: string // ISO datetime from calendar tap
  /** When ForgePlan returns after a "Build new plan" flow. */
  newPlanId?: string
  /** When Plans → Schedule kicks off pre-selected. */
  planId?: string
} | null

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}
function startOfWeekMonday(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  const day = (c.getDay() + 6) % 7
  return addDays(c, -day)
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function lastUsedLabel(iso: string | null): string {
  if (!iso) return 'Never used'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'Used today'
  if (days === 1) return 'Used yesterday'
  return `Used ${days} days ago`
}

export function ScheduleWorkoutScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState

  const today = useMemo(() => startOfToday(), [])
  const target = useMemo(() => {
    if (state?.date) {
      const d = new Date(state.date)
      d.setHours(0, 0, 0, 0)
      return d
    }
    return addDays(today, 1)
  }, [state?.date, today])

  const { data: plans, isLoading, error } = usePlans()
  const scheduleMutation = useScheduleWorkout()

  const initialPlanId = state?.newPlanId ?? state?.planId ?? null
  const [selectedId, setSelectedId] = useState<string | null>(initialPlanId)
  const [note, setNote] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    if (!plans) return []
    return [...plans].sort((a, b) => {
      const at = a.lastPerformedAt ? new Date(a.lastPerformedAt).getTime() : 0
      const bt = b.lastPerformedAt ? new Date(b.lastPerformedAt).getTime() : 0
      return bt - at
    })
  }, [plans])

  const weekStart = startOfWeekMonday(target)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const targetLabel = `${WEEKDAY_LABELS[(target.getDay() + 6) % 7]}, ${MONTHS[target.getMonth()]} ${target.getDate()}`

  const select = (id: string) => {
    setSelectedId(id)
    setScheduled(false)
  }

  async function doSchedule() {
    if (!selectedId) return
    await scheduleMutation.mutateAsync({
      date: target,
      workoutId: selectedId,
      notes: note || null,
    })
    setScheduled(true)
    // Brief beat so the "Scheduled" toast is visible, then return to the
    // calendar focused on the target day so the user can see their schedule.
    window.setTimeout(() => {
      navigate('/', { replace: true, state: { focusDate: target.toISOString() } })
    }, 750)
  }

  return (
    <ScreenSurface>
      <header className="relative border-b border-nr-bronze/15 px-5 pb-4 pt-9">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 hover:border-nr-crimson hover:text-nr-ember"
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

      <div className="relative flex-1 space-y-6 overflow-y-auto px-5 py-5 pb-28">
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

        <button
          onClick={() =>
            navigate('/builder', { state: { from: 'schedule', date: target.toISOString() } })
          }
          className="clip-bevel-sm flex w-full items-center justify-center gap-2 border border-dashed border-nr-bronze/40 py-3 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
        >
          <Hammer className="size-4" /> Build New Plan from Scratch
        </button>

        {state?.newPlanId && (
          <div className="clip-bevel-sm flex items-center gap-2 border border-nr-ember/40 bg-nr-crimson/10 px-3 py-2.5">
            <Check className="size-4 shrink-0 text-nr-ember" strokeWidth={3} />
            <p className="text-[11px] uppercase tracking-wider text-nr-bone/80">
              Plan forged &amp; pre-selected — schedule it below.
            </p>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
              Choose a Plan
            </h2>
            <span className="text-[9px] uppercase tracking-widest text-nr-bone/35">
              Most recent first
            </span>
          </div>

          {isLoading && <ScreenSpinner />}
          {error && <ScreenError message={(error as Error).message} />}
          {!isLoading && !error && sorted.length === 0 && (
            <p className="py-6 text-center text-xs uppercase tracking-widest text-nr-bone/40">
              No plans yet — forge one above.
            </p>
          )}

          <ul className="space-y-2">
            {sorted.map((plan) => (
              <PlanRow
                key={plan.workout.id}
                plan={plan}
                active={selectedId === plan.workout.id}
                onSelect={() => select(plan.workout.id)}
                onDetails={() => setDetailId(plan.workout.id)}
              />
            ))}
          </ul>
        </div>

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

      {selectedId && (
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
              onClick={doSchedule}
              disabled={scheduleMutation.isPending}
              className="clip-bevel pointer-events-auto flex items-center gap-2 bg-nr-crimson px-10 py-3.5 font-heading text-base font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_30px_-4px] shadow-nr-ember/80 hover:bg-nr-ember disabled:opacity-40"
            >
              <Skull className="size-5" /> Schedule
            </button>
          )}
        </div>
      )}

      {detailId && (
        <PlanDetailSheet
          planId={detailId}
          onClose={() => setDetailId(null)}
          onSelect={() => {
            select(detailId)
            setDetailId(null)
          }}
        />
      )}
    </ScreenSurface>
  )
}

function PlanRow({
  plan,
  active,
  onSelect,
  onDetails,
}: {
  plan: PlanSummary
  active: boolean
  onSelect: () => void
  onDetails: () => void
}) {
  return (
    <li
      className={cn(
        'clip-bevel overflow-hidden border transition-all',
        active
          ? 'border-nr-crimson bg-nr-crimson/10 shadow-[0_0_18px_-4px] shadow-nr-ember/70'
          : 'border-nr-bronze/25 bg-nr-gunmetal/40',
      )}
    >
      <div className="flex items-stretch">
        <button
          onClick={onSelect}
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
              {plan.workout.name}
            </p>
            <p className="mt-1.5 text-[10px] uppercase tracking-widest text-nr-bone/40">
              {plan.exerciseCount} exercises · {lastUsedLabel(plan.lastPerformedAt)}
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
        <button
          onClick={onDetails}
          aria-label="View plan details"
          className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 border-l border-nr-bronze/20 text-nr-bone/50 hover:bg-nr-bronze/10 hover:text-nr-bone"
        >
          <ListChecks className="size-4" />
          <span className="text-[8px] uppercase tracking-wider">View</span>
        </button>
      </div>
    </li>
  )
}

function PlanDetailSheet({
  planId,
  onClose,
  onSelect,
}: {
  planId: string
  onClose: () => void
  onSelect: () => void
}) {
  const { data: detail, isLoading } = usePlan(planId)
  const { data: catalog } = useExercises()
  const byslug = new Map((catalog ?? []).map((e) => [e.slug, e]))

  return (
    <div className="absolute inset-0 z-40 flex flex-col">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-nr-black/85 backdrop-blur-sm"
      />
      <div className="relative mt-auto flex max-h-[82%] flex-col border-t border-nr-bronze/40 bg-nr-gunmetal px-5 pb-7 pt-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
              {detail?.workout.name ?? 'Plan'}
            </h3>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-nr-bone/45">
              {detail?.exercises.length ?? 0} exercises
            </p>
          </div>
          <button onClick={onClose} className="text-nr-bone/50 hover:text-nr-bone">
            <X className="size-5" />
          </button>
        </div>

        {isLoading && <ScreenSpinner />}

        <ul className="space-y-1.5 overflow-y-auto">
          {(detail?.exercises ?? []).map((ex, i) => {
            const c = byslug.get(ex.exercise_slug)
            const scheme = `${ex.planned_sets} × ${
              ex.planned_reps ??
              (ex.planned_duration_seconds ? `${ex.planned_duration_seconds}s` : '')
            }${ex.planned_weight_lbs ? ` · ${ex.planned_weight_lbs} lb` : ''}`
            return (
              <li
                key={ex.id}
                className="clip-bevel-sm flex items-center gap-3 border border-nr-bronze/20 bg-nr-black/30 px-3 py-2.5"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-nr-bronze/30 text-[10px] font-bold text-nr-bone/50">
                  {i + 1}
                </span>
                <span className="flex-1 font-heading text-sm uppercase tracking-wide text-nr-bone">
                  {c?.name ?? ex.exercise_slug}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-nr-ember/80">
                  {scheme}
                </span>
              </li>
            )
          })}
        </ul>

        <button
          onClick={onSelect}
          className="clip-bevel-sm mt-4 flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
        >
          <Check className="size-4" strokeWidth={3} /> Select This Plan
        </button>
      </div>
    </div>
  )
}
