import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowUp,
  Check,
  ChevronsRight,
  Hand,
  Heart,
  Hourglass,
  ListOrdered,
  Lock,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat2,
  Search,
  Skull,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScreenError, ScreenSpinner } from '@/screens/_shared/screen'
import { PlanSheet, PlanSheetRow } from '@/components/PlanSheet'
import { useSession } from '@/lib/queries/sessions'
import { useExercises, exercisesByGroup, subGroupSlugsForGroup } from '@/lib/queries/exercises'
import { useBodyGroups } from '@/lib/queries/exercises'
import {
  useAddSessionExercise,
  useAddSessionSet,
  useAppendEvent,
  useFinalizeSession,
  useLogSet,
  useRemoveSessionExercise,
  useUpdatePlannedSet,
} from '@/lib/queries/live'
import {
  clearLiveState,
  getActiveSessionId,
  initialCursor,
  loadLiveState,
  saveLiveState,
  setActiveSessionId,
  type LiveSessionState,
} from '@/lib/live/store'
import { acquireWakeLock, releaseWakeLock } from '@/lib/live/wake_lock'
import { cues } from '@/lib/live/audio'
import { usePrefs } from '@/lib/prefs'
import type { Exercise, SessionExercise, SessionSet } from '@/lib/supabase'

