import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Play,
  Plus,
  RotateCcw,
  Skull,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { TabBar } from '@/mockups/components/TabBar'
import { ConfirmDialog } from '@/mockups/components/ConfirmDialog'
import {
  addDays,
  disciplineStreak,
  MONTHS,
  sameDay,
  startOfToday,
  startOfWeekMonday,
  WEEKDAY_LABELS,
  workoutForDate,
  type DayWorkout,
} from '@/mockups/data/calendar'

const today = startOfToday()

function DayGlyph({ workout, muted }: { workout?: DayWorkout; muted: boolean }) {
  if (!workout) {
    return <span className={cn('block h-1 w-1 rounded-full', muted ? 'bg-nr-bone/15' : 'bg-nr-bone/25')} />
  }
  if (workout.status === 'completed') {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-nr-crimson text-nr-bone">
        <Check className="size-3" strokeWidth={3} />
      </span>
    )
  }
  if (workout.status === 'in_progress') {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-nr-ember text-nr-black">
        <Play className="size-2.5" />
      </span>
    )
  }
  if (workout.status === 'skipped') {
    return (
      <span className="flex size-4 items-center justify-center rounded-full border border-nr-crimson/50 text-nr-crimson/70">
        <X className="size-3" />
      </span>
    )
  }
  // scheduled
  return <span className="block size-3 rounded-full border-2 border-nr-bronze/70" />
}

