import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Play,
  Plus,
  Swords,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { uiArt } from '@/lib/uiArt'
import { UiBackground } from '@/components/UiBackground'
import { SkullGlyph } from '@/components/SkullGlyph'
import { ConfirmDialog } from '@/mockups/components/ConfirmDialog'
import { PlanSheet } from '@/components/PlanSheet'
import { ScreenError, ScreenSpinner, ScreenSurface } from '@/screens/_shared/screen'
import { useScheduledWorkouts, useUnscheduleWorkout } from '@/lib/queries/schedule'
import {
  useAbandonSession,
  useInProgressSession,
  useSessions,
  useStartSession,
} from '@/lib/queries/sessions'
import { usePlans, type PlanSummary } from '@/lib/queries/plans'
import type { ScheduledWorkout, WorkoutSession } from '@/lib/supabase'

// ============================================================================
// Calendar = union of scheduled_workout (planned/future) and workout_session
// (history). Each day holds an ordered *list* of entries (multiple workouts
// per day are first-class). Within an entry: completed > in_progress >
// scheduled > missed.
// ============================================================================

type DayStatus = 'completed' | 'scheduled' | 'in_progress' | 'skipped' | 'abandoned'
interface DayEntry {
  key: string
  date: Date
  workoutName: string
  status: DayStatus
  workoutId?: string
  sessionId?: string
  scheduledId?: string
  /** Intra-day order: scheduled rows by their stored position, then sessions. */
  position: number
  durationMin?: number
  effort?: number | null
}

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

/**
 * Union scheduled + sessions into an ordered per-day *list*. A session is
 * merged into its linked scheduled row (via `session_id`); ad-hoc sessions with
 * no schedule row (Quick Start) become their own appended entries.
 */
function buildDayMap(
  scheduled: ScheduledWorkout[],
  sessions: WorkoutSession[],
  planNames: Map<string, string>,
): Map<string, DayEntry[]> {
  const map = new Map<string, DayEntry[]>()
  const bySession = new Map<string, DayEntry>()
  const add = (key: string, entry: DayEntry) => {
    const list = map.get(key)
    if (list) list.push(entry)
    else map.set(key, [entry])
  }

  // Scheduled rows first (already ordered by date, then position by the query).
  for (const s of scheduled) {
    const entry: DayEntry = {
      key: s.id,
      date: new Date(s.scheduled_date + 'T00:00:00'),
      workoutName: planNames.get(s.workout_id) ?? 'Workout',
      status:
        s.status === 'completed'
          ? 'completed'
          : s.status === 'skipped'
            ? 'skipped'
            : 'scheduled',
      workoutId: s.workout_id,
      scheduledId: s.id,
      sessionId: s.session_id ?? undefined,
      position: s.position,
    }
    add(s.scheduled_date, entry)
    if (s.session_id) bySession.set(s.session_id, entry)
  }

  // Sessions: merge into the linked scheduled entry, else append as an
  // unplanned (ad-hoc / Quick Start) entry sorted after the planned ones.
  let unplanned = 0
  for (const sess of sessions) {
    const key = sess.started_at.slice(0, 10)
    const durationMin = sess.total_active_seconds
      ? Math.round(sess.total_active_seconds / 60)
      : undefined
    const status: DayStatus =
      sess.status === 'completed'
        ? 'completed'
        : sess.status === 'abandoned'
          ? 'abandoned'
          : 'in_progress'
    const linked = bySession.get(sess.id)
    if (linked) {
      linked.status = status
      linked.sessionId = sess.id
      linked.durationMin = durationMin
      linked.effort = sess.perceived_effort
    } else {
      add(key, {
        key: sess.id,
        date: new Date(key + 'T00:00:00'),
        workoutName: sess.workout_name_snapshot,
        status,
        workoutId: sess.workout_id,
        sessionId: sess.id,
        position: 1000 + unplanned++,
        durationMin,
        effort: sess.perceived_effort,
      })
    }
  }

  for (const list of map.values()) list.sort((a, b) => a.position - b.position)
  return map
}

