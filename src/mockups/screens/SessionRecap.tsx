import { useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Check,
  Dumbbell,
  Flame,
  Hourglass,
  Layers,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat2,
  SkipForward,
  Timer,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'

// ============================================================================
// SessionRecap — the read-only record of a finished `workout_session`.
// Reached by tapping a completed day on the calendar. All data is mock/inline.
// A finished session = workout_session (completed) -> ordered session_exercise
// rows -> session_set rows; plus an append-only session_event log.
// ============================================================================

type SetRole = 'warmup' | 'working' | 'cooldown'
type SetStatus = 'completed' | 'skipped' | 'pending'

interface SessionSet {
  setNumber: number
  role: SetRole
  status: SetStatus
  plannedReps: number
  plannedWeight: number
  actualReps: number | null
  actualWeight: number | null
  actualRpe: number | null
  completedAt: string | null
}

interface SessionExercise {
  name: string
  subGroup: string
  status: 'completed' | 'skipped'
  pr: boolean
  sets: SessionSet[]
}

type EventType =
  | 'weight_changed'
  | 'reps_changed'
  | 'rest_changed'
  | 'set_added'
  | 'set_removed'
  | 'exercise_skipped'
  | 'set_completed'
  | 'paused'
  | 'resumed'

interface SessionEvent {
  type: EventType
  at: string
  text: string
}

// ---- mock session_exercise + session_set rows -----------------------------
const EXERCISES: SessionExercise[] = [
  {
    name: 'Incline Dumbbell Press',
    subGroup: 'Upper Chest',
    status: 'completed',
    pr: false,
    sets: [
      { setNumber: 1, role: 'warmup', status: 'completed', plannedReps: 12, plannedWeight: 40, actualReps: 12, actualWeight: 40, actualRpe: 5, completedAt: '12:03' },
      { setNumber: 2, role: 'working', status: 'completed', plannedReps: 10, plannedWeight: 65, actualReps: 10, actualWeight: 65, actualRpe: 7, completedAt: '12:06' },
      { setNumber: 3, role: 'working', status: 'completed', plannedReps: 10, plannedWeight: 65, actualReps: 9, actualWeight: 65, actualRpe: 8, completedAt: '12:09' },
      { setNumber: 4, role: 'working', status: 'completed', plannedReps: 10, plannedWeight: 65, actualReps: 8, actualWeight: 65, actualRpe: 9, completedAt: '12:12' },
    ],
  },
  {
    name: 'Barbell Bench Press',
    subGroup: 'Chest',
    status: 'completed',
    pr: true,
    sets: [
      { setNumber: 1, role: 'working', status: 'completed', plannedReps: 8, plannedWeight: 135, actualReps: 8, actualWeight: 135, actualRpe: 7, completedAt: '12:18' },
      { setNumber: 2, role: 'working', status: 'completed', plannedReps: 8, plannedWeight: 135, actualReps: 8, actualWeight: 140, actualRpe: 8, completedAt: '12:22' },
      { setNumber: 3, role: 'working', status: 'completed', plannedReps: 8, plannedWeight: 135, actualReps: 8, actualWeight: 140, actualRpe: 9, completedAt: '12:26' },
      { setNumber: 4, role: 'working', status: 'completed', plannedReps: 8, plannedWeight: 135, actualReps: 6, actualWeight: 140, actualRpe: 10, completedAt: '12:31' },
    ],
  },
  {
    name: 'Cable Fly',
    subGroup: 'Chest',
    status: 'completed',
    pr: false,
    sets: [
      { setNumber: 1, role: 'working', status: 'completed', plannedReps: 12, plannedWeight: 25, actualReps: 12, actualWeight: 25, actualRpe: 7, completedAt: '12:37' },
      { setNumber: 2, role: 'working', status: 'completed', plannedReps: 12, plannedWeight: 25, actualReps: 11, actualWeight: 25, actualRpe: 8, completedAt: '12:40' },
      { setNumber: 3, role: 'working', status: 'skipped', plannedReps: 12, plannedWeight: 25, actualReps: null, actualWeight: null, actualRpe: null, completedAt: null },
    ],
  },
  {
    name: 'Overhead Press',
    subGroup: 'Shoulders',
    status: 'completed',
    pr: true,
    sets: [
      { setNumber: 1, role: 'working', status: 'completed', plannedReps: 8, plannedWeight: 75, actualReps: 8, actualWeight: 75, actualRpe: 7, completedAt: '12:46' },
      { setNumber: 2, role: 'working', status: 'completed', plannedReps: 8, plannedWeight: 75, actualReps: 8, actualWeight: 80, actualRpe: 9, completedAt: '12:50' },
      { setNumber: 3, role: 'working', status: 'completed', plannedReps: 8, plannedWeight: 75, actualReps: 7, actualWeight: 80, actualRpe: 9, completedAt: '12:54' },
    ],
  },
  {
    name: 'Triceps Pushdown',
    subGroup: 'Triceps',
    status: 'completed',
    pr: false,
    sets: [
      { setNumber: 1, role: 'working', status: 'completed', plannedReps: 12, plannedWeight: 50, actualReps: 12, actualWeight: 50, actualRpe: 7, completedAt: '12:58' },
      { setNumber: 2, role: 'working', status: 'completed', plannedReps: 12, plannedWeight: 50, actualReps: 12, actualWeight: 50, actualRpe: 8, completedAt: '13:01' },
      { setNumber: 3, role: 'cooldown', status: 'skipped', plannedReps: 12, plannedWeight: 50, actualReps: null, actualWeight: null, actualRpe: null, completedAt: null },
    ],
  },
]

// ---- mock session_event log (append-only) ----------------------------------
const EVENTS: SessionEvent[] = [
  { type: 'set_completed', at: '12:06', text: 'First working set on Incline Dumbbell Press' },
  { type: 'weight_changed', at: '12:22', text: 'Weight → 140 lb on Bench Press' },
  { type: 'set_completed', at: '12:31', text: 'PR — 140 lb × 6 on Bench Press' },
  { type: 'paused', at: '12:33', text: 'Paused — chalked up' },
  { type: 'resumed', at: '12:35', text: 'Resumed' },
  { type: 'exercise_skipped', at: '12:42', text: 'Skipped last set of Cable Fly' },
  { type: 'set_added', at: '12:50', text: 'Added a set to Overhead Press' },
  { type: 'reps_changed', at: '12:54', text: 'Reps → 7 on Overhead Press' },
  { type: 'set_removed', at: '13:03', text: 'Dropped cooldown set on Triceps Pushdown' },
]

// ---- derived session_session totals ----------------------------------------
const allSets = EXERCISES.flatMap((e) => e.sets)
const completedSets = allSets.filter((s) => s.status === 'completed')
const skippedCount = allSets.filter((s) => s.status === 'skipped').length
const totalVolume = completedSets.reduce(
  (sum, s) => sum + (s.actualReps ?? 0) * (s.actualWeight ?? 0),
  0,
)
const prCount = EXERCISES.filter((e) => e.pr).length
const avgRpe =
  completedSets.length > 0
    ? completedSets.reduce((sum, s) => sum + (s.actualRpe ?? 0), 0) / completedSets.length
    : 0

const eventMeta: Record<EventType, { icon: typeof Check; tone: string }> = {
  weight_changed: { icon: ArrowUp, tone: 'text-nr-ember' },
  reps_changed: { icon: Repeat2, tone: 'text-nr-bronze' },
  rest_changed: { icon: Hourglass, tone: 'text-nr-bronze' },
  set_added: { icon: Plus, tone: 'text-nr-bronze' },
  set_removed: { icon: Minus, tone: 'text-nr-bone/50' },
  exercise_skipped: { icon: SkipForward, tone: 'text-nr-bone/50' },
  set_completed: { icon: Check, tone: 'text-nr-crimson' },
  paused: { icon: Pause, tone: 'text-nr-bronze' },
  resumed: { icon: Play, tone: 'text-nr-crimson' },
}

export function SessionRecap() {
  const navigate = useNavigate()
  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col bg-nr-black text-nr-bone">
        {/* faint atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(122,30,30,0.20),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.75)]" />

        {/* ---- header ---- */}
        <header className="relative border-b border-nr-bronze/15 px-5 pb-4 pt-9">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/mockups/calendar')}
              aria-label="Back"
              className="flex size-8 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 transition-colors hover:border-nr-crimson hover:text-nr-crimson"
            >
              <ChevronLeft className="size-5" />
            </button>
            <p className="font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
              Battle Record
            </p>
            <span className="size-8" />
          </div>
          <h1 className="mt-3 font-heading text-2xl font-bold uppercase leading-tight tracking-[0.08em] text-nr-bone">
            Iron Crusade — Push
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-nr-bone/45">
            Mon, Jun 1
            <span className="text-nr-bronze/50">·</span>
            <Timer className="size-3.5 text-nr-bronze/70" />
            54 min
          </p>
        </header>

        <div className="relative flex-1 space-y-7 overflow-y-auto px-5 py-6">
          {/* ---- summary tiles ---- */}
          <div className="grid grid-cols-4 gap-2">
            <SumTile icon={<Dumbbell className="size-3.5" />} label="Volume" value={totalVolume.toLocaleString()} unit="lb" />
            <SumTile icon={<Layers className="size-3.5" />} label="Sets" value={String(completedSets.length)} />
            <SumTile icon={<Repeat2 className="size-3.5" />} label="Lifts" value={String(EXERCISES.length)} />
            <SumTile icon={<Trophy className="size-3.5" />} label="PRs" value={String(prCount)} highlight />
          </div>
          <p className="-mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-nr-bone/35">
            <Flame className="size-3 text-nr-bronze/60" />
            Avg RPE {avgRpe.toFixed(1)}
            {skippedCount > 0 && <span className="text-nr-bone/25">· {skippedCount} skipped</span>}
          </p>

          {/* ---- per-exercise breakdown ---- */}
          <section className="space-y-4">
            <h2 className="font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
              The Reckoning
            </h2>
            {EXERCISES.map((exercise, i) => (
              <ExerciseCard
                key={i}
                index={i + 1}
                exercise={exercise}
                onOpen={() => navigate('/mockups/exercise')}
              />
            ))}
          </section>

          {/* ---- event timeline ---- */}
          <section>
            <h2 className="mb-3 font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
              Event Timeline
            </h2>
            <ol className="relative ml-1 space-y-3 border-l border-nr-bronze/25 pl-5">
              {EVENTS.map((event, i) => {
                const { icon: Icon, tone } = eventMeta[event.type]
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[1.7rem] flex size-6 items-center justify-center rounded-full border border-nr-bronze/40 bg-nr-black">
                      <Icon className={cn('size-3', tone)} />
                    </span>
                    <p className="text-[12px] leading-tight text-nr-bone/85">{event.text}</p>
                    <p className="mt-0.5 font-heading text-[9px] uppercase tracking-widest text-nr-bone/35">
                      {event.at} · {event.type.replace(/_/g, ' ')}
                    </p>
                  </li>
                )
              })}
            </ol>
          </section>

          {/* ---- footer action ---- */}
          <button
            onClick={() => navigate('/mockups/schedule')}
            className="clip-bevel flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-base font-bold uppercase tracking-widest text-nr-bone transition-colors hover:bg-nr-ember"
          >
            <Repeat2 className="size-5" />
            Repeat This Workout
          </button>

          <p className="pb-2 text-center text-[10px] uppercase tracking-[0.3em] text-nr-bone/25">
            NoRespawn · Session #214
          </p>
        </div>
      </div>
    </PhoneFrame>
  )
}

