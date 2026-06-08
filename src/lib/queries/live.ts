import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/db'
import { qk } from '@/lib/queries/keys'
import { useAuth } from '@/lib/auth'
import type { SessionDetail } from '@/lib/queries/sessions'
import type {
  SessionEvent,
  SessionEventInsert,
  SessionExercise,
  SessionExerciseInsert,
  SessionSet,
  SessionSetInsert,
  WorkoutSession,
} from '@/lib/supabase'

// ============================================================================
// Live-session writes. All mutations also append to `session_event` so the
// recap timeline is faithful — that's the "history" the data model promises.
// ============================================================================

interface LogSetInput {
  sessionId: string
  setId: string
  sessionExerciseId: string
  actualReps: number
  actualWeightLbs: number
  actualRpe?: number | null
  skipped?: boolean
}

export function useLogSet() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: LogSetInput): Promise<SessionSet> => {
      if (!user) throw new Error('not signed in')
      const now = new Date().toISOString()
      const row = unwrap(
        await supabase
          .from('session_set')
          .update({
            status: input.skipped ? 'skipped' : 'completed',
            actual_reps: input.actualReps,
            actual_weight_lbs: input.actualWeightLbs,
            actual_rpe: input.actualRpe ?? null,
            completed_at: now,
          })
          .eq('id', input.setId)
          .select()
          .single(),
      ) as SessionSet
      const evt: SessionEventInsert = {
        session_id: input.sessionId,
        user_id: user.id,
        session_exercise_id: input.sessionExerciseId,
        session_set_id: input.setId,
        event_type: input.skipped ? 'exercise_skipped' : 'set_completed',
        payload: {
          reps: input.actualReps,
          weight_lbs: input.actualWeightLbs,
          rpe: input.actualRpe ?? null,
        },
      }
      unwrap(await supabase.from('session_event').insert(evt).select())
      return row
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: qk.sessions.detail(vars.sessionId) })
    },
  })
}

export function useAppendEvent() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (
      e: Omit<SessionEventInsert, 'user_id'>,
    ): Promise<SessionEvent> => {
      if (!user) throw new Error('not signed in')
      return unwrap(
        await supabase
          .from('session_event')
          .insert({ ...e, user_id: user.id })
          .select()
          .single(),
      ) as SessionEvent
    },
  })
}

/** Append a new set row to an existing session_exercise (mid-session "Add Set").
 * Optimistically extends the cached SessionDetail so the ring grows the moment
 * the user taps; the real row replaces the placeholder when the insert lands.
 */
export function useAddSessionSet() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: {
      sessionId: string
      sessionExerciseId: string
      setNumber: number
      plannedReps?: number | null
      plannedWeightLbs?: number | null
      plannedRestSeconds: number
    }): Promise<SessionSet> => {
      if (!user) throw new Error('not signed in')
      const row: SessionSetInsert = {
        session_exercise_id: input.sessionExerciseId,
        set_number: input.setNumber,
        set_role: 'working',
        status: 'pending',
        planned_reps: input.plannedReps ?? null,
        planned_weight_lbs: input.plannedWeightLbs ?? null,
        planned_rest_seconds: input.plannedRestSeconds,
      }
      const inserted = unwrap(
        await supabase.from('session_set').insert(row).select().single(),
      ) as SessionSet
      unwrap(
        await supabase.from('session_event').insert({
          session_id: input.sessionId,
          user_id: user.id,
          session_exercise_id: input.sessionExerciseId,
          session_set_id: inserted.id,
          event_type: 'set_added',
          payload: { set_number: input.setNumber },
        }),
      )
      return inserted
    },
    onMutate: async (input) => {
      const key = qk.sessions.detail(input.sessionId)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<SessionDetail>(key)
      const tempId = `temp-${Date.now()}`
      if (prev) {
        const optimistic: SessionSet = {
          id: tempId,
          session_exercise_id: input.sessionExerciseId,
          set_number: input.setNumber,
          set_role: 'working',
          status: 'pending',
          planned_reps: input.plannedReps ?? null,
          planned_weight_lbs: input.plannedWeightLbs ?? null,
          planned_duration_seconds: null,
          planned_rest_seconds: input.plannedRestSeconds,
          actual_reps: null,
          actual_weight_lbs: null,
          actual_duration_seconds: null,
          actual_rest_seconds: null,
          actual_rpe: null,
          started_at: null,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        qc.setQueryData<SessionDetail>(key, {
          ...prev,
          sets: [...prev.sets, optimistic],
        })
      }
      return { prev, tempId }
    },
    onError: (_err, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.sessions.detail(input.sessionId), ctx.prev)
    },
    onSuccess: (real, input, ctx) => {
      // Swap the placeholder for the real row so subsequent updates target it.
      const key = qk.sessions.detail(input.sessionId)
      const cur = qc.getQueryData<SessionDetail>(key)
      if (cur && ctx?.tempId) {
        qc.setQueryData<SessionDetail>(key, {
          ...cur,
          sets: cur.sets.map((s) => (s.id === ctx.tempId ? real : s)),
        })
      }
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: qk.sessions.detail(input.sessionId) })
    },
  })
}

