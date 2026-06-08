import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { ScreenError, ScreenSpinner, ScreenSurface } from '@/screens/_shared/screen'
import { useSession } from '@/lib/queries/sessions'
import { useExercises } from '@/lib/queries/exercises'
import { supabase, unwrap } from '@/lib/db'
import { useQuery } from '@tanstack/react-query'
import type { SessionEvent, SessionExercise, SessionSet } from '@/lib/supabase'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${WEEKDAY_LABELS[(d.getDay() + 6) % 7]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function useSessionEvents(sessionId: string | undefined) {
  return useQuery({
    enabled: !!sessionId,
    queryKey: ['session_event', sessionId],
    queryFn: async (): Promise<SessionEvent[]> => {
      const rows = unwrap(
        await supabase
          .from('session_event')
          .select('*')
          .eq('session_id', sessionId!)
          .order('occurred_at'),
      ) as SessionEvent[]
      return rows
    },
  })
}

const eventMeta: Record<SessionEvent['event_type'], { icon: typeof Check; tone: string }> = {
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

export function SessionRecapScreen() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { data, isLoading, error } = useSession(sessionId)
  const { data: events } = useSessionEvents(sessionId)
  const { data: catalog } = useExercises()

  const catBySlug = useMemo(
    () => new Map((catalog ?? []).map((c) => [c.slug, c])),
    [catalog],
  )

  const totals = useMemo(() => {
    if (!data) return null
    const completed = data.sets.filter((s) => s.status === 'completed')
    const skipped = data.sets.filter((s) => s.status === 'skipped').length
    const volume = completed.reduce(
      (sum, s) => sum + (s.actual_reps ?? 0) * Number(s.actual_weight_lbs ?? 0),
      0,
    )
    const rpes = completed
      .map((s) => s.actual_rpe)
      .filter((r): r is number => typeof r === 'number')
    const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0
    return {
      completed,
      skipped,
      volume,
      avgRpe,
      lifts: data.exercises.length,
    }
  }, [data])

  return (
    <ScreenSurface>
      <header className="relative border-b border-nr-bronze/15 px-5 pb-4 pt-9">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex size-8 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 hover:border-nr-crimson hover:text-nr-crimson"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
            Battle Record
          </p>
          <span className="size-8" />
        </div>
        <h1 className="mt-3 font-heading text-2xl font-bold uppercase leading-tight tracking-[0.08em] text-nr-bone">
          {data?.session.workout_name_snapshot ?? 'Session'}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-nr-bone/45">
          {data && fmtDate(data.session.started_at)}
          {data?.session.total_active_seconds && (
            <>
              <span className="text-nr-bronze/50">·</span>
              <Timer className="size-3.5 text-nr-bronze/70" />
              {Math.round(data.session.total_active_seconds / 60)} min
            </>
          )}
        </p>
      </header>

      <div className="relative flex-1 space-y-7 overflow-y-auto px-5 py-6">
        {isLoading && <ScreenSpinner />}
        {error && <ScreenError message={(error as Error).message} />}

        {data && totals && (
          <>
            <div className="grid grid-cols-4 gap-2">
              <SumTile icon={<Dumbbell className="size-3.5" />} label="Volume" value={totals.volume.toLocaleString()} unit="lb" />
              <SumTile icon={<Layers className="size-3.5" />} label="Sets" value={String(totals.completed.length)} />
              <SumTile icon={<Repeat2 className="size-3.5" />} label="Lifts" value={String(totals.lifts)} />
              <SumTile icon={<Trophy className="size-3.5" />} label="RPE" value={totals.avgRpe ? totals.avgRpe.toFixed(1) : '—'} highlight />
            </div>
            {totals.skipped > 0 && (
              <p className="-mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-nr-bone/35">
                <Flame className="size-3 text-nr-bronze/60" />
                {totals.skipped} skipped
              </p>
            )}

            <section className="space-y-4">
              <h2 className="font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
                The Reckoning
              </h2>
              {data.exercises.map((ex, i) => {
                const sets = data.sets.filter((s) => s.session_exercise_id === ex.id)
                const cat = catBySlug.get(ex.exercise_slug)
                return (
                  <ExerciseCard
                    key={ex.id}
                    index={i + 1}
                    exercise={ex}
                    sets={sets}
                    subLabel={cat?.body_sub_group_slug ?? null}
                    onOpen={() => navigate(`/exercise/${ex.exercise_slug}`)}
                  />
                )
              })}
            </section>

            {events && events.length > 0 && (
              <section>
                <h2 className="mb-3 font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
                  Event Timeline
                </h2>
                <ol className="relative ml-1 space-y-3 border-l border-nr-bronze/25 pl-5">
                  {events.map((event) => {
                    const { icon: Icon, tone } = eventMeta[event.event_type]
                    const occ = new Date(event.occurred_at)
                    return (
                      <li key={event.id} className="relative">
                        <span className="absolute -left-[1.7rem] flex size-6 items-center justify-center rounded-full border border-nr-bronze/40 bg-nr-black">
                          <Icon className={cn('size-3', tone)} />
                        </span>
                        <p className="text-[12px] leading-tight text-nr-bone/85">
                          {event.event_type.replace(/_/g, ' ')}
                        </p>
                        <p className="mt-0.5 font-heading text-[9px] uppercase tracking-widest text-nr-bone/35">
                          {occ.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )}

            <button
              onClick={() => navigate('/schedule', { state: { planId: data.session.workout_id } })}
              className="clip-bevel flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-base font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
            >
              <Repeat2 className="size-5" />
              Repeat This Workout
            </button>
          </>
        )}
      </div>
    </ScreenSurface>
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
      <span className={cn('mx-auto mb-1 flex items-center justify-center', highlight ? 'text-nr-ember' : 'text-nr-bronze/70')}>
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
  sets,
  subLabel,
  onOpen,
}: {
  index: number
  exercise: SessionExercise
  sets: SessionSet[]
  subLabel: string | null
  onOpen: () => void
}) {
  const completed = sets.filter((s) => s.status === 'completed')
  const exVolume = completed.reduce(
    (sum, s) => sum + (s.actual_reps ?? 0) * Number(s.actual_weight_lbs ?? 0),
    0,
  )
  return (
    <div className="clip-bevel-sm border border-nr-bronze/20 bg-nr-gunmetal/30">
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-3 border-b border-nr-bronze/15 px-3 py-2.5 text-left hover:bg-nr-bronze/5"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-nr-bronze/40 font-heading text-xs font-bold text-nr-bronze">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">
            {exercise.exercise_name_snapshot}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-nr-bone/40">
            {subLabel && `${subLabel} · `}{completed.length} sets · {exVolume.toLocaleString()} lb
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-nr-bronze/50" />
      </button>

      <ul className="divide-y divide-nr-bronze/10">
        {sets.map((set) => (
          <SetRow key={set.id} set={set} />
        ))}
      </ul>
    </div>
  )
}

function SetRow({ set }: { set: SessionSet }) {
  const skipped = set.status === 'skipped'
  const planW = set.planned_weight_lbs == null ? null : Number(set.planned_weight_lbs)
  const actW = set.actual_weight_lbs == null ? null : Number(set.actual_weight_lbs)
  const weightChanged = !skipped && planW != null && actW != null && actW !== planW
  const repsChanged =
    !skipped &&
    set.actual_reps != null &&
    set.planned_reps != null &&
    set.actual_reps !== set.planned_reps

  return (
    <li className={cn('flex items-center gap-3 px-3 py-2', skipped && 'opacity-55')}>
      <div className="flex w-9 shrink-0 flex-col items-center">
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-sm border text-[11px] font-bold',
            skipped ? 'border-nr-bronze/25 text-nr-bone/40' : 'border-nr-crimson/50 text-nr-bone',
          )}
        >
          {set.set_number}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        {skipped ? (
          <p className="font-heading text-sm uppercase tracking-wide text-nr-bone/45">
            {set.planned_reps ?? '?'} × {planW ?? '?'} lb
          </p>
        ) : (
          <p className="font-heading text-sm uppercase tracking-wide text-nr-bone">
            {set.actual_reps ?? '?'} × {actW ?? '?'}
            <span className="ml-0.5 text-[11px] text-nr-bone/50">lb</span>
          </p>
        )}
        {(weightChanged || repsChanged) && (
          <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-nr-ember/80">
            {weightChanged && actW != null && planW != null &&
              (actW > planW ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />)}
            plan {set.planned_reps ?? '?'} × {planW ?? '?'}
          </p>
        )}
      </div>

      <div className="w-12 shrink-0 text-right">
        {skipped ? (
          <span className="text-[10px] uppercase tracking-widest text-nr-bone/30">—</span>
        ) : set.actual_rpe ? (
          <span className="font-heading text-sm tabular-nums text-nr-bronze">
            {set.actual_rpe}
            <span className="ml-0.5 text-[8px] uppercase tracking-wider text-nr-bone/35">rpe</span>
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-widest text-nr-bone/30">—</span>
        )}
      </div>

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