// ----------------------------------------------------------------------------
// Geometry for the quadrant ring (copied from mockup; pure presentational)
// ----------------------------------------------------------------------------
const C = 110
const R = 92
function polar(angleDeg: number, r = R) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
}
function arcPath(start: number, end: number) {
  const s = polar(start)
  const e = polar(end)
  const large = end - start <= 180 ? 0 : 1
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`
}

function fmt(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
function fmtLong(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type SetState = 'completed' | 'skipped' | 'active' | 'upcoming'

type PickerMode = { kind: 'add' } | { kind: 'swap'; sessionExerciseId: string }

export function LiveSessionScreen() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()

  const { data, isLoading, error, refetch } = useSession(sessionId)
  const { data: catalog } = useExercises()
  const [prefs] = usePrefs()

  // ---- mutations ----------------------------------------------------------
  const logSet = useLogSet()
  const updatePlannedSet = useUpdatePlannedSet()
  const addSet = useAddSessionSet()
  const addExercise = useAddSessionExercise()
  const removeExercise = useRemoveSessionExercise()
  const appendEvent = useAppendEvent()
  const finalize = useFinalizeSession()

  // ---- live cursor (localStorage-backed) ----------------------------------
  const [state, setState] = useState<LiveSessionState | null>(() =>
    sessionId ? loadLiveState(sessionId) : null,
  )

  // Hydrate cursor once the session data arrives (only on first load).
  useEffect(() => {
    if (!sessionId || !data) return
    if (state && state.sessionId === sessionId) return
    const firstSet = data.sets.find((s) => s.status === 'pending')
    const firstEx = data.exercises[0]
    const next: LiveSessionState = {
      sessionId,
      schemaVersion: 1,
      ...initialCursor(),
      reps: firstSet?.planned_reps ?? 0,
      weight: firstSet?.planned_weight_lbs ? Number(firstSet.planned_weight_lbs) : 0,
      restTarget: firstEx?.planned_set_rest_seconds ?? 60,
      sessionStartedAt: new Date(data.session.started_at).getTime() || Date.now(),
    }
    setState(next)
    saveLiveState(next)
    setActiveSessionId(sessionId)
  }, [sessionId, data, state])

  // Persist cursor changes.
  useEffect(() => {
    if (state) saveLiveState(state)
  }, [state])

  // Wake lock on mount / off on unmount.
  useEffect(() => {
    if (prefs.wakeLockEnabled) acquireWakeLock()
    return () => {
      releaseWakeLock()
    }
  }, [prefs.wakeLockEnabled])

  // ---- derived shape ------------------------------------------------------
  type ExerciseView = {
    sx: SessionExercise
    sets: SessionSet[]
  }
  const exerciseViews: ExerciseView[] = useMemo(() => {
    if (!data) return []
    return data.exercises.map((sx) => ({
      sx,
      sets: data.sets
        .filter((s) => s.session_exercise_id === sx.id)
        .sort((a, b) => a.set_number - b.set_number),
    }))
  }, [data])

  const exView = state ? exerciseViews[state.exIndex] : null
  const currentSetRow = exView?.sets[state?.currentSet ?? -1] ?? null
  const nextView = state ? exerciseViews[state.exIndex + 1] : null

  // ---- master tick (drives session/work/rest timers) ----------------------
  // Depend ONLY on the gates that should pause/resume the interval (phase +
  // running). Including the whole `state` object would tear the interval down
  // on every reps/weight/rest tap, which made the displayed timer freeze for
  // up to a second before snapping back.
  const [tickNow, setTickNow] = useState(() => Date.now())
  const phase = state?.phase
  const running = state?.running
  useEffect(() => {
    if (!phase || phase === 'done' || !running) return
    const id = window.setInterval(() => setTickNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase, running])

  const sessionSeconds = useMemo(() => {
    if (!state) return 0
    return Math.max(
      0,
      Math.floor((tickNow - state.sessionStartedAt - state.pausedMs) / 1000),
    )
  }, [tickNow, state])
  const workElapsed = useMemo(() => {
    if (!state || state.phase !== 'work' || !state.workStartedAt) return 0
    return Math.max(0, Math.floor((tickNow - state.workStartedAt) / 1000))
  }, [tickNow, state])
  const restRemaining = useMemo(() => {
    if (!state || state.phase !== 'rest' || !state.restStartedAt) return 0
    const elapsed = Math.floor((tickNow - state.restStartedAt) / 1000)
    return Math.max(0, state.restTarget - elapsed)
  }, [tickNow, state])

  // Auto-advance & sound on rest end.
  const restAutoFiredRef = useRef(false)
  useEffect(() => {
    if (!state || state.phase !== 'rest') {
      restAutoFiredRef.current = false
      return
    }
    if (restRemaining <= 3 && restRemaining > 0) cues.restCountdown(prefs.audioEnabled && prefs.restCountdownCue)
    if (restRemaining === 0 && !restAutoFiredRef.current) {
      restAutoFiredRef.current = true
      cues.restEnd(prefs.audioEnabled)
      if (prefs.autoStartWorkAfterRest) {
        setState((s) =>
          s ? { ...s, phase: 'work', workStartedAt: Date.now(), restStartedAt: null } : s,
        )
      }
    }
  }, [restRemaining, state, prefs])

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const flash = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }, [])

  // ---- ring segments ------------------------------------------------------
  const setsCount = exView?.sets.length ?? 0
  const setStates: SetState[] = useMemo(() => {
    if (!exView || !state) return []
    return exView.sets.map((s, i) => {
      if (s.status === 'completed') return 'completed'
      if (s.status === 'skipped') return 'skipped'
      if (state.phase === 'transition') return 'completed'
      return i === state.currentSet ? 'active' : 'upcoming'
    })
  }, [exView, state])
  const progress =
    state?.phase === 'rest'
      ? state.restTarget > 0
        ? (state.restTarget - restRemaining) / state.restTarget
        : 1
      : 1

  const [showQueue, setShowQueue] = useState(false)
  const [picker, setPicker] = useState<PickerMode | null>(null)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  // ---- core actions -------------------------------------------------------
  const advanceAfterSet = useCallback(
    async (skipped: boolean) => {
      if (!sessionId || !state || !exView || !currentSetRow) return
      const planW =
        currentSetRow.planned_weight_lbs != null
          ? Number(currentSetRow.planned_weight_lbs)
          : null
      const planR = currentSetRow.planned_reps ?? null

      try {
        await logSet.mutateAsync({
          sessionId,
          setId: currentSetRow.id,
          sessionExerciseId: exView.sx.id,
          actualReps: skipped ? planR ?? 0 : state.reps,
          actualWeightLbs: skipped ? planW ?? 0 : state.weight,
          skipped,
        })
      } catch (e) {
        flash(`Save failed: ${(e as Error).message}`)
        return
      }

      cues.setComplete(prefs.audioEnabled && prefs.setCompleteCue)

      const wasLast = state.currentSet + 1 >= setsCount
      if (wasLast) {
        const last = state.exIndex + 1 >= exerciseViews.length
        setState((s) =>
          s ? { ...s, phase: last ? 'done' : 'transition', workStartedAt: null, restStartedAt: null } : s,
        )
        if (last) cues.sessionDone(prefs.audioEnabled)
        return
      }
      // More sets → rest, charge toward the next set.
      const remaining = setsCount - (state.currentSet + 1)
      if (!skipped && planW != null && planR != null && (state.weight !== planW || state.reps !== planR)) {
        const what = state.weight !== planW ? `${state.weight} lb` : `${state.reps} reps`
        setSuggestion(
          `Carry ${what} to your ${remaining} remaining set${remaining > 1 ? 's' : ''}?`,
        )
      }
      const nextSet = exView.sets[state.currentSet + 1]
      setState((s) =>
        s
          ? {
              ...s,
              currentSet: s.currentSet + 1,
              phase: 'rest',
              workStartedAt: null,
              restStartedAt: Date.now(),
              restTarget: nextSet?.planned_rest_seconds ?? s.restTarget,
              reps: nextSet?.planned_reps ?? s.reps,
              weight:
                nextSet?.planned_weight_lbs != null
                  ? Number(nextSet.planned_weight_lbs)
                  : s.weight,
            }
          : s,
      )
    },
    [sessionId, state, exView, currentSetRow, setsCount, exerciseViews, logSet, prefs, flash],
  )

  const beginNextExercise = useCallback(() => {
    if (!state) return
    const ni = state.exIndex + 1
    if (ni >= exerciseViews.length) {
      setState((s) => (s ? { ...s, phase: 'done' } : s))
      return
    }
    const next = exerciseViews[ni]
    const first = next.sets[0]
    setState((s) =>
      s
        ? {
            ...s,
            exIndex: ni,
            currentSet: 0,
            phase: 'work',
            workStartedAt: Date.now(),
            restStartedAt: null,
            restTarget: next.sx.planned_set_rest_seconds,
            reps: first?.planned_reps ?? 0,
            weight: first?.planned_weight_lbs != null ? Number(first.planned_weight_lbs) : 0,
          }
        : s,
    )
    setSuggestion(null)
  }, [state, exerciseViews])

  const tapRing = useCallback(() => {
    if (!state) return
    if (state.phase === 'work') advanceAfterSet(false)
    else if (state.phase === 'rest')
      setState((s) =>
        s ? { ...s, phase: 'work', workStartedAt: Date.now(), restStartedAt: null } : s,
      )
    else if (state.phase === 'transition') beginNextExercise()
  }, [state, advanceAfterSet, beginNextExercise])

  const skipSet = useCallback(() => {
    if (!state || state.phase === 'transition' || state.phase === 'done') return
    setSuggestion(null)
    advanceAfterSet(true)
    flash('Set skipped')
  }, [state, advanceAfterSet, flash])

  const togglePause = useCallback(() => {
    if (!state) return
    if (state.running) {
      // Pause: capture how much time has elapsed; we'll roll it into pausedMs on resume.
      setState((s) => (s ? { ...s, running: false, lastTickAt: Date.now() } : s))
      flash('Paused')
      appendEvent.mutate({
        session_id: sessionId!,
        event_type: 'paused',
        session_exercise_id: exView?.sx.id ?? null,
      })
    } else {
      const now = Date.now()
      const gap = now - state.lastTickAt
      setState((s) =>
        s
          ? {
              ...s,
              running: true,
              pausedMs: s.pausedMs + Math.max(0, gap),
              workStartedAt: s.workStartedAt ? s.workStartedAt + gap : s.workStartedAt,
              restStartedAt: s.restStartedAt ? s.restStartedAt + gap : s.restStartedAt,
              lastTickAt: now,
            }
          : s,
      )
      flash('Resumed')
      appendEvent.mutate({
        session_id: sessionId!,
        event_type: 'resumed',
        session_exercise_id: exView?.sx.id ?? null,
      })
    }
  }, [state, sessionId, exView, appendEvent, flash])

  // ---- carry suggestion onto remaining sets ------------------------------
  const applySuggestion = useCallback(() => {
    if (!exView || !state) return
    const remaining = exView.sets.slice(state.currentSet) // currentSet is the *next* set after we advanced
    Promise.all(
      remaining.map((s) =>
        updatePlannedSet.mutateAsync({
          sessionId: sessionId!,
          setId: s.id,
          plannedReps: state.reps,
          plannedWeightLbs: state.weight,
        }),
      ),
    )
      .then(() => flash('Applied to remaining sets'))
      .catch((e) => flash(`Apply failed: ${(e as Error).message}`))
    setSuggestion(null)
  }, [exView, state, sessionId, updatePlannedSet, flash])

  // ---- step helpers (Reps / Weight / Rest) -------------------------------
  const bump = useCallback(
    (field: 'reps' | 'weight' | 'rest', delta: number) => {
      setState((s) => {
        if (!s) return s
        if (field === 'reps') {
          const v = Math.max(0, s.reps + delta)
          flash(`Reps → ${v}`)
          appendEvent.mutate({
            session_id: sessionId!,
            event_type: 'reps_changed',
            session_exercise_id: exView?.sx.id ?? null,
            session_set_id: currentSetRow?.id ?? null,
            payload: { reps: v },
          })
          return { ...s, reps: v }
        }
        if (field === 'weight') {
          const v = Math.max(0, s.weight + delta)
          flash(`Weight → ${v} lb`)
          appendEvent.mutate({
            session_id: sessionId!,
            event_type: 'weight_changed',
            session_exercise_id: exView?.sx.id ?? null,
            session_set_id: currentSetRow?.id ?? null,
            payload: { weight_lbs: v },
          })
          return { ...s, weight: v }
        }
        const t = Math.max(15, s.restTarget + delta)
        flash(`Rest → ${t}s`)
        appendEvent.mutate({
          session_id: sessionId!,
          event_type: 'rest_changed',
          session_exercise_id: exView?.sx.id ?? null,
          payload: { rest_seconds: t },
        })
        return { ...s, restTarget: t }
      })
    },
    [sessionId, exView, currentSetRow, appendEvent, flash],
  )

  // ---- mid-session structural edits --------------------------------------
  const handleAddSet = useCallback(async () => {
    if (!exView || !sessionId) return
    const newNum = exView.sets.length + 1
    const last = exView.sets[exView.sets.length - 1]
    await addSet.mutateAsync({
      sessionId,
      sessionExerciseId: exView.sx.id,
      setNumber: newNum,
      plannedReps: last?.planned_reps ?? null,
      plannedWeightLbs:
        last?.planned_weight_lbs != null ? Number(last.planned_weight_lbs) : null,
      plannedRestSeconds: exView.sx.planned_set_rest_seconds,
    })
    setState((s) => (s ? { ...s, planEdited: true } : s))
    flash('Set added')
  }, [exView, sessionId, addSet, flash])

  const handleRemoveExercise = useCallback(
    async (sx: SessionExercise) => {
      if (!sessionId) return
      await removeExercise.mutateAsync({ sessionId, sessionExerciseId: sx.id })
      setState((s) => (s ? { ...s, planEdited: true } : s))
      flash('Exercise removed')
    },
    [sessionId, removeExercise, flash],
  )

  const handleAddExercise = useCallback(
    async (e: Exercise) => {
      if (!sessionId || !exerciseViews) return
      const lastPos = exerciseViews.reduce((m, v) => Math.max(m, v.sx.position), 0)
      await addExercise.mutateAsync({
        sessionId,
        exerciseSlug: e.slug,
        position: lastPos + 1,
        plannedSets: e.default_sets,
        plannedReps: e.default_reps,
        plannedWeightLbs: e.default_weight_lbs ? Number(e.default_weight_lbs) : null,
        plannedRestSeconds: 60,
      })
      setState((s) => (s ? { ...s, planEdited: true } : s))
      setPicker(null)
      flash(`Added ${e.name}`)
    },
    [sessionId, exerciseViews, addExercise, flash],
  )

  const handleSwap = useCallback(
    async (oldSx: SessionExercise, e: Exercise) => {
      if (!sessionId) return
      // For simplicity, remove the old upcoming exercise and add the new one
      // at the end (positions don't need to be contiguous).
      await removeExercise.mutateAsync({ sessionId, sessionExerciseId: oldSx.id })
      await addExercise.mutateAsync({
        sessionId,
        exerciseSlug: e.slug,
        position: oldSx.position,
        plannedSets: e.default_sets,
        plannedReps: e.default_reps,
        plannedWeightLbs: e.default_weight_lbs ? Number(e.default_weight_lbs) : null,
        plannedRestSeconds: oldSx.planned_set_rest_seconds,
      })
      setState((s) => (s ? { ...s, planEdited: true } : s))
      setPicker(null)
      flash(`Swapped to ${e.name}`)
    },
    [sessionId, removeExercise, addExercise, flash],
  )

  // ---- bail-out: no params or fetch errors --------------------------------
  if (!sessionId) {
    return <ScreenError message="No session id" />
  }
  if (isLoading || !data || !state) {
    return (
      <div className="flex h-full flex-col bg-nr-black">
        <ScreenSpinner />
      </div>
    )
  }
  if (error) return <ScreenError message={(error as Error).message} />
  if (exerciseViews.length === 0) {
    return <ScreenError message="This session has no exercises." />
  }
  if (!exView) {
    // Out-of-range cursor → snap to last exercise.
    setState({ ...state, exIndex: Math.max(0, exerciseViews.length - 1) })
    return <ScreenSpinner />
  }

  // ---- rendering ----------------------------------------------------------
  if (state.phase === 'done') {
    return (
      <SummaryView
        sessionId={sessionId}
        sessionSeconds={sessionSeconds}
        state={state}
        exerciseViews={exerciseViews}
        finalize={finalize}
        onSavedAndExit={async (savePlanChanges: boolean | null) => {
          // If user opted to copy session edits back to the plan, we'd issue
          // workout/workout_exercise updates here. v1: log the intent only.
          if (savePlanChanges) {
            appendEvent.mutate({
              session_id: sessionId,
              event_type: 'set_added',
              payload: { plan_save_back: true },
            })
          }
          clearLiveState(sessionId)
          if (getActiveSessionId() === sessionId) setActiveSessionId(null)
          await refetch()
          navigate(`/recap/${sessionId}`, { replace: true })
        }}
      />
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-nr-black text-nr-bone">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(127,29,29,0.30),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-nr-black/70 via-nr-black/40 to-nr-black/90" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.8)]" />

      {/* ---- header ---- */}
      <header className="relative px-4 pt-9">
        <div className="flex items-center justify-between text-nr-bronze/70">
          <span className="font-heading text-[10px] uppercase tracking-[0.25em]">
            Exercise {state.exIndex + 1} / {exerciseViews.length}
          </span>
          <span className="font-heading text-[10px] tracking-[0.2em]">
            {fmtLong(sessionSeconds)}
          </span>
          <button
            onClick={() => setShowQueue(true)}
            className="flex items-center gap-1 rounded-sm border border-nr-bronze/30 px-2 py-1 text-[9px] uppercase tracking-widest hover:border-nr-crimson hover:text-nr-crimson"
          >
            <ListOrdered className="size-3.5" /> Plan
          </button>
        </div>
        <div className="mt-2 flex gap-1">
          {exerciseViews.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full',
                i < state.exIndex
                  ? 'bg-nr-crimson'
                  : i === state.exIndex
                    ? 'bg-nr-ember'
                    : 'bg-nr-bone/15',
              )}
            />
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[8px] uppercase tracking-[0.25em] text-nr-bronze/55">
          <Check className="size-2.5" /> Saved locally
        </div>
        <button
          onClick={() => navigate(`/exercise/${exView.sx.exercise_slug}`)}
          className="mt-2 w-full text-center font-heading text-xl font-bold uppercase leading-tight tracking-wide text-nr-bone underline-offset-4 transition-colors hover:text-nr-ember hover:underline"
        >
          {exView.sx.exercise_name_snapshot}
        </button>
        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-nr-bone/40">
          {catalog?.find((c) => c.slug === exView.sx.exercise_slug)?.body_sub_group_slug ?? ''}
        </p>
      </header>

      {/* ---- ring ---- */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        <QuadrantRing
          sets={setStates}
          progress={progress}
          onTap={tapRing}
          ariaLabel={
            state.phase === 'work'
              ? 'Tap when set done'
              : state.phase === 'rest'
                ? 'Tap to start now'
                : 'Tap to begin'
          }
        >
          {state.phase === 'transition' ? (
            <>
              <Check className="mb-1 size-9 text-nr-crimson" strokeWidth={2.5} />
              <span className="font-heading text-xs uppercase tracking-[0.3em] text-nr-bone/55">
                Exercise Done
              </span>
              {nextView && (
                <span className="mt-1 px-6 text-[11px] uppercase leading-tight tracking-wider text-nr-bone/70">
                  Next · {nextView.sx.exercise_name_snapshot}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="font-heading text-xs uppercase tracking-[0.3em] text-nr-bone/55">
                {state.phase === 'work' ? `Set ${state.currentSet + 1} / ${setsCount}` : 'Rest'}
              </span>
              <span className="font-heading text-6xl font-bold leading-none tabular-nums text-nr-bone">
                {state.phase === 'work' ? fmt(workElapsed) : fmt(restRemaining)}
              </span>
            </>
          )}
          <span
            className={cn(
              'mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.2em]',
              state.phase === 'work' ? 'text-nr-ember' : 'text-nr-bronze',
            )}
          >
            <Hand className="size-3" />
            {state.phase === 'work'
              ? 'Tap when done'
              : state.phase === 'rest'
                ? 'Tap to start now'
                : 'Tap to begin'}
          </span>
        </QuadrantRing>

        {/* Completed-set recap for this exercise. */}
        {exView.sets.some((s) => s.status === 'completed' || s.status === 'skipped') && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {exView.sets.map((s, i) => {
              if (s.status === 'completed') {
                return (
                  <span
                    key={i}
                    className="rounded-sm border border-nr-crimson/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-nr-bone/70"
                  >
                    {s.actual_reps}×{s.actual_weight_lbs ?? 0}
                    {s.actual_rpe ? ` · @${s.actual_rpe}` : ''}
                  </span>
                )
              }
              if (s.status === 'skipped') {
                return (
                  <span
                    key={i}
                    className="rounded-sm border border-nr-bronze/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-nr-bone/40"
                  >
                    S{s.set_number} skip
                  </span>
                )
              }
              return null
            })}
          </div>
        )}

        {state.phase !== 'transition' && currentSetRow && (
          <div className="mt-3 grid w-full max-w-[300px] grid-cols-2 gap-2">
            <StatTile label="Reps" value={state.reps} planned={currentSetRow.planned_reps ?? 0} />
            <StatTile
              label="Weight"
              value={state.weight}
              unit="lb"
              planned={currentSetRow.planned_weight_lbs != null ? Number(currentSetRow.planned_weight_lbs) : 0}
            />
          </div>
        )}
      </div>

      {state.phase === 'rest' && suggestion && (
        <div className="clip-bevel-sm relative mx-4 mb-2 flex items-center gap-2 border border-nr-ember/40 bg-nr-crimson/10 px-3 py-2">
          <Skull className="size-4 shrink-0 text-nr-ember" />
          <p className="flex-1 text-[11px] leading-tight text-nr-bone/85">{suggestion}</p>
          <button
            onClick={applySuggestion}
            className="rounded-sm bg-nr-crimson px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
          >
            Apply
          </button>
          <button
            onClick={() => setSuggestion(null)}
            className="text-nr-bone/40 hover:text-nr-bone"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 1-tap RPE on the previous (just-completed) set */}
      {state.phase === 'rest' && (
        <RpeStrip
          onPick={(v) => {
            const prev = exView.sets[state.currentSet - 1]
            if (!prev) return
            logSet
              .mutateAsync({
                sessionId,
                setId: prev.id,
                sessionExerciseId: exView.sx.id,
                actualReps: prev.actual_reps ?? 0,
                actualWeightLbs:
                  prev.actual_weight_lbs != null ? Number(prev.actual_weight_lbs) : 0,
                actualRpe: v,
              })
              .catch((e) => flash(`RPE save failed: ${(e as Error).message}`))
          }}
          current={exView.sets[state.currentSet - 1]?.actual_rpe ?? null}
        />
      )}

      <div className="relative flex h-5 items-center justify-center">
        {toast && (
          <p className="text-[10px] uppercase tracking-widest text-nr-bronze/80">{toast}</p>
        )}
      </div>

      {/* ---- controls ---- */}
      <div className="relative border-t border-nr-bronze/25 bg-nr-black/60 px-3 pb-7 pt-3 backdrop-blur-sm">
        <div className="mb-2 grid grid-cols-3 gap-2">
          <CtrlButton
            onClick={togglePause}
            icon={state.running ? <Pause className="size-5" /> : <Play className="size-5" />}
            label={state.running ? 'Pause' : 'Resume'}
            tone="primary"
          />
          <CtrlButton onClick={handleAddSet} icon={<Plus className="size-5" />} label="Add Set" />
          <CtrlButton onClick={skipSet} icon={<ChevronsRight className="size-5" />} label="Skip Set" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stepper label="Reps" onDec={() => bump('reps', -1)} onInc={() => bump('reps', 1)} />
          <Stepper
            label="Weight"
            onDec={() => bump('weight', -prefs.weightStep)}
            onInc={() => bump('weight', prefs.weightStep)}
          />
          <Stepper
            label="Rest"
            icon={<Hourglass className="size-4" />}
            onDec={() => bump('rest', -prefs.restStep)}
            onInc={() => bump('rest', prefs.restStep)}
          />
        </div>
      </div>

      {!state.running && (
        <button
          onClick={togglePause}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-nr-black/80 backdrop-blur-sm"
        >
          <Pause className="size-12 text-nr-bronze" />
          <span className="font-heading text-2xl uppercase tracking-[0.3em] text-nr-bone">
            Paused
          </span>
          <span className="text-[10px] uppercase tracking-widest text-nr-bone/50">Tap to resume</span>
        </button>
      )}

      {showQueue && (
        <PlanSheet
          title="The Plan"
          subtitle="Completed & current locked · edit upcoming"
          onClose={() => setShowQueue(false)}
          footer={
            <button
              onClick={() => setPicker({ kind: 'add' })}
              className="clip-bevel-sm mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-nr-bronze/40 py-2.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
            >
              <Plus className="size-4" /> Add Exercise
            </button>
          }
        >
          <ul className="space-y-2">
            {exerciseViews.map((v, i) => {
              const done = i < state.exIndex
              const cur = i === state.exIndex
              const upcoming = i > state.exIndex
              const completed = v.sets.filter((s) => s.status === 'completed').length
              const sub = catalog?.find((c) => c.slug === v.sx.exercise_slug)?.body_sub_group_slug ?? ''
              const planRow = v.sets[0]
              return (
                <PlanSheetRow
                  key={v.sx.id}
                  highlight={cur}
                  name={v.sx.exercise_name_snapshot}
                  meta={`${sub} · ${v.sets.length}×${planRow?.planned_reps ?? '?'} @ ${planRow?.planned_weight_lbs ?? '?'}lb`}
                  badge={
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                        done
                          ? 'border-nr-crimson bg-nr-crimson text-nr-bone'
                          : cur
                            ? 'border-nr-ember text-nr-ember'
                            : 'border-nr-bronze/40 text-nr-bone/50',
                      )}
                    >
                      {done ? <Check className="size-4" /> : i + 1}
                    </span>
                  }
                  trailing={
                    upcoming ? (
                      <div className="flex shrink-0 items-center gap-0.5">
                        <IconBtn
                          onClick={() => setPicker({ kind: 'swap', sessionExerciseId: v.sx.id })}
                        >
                          <Repeat2 className="size-3.5" />
                        </IconBtn>
                        <IconBtn onClick={() => handleRemoveExercise(v.sx)} danger>
                          <Trash2 className="size-3.5" />
                        </IconBtn>
                      </div>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-widest text-nr-bone/40">
                        {done ? 'done' : `${completed}/${v.sets.length}`}
                        <Lock className="size-3 text-nr-bone/25" />
                      </span>
                    )
                  }
                />
              )
            })}
          </ul>
        </PlanSheet>
      )}

      {picker && (
        <ExercisePicker
          mode={picker}
          current={
            picker.kind === 'swap'
              ? exerciseViews.find((v) => v.sx.id === picker.sessionExerciseId)?.sx ?? null
              : null
          }
          onPick={(e) => {
            if (picker.kind === 'swap') {
              const v = exerciseViews.find((v) => v.sx.id === picker.sessionExerciseId)
              if (v) handleSwap(v.sx, e)
            } else {
              handleAddExercise(e)
            }
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}

// ============================================================================
// Visual building blocks
// ============================================================================

function QuadrantRing({
  sets,
  progress,
  children,
  onTap,
  ariaLabel,
}: {
  sets: SetState[]
  progress: number
  children: React.ReactNode
  onTap: () => void
  ariaLabel: string
}) {
  const n = Math.max(sets.length, 1)
  const span = 360 / n
  const halfGap = Math.min(13, 52 / n)
  const arcs = sets.map((_, i) => ({ start: i * span + halfGap, end: (i + 1) * span - halfGap }))
  const bossAngles = sets.map((_, i) => i * span)

  return (
    <button
      onClick={onTap}
      aria-label={ariaLabel}
      className="group relative aspect-square w-full max-w-[270px] cursor-pointer rounded-full transition-transform active:scale-[0.97]"
    >
      <span className="absolute inset-2 rounded-full bg-nr-crimson/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <svg viewBox="0 0 220 220" className="size-full">
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(176,141,87,0.10)" strokeWidth={16} />
        {arcs.map((arc, i) => {
          const state = sets[i]
          const arcSpan = arc.end - arc.start
          const baseStroke =
            state === 'completed'
              ? '#b91c1c'
              : state === 'skipped'
                ? 'rgba(176,141,87,0.35)'
                : 'rgba(176,141,87,0.18)'
          return (
            <g key={i}>
              <path
                d={arcPath(arc.start, arc.end)}
                fill="none"
                strokeLinecap="round"
                strokeWidth={14}
                stroke={baseStroke}
                strokeDasharray={state === 'skipped' ? '2 6' : undefined}
                style={
                  state === 'completed'
                    ? { filter: 'drop-shadow(0 0 5px rgba(185,28,28,0.65))' }
                    : undefined
                }
              />
              {state === 'active' && progress > 0.01 && (
                <path
                  d={arcPath(arc.start, arc.start + arcSpan * Math.min(progress, 1))}
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth={14}
                  stroke="#ef4444"
                  style={{ filter: 'drop-shadow(0 0 7px rgba(239,68,68,0.9))' }}
                />
              )}
            </g>
          )
        })}
      </svg>
      {bossAngles.map((ang) => {
        const p = polar(ang)
        return (
          <span
            key={ang}
            className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-nr-bronze/50 bg-nr-black"
            style={{ left: `${(p.x / 220) * 100}%`, top: `${(p.y / 220) * 100}%` }}
          >
            <Skull className="size-3.5 text-nr-bronze" strokeWidth={1.5} />
          </span>
        )
      })}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </button>
  )
}

function StatTile({
  label,
  value,
  unit,
  planned,
}: {
  label: string
  value: number
  unit?: string
  planned: number
}) {
  const changed = planned !== value
  return (
    <div className="clip-bevel-sm border border-nr-bronze/25 bg-nr-gunmetal/50 px-2 py-2 text-center">
      <p className="text-[9px] uppercase tracking-widest text-nr-bone/45">{label}</p>
      <p className="font-heading text-2xl font-bold leading-none text-nr-bone">
        {value}
        {unit && <span className="ml-0.5 text-xs text-nr-bone/50">{unit}</span>}
      </p>
      <p
        className={cn(
          'mt-0.5 text-[9px] uppercase tracking-wider',
          changed ? 'text-nr-ember/80' : 'text-nr-bone/35',
        )}
      >
        {changed ? `plan ${planned}` : 'on plan'}
      </p>
    </div>
  )
}

function CtrlButton({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'clip-bevel-sm flex flex-col items-center gap-1 border py-2.5 transition-colors',
        tone === 'primary'
          ? 'border-nr-crimson/60 bg-nr-crimson/15 text-nr-ember hover:bg-nr-crimson/25'
          : 'border-nr-bronze/30 text-nr-bone/80 hover:border-nr-bronze/60 hover:text-nr-bone',
      )}
    >
      {icon}
      <span className="font-heading text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  )
}

function Stepper({
  label,
  icon,
  onDec,
  onInc,
}: {
  label: string
  icon?: React.ReactNode
  onDec: () => void
  onInc: () => void
}) {
  return (
    <div className="clip-bevel-sm flex items-center justify-between border border-nr-bronze/30 bg-nr-gunmetal/40">
      <button
        onClick={onDec}
        className="flex h-10 flex-1 items-center justify-center text-nr-bone/70 hover:bg-nr-crimson/20 hover:text-nr-ember"
      >
        <Minus className="size-4" />
      </button>
      <span className="flex items-center gap-1 px-1 font-heading text-[10px] uppercase tracking-widest text-nr-bone/50">
        {icon}
        {label}
      </span>
      <button
        onClick={onInc}
        className="flex h-10 flex-1 items-center justify-center text-nr-bone/70 hover:bg-nr-crimson/20 hover:text-nr-ember"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-7 items-center justify-center rounded-sm border transition-colors',
        disabled
          ? 'border-nr-bronze/10 text-nr-bone/15'
          : danger
            ? 'border-nr-bronze/30 text-nr-bone/60 hover:border-nr-crimson hover:text-nr-ember'
            : 'border-nr-bronze/30 text-nr-bone/60 hover:border-nr-bronze hover:text-nr-bone',
      )}
    >
      {children}
    </button>
  )
}

function RpeStrip({
  current,
  onPick,
}: {
  current: number | null
  onPick: (v: number) => void
}) {
  return (
    <div className="clip-bevel-sm relative mx-4 mb-2 border border-nr-bronze/30 bg-nr-black/40 px-3 py-2">
      <p className="mb-1.5 text-center text-[9px] uppercase tracking-[0.25em] text-nr-bone/45">
        Rate that set · effort
      </p>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            onClick={() => onPick(v)}
            className={cn(
              'h-7 flex-1 rounded-sm border font-heading text-[11px] tabular-nums transition-colors',
              current === v
                ? 'border-nr-ember bg-nr-crimson text-nr-bone'
                : 'border-nr-bronze/30 text-nr-bone/55 hover:border-nr-bronze hover:text-nr-bone',
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Final summary screen — collects effort & per-exercise scores then calls
// finalize_session RPC.
// ============================================================================
function SummaryView({
  sessionId,
  sessionSeconds,
  state,
  exerciseViews,
  finalize,
  onSavedAndExit,
}: {
  sessionId: string
  sessionSeconds: number
  state: LiveSessionState
  exerciseViews: { sx: SessionExercise; sets: SessionSet[] }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finalize: any
  onSavedAndExit: (savePlanChanges: boolean | null) => Promise<void>
}) {
  const [effort, setEffort] = useState<number | null>(null)
  const [ratings, setRatings] = useState<Record<string, 1 | 0 | -1>>({})
  const [planChoice, setPlanChoice] = useState<'plan' | 'today' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const completedSets = exerciseViews.flatMap((v) => v.sets.filter((s) => s.status === 'completed'))
  const skipped = exerciseViews.flatMap((v) => v.sets.filter((s) => s.status === 'skipped')).length
  const volume = completedSets.reduce(
    (sum, s) => sum + (s.actual_reps ?? 0) * Number(s.actual_weight_lbs ?? 0),
    0,
  )
  const performed = exerciseViews
    .map((v) => ({
      slug: v.sx.exercise_slug,
      name: v.sx.exercise_name_snapshot,
      didSomething: v.sets.some((s) => s.status === 'completed'),
    }))
    .filter((p) => p.didSomething)

  const finish = async () => {
    setSubmitting(true)
    const scores = performed
      .map((p) => ({
        exercise_slug: p.slug,
        preference_score: ratings[p.slug] === 1 ? 8 : ratings[p.slug] === -1 ? 3 : null,
      }))
      .filter((s) => s.preference_score !== null)
    try {
      await finalize.mutateAsync({
        sessionId,
        perceivedEffort: effort,
        totalActiveSeconds: sessionSeconds,
        exerciseScores: scores,
      })
      await onSavedAndExit(state.planEdited ? planChoice === 'plan' : null)
    } catch (e) {
      alert(`Could not finalize: ${(e as Error).message}`)
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex h-full flex-col items-center overflow-y-auto bg-nr-black px-6 py-9 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(122,30,30,0.18),transparent_60%)]" />
      <div className="relative z-10 flex flex-col items-center">
        <Trophy className="size-14 text-nr-bronze" strokeWidth={1.5} />
        <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.15em] text-nr-bone">
          Victory
        </h1>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
          Session complete
        </p>

        <div className="mt-5 grid w-full max-w-[320px] grid-cols-2 gap-2">
          <SumTile label="Time" value={fmtLong(sessionSeconds)} />
          <SumTile label="Exercises" value={String(exerciseViews.length)} />
          <SumTile label="Sets Done" value={String(completedSets.length)} />
          <SumTile label="Volume" value={`${volume.toLocaleString()} lb`} />
        </div>
        {skipped > 0 && (
          <p className="mt-2.5 text-[10px] uppercase tracking-widest text-nr-bone/40">
            {skipped} set(s) skipped
          </p>
        )}

        <div className="clip-bevel-sm mt-5 w-full max-w-[320px] border border-nr-bronze/30 bg-nr-gunmetal/40 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-nr-bone/55">
            How hard was today?
          </p>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                onClick={() => setEffort((e) => (e === v ? null : v))}
                className={cn(
                  'h-7 flex-1 rounded-sm border font-heading text-[11px] tabular-nums transition-colors',
                  effort === v
                    ? 'border-nr-ember bg-nr-crimson text-nr-bone'
                    : 'border-nr-bronze/30 text-nr-bone/55 hover:border-nr-bronze hover:text-nr-bone',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {performed.length > 0 && (
          <div className="clip-bevel-sm mt-3 w-full max-w-[320px] border border-nr-bronze/30 bg-nr-gunmetal/40 p-3 text-left">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-nr-bone/55">
              <Heart className="size-3.5 text-nr-ember" /> Rate today's lifts
            </p>
            <ul className="space-y-1.5">
              {performed.map((p) => (
                <li key={p.slug} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-heading text-[12px] uppercase tracking-wide text-nr-bone/85">
                    {p.name}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <RateBtn
                      active={ratings[p.slug] === -1}
                      onClick={() =>
                        setRatings((r) => ({ ...r, [p.slug]: r[p.slug] === -1 ? 0 : -1 }))
                      }
                    >
                      <ThumbsDown className="size-3.5" />
                    </RateBtn>
                    <RateBtn
                      up
                      active={ratings[p.slug] === 1}
                      onClick={() =>
                        setRatings((r) => ({ ...r, [p.slug]: r[p.slug] === 1 ? 0 : 1 }))
                      }
                    >
                      <ThumbsUp className="size-3.5" />
                    </RateBtn>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.planEdited && (
          <div className="clip-bevel-sm mt-3 w-full max-w-[320px] border border-nr-bronze/30 bg-nr-gunmetal/50 p-3">
            {planChoice === null ? (
              <>
                <p className="text-[11px] leading-tight text-nr-bone/75">
                  You changed today's workout. Save these changes to your saved plan?
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => setPlanChoice('plan')}
                    className="clip-bevel-sm flex-1 bg-nr-crimson py-2 font-heading text-[11px] font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
                  >
                    Save to Plan
                  </button>
                  <button
                    onClick={() => setPlanChoice('today')}
                    className="clip-bevel-sm flex-1 border border-nr-bronze/40 py-2 font-heading text-[11px] font-semibold uppercase tracking-widest text-nr-bronze hover:text-nr-bone"
                  >
                    Just Today
                  </button>
                </div>
              </>
            ) : (
              <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest text-nr-bone/70">
                <Check className="size-3.5 text-nr-crimson" />
                {planChoice === 'plan' ? 'Plan will be updated' : 'Kept for today only'}
              </p>
            )}
          </div>
        )}

        <button
          onClick={finish}
          disabled={submitting}
          className="clip-bevel mt-5 w-full max-w-[320px] shrink-0 bg-nr-crimson py-3 font-heading text-base font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Finish & Save'}
        </button>
      </div>
    </div>
  )
}

function SumTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="clip-bevel-sm border border-nr-bronze/25 bg-nr-gunmetal/50 px-2 py-3">
      <p className="font-heading text-xl font-bold text-nr-bone">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-widest text-nr-bone/40">{label}</p>
    </div>
  )
}

function RateBtn({
  children,
  active,
  up,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  up?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-sm border transition-colors',
        active
          ? up
            ? 'border-nr-ember bg-nr-crimson text-nr-bone'
            : 'border-nr-bronze/60 bg-nr-bronze/20 text-nr-bone'
          : 'border-nr-bronze/30 text-nr-bone/50 hover:text-nr-bone',
      )}
    >
      {children}
    </button>
  )
}

// ============================================================================
// Add / swap picker — walks body group → sub-group → exercise
// ============================================================================
function ExercisePicker({
  mode,
  current,
  onPick,
  onClose,
}: {
  mode: PickerMode
  current: SessionExercise | null
  onPick: (e: Exercise) => void
  onClose: () => void
}) {
  const { data: catalog = [] } = useExercises()
  const { data: groupsData } = useBodyGroups()
  const groups = groupsData?.groups ?? []

  const [q, setQ] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [sub, setSub] = useState<string | null>(null)
  const isSwap = mode.kind === 'swap'

  const query = q.trim().toLowerCase()
  const groupLabel = group ? groups.find((g) => g.slug === group)?.label ?? group : null

  let list: Exercise[] | null = null
  if (query) {
    list = catalog.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        (e.body_sub_group_slug ?? '').toLowerCase().includes(query) ||
        (e.body_group_slug ?? '').toLowerCase().includes(query),
    )
  } else if (group && sub) {
    list = exercisesByGroup(catalog, group).filter((e) => e.body_sub_group_slug === sub)
  } else if (!group && isSwap && current) {
    const cur = catalog.find((c) => c.slug === current.exercise_slug)
    if (cur) {
      const subMatches = catalog.filter(
        (e) =>
          e.body_sub_group_slug === cur.body_sub_group_slug && e.slug !== cur.slug,
      )
      const groupMatches = catalog.filter(
        (e) =>
          e.body_group_slug === cur.body_group_slug &&
          e.body_sub_group_slug !== cur.body_sub_group_slug,
      )
      list = [...subMatches, ...groupMatches]
    }
  }

  const subGroups =
    group && !sub && !query ? subGroupSlugsForGroup(catalog, group) : null

  const selectGroup = (slug: string) => {
    setQ('')
    setSub(null)
    setGroup((g) => (g === slug ? null : slug))
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-nr-black/85 backdrop-blur-sm"
      />
      <div className="relative mt-auto flex max-h-[88%] flex-col border-t border-nr-bronze/40 bg-nr-gunmetal px-4 pb-6 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
            {isSwap ? 'Swap Exercise' : 'Add Exercise'}
          </h3>
          <button onClick={onClose} className="text-nr-bone/50 hover:text-nr-bone">
            <X className="size-5" />
          </button>
        </div>

        <div className="clip-bevel-sm mb-3 flex items-center gap-2 border border-nr-bronze/30 bg-nr-black/40 px-2">
          <Search className="size-4 text-nr-bone/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all exercises…"
            className="h-9 flex-1 bg-transparent text-sm text-nr-bone placeholder:text-nr-bone/30 focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-nr-bone/40 hover:text-nr-bone">
              <X className="size-4" />
            </button>
          )}
        </div>

        {!query && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groups.map((g) => {
              const active = g.slug === group
              return (
                <button
                  key={g.slug}
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
        )}

        {!query && group && (
          <button
            onClick={() => (sub ? setSub(null) : setGroup(null))}
            className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-nr-bronze hover:text-nr-ember"
          >
            <ArrowUp className="size-3 -rotate-90" />
            {sub ? `${groupLabel} · all` : isSwap ? 'Back to alternatives' : 'Muscle groups'}
            {sub && <span className="text-nr-bone/45">› {sub}</span>}
          </button>
        )}

        <div className="overflow-y-auto">
          {subGroups && (
            <ul className="space-y-1.5">
              {subGroups.map((s) => {
                const count = exercisesByGroup(catalog, group!).filter(
                  (e) => e.body_sub_group_slug === s,
                ).length
                return (
                  <li key={s}>
                    <button
                      onClick={() => setSub(s)}
                      className="clip-bevel-sm flex w-full items-center justify-between border border-nr-bronze/25 bg-nr-black/30 px-3 py-2.5 text-left hover:border-nr-crimson hover:bg-nr-crimson/10"
                    >
                      <span className="font-heading text-sm uppercase tracking-wide text-nr-bone">
                        {s}
                      </span>
                      <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-nr-bone/40">
                        {count}
                        <ChevronsRight className="size-3.5 text-nr-bronze" />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {!query && !group && isSwap && current && (
            <p className="mb-2 text-[10px] uppercase tracking-wider text-nr-bone/40">
              Alternatives for {current.exercise_name_snapshot}
            </p>
          )}

          {list && (
            <ul className="space-y-1.5">
              {list.map((e) => (
                <li key={e.slug}>
                  <button
                    onClick={() => onPick(e)}
                    className="clip-bevel-sm flex w-full items-center gap-3 border border-nr-bronze/25 bg-nr-black/30 px-3 py-2 text-left hover:border-nr-crimson hover:bg-nr-crimson/10"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bronze">
                      <Plus className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">
                        {e.name}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-nr-bone/40">
                        {e.body_sub_group_slug ?? '—'} · {e.default_sets}×
                        {e.default_reps ?? `${e.default_duration_seconds ?? 0}s`}
                        {e.default_weight_lbs ? ` @ ${e.default_weight_lbs}lb` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
              {list.length === 0 && (
                <li className="py-6 text-center text-xs uppercase tracking-widest text-nr-bone/30">
                  No matches
                </li>
              )}
            </ul>
          )}

          {!query && !group && !isSwap && (
            <p className="py-8 text-center text-[11px] uppercase tracking-widest text-nr-bone/35">
              Choose a muscle group above
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
