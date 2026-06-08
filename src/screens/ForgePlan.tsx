import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, GripVertical, Minus, Plus, Save, Swords, Timer, TimerReset } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScreenError, ScreenSpinner, ScreenSurface } from '@/screens/_shared/screen'
import { useExercises } from '@/lib/queries/exercises'
import {
  useCreatePlan,
  usePlan,
  useUpdatePlan,
  type PlanExerciseInput,
} from '@/lib/queries/plans'
import { useStartSession } from '@/lib/queries/sessions'
import type { Exercise } from '@/lib/supabase'

const SET_REST_OPTIONS = [30, 45, 60, 90]
const EXERCISE_REST_OPTIONS = [60, 90, 120]

interface Edit {
  sets: number
  reps: number
  weight: number
  duration: number
}

type LocationState = {
  /** WorkoutBuilder hands us a fresh selection of catalog slugs to forge. */
  slugs?: string[]
  /** When set, return to schedule with the new plan pre-selected. */
  from?: string
  date?: string
  /** Set by ScheduleWorkout "build from scratch" loopback. */
  planId?: string
} | null

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`
}

export function ForgePlanScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ planId?: string }>()
  const state = location.state as LocationState
  const editing = params.planId
  const fromSchedule = state?.from === 'schedule'

  const { data: catalog, isLoading: catLoading, error: catError } = useExercises()
  const { data: existing, isLoading: planLoading } = usePlan(editing)
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const startSession = useStartSession()

  const [name, setName] = useState('New Plan')
  const [restSet, setRestSet] = useState(45)
  const [restExercise, setRestExercise] = useState(120)
  const [order, setOrder] = useState<string[]>([])
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [seeded, setSeeded] = useState(false)

  // Seed plan from either the existing record (edit) or fresh selection (create).
  useEffect(() => {
    if (seeded || !catalog) return
    if (editing) {
      if (!existing) return
      setName(existing.workout.name)
      const slugs = existing.exercises.map((e) => e.exercise_slug)
      setOrder(slugs)
      const next: Record<string, Edit> = {}
      let setRestSeed = 45
      let endRestSeed = 120
      for (const ex of existing.exercises) {
        next[ex.exercise_slug] = {
          sets: ex.planned_sets,
          reps: ex.planned_reps ?? 10,
          weight: ex.planned_weight_lbs ? Number(ex.planned_weight_lbs) : 0,
          duration: ex.planned_duration_seconds ?? 45,
        }
        setRestSeed = ex.planned_set_rest_seconds
        endRestSeed = ex.planned_end_rest_seconds
      }
      setEdits(next)
      setRestSet(setRestSeed)
      setRestExercise(endRestSeed)
      setSeeded(true)
    } else if (state?.slugs) {
      const slugs = state.slugs.filter((s) => catalog.some((c) => c.slug === s))
      setOrder(slugs)
      const next: Record<string, Edit> = {}
      for (const s of slugs) {
        const c = catalog.find((c) => c.slug === s)!
        next[s] = {
          sets: c.default_sets,
          reps: c.default_reps ?? 10,
          weight: c.default_weight_lbs ? Number(c.default_weight_lbs) : 0,
          duration: c.default_duration_seconds ?? 45,
        }
      }
      setEdits(next)
      setSeeded(true)
    }
  }, [catalog, existing, editing, state, seeded])

  const exercises = useMemo(() => {
    if (!catalog) return []
    return order.map((s) => catalog.find((c) => c.slug === s)).filter((e): e is Exercise => !!e)
  }, [catalog, order])

  const reorder = (from: number, to: number) =>
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })

  const update = (slug: string, next: Partial<Edit>) =>
    setEdits((prev) => ({ ...prev, [slug]: { ...prev[slug], ...next } }))

  function buildPlanInput(): PlanExerciseInput[] {
    return exercises.map((c, i) => {
      const e = edits[c.slug]
      const isTimed = c.tracking_type === 'timed'
      const isBodyweight = c.default_weight_lbs == null
      return {
        exercise_slug: c.slug,
        position: i + 1,
        tracking_type: c.tracking_type,
        planned_sets: e.sets,
        planned_reps: isTimed ? null : e.reps,
        planned_weight_lbs: isBodyweight ? null : e.weight,
        planned_duration_seconds: isTimed ? e.duration : null,
        planned_set_rest_seconds: restSet,
        planned_end_rest_seconds: restExercise,
      }
    })
  }

  async function persist(): Promise<string> {
    const planInput = buildPlanInput()
    if (editing) {
      const result = await updatePlan.mutateAsync({
        id: editing,
        patch: { name },
        exercises: planInput,
      })
      return result.workout.id
    }
    const created = await createPlan.mutateAsync({
      name,
      exercises: planInput,
    })
    return created.workout.id
  }

  async function savePlan() {
    const id = await persist()
    if (fromSchedule) {
      navigate('/schedule', { state: { date: state?.date, newPlanId: id } })
    } else {
      navigate('/plans')
    }
  }

  async function saveAndStart() {
    const id = await persist()
    const session = await startSession.mutateAsync({ workoutId: id })
    navigate(`/live/${session.id}`)
  }

  const isLoading = catLoading || (editing && planLoading)
  const error = catError

  return (
    <ScreenSurface>
      <header className="relative z-20 flex items-center gap-2 border-b border-nr-bronze/25 bg-nr-black/95 px-3 pb-3 pt-10">
        <button
          onClick={() => navigate(-1)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-nr-bronze/40 text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-nr-bone/40">
            {editing ? 'Edit Plan' : 'Forge Plan'}
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent font-heading text-xl font-bold uppercase tracking-wide text-nr-bone outline-none focus:text-nr-ember"
          />
        </div>
      </header>

      {isLoading && <ScreenSpinner />}
      {error && <ScreenError message={(error as Error).message} />}

      {!isLoading && !error && (
        <>
          <div className="flex-1 overflow-y-auto pb-28 [scrollbar-width:thin]">
            <section className="border-b border-nr-bronze/15 p-3">
              <h2 className="mb-3 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone/60">
                Rest Timers
              </h2>
              <div className="flex flex-col gap-3">
                <RestRow
                  icon={Timer}
                  label="Between Sets"
                  value={restSet}
                  options={SET_REST_OPTIONS}
                  onChange={setRestSet}
                />
                <RestRow
                  icon={TimerReset}
                  label="Between Exercises"
                  value={restExercise}
                  options={EXERCISE_REST_OPTIONS}
                  onChange={setRestExercise}
                />
              </div>
            </section>

            <section className="flex flex-col gap-2.5 p-3">
              <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-nr-bone/60">
                {exercises.length} Exercises
              </h2>
              {exercises.length === 0 && (
                <p className="py-6 text-center text-xs uppercase tracking-widest text-nr-bone/40">
                  No exercises — go back and pick some from the catalog.
                </p>
              )}
              {exercises.map((ex, i) => (
                <div
                  key={ex.slug}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnter={() => {
                    if (dragIndex !== null && dragIndex !== i) {
                      reorder(dragIndex, i)
                      setDragIndex(i)
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn(
                    'cursor-grab transition-opacity active:cursor-grabbing',
                    dragIndex === i && 'opacity-40',
                  )}
                >
                  <ExerciseRow
                    exercise={ex}
                    index={i}
                    state={
                      edits[ex.slug] ?? {
                        sets: ex.default_sets,
                        reps: ex.default_reps ?? 10,
                        weight: 0,
                        duration: 45,
                      }
                    }
                    onChange={(next) => update(ex.slug, next)}
                  />
                </div>
              ))}
            </section>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 flex gap-2 border-t border-nr-bronze/30 bg-nr-black/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
            <button
              onClick={savePlan}
              disabled={createPlan.isPending || updatePlan.isPending || exercises.length === 0}
              className="clip-bevel-sm flex flex-1 items-center justify-center gap-2 border border-nr-bronze/40 py-3.5 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone/80 hover:border-nr-bronze hover:text-nr-bone disabled:opacity-40"
            >
              <Save className="size-5" />
              {fromSchedule ? 'Save & Schedule' : 'Save Plan'}
            </button>
            {!fromSchedule && (
              <button
                onClick={saveAndStart}
                disabled={
                  createPlan.isPending ||
                  updatePlan.isPending ||
                  startSession.isPending ||
                  exercises.length === 0
                }
                className="clip-bevel flex flex-1 items-center justify-center gap-2 bg-nr-crimson py-3.5 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember disabled:opacity-40"
              >
                <Swords className="size-5" />
                Save &amp; Start
              </button>
            )}
          </div>
        </>
      )}
    </ScreenSurface>
  )
}

function ExerciseRow({
  exercise,
  state,
  index,
  onChange,
}: {
  exercise: Exercise
  state: Edit
  index: number
  onChange: (next: Partial<Edit>) => void
}) {
  const isTimed = exercise.tracking_type === 'timed'
  const isBodyweight = exercise.default_weight_lbs == null

  return (
    <div className="clip-bevel border border-nr-bronze/25 bg-nr-gunmetal/50 p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <GripVertical className="size-4 shrink-0 text-nr-bone/30" />
        <span className="font-mono text-xs text-nr-bronze">{index + 1}</span>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-nr-bone">
          {exercise.name}
        </h3>
      </div>
      <div className="flex items-end gap-2">
        <Stepper
          label="Sets"
          display={String(state.sets)}
          onDec={() => onChange({ sets: Math.max(1, state.sets - 1) })}
          onInc={() => onChange({ sets: state.sets + 1 })}
        />
        <span className="pb-1.5 text-nr-bone/20">·</span>
        {isTimed ? (
          <Stepper
            label="Time"
            display={fmtTime(state.duration)}
            onDec={() => onChange({ duration: Math.max(5, state.duration - 5) })}
            onInc={() => onChange({ duration: state.duration + 5 })}
          />
        ) : (
          <Stepper
            label="Reps"
            display={String(state.reps)}
            onDec={() => onChange({ reps: Math.max(1, state.reps - 1) })}
            onInc={() => onChange({ reps: state.reps + 1 })}
          />
        )}
        <span className="pb-1.5 text-nr-bone/20">·</span>
        <Stepper
          label="Weight (lb)"
          display={isBodyweight ? 'BW' : `${state.weight}`}
          disabled={isBodyweight}
          editableValue={isBodyweight ? undefined : state.weight}
          onEdit={(n) => onChange({ weight: n })}
          onDec={() => onChange({ weight: Math.max(0, state.weight - 5) })}
          onInc={() => onChange({ weight: state.weight + 5 })}
        />
      </div>
    </div>
  )
}

function Stepper({
  label,
  display,
  onDec,
  onInc,
  disabled,
  editableValue,
  onEdit,
}: {
  label: string
  display: string
  onDec?: () => void
  onInc?: () => void
  disabled?: boolean
  editableValue?: number
  onEdit?: (n: number) => void
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className="text-[9px] uppercase tracking-widest text-nr-bone/40">{label}</span>
      <div className="flex w-full items-center justify-between gap-1">
        <button
          onClick={onDec}
          disabled={disabled}
          className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 hover:border-nr-crimson hover:text-nr-crimson disabled:opacity-25"
        >
          <Minus className="size-3" />
        </button>
        {editableValue != null && onEdit && !disabled ? (
          <input
            type="number"
            inputMode="numeric"
            value={editableValue}
            onChange={(e) => onEdit(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-10 flex-1 rounded-sm border border-nr-bronze/20 bg-nr-black/40 text-center font-mono text-sm font-semibold text-nr-bone outline-none focus:border-nr-ember [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        ) : (
          <span
            className={cn(
              'flex-1 text-center font-mono text-sm font-semibold',
              disabled ? 'text-nr-bone/40' : 'text-nr-bone',
            )}
          >
            {display}
          </span>
        )}
        <button
          onClick={onInc}
          disabled={disabled}
          className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 hover:border-nr-crimson hover:text-nr-crimson disabled:opacity-25"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  )
}

function RestRow({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: typeof Timer
  label: string
  value: number
  options: number[]
  onChange: (v: number) => void
}) {
  const isCustom = !options.includes(value)
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-28 shrink-0 items-center gap-2 text-nr-bone/70">
        <Icon className="size-4 text-nr-bronze" />
        <span className="text-[10px] font-medium uppercase leading-tight tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex flex-1 items-center gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              'clip-bevel-sm flex-1 py-1.5 font-mono text-xs transition-all',
              o === value
                ? 'bg-nr-crimson text-nr-bone shadow-[0_0_12px_-3px] shadow-nr-ember/70'
                : 'border border-nr-bronze/25 text-nr-bone/55 hover:text-nr-bone',
            )}
          >
            {fmtTime(o)}
          </button>
        ))}
        <div
          className={cn(
            'clip-bevel-sm flex w-14 shrink-0 items-center justify-center gap-0.5 border py-1',
            isCustom ? 'border-nr-ember bg-nr-crimson/15' : 'border-nr-bronze/25',
          )}
          title="Custom rest (seconds)"
        >
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-7 bg-transparent text-right font-mono text-xs text-nr-bone outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="font-mono text-[10px] text-nr-bone/40">s</span>
        </div>
      </div>
    </div>
  )
}
