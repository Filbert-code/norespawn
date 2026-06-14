import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import wordmark from '@/mockups/assets/wordmark.png?w=300;520;760&format=avif;webp;png&as=picture'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { TabBar } from '@/mockups/components/TabBar'
import { ConfirmDialog } from '@/mockups/components/ConfirmDialog'
import { PlanSheet } from '@/mockups/components/PlanSheet'
import {
  addDays,
  dayIsComplete,
  disciplineStreak,
  entriesForDate,
  MOCK_PLANS,
  MONTHS,
  sameDay,
  startOfToday,
  startOfWeekMonday,
  WEEKDAY_LABELS,
  type DayEntry,
  type MockPlan,
} from '@/mockups/data/calendar'

const today = startOfToday()

export function CalendarHome() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today))
  const [selected, setSelected] = useState(today)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [firstRun, setFirstRun] = useState(false)
  const [quickStartOpen, setQuickStartOpen] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState<string | null>(null)
  const [confirmCancelSchedule, setConfirmCancelSchedule] = useState<{ key: string; name: string } | null>(null)

  const goToSchedule = () =>
    navigate('/mockups/schedule', { state: { date: selected.toISOString() } })
  const goLive = () => navigate('/mockups/live')
  const goRecap = () => navigate('/mockups/recap')
  const goForge = () => navigate('/mockups/workout-builder')

  // First-run preview suppresses all history/plans so empty states are reviewable.
  const entriesFor = (d: Date): DayEntry[] => (firstRun ? [] : entriesForDate(d))
  const plans = firstRun ? [] : MOCK_PLANS

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

  const selectedEntries = entriesFor(selected)
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
          <SkullGlyph className="size-14" />
          <div className="leading-none">
            <h1 className="w-40">
              <picture>
                {Object.entries(wordmark.sources).map(([format, srcSet]) => (
                  <source key={format} type={`image/${format}`} srcSet={srcSet} />
                ))}
                <img
                  src={wordmark.img.src}
                  width={wordmark.img.w}
                  height={wordmark.img.h}
                  alt="NoRespawn"
                  className="w-full mix-blend-screen"
                />
              </picture>
            </h1>
            <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-nr-bone/40">
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
          {/* recent pips */}
          <div className="ml-auto flex items-end gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(today, i - 6)
              return (
                <span
                  key={i}
                  className={cn(
                    'w-1.5 rounded-full',
                    dayIsComplete(entriesFor(d)) ? 'h-5 bg-nr-crimson' : 'h-2 bg-nr-bone/15',
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
                  <DayGlyph entries={entriesFor(d)} muted={d.getTime() < today.getTime()} />
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

          {selectedEntries.length > 0 ? (
            <div className="space-y-3">
              {selectedEntries.map((entry) => (
                <DayDetailCard
                  key={entry.key}
                  entry={entry}
                  isToday={isToday}
                  isFuture={isFuture}
                  onReschedule={goToSchedule}
                  onCancelSchedule={
                    entry.status === 'scheduled'
                      ? () => setConfirmCancelSchedule({ key: entry.key, name: entry.workoutName })
                      : undefined
                  }
                  onStart={goLive}
                  onResume={goLive}
                  onAbandon={() => setConfirmAbandon(entry.key)}
                  onViewSummary={goRecap}
                />
              ))}
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
              firstRun={firstRun}
              onPlan={goToSchedule}
              onQuickStart={() => setQuickStartOpen(true)}
              onForge={goForge}
            />
          )}
        </div>

        <TabBar />

        {/* ---- Date picker overlay ---- */}
        {pickerOpen && (
          <MonthPicker
            month={pickerMonth}
            selected={selected}
            entriesFor={entriesFor}
            onMonthChange={setPickerMonth}
            onPick={jumpToDate}
            onClose={() => setPickerOpen(false)}
          />
        )}

        {/* ---- Quick Start sheet ---- */}
        {quickStartOpen && (
          <QuickStartSheet
            plans={plans}
            onClose={() => setQuickStartOpen(false)}
            onStart={goLive}
            onForge={() => {
              setQuickStartOpen(false)
              goForge()
            }}
          />
        )}

        <ConfirmDialog
          open={confirmAbandon !== null}
          title="Abandon Session"
          message="This marks the session as abandoned. Logged sets are kept, but the workout won't count as completed."
          confirmLabel="Abandon"
          onConfirm={() => setConfirmAbandon(null)}
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
          confirmLabel="Cancel Workout"
          cancelLabel="Keep It"
          onConfirm={() => setConfirmCancelSchedule(null)}
          onCancel={() => setConfirmCancelSchedule(null)}
        />
      </div>
    </PhoneFrame>
  )
}

function DayGlyph({ entries, muted }: { entries: DayEntry[]; muted: boolean }) {
  if (entries.length === 0) {
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

function MonthPicker({
  month,
  selected,
  entriesFor,
  onMonthChange,
  onPick,
  onClose,
}: {
  month: Date
  selected: Date
  entriesFor: (d: Date) => DayEntry[]
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
            const entries = entriesFor(d)
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
                {entries.length > 0 && !dSelected && (
                  <span
                    className={cn(
                      'absolute bottom-1 size-1 rounded-full',
                      entries.some((e) => e.status === 'completed') ? 'bg-nr-crimson' : 'bg-nr-bronze',
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
  onForge,
}: {
  isToday: boolean
  isFuture: boolean
  firstRun: boolean
  onPlan: () => void
  onQuickStart: () => void
  onForge: () => void
}) {
  // First-run: no plans exist yet, so nudge toward forging the first one.
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
          onClick={onForge}
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
              onClick={onForge}
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
  onClose,
  onStart,
  onForge,
}: {
  plans: MockPlan[]
  onClose: () => void
  onStart: () => void
  onForge: () => void
}) {
  return (
    <PlanSheet
      title="Start a Workout"
      subtitle={plans.length > 0 ? 'Pick a plan and begin now' : 'No plans yet'}
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
      {plans.length === 0 ? (
        <p className="py-8 text-center text-[11px] uppercase tracking-widest text-nr-bone/40">
          Forge your first plan to begin lifting
        </p>
      ) : (
        <ul className="space-y-2">
          {plans.map((plan) => {
            const meta = `${plan.exerciseCount} exercises${
              plan.timesPerformed > 0
                ? ` · ${plan.timesPerformed} session${plan.timesPerformed === 1 ? '' : 's'}`
                : ''
            }`
            return (
              <li key={plan.id}>
                <button
                  onClick={onStart}
                  className="clip-bevel-sm flex w-full items-center gap-3 border border-nr-bronze/25 bg-nr-black/30 px-3 py-2.5 text-left transition-colors hover:border-nr-crimson hover:bg-nr-crimson/10"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 bg-nr-black/50 text-nr-bronze">
                    <Dumbbell className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">
                      {plan.name}
                    </p>
                    <p className="truncate text-[10px] uppercase tracking-wider text-nr-bone/40">
                      {meta}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 font-heading text-[11px] uppercase tracking-widest text-nr-ember">
                    <Play className="size-3.5" fill="currentColor" />
                    Start
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