export function CalendarHome() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today))
  const [selected, setSelected] = useState(today)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [firstRun, setFirstRun] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  const goToSchedule = () =>
    navigate('/mockups/schedule', { state: { date: selected.toISOString() } })
  const goLive = () => navigate('/mockups/live')
  const goRecap = () => navigate('/mockups/recap')

  // First-run preview suppresses all history so empty states are reviewable.
  const wf = (d: Date) => (firstRun ? undefined : workoutForDate(d))
  // first-of-month the picker is currently showing
  const [pickerMonth, setPickerMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  function jumpToDate(date: Date) {
    setSelected(date)
    setWeekStart(startOfWeekMonday(date))
    setPickerOpen(false)
  }

  function openPicker() {
    setPickerMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
    setPickerOpen(true)
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)
  const streak = firstRun ? 0 : disciplineStreak()
  const onCurrentWeek = sameDay(weekStart, startOfWeekMonday(today))

  const selectedWorkout = wf(selected)
  const isToday = sameDay(selected, today)
  const isFuture = selected.getTime() > today.getTime()

  const rangeLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}`
      : `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}`

  const selectedLabel = `${WEEKDAY_LABELS[(selected.getDay() + 6) % 7]}, ${MONTHS[selected.getMonth()]} ${selected.getDate()}`

  return (
    <PhoneFrame>
      {/* texture wash */}
      <div className="relative flex h-full flex-col bg-[radial-gradient(circle_at_50%_-5%,rgba(127,29,29,0.35),transparent_55%)]">
        {/* ---- Brand header ---- */}
        <header className="flex items-center gap-2 px-4 pb-3 pt-10">
          <Skull className="size-7 text-nr-bronze" strokeWidth={1.5} />
          <div className="leading-none">
            <h1 className="font-heading text-2xl font-bold uppercase tracking-[0.2em] text-nr-bone">
              NoRespawn
            </h1>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-nr-bone/40">
              Glory thru discipline
            </p>
          </div>
          {/* demo-only: preview the first-run / empty state */}
          <button
            onClick={() => setFirstRun((f) => !f)}
            className="clip-bevel-sm ml-auto border border-nr-bronze/30 px-2.5 py-1.5 font-heading text-[9px] uppercase tracking-widest text-nr-bone/45 hover:text-nr-bone"
          >
            {firstRun ? 'Demo: First-run' : 'Demo: Populated'}
          </button>
        </header>

        {/* ---- Discipline streak ---- */}
        <div className="mx-4 mb-3 flex items-center gap-3 border border-nr-bronze/30 bg-nr-gunmetal/50 px-4 py-3 clip-bevel">
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
          {/* recent pips */}
          <div className="ml-auto flex items-end gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(today, i - 6)
              const w = wf(d)
              return (
                <span
                  key={i}
                  className={cn(
                    'w-1.5 rounded-full',
                    w?.status === 'completed' ? 'h-5 bg-nr-crimson' : 'h-2 bg-nr-bone/15',
                  )}
                />
              )
            })}
          </div>
        </div>

        {/* ---- Week navigation ---- */}
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

        {/* ---- Week strip ---- */}
        <div className="grid grid-cols-7 gap-1.5 px-3 pb-1">
          {days.map((d, i) => {
            const dToday = sameDay(d, today)
            const dSelected = sameDay(d, selected)
            const w = wf(d)
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
                  <DayGlyph workout={w} muted={d.getTime() < today.getTime()} />
                </span>
              </button>
            )
          })}
        </div>

        {/* ---- Selected-day detail ---- */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
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

          {selectedWorkout ? (
            <DayDetailCard
              workout={selectedWorkout}
              isToday={isToday}
              isFuture={isFuture}
              onReschedule={goToSchedule}
              onStart={goLive}
              onResume={goLive}
              onAbandon={() => setConfirmAbandon(true)}
              onViewSummary={goRecap}
            />
          ) : (
            <EmptyDay isFuture={isFuture} firstRun={firstRun} onPlan={goToSchedule} />
          )}
        </div>

        <TabBar />

        {/* ---- Date picker overlay ---- */}
        {pickerOpen && (
          <MonthPicker
            month={pickerMonth}
            selected={selected}
            onMonthChange={setPickerMonth}
            onPick={jumpToDate}
            onClose={() => setPickerOpen(false)}
          />
        )}

        <ConfirmDialog
          open={confirmAbandon}
          title="Abandon Session"
          message="This marks today's session as abandoned. Logged sets are kept, but the workout won't count as completed."
          confirmLabel="Abandon"
          onConfirm={() => setConfirmAbandon(false)}
          onCancel={() => setConfirmAbandon(false)}
        />
      </div>
    </PhoneFrame>
  )
}

function MonthPicker({
  month,
  selected,
  onMonthChange,
  onPick,
  onClose,
}: {
  month: Date
  selected: Date
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
        {/* month nav */}
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

        {/* weekday header */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((l) => (
            <span key={l} className="text-center text-[9px] uppercase tracking-widest text-nr-bone/40">
              {l[0]}
            </span>
          ))}
        </div>

        {/* day grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth()
            const dToday = sameDay(d, today)
            const dSelected = sameDay(d, selected)
            const w = workoutForDate(d)
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
                {w && !dSelected && (
                  <span
                    className={cn(
                      'absolute bottom-1 size-1 rounded-full',
                      w.status === 'completed' ? 'bg-nr-crimson' : 'bg-nr-bronze',
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

function DayDetailCard({
  workout,
  isToday,
  isFuture,
  onReschedule,
  onStart,
  onResume,
  onAbandon,
  onViewSummary,
}: {
  workout: DayWorkout
  isToday: boolean
  isFuture: boolean
  onReschedule: () => void
  onStart: () => void
  onResume: () => void
  onAbandon: () => void
  onViewSummary: () => void
}) {
  const completed = workout.status === 'completed'
  const inProgress = workout.status === 'in_progress'

  return (
    <div className="clip-bevel border border-nr-bronze/30 bg-nr-gunmetal/50 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-sm border border-nr-bronze/30 bg-nr-black/50 text-nr-bronze">
          <Dumbbell className="size-5" />
        </span>
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-bold uppercase tracking-wide text-nr-bone">
            {workout.workoutName}
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
                    : 'Missed'}
          </p>
        </div>
      </div>

      {completed && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Duration" value={`${workout.durationMin}m`} />
          <Stat label="Sets" value={String(workout.totalSets)} />
          <Stat label="Effort" value={`${workout.effort}/10`} />
        </div>
      )}

      {completed && workout.bodyGroups && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {workout.bodyGroups.map((g) => (
            <span
              key={g}
              className="rounded-sm border border-nr-bronze/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-nr-bone/60"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {/* actions */}
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
              className="clip-bevel-sm flex w-full items-center justify-center gap-1.5 border border-nr-bronze/40 py-2 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bone/60 hover:border-nr-crimson hover:text-nr-ember"
            >
              <RotateCcw className="size-3.5" /> Abandon
            </button>
          </div>
        ) : isToday ? (
          <button
            onClick={onStart}
            className="clip-bevel flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-base font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_22px_-4px] shadow-nr-ember/80 hover:bg-nr-ember"
          >
            <Play className="size-5" /> Start Workout
          </button>
        ) : isFuture ? (
          <button
            onClick={onReschedule}
            className="clip-bevel-sm w-full border border-nr-bronze/40 py-2.5 font-heading text-sm font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-bronze hover:text-nr-bone"
          >
            Edit / Reschedule
          </button>
        ) : null}
      </div>
    </div>
  )
}

function EmptyDay({
  isFuture,
  firstRun,
  onPlan,
}: {
  isFuture: boolean
  firstRun: boolean
  onPlan: () => void
}) {
  // First-run: no plans exist yet, so nudge toward forging the first one.
  if (firstRun) {
    return (
      <div className="clip-bevel flex flex-col items-center gap-3 border border-dashed border-nr-bronze/30 bg-nr-gunmetal/20 px-4 py-9 text-center">
        <Skull className="size-9 text-nr-bone/15" />
        <div>
          <p className="font-heading text-sm uppercase tracking-widest text-nr-bone/70">
            No plans yet
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-nr-bone/35">
            Forge your first plan to begin
          </p>
        </div>
        <button
          onClick={onPlan}
          className="clip-bevel-sm flex items-center gap-1.5 bg-nr-crimson px-4 py-2 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
        >
          <Plus className="size-4" /> Forge a Plan
        </button>
      </div>
    )
  }

  return (
    <div className="clip-bevel flex flex-col items-center gap-3 border border-dashed border-nr-bronze/25 bg-nr-gunmetal/20 px-4 py-8 text-center">
      <Skull className="size-8 text-nr-bone/15" />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="clip-bevel-sm border border-nr-bronze/20 bg-nr-black/30 px-2 py-2 text-center">
      <p className="font-heading text-lg font-bold text-nr-bone">{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-nr-bone/40">{label}</p>
    </div>
  )
}