function SumTile({
  icon,
  label,
  value,
  unit,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'clip-bevel-sm border px-1.5 py-2.5 text-center',
        highlight
          ? 'border-nr-crimson/45 bg-nr-crimson/10'
          : 'border-nr-bronze/25 bg-nr-gunmetal/50',
      )}
    >
      <span
        className={cn(
          'mx-auto mb-1 flex items-center justify-center',
          highlight ? 'text-nr-ember' : 'text-nr-bronze/70',
        )}
      >
        {icon}
      </span>
      <p className="font-heading text-base font-bold leading-none text-nr-bone">
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-nr-bone/50">{unit}</span>}
      </p>
      <p className="mt-1 text-[8px] uppercase tracking-widest text-nr-bone/40">{label}</p>
    </div>
  )
}

function ExerciseCard({
  index,
  exercise,
  onOpen,
}: {
  index: number
  exercise: SessionExercise
  onOpen: () => void
}) {
  const working = exercise.sets.filter((s) => s.status === 'completed')
  const exVolume = working.reduce(
    (sum, s) => sum + (s.actualReps ?? 0) * (s.actualWeight ?? 0),
    0,
  )
  return (
    <div className="clip-bevel-sm border border-nr-bronze/20 bg-nr-gunmetal/30">
      {/* exercise header — taps through to the exercise deep-dive */}
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-3 border-b border-nr-bronze/15 px-3 py-2.5 text-left transition-colors hover:bg-nr-bronze/5"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-nr-bronze/40 font-heading text-xs font-bold text-nr-bronze">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">
              {exercise.name}
            </p>
            {exercise.pr && (
              <span className="flex shrink-0 items-center gap-0.5 rounded-sm border border-nr-crimson/50 bg-nr-crimson/15 px-1.5 py-0.5 font-heading text-[8px] font-bold uppercase tracking-widest text-nr-ember">
                <Trophy className="size-2.5" /> PR
              </span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-nr-bone/40">
            {exercise.subGroup} · {working.length} sets · {exVolume.toLocaleString()} lb
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-nr-bronze/50" />
      </button>

      {/* set rows */}
      <ul className="divide-y divide-nr-bronze/10">
        {exercise.sets.map((set) => (
          <SetRow key={set.setNumber} set={set} />
        ))}
      </ul>
    </div>
  )
}

function SetRow({ set }: { set: SessionSet }) {
  const skipped = set.status === 'skipped'
  const weightChanged = !skipped && set.actualWeight !== set.plannedWeight
  const repsChanged = !skipped && set.actualReps !== set.plannedReps
  return (
    <li className={cn('flex items-center gap-3 px-3 py-2', skipped && 'opacity-55')}>
      {/* set number (v1: uniform working sets — no role tags, per D6) */}
      <div className="flex w-9 shrink-0 flex-col items-center">
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-sm border text-[11px] font-bold',
            skipped ? 'border-nr-bronze/25 text-nr-bone/40' : 'border-nr-crimson/50 text-nr-bone',
          )}
        >
          {set.setNumber}
        </span>
      </div>

      {/* reps × weight */}
      <div className="min-w-0 flex-1">
        {skipped ? (
          <p className="font-heading text-sm uppercase tracking-wide text-nr-bone/45">
            {set.plannedReps} × {set.plannedWeight} lb
          </p>
        ) : (
          <p className="font-heading text-sm uppercase tracking-wide text-nr-bone">
            {set.actualReps} × {set.actualWeight}
            <span className="ml-0.5 text-[11px] text-nr-bone/50">lb</span>
          </p>
        )}
        {(weightChanged || repsChanged) && (
          <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-nr-ember/80">
            {weightChanged &&
              ((set.actualWeight ?? 0) > set.plannedWeight ? (
                <ArrowUp className="size-2.5" />
              ) : (
                <ArrowDown className="size-2.5" />
              ))}
            plan {set.plannedReps} × {set.plannedWeight}
          </p>
        )}
      </div>

      {/* RPE */}
      <div className="w-12 shrink-0 text-right">
        {skipped ? (
          <span className="text-[10px] uppercase tracking-widest text-nr-bone/30">—</span>
        ) : (
          <span className="font-heading text-sm tabular-nums text-nr-bronze">
            {set.actualRpe?.toFixed(0)}
            <span className="ml-0.5 text-[8px] uppercase tracking-wider text-nr-bone/35">rpe</span>
          </span>
        )}
      </div>

      {/* status */}
      <div className="w-5 shrink-0">
        {skipped ? (
          <SkipForward className="size-4 text-nr-bone/35" />
        ) : (
          <Check className="size-4 text-nr-crimson" />
        )}
      </div>
    </li>
  )
}