/** A day counts toward the streak if *any* workout that day was completed. */
function dayIsComplete(entries?: DayEntry[]): boolean {
  return !!entries?.some((e) => e.status === 'completed')
}

function disciplineStreak(map: Map<string, DayEntry[]>, today: Date): number {
  let streak = 0
  // Count today only if completed; otherwise start from yesterday.
  let cursor = today
  if (!dayIsComplete(map.get(isoKey(today)))) {
    cursor = addDays(today, -1)
  }
  while (true) {
    if (dayIsComplete(map.get(isoKey(cursor)))) {
      streak += 1
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }
  return streak
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CalendarHomeScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const today = useMemo(() => startOfToday(), [])
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today))
  const [selected, setSelected] = useState(today)

  // ScheduleWorkout (and other flows) can navigate back here with a target
  // day so the calendar lands focused on what the user just touched.
  useEffect(() => {
    const focusDate = (location.state as { focusDate?: string } | null)?.focusDate
    if (!focusDate) return
    const d = new Date(focusDate)
    d.setHours(0, 0, 0, 0)
    setSelected(d)
    setWeekStart(startOfWeekMonday(d))
    // Clear the state so back-nav / refresh doesn't keep snapping focus.
    navigate(location.pathname, { replace: true })
  }, [location.state, location.pathname, navigate])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [confirmAbandon, setConfirmAbandon] = useState<string | null>(null)
  const [confirmCancelSchedule, setConfirmCancelSchedule] = useState<{
    id: string
    name: string
  } | null>(null)
  const [quickStartOpen, setQuickStartOpen] = useState(false)
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const [launchError, setLaunchError] = useState<string | null>(null)

  // Pull a wide enough range to cover the visible week strip AND the month
  // picker grid in one query — picker shows 6 weeks centered on the chosen month.
  const rangeStart = useMemo(() => addDays(weekStart, -42), [weekStart])
  const rangeEnd = useMemo(() => addDays(weekStart, 42), [weekStart])

  const { data: scheduled, isLoading: schedLoading, error: schedError } = useScheduledWorkouts(rangeStart, rangeEnd)
  const { data: sessions, isLoading: sessLoading, error: sessError } = useSessions(rangeStart, rangeEnd)
  const { data: inProgress } = useInProgressSession()
  const { data: plans } = usePlans()
  const abandon = useAbandonSession()
  const unschedule = useUnscheduleWorkout()
  const startSession = useStartSession()

  async function startPlan(planId: string) {
    setLaunchingId(planId)
    setLaunchError(null)
    try {
      const session = await startSession.mutateAsync({ workoutId: planId })
      setQuickStartOpen(false)
      navigate(`/live/${session.id}`)
    } catch (e) {
      setLaunchError((e as Error).message)
      setLaunchingId(null)
    }
  }

  // Start a *scheduled* entry: resume if it already spawned a session, else
  // snapshot a fresh session from its plan and link the schedule row.
  async function startScheduled(entry: DayEntry) {
    if (entry.sessionId) {
      goLive(entry.sessionId)
      return
    }
    if (!entry.workoutId) return
    setLaunchError(null)
    try {
      const session = await startSession.mutateAsync({
        workoutId: entry.workoutId,
        scheduledWorkoutId: entry.scheduledId,
      })
      navigate(`/live/${session.id}`)
    } catch (e) {
      setLaunchError((e as Error).message)
    }
  }

  const planNames = useMemo(
    () => new Map((plans ?? []).map((p) => [p.workout.id, p.workout.name])),
    [plans],
  )
  const dayMap = useMemo(
    () => buildDayMap(scheduled ?? [], sessions ?? [], planNames),
    [scheduled, sessions, planNames],
  )

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekEnd = addDays(weekStart, 6)
  const streak = disciplineStreak(dayMap, today)
  const onCurrentWeek = sameDay(weekStart, startOfWeekMonday(today))

  const selectedKey = isoKey(selected)
  const isToday = sameDay(selected, today)
  const isFuture = selected.getTime() > today.getTime()
  // An in-progress session must always be resumable on "today" even if its UTC
  // start date lands on an adjacent calendar key — inject it if missing.
  const selectedEntries = useMemo<DayEntry[]>(() => {
    const base = dayMap.get(selectedKey) ?? []
    if (isToday && inProgress && !base.some((e) => e.sessionId === inProgress.id)) {
      return [
        {
          key: inProgress.id,
          date: selected,
          workoutName: inProgress.workout_name_snapshot,
          status: 'in_progress',
          workoutId: inProgress.workout_id,
          sessionId: inProgress.id,
          position: -1,
        },
        ...base,
      ]
    }
    return base
  }, [dayMap, selectedKey, isToday, inProgress, selected])

  const rangeLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}`
      : `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}`

  const selectedLabel = `${WEEKDAY_LABELS[(selected.getDay() + 6) % 7]}, ${MONTHS[selected.getMonth()]} ${selected.getDate()}`

  const isLoading = schedLoading || sessLoading
  const error = schedError || sessError

  const goToSchedule = () =>
    navigate('/schedule', { state: { date: selected.toISOString() } })
  const goLive = (sessionId: string) => navigate(`/live/${sessionId}`)
  const goRecap = (sessionId: string) => navigate(`/recap/${sessionId}`)

  function jumpToDate(date: Date) {
    setSelected(date)
    setWeekStart(startOfWeekMonday(date))
    setPickerOpen(false)
  }
  function openPicker() {
    setPickerMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
    setPickerOpen(true)
  }

  return (
    <ScreenSurface>
      <header className="flex items-center gap-2 px-4 pb-3 pt-10">
        <SkullGlyph className="size-14 [filter:saturate(0.2)_brightness(1.5)]" />
        <div className="leading-none">
          <h1 className="font-heading text-2xl font-bold uppercase tracking-[0.2em] text-nr-bone">
            NoRespawn
          </h1>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-nr-bone/40">
            Glory thru discipline
          </p>
        </div>
      </header>

      <div className="clip-bevel relative isolate mx-4 mb-3 flex items-center gap-3 overflow-hidden border border-nr-bronze/30 bg-nr-gunmetal/50 px-4 py-3">
        <UiBackground src={uiArt.streakBanner} scrim={68} />
        <span className="flex size-10 items-center justify-center rounded-full bg-nr-crimson/15 text-nr-ember">
          <Flame className="size-6" />
        </span>
        <div className="leading-none">
          <p className="font-heading text-3xl font-bold text-nr-bone">
            {streak}
            <span className="ml-1.5 align-baseline font-sans text-xs font-medium uppercase tracking-widest text-nr-bone/50">
              day streak
            </span>
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-nr-bone/40">
            Do not break the chain
          </p>
        </div>
        <div className="ml-auto flex items-end gap-1">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(today, i - 6)
            const w = dayMap.get(isoKey(d))
            return (
              <span
                key={i}
                className={cn(
                  'w-1.5 rounded-full',
                  dayIsComplete(w) ? 'h-5 bg-nr-crimson' : 'h-2 bg-nr-bone/15',
                )}
              />
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-2">
        <button
          onClick={openPicker}
          className="group flex items-center gap-1.5 text-nr-bone hover:text-nr-crimson"
        >
          <CalendarDays className="size-4 text-nr-bronze group-hover:text-nr-crimson" />
          <h2 className="font-heading text-sm font-bold uppercase tracking-widest">
            {onCurrentWeek ? 'This Week' : rangeLabel}
          </h2>
          <ChevronDown className="size-3.5 text-nr-bronze group-hover:text-nr-crimson" />
        </button>
        {!onCurrentWeek && (
          <button
            onClick={() => {
              setWeekStart(startOfWeekMonday(today))
              setSelected(today)
            }}
            className="ml-2 rounded-sm border border-nr-bronze/30 px-2 py-0.5 text-[9px] uppercase tracking-widest text-nr-bone/60 hover:border-nr-crimson hover:text-nr-crimson"
          >
            Today
          </button>
        )}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="flex size-7 items-center justify-center rounded-full border border-nr-bronze/30 text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="flex size-7 items-center justify-center rounded-full border border-nr-bronze/30 text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 px-3 pb-1">
        {days.map((d, i) => {
          const dToday = sameDay(d, today)
          const dSelected = sameDay(d, selected)
          const w = dayMap.get(isoKey(d))
          return (
            <button
              key={i}
              onClick={() => setSelected(d)}
              className={cn(
                'clip-bevel-sm flex flex-col items-center gap-1.5 border py-2 transition-all',
                dSelected
                  ? 'border-nr-ember bg-nr-crimson/15 shadow-[0_0_14px_-4px] shadow-nr-ember/70'
                  : dToday
                    ? 'border-nr-crimson/60 bg-nr-gunmetal/40'
                    : 'border-nr-bronze/20 hover:border-nr-bronze/50',
              )}
            >
              <span className="text-[9px] font-medium uppercase tracking-widest text-nr-bone/45">
                {WEEKDAY_LABELS[i][0]}
              </span>
              <span
                className={cn(
                  'font-heading text-base font-bold',
                  dToday ? 'text-nr-ember' : 'text-nr-bone',
                )}
              >
                {d.getDate()}
              </span>
              <span className="flex h-4 items-center justify-center">
                <DayGlyph entries={w} muted={d.getTime() < today.getTime()} />
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] pt-3">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
            {isToday ? 'Today' : selectedLabel}
          </h3>
          {isToday && (
            <span className="rounded-sm bg-nr-crimson px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-nr-bone">
              {MONTHS[selected.getMonth()]} {selected.getDate()}
            </span>
          )}
        </div>

        {isLoading && <ScreenSpinner />}
        {error && <ScreenError message={(error as Error).message} />}

        {!isLoading && !error && (
          selectedEntries.length > 0 ? (
            <div className="space-y-3">
              {selectedEntries.map((entry) => (
                <DayDetailCard
                  key={entry.key}
                  entry={entry}
                  isToday={isToday}
                  isFuture={isFuture}
                  onReschedule={goToSchedule}
                  onCancelSchedule={
                    entry.scheduledId && entry.status === 'scheduled'
                      ? () =>
                          setConfirmCancelSchedule({
                            id: entry.scheduledId!,
                            name: entry.workoutName,
                          })
                      : undefined
                  }
                  onStart={() => startScheduled(entry)}
                  onResume={() => entry.sessionId && goLive(entry.sessionId)}
                  onAbandon={() => entry.sessionId && setConfirmAbandon(entry.sessionId)}
                  onViewSummary={() => entry.sessionId && goRecap(entry.sessionId)}
                />
              ))}
              {launchError && (
                <p className="rounded-sm border border-nr-crimson/40 bg-nr-crimson/10 px-3 py-2 text-[11px] uppercase tracking-wider text-nr-ember">
                  Could not start: {launchError}
                </p>
              )}
              {(isToday || isFuture) && (
                <button
                  onClick={goToSchedule}
                  className="clip-bevel-sm flex w-full items-center justify-center gap-1.5 border border-dashed border-nr-bronze/40 py-2.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
                >
                  <Plus className="size-4" /> Add another workout
                </button>
              )}
            </div>
          ) : (
            <EmptyDay
              isToday={isToday}
              isFuture={isFuture}
              firstRun={(plans?.length ?? 0) === 0}
              onPlan={goToSchedule}
              onQuickStart={() => setQuickStartOpen(true)}
            />
          )
        )}
      </div>

      {pickerOpen && (
        <MonthPicker
          month={pickerMonth}
          selected={selected}
          today={today}
          map={dayMap}
          onMonthChange={setPickerMonth}
          onPick={jumpToDate}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {quickStartOpen && (
        <QuickStartSheet
          plans={plans ?? []}
          launchingId={launchingId}
          launchError={launchError}
          onClose={() => {
            setQuickStartOpen(false)
            setLaunchError(null)
          }}
          onStart={startPlan}
          onForge={() => {
            setQuickStartOpen(false)
            navigate('/builder')
          }}
        />
      )}

      <ConfirmDialog
        open={confirmAbandon !== null}
        title="Abandon Session"
        message="This marks the session as abandoned. Logged sets are kept, but the workout won't count as completed."
        confirmLabel="Abandon"
        onConfirm={() => {
          if (confirmAbandon) abandon.mutate(confirmAbandon)
          setConfirmAbandon(null)
        }}
        onCancel={() => setConfirmAbandon(null)}
      />

      <ConfirmDialog
        open={confirmCancelSchedule !== null}
        title="Cancel Workout?"
        message={
          confirmCancelSchedule
            ? `Remove "${confirmCancelSchedule.name}" from the calendar. The plan itself stays in your library.`
            : ''
        }
        confirmLabel={unschedule.isPending ? 'Cancelling…' : 'Cancel Workout'}
        cancelLabel="Keep It"
        onConfirm={() => {
          if (confirmCancelSchedule) unschedule.mutate(confirmCancelSchedule.id)
          setConfirmCancelSchedule(null)
        }}
        onCancel={() => setConfirmCancelSchedule(null)}
      />
    </ScreenSurface>
  )
}

function DayGlyph({ entries, muted }: { entries?: DayEntry[]; muted: boolean }) {
  if (!entries || entries.length === 0) {
    return (
      <span className={cn('block h-1 w-1 rounded-full', muted ? 'bg-nr-bone/15' : 'bg-nr-bone/25')} />
    )
  }

  // Multi-workout day: a compact count badge tinted by the aggregate state.
  if (entries.length > 1) {
    const total = entries.length
    const completed = entries.filter((e) => e.status === 'completed').length
    const inProgress = entries.some((e) => e.status === 'in_progress')
    const tone = inProgress
      ? 'bg-nr-ember text-nr-black'
      : completed === total
        ? 'bg-nr-crimson text-nr-bone'
        : completed > 0
          ? 'bg-nr-crimson/40 text-nr-bone'
          : 'border border-nr-bronze/70 text-nr-bone/70'
    return (
      <span
        className={cn(
          'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold leading-none',
          tone,
        )}
      >
        {completed > 0 && completed < total ? `${completed}/${total}` : total}
      </span>
    )
  }

  const entry = entries[0]
  if (entry.status === 'completed') {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-nr-crimson text-nr-bone">
        <Check className="size-3" strokeWidth={3} />
      </span>
    )
  }
  if (entry.status === 'in_progress') {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-nr-ember text-nr-black">
        <Play className="size-2.5" />
      </span>
    )
  }
  if (entry.status === 'skipped' || entry.status === 'abandoned') {
    return (
      <span className="flex size-4 items-center justify-center rounded-full border border-nr-crimson/50 text-nr-crimson/70">
        <X className="size-3" />
      </span>
    )
  }
  return <span className="block size-3 rounded-full border-2 border-nr-bronze/70" />
}

function DayDetailCard({
  entry,
  isToday,
  isFuture,
  onReschedule,
  onCancelSchedule,
  onStart,
  onResume,
  onAbandon,
  onViewSummary,
}: {
  entry: DayEntry
  isToday: boolean
  isFuture: boolean
  onReschedule: () => void
  onCancelSchedule?: () => void
  onStart: () => void
  onResume: () => void
  onAbandon: () => void
  onViewSummary: () => void
}) {
  const completed = entry.status === 'completed'
  const inProgress = entry.status === 'in_progress'

  return (
    <div className="clip-bevel relative isolate overflow-hidden border border-nr-bronze/30 bg-nr-gunmetal/50 p-4">
      <UiBackground src={uiArt.plannedWorkout} scrim={72} />
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-sm border border-nr-bronze/30 bg-nr-black/50 text-nr-bronze">
          <Dumbbell className="size-5" />
        </span>
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-bold uppercase tracking-wide text-nr-bone">
            {entry.workoutName}
          </h4>
          <p
            className={cn(
              'text-[10px] uppercase tracking-widest',
              inProgress ? 'text-nr-ember' : 'text-nr-bone/45',
            )}
          >
            {completed
              ? 'Completed'
              : inProgress
                ? 'In progress · unfinished'
                : isToday
                  ? 'Scheduled today'
                  : isFuture
                    ? 'Scheduled'
                    : entry.status === 'abandoned'
                      ? 'Abandoned'
                      : 'Missed'}
          </p>
        </div>
      </div>

      {completed && (entry.durationMin || entry.effort) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {entry.durationMin && <Stat label="Duration" value={`${entry.durationMin}m`} />}
          {entry.effort && <Stat label="Effort" value={`${entry.effort}/10`} />}
        </div>
      )}

      <div className="mt-4">
        {completed ? (
          <button
            onClick={onViewSummary}
            className="clip-bevel-sm w-full border border-nr-bronze/40 py-2.5 font-heading text-sm font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-bronze hover:text-nr-bone"
          >
            View Summary
          </button>
        ) : inProgress ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={onResume}
              className="clip-bevel flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-base font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_22px_-4px] shadow-nr-ember/80 hover:bg-nr-ember"
            >
              <Play className="size-5" /> Resume Workout
            </button>
            <button
              onClick={onAbandon}
              className="clip-bevel-sm flex w-full items-center justify-center gap-1.5 border border-nr-crimson/40 bg-nr-crimson/5 py-2 font-heading text-xs font-semibold uppercase tracking-widest text-nr-ember hover:bg-nr-crimson/15"
            >
              <Trash2 className="size-3.5" /> Cancel Workout
            </button>
          </div>
        ) : isToday ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={onStart}
              className="clip-bevel flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-base font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_22px_-4px] shadow-nr-ember/80 hover:bg-nr-ember"
            >
              <Play className="size-5" /> Start Workout
            </button>
            {onCancelSchedule && (
              <button
                onClick={onCancelSchedule}
                className="clip-bevel-sm flex w-full items-center justify-center gap-1.5 border border-nr-bronze/40 py-2 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bone/60 hover:border-nr-crimson hover:text-nr-ember"
              >
                <Trash2 className="size-3.5" /> Cancel Workout
              </button>
            )}
          </div>
        ) : isFuture ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={onReschedule}
              className="clip-bevel-sm w-full border border-nr-bronze/40 py-2.5 font-heading text-sm font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-bronze hover:text-nr-bone"
            >
              Edit / Reschedule
            </button>
            {onCancelSchedule && (
              <button
                onClick={onCancelSchedule}
                className="clip-bevel-sm flex w-full items-center justify-center gap-1.5 border border-nr-crimson/40 bg-nr-crimson/5 py-2 font-heading text-xs font-semibold uppercase tracking-widest text-nr-ember hover:bg-nr-crimson/15"
              >
                <Trash2 className="size-3.5" /> Cancel Workout
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function EmptyDay({
  isToday,
  isFuture,
  firstRun,
  onPlan,
  onQuickStart,
}: {
  isToday: boolean
  isFuture: boolean
  firstRun: boolean
  onPlan: () => void
  onQuickStart: () => void
}) {
  const navigate = useNavigate()
  if (firstRun) {
    return (
      <div className="clip-bevel relative isolate flex flex-col items-center gap-3 overflow-hidden border border-dashed border-nr-bronze/30 bg-nr-gunmetal/20 px-4 py-9 text-center">
        <UiBackground src={uiArt.restDay} scrim={74} />
        <SkullGlyph className="size-[4.5rem] opacity-15" />
        <div>
          <p className="font-heading text-sm uppercase tracking-widest text-nr-bone/70">
            No plans yet
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-nr-bone/35">
            Forge your first plan to begin
          </p>
        </div>
        <button
          onClick={() => navigate('/builder')}
          className="clip-bevel-sm flex items-center gap-1.5 bg-nr-crimson px-4 py-2 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
        >
          <Plus className="size-4" /> Forge a Plan
        </button>
      </div>
    )
  }

  // For TODAY we want a path to "just start lifting" without scheduling first.
  if (isToday) {
    return (
      <div className="clip-bevel relative isolate flex flex-col items-center gap-3 overflow-hidden border border-dashed border-nr-bronze/25 bg-nr-gunmetal/20 px-4 py-8 text-center">
        <UiBackground src={uiArt.restDay} scrim={74} />
        <SkullGlyph className="size-16 opacity-15" />
        <p className="text-sm uppercase tracking-widest text-nr-bone/40">No workout yet today</p>
        <p className="-mt-1 text-[11px] uppercase tracking-wider text-nr-bone/35">
          Pick a plan and begin, or schedule for later
        </p>
        <div className="flex w-full max-w-[260px] flex-col gap-2 pt-1">
          <button
            onClick={onQuickStart}
            className="clip-bevel-sm flex w-full items-center justify-center gap-2 bg-nr-crimson py-2.5 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
          >
            <Swords className="size-4" /> Start a Workout
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onPlan}
              className="clip-bevel-sm flex items-center justify-center gap-1 border border-nr-bronze/40 px-2 py-2 font-heading text-[10px] font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
            >
              <CalendarPlus className="size-3.5" /> Schedule
            </button>
            <button
              onClick={() => navigate('/builder')}
              className="clip-bevel-sm flex items-center justify-center gap-1 border border-nr-bronze/40 px-2 py-2 font-heading text-[10px] font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
            >
              <Plus className="size-3.5" /> Forge New
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="clip-bevel relative isolate flex flex-col items-center gap-3 overflow-hidden border border-dashed border-nr-bronze/25 bg-nr-gunmetal/20 px-4 py-8 text-center">
      <UiBackground src={uiArt.restDay} scrim={74} />
      <SkullGlyph className="size-16 opacity-15" />
      <p className="text-sm uppercase tracking-widest text-nr-bone/40">
        {isFuture ? 'No workout planned' : 'Rest day'}
      </p>
      {isFuture && (
        <button
          onClick={onPlan}
          className="clip-bevel-sm flex items-center gap-1.5 border border-nr-bronze/40 px-4 py-2 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
        >
          <Plus className="size-4" /> Plan a Workout
        </button>
      )}
    </div>
  )
}

function QuickStartSheet({
  plans,
  launchingId,
  launchError,
  onClose,
  onStart,
  onForge,
}: {
  plans: PlanSummary[]
  launchingId: string | null
  launchError: string | null
  onClose: () => void
  onStart: (planId: string) => void
  onForge: () => void
}) {
  // Most-recent first so the plan you actually use today bubbles up.
  const sorted = useMemo(() => {
    const copy = [...plans]
    copy.sort((a, b) => {
      const at = a.lastPerformedAt
        ? new Date(a.lastPerformedAt).getTime()
        : new Date(a.workout.updated_at).getTime() / 2
      const bt = b.lastPerformedAt
        ? new Date(b.lastPerformedAt).getTime()
        : new Date(b.workout.updated_at).getTime() / 2
      return bt - at
    })
    return copy
  }, [plans])

  return (
    <PlanSheet
      title="Start a Workout"
      subtitle={sorted.length > 0 ? 'Pick a plan and begin now' : 'No plans yet'}
      onClose={onClose}
      footer={
        <button
          onClick={onForge}
          className="clip-bevel-sm mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-nr-bronze/40 py-2.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
        >
          <Plus className="size-4" /> Forge New Plan
        </button>
      }
    >
      {launchError && (
        <p className="mb-2 rounded-sm border border-nr-crimson/40 bg-nr-crimson/10 px-3 py-2 text-[11px] uppercase tracking-wider text-nr-ember">
          Could not start: {launchError}
        </p>
      )}
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-[11px] uppercase tracking-widest text-nr-bone/40">
          Forge your first plan to begin lifting
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((plan) => {
            const starting = launchingId === plan.workout.id
            const meta = `${plan.exerciseCount} exercises${
              plan.timesPerformed > 0 ? ` · ${plan.timesPerformed} session${plan.timesPerformed === 1 ? '' : 's'}` : ''
            }`
            return (
              <li key={plan.workout.id}>
                <button
                  onClick={() => onStart(plan.workout.id)}
                  disabled={launchingId !== null}
                  className={cn(
                    'clip-bevel-sm flex w-full items-center gap-3 border bg-nr-black/30 px-3 py-2.5 text-left transition-colors',
                    starting
                      ? 'border-nr-ember bg-nr-crimson/10'
                      : 'border-nr-bronze/25 hover:border-nr-crimson hover:bg-nr-crimson/10',
                    'disabled:opacity-60',
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 bg-nr-black/50 text-nr-bronze">
                    <Dumbbell className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">
                      {plan.workout.name}
                    </p>
                    <p className="truncate text-[10px] uppercase tracking-wider text-nr-bone/40">
                      {meta}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 font-heading text-[11px] uppercase tracking-widest text-nr-ember">
                    {starting ? (
                      <span className="size-3.5 animate-spin rounded-full border-2 border-nr-ember border-t-transparent" />
                    ) : (
                      <Play className="size-3.5" fill="currentColor" />
                    )}
                    {starting ? 'Starting' : 'Start'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </PlanSheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="clip-bevel-sm border border-nr-bronze/20 bg-nr-black/30 px-2 py-2 text-center">
      <p className="font-heading text-lg font-bold text-nr-bone">{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-nr-bone/40">{label}</p>
    </div>
  )
}

function MonthPicker({
  month,
  selected,
  today,
  map,
  onMonthChange,
  onPick,
  onClose,
}: {
  month: Date
  selected: Date
  today: Date
  map: Map<string, DayEntry[]>
  onMonthChange: (d: Date) => void
  onPick: (d: Date) => void
  onClose: () => void
}) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
  const gridStart = startOfWeekMonday(firstOfMonth)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-nr-black/80 backdrop-blur-sm"
      />
      <div className="clip-bevel relative w-full border border-nr-bronze/40 bg-nr-gunmetal p-4 shadow-[0_0_40px_-8px] shadow-nr-black">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="flex size-7 items-center justify-center rounded-full border border-nr-bronze/30 text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-nr-bone">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </h3>
          <button
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="flex size-7 items-center justify-center rounded-full border border-nr-bronze/30 text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((l) => (
            <span key={l} className="text-center text-[9px] uppercase tracking-widest text-nr-bone/40">
              {l[0]}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth()
            const dToday = sameDay(d, today)
            const dSelected = sameDay(d, selected)
            const w = map.get(isoKey(d))
            return (
              <button
                key={i}
                onClick={() => onPick(d)}
                className={cn(
                  'relative flex h-9 flex-col items-center justify-center rounded-sm text-sm transition-colors',
                  dSelected
                    ? 'bg-nr-crimson font-bold text-nr-bone'
                    : dToday
                      ? 'border border-nr-crimson/60 text-nr-ember'
                      : inMonth
                        ? 'text-nr-bone hover:bg-nr-bronze/15'
                        : 'text-nr-bone/25 hover:bg-nr-bronze/10',
                )}
              >
                {d.getDate()}
                {w && w.length > 0 && !dSelected && (
                  <span
                    className={cn(
                      'absolute bottom-1 size-1 rounded-full',
                      w.some((e) => e.status === 'completed') ? 'bg-nr-crimson' : 'bg-nr-bronze',
                    )}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex justify-between">
          <button
            onClick={() => onPick(today)}
            className="rounded-sm border border-nr-bronze/30 px-3 py-1 text-[10px] uppercase tracking-widest text-nr-bone/70 hover:border-nr-crimson hover:text-nr-crimson"
          >
            Jump to Today
          </button>
          <button
            onClick={onClose}
            className="rounded-sm px-3 py-1 text-[10px] uppercase tracking-widest text-nr-bone/40 hover:text-nr-bone"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
