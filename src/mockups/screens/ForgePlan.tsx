import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, GripVertical, Minus, Plus, Save, Swords, Timer, TimerReset } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { getExercise, type MockExercise } from '@/mockups/data/exercises'

// A representative plan handed off from the builder (standalone for the mockup).
const PLAN_SLUGS = [
  'barbell_bench_press',
  'incline_dumbbell_press',
  'cable_fly',
  'chest_dip',
  'barbell_overhead_press',
]

const SET_REST_OPTIONS = [30, 45, 60, 90]
const EXERCISE_REST_OPTIONS = [60, 90, 120]

interface SetReps {
  sets: number
  reps: number
  weight: number
  duration: number
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`
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
  /** when provided, the value becomes a tap-to-edit numeric input */
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
          className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 transition-colors hover:border-nr-crimson hover:text-nr-crimson disabled:opacity-25 disabled:hover:border-nr-bronze/30 disabled:hover:text-nr-bone/70"
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
          className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 transition-colors hover:border-nr-crimson hover:text-nr-crimson disabled:opacity-25 disabled:hover:border-nr-bronze/30 disabled:hover:text-nr-bone/70"
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
        {/* manual entry (seconds) */}
        <div
          className={cn(
            'clip-bevel-sm flex w-14 shrink-0 items-center justify-center gap-0.5 border py-1',
            isCustom
              ? 'border-nr-ember bg-nr-crimson/15'
              : 'border-nr-bronze/25',
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

function ExerciseRow({
  exercise,
  state,
  index,
  onChange,
}: {
  exercise: MockExercise
  state: SetReps
  index: number
  onChange: (next: Partial<SetReps>) => void
}) {
  const isTimed = exercise.tracking === 'timed'
  const isBodyweight = exercise.defaultWeightLbs == null

  return (
    <div className="clip-bevel border border-nr-bronze/25 bg-nr-gunmetal/50 p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <GripVertical className="size-4 shrink-0 text-nr-bone/30" />
        <span className="font-mono text-xs text-nr-bronze">{index + 1}</span>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-nr-bone">
          {exercise.name}
        </h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-nr-bone/40">
          {exercise.subGroup}
        </span>
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

export function ForgePlan() {
  const navigate = useNavigate()
  const location = useLocation()
  // D8: when we arrived here mid-scheduling, carry the target date back so the
  // user can finish scheduling the plan they just built.
  const sched = location.state as { from?: string; date?: string } | null
  const fromSchedule = sched?.from === 'schedule'

  const [order, setOrder] = useState<string[]>(PLAN_SLUGS)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const exercises = order.map((s) => getExercise(s)!).filter(Boolean)

  const reorder = (from: number, to: number) =>
    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })

  const [name, setName] = useState('Chest & Shoulders')
  const [restSet, setRestSet] = useState(45)
  const [restExercise, setRestExercise] = useState(120)
  const [edits, setEdits] = useState<Record<string, SetReps>>(() =>
    Object.fromEntries(
      exercises.map((e) => [
        e.slug,
        {
          sets: e.defaultSets,
          reps: e.defaultReps ?? 10,
          weight: e.defaultWeightLbs ?? 0,
          duration: e.defaultDurationSeconds ?? 45,
        },
      ]),
    ),
  )

  const update = (slug: string, next: Partial<SetReps>) =>
    setEdits((prev) => ({ ...prev, [slug]: { ...prev[slug], ...next } }))

  // Save always persists the plan first (D7). If we came from scheduling,
  // bounce back there with the new plan pre-selected (D8).
  const savePlan = () => {
    if (fromSchedule) {
      navigate('/mockups/schedule', { state: { date: sched?.date, newPlan: name } })
    } else {
      navigate('/mockups/plans')
    }
  }
  const saveAndStart = () => navigate('/mockups/live')

  return (
    <PhoneFrame>
      {/* ---- Header ---- */}
      <header className="relative z-20 flex items-center gap-2 border-b border-nr-bronze/25 bg-nr-black/95 px-3 pb-3 pt-10">
        <button
          onClick={() => navigate('/mockups/workout-builder')}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-nr-bronze/40 text-nr-bronze transition-colors hover:border-nr-crimson hover:text-nr-crimson"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-nr-bone/40">Forge Plan</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent font-heading text-xl font-bold uppercase tracking-wide text-nr-bone outline-none focus:text-nr-ember"
          />
        </div>
      </header>

      {/* ---- Body ---- */}
      <div className="flex-1 overflow-y-auto pb-24 [scrollbar-width:thin]">
        {/* Global rest config */}
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

        {/* Per-exercise prescription */}
        <section className="flex flex-col gap-2.5 p-3">
          <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-nr-bone/60">
            {exercises.length} Exercises
          </h2>
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
                state={edits[ex.slug]}
                onChange={(next) => update(ex.slug, next)}
              />
            </div>
          ))}
        </section>
      </div>

      {/* ---- Save / Launch ---- */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex gap-2 border-t border-nr-bronze/30 bg-nr-black/95 p-3">
        <button
          onClick={savePlan}
          className="clip-bevel-sm flex flex-1 items-center justify-center gap-2 border border-nr-bronze/40 py-3.5 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone/80 transition-colors hover:border-nr-bronze hover:text-nr-bone"
        >
          <Save className="size-5" />
          {fromSchedule ? 'Save & Schedule' : 'Save Plan'}
        </button>
        {!fromSchedule && (
          <button
            onClick={saveAndStart}
            className="clip-bevel flex flex-1 items-center justify-center gap-2 bg-nr-crimson py-3.5 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_22px_-4px] shadow-nr-ember/80 transition-all hover:bg-nr-ember"
          >
            <Swords className="size-5" />
            Save &amp; Start
          </button>
        )}
      </div>
    </PhoneFrame>
  )
}