/** Add a brand-new exercise to the live session (after the current cursor). */
export function useAddSessionExercise() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: {
      sessionId: string
      exerciseSlug: string
      position: number
      plannedSets: number
      plannedReps: number | null
      plannedWeightLbs: number | null
      plannedRestSeconds: number
    }): Promise<SessionExercise> => {
      if (!user) throw new Error('not signed in')
      const ex = unwrap(
        await supabase
          .from('exercise')
          .select('slug, name, laterality, tracking_type')
          .eq('slug', input.exerciseSlug)
          .single(),
      ) as {
        slug: string
        name: string
        laterality: SessionExercise['laterality']
        tracking_type: SessionExercise['tracking_type']
      }
      const sxRow: SessionExerciseInsert = {
        session_id: input.sessionId,
        exercise_slug: ex.slug,
        position: input.position,
        exercise_name_snapshot: ex.name,
        tracking_type: ex.tracking_type,
        laterality: ex.laterality,
        planned_set_rest_seconds: input.plannedRestSeconds,
        planned_end_rest_seconds: input.plannedRestSeconds,
        status: 'pending',
      }
      const sx = unwrap(
        await supabase.from('session_exercise').insert(sxRow).select().single(),
      ) as SessionExercise

      const setRows: SessionSetInsert[] = []
      for (let i = 1; i <= input.plannedSets; i++) {
        setRows.push({
          session_exercise_id: sx.id,
          set_number: i,
          set_role: 'working',
          status: 'pending',
          planned_reps: input.plannedReps,
          planned_weight_lbs: input.plannedWeightLbs,
          planned_rest_seconds: input.plannedRestSeconds,
        })
      }
      unwrap(await supabase.from('session_set').insert(setRows).select())

      unwrap(
        await supabase.from('session_event').insert({
          session_id: input.sessionId,
          user_id: user.id,
          session_exercise_id: sx.id,
          event_type: 'set_added',
          payload: { exercise_added: ex.slug },
        }),
      )
      return sx
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.sessions.detail(v.sessionId) })
    },
  })
}

/** Remove an upcoming exercise (only allowed before any of its sets land). */
export function useRemoveSessionExercise() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: { sessionId: string; sessionExerciseId: string }) => {
      if (!user) throw new Error('not signed in')
      unwrap(
        await supabase
          .from('session_exercise')
          .delete()
          .eq('id', input.sessionExerciseId)
          .select(),
      )
      unwrap(
        await supabase.from('session_event').insert({
          session_id: input.sessionId,
          user_id: user.id,
          session_exercise_id: input.sessionExerciseId,
          event_type: 'set_removed',
          payload: { exercise_removed: true },
        }),
      )
      return input.sessionExerciseId
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.sessions.detail(v.sessionId) })
    },
  })
}

interface FinalizeInput {
  sessionId: string
  perceivedEffort?: number | null
  totalActiveSeconds?: number | null
  totalRestSeconds?: number | null
  notes?: string | null
  exerciseScores?: Array<{
    exercise_slug: string
    preference_score?: number | null
    intensity_score?: number | null
  }>
}

export function useFinalizeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: FinalizeInput): Promise<WorkoutSession> => {
      const { data, error } = await supabase.rpc('finalize_session', {
        p_session_id: input.sessionId,
        p_perceived_effort: input.perceivedEffort ?? undefined,
        p_total_active_seconds: input.totalActiveSeconds ?? undefined,
        p_total_rest_seconds: input.totalRestSeconds ?? undefined,
        p_notes: input.notes ?? undefined,
        p_exercise_scores: input.exerciseScores ?? [],
      })
      if (error) throw error
      return data as unknown as WorkoutSession
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: qk.sessions.all })
      qc.invalidateQueries({ queryKey: qk.schedule.all })
      qc.invalidateQueries({ queryKey: qk.prs.all })
      qc.invalidateQueries({ queryKey: qk.exercises.lastPerformed() })
      qc.invalidateQueries({ queryKey: qk.scores.all })
      qc.invalidateQueries({ queryKey: qk.sessions.detail(s.id) })
    },
  })
}

/** Update planned values on a future set (used when "Apply to remaining" fires). */
export function useUpdatePlannedSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      sessionId: string
      setId: string
      plannedReps?: number
      plannedWeightLbs?: number
    }) => {
      unwrap(
        await supabase
          .from('session_set')
          .update({
            planned_reps: input.plannedReps,
            planned_weight_lbs: input.plannedWeightLbs,
          })
          .eq('id', input.setId)
          .select(),
      )
      return input.setId
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.sessions.detail(v.sessionId) })
    },
  })
}
