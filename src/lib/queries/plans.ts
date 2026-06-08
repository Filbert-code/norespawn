import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/db'
import { qk } from '@/lib/queries/keys'
import { useAuth } from '@/lib/auth'
import type {
  TrackingType,
  Workout,
  WorkoutExercise,
  WorkoutExerciseInsert,
} from '@/lib/supabase'

// ----------------------------------------------------------------------------
// `plan` here = `workout` row (header) + ordered `workout_exercise` rows
// (per-exercise prescription). Optional `workout_set` rows can extend with
// per-set targets but the V1 UI works at the exercise level only.
// ----------------------------------------------------------------------------

export interface PlanExerciseInput {
  exercise_slug: string
  position: number
  tracking_type: TrackingType
  planned_sets: number
  planned_reps: number | null
  planned_weight_lbs: number | null
  planned_duration_seconds: number | null
  planned_set_rest_seconds: number
  planned_end_rest_seconds: number
  notes?: string | null
}

export interface PlanInput {
  name: string
  notes?: string | null
  exercises: PlanExerciseInput[]
}

export interface PlanDetail {
  workout: Workout
  exercises: WorkoutExercise[]
}

/** Aggregate row used by the list view: header + recent-session metadata. */
export interface PlanSummary {
  workout: Workout
  exerciseCount: number
  lastPerformedAt: string | null
  /** Total completed sessions linked to this workout, drives "Most Used". */
  timesPerformed: number
}

export function usePlans() {
  return useQuery({
    queryKey: qk.plans.list(),
    queryFn: async (): Promise<PlanSummary[]> => {
      // Fetch headers + grouped session info in parallel, then stitch.
      const workouts = unwrap(
        await supabase
          .from('workout')
          .select('*')
          .eq('is_archived', false)
          .order('created_at', { ascending: false }),
      ) as Workout[]
      if (workouts.length === 0) return []

      const ids = workouts.map((w) => w.id)
      const [exRows, sessions] = await Promise.all([
        supabase
          .from('workout_exercise')
          .select('id, workout_id')
          .in('workout_id', ids),
        supabase
          .from('workout_session')
          .select('id, workout_id, started_at, status')
          .in('workout_id', ids),
      ])
      const exErr = exRows.error
      const sErr = sessions.error
      if (exErr) throw exErr
      if (sErr) throw sErr

      const countByWorkout = new Map<string, number>()
      for (const r of exRows.data ?? []) {
        countByWorkout.set(r.workout_id, (countByWorkout.get(r.workout_id) ?? 0) + 1)
      }
      const completedByWorkout = new Map<string, number>()
      const lastByWorkout = new Map<string, string>()
      for (const s of sessions.data ?? []) {
        if (s.status === 'completed') {
          completedByWorkout.set(
            s.workout_id,
            (completedByWorkout.get(s.workout_id) ?? 0) + 1,
          )
          const prev = lastByWorkout.get(s.workout_id)
          if (!prev || s.started_at > prev) lastByWorkout.set(s.workout_id, s.started_at)
        }
      }

      return workouts.map((w) => ({
        workout: w,
        exerciseCount: countByWorkout.get(w.id) ?? 0,
        lastPerformedAt: lastByWorkout.get(w.id) ?? null,
        timesPerformed: completedByWorkout.get(w.id) ?? 0,
      }))
    },
  })
}

export function usePlan(id: string | undefined) {
  return useQuery<PlanDetail>({
    enabled: !!id,
    queryKey: qk.plans.detail(id ?? ''),
    queryFn: async () => {
      const workout = unwrap(
        await supabase.from('workout').select('*').eq('id', id!).single(),
      ) as Workout
      const exercises = unwrap(
        await supabase
          .from('workout_exercise')
          .select('*')
          .eq('workout_id', id!)
          .order('position'),
      ) as WorkoutExercise[]
      return { workout, exercises }
    },
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: PlanInput): Promise<PlanDetail> => {
      if (!user) throw new Error('Not signed in')
      const workout = unwrap(
        await supabase
          .from('workout')
          .insert({ user_id: user.id, name: input.name, notes: input.notes ?? null })
          .select()
          .single(),
      ) as Workout
      if (input.exercises.length > 0) {
        const rows: WorkoutExerciseInsert[] = input.exercises.map((e) => ({
          ...e,
          workout_id: workout.id,
        }))
        unwrap(await supabase.from('workout_exercise').insert(rows).select())
      }
      const exercises = unwrap(
        await supabase
          .from('workout_exercise')
          .select('*')
          .eq('workout_id', workout.id)
          .order('position'),
      ) as WorkoutExercise[]
      return { workout, exercises }
    },
    onSuccess: (detail) => {
      qc.invalidateQueries({ queryKey: qk.plans.all })
      qc.setQueryData(qk.plans.detail(detail.workout.id), detail)
    },
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
      exercises,
    }: {
      id: string
      patch?: Partial<Pick<Workout, 'name' | 'notes' | 'is_archived'>>
      /** When provided, replaces the full exercise list for this workout. */
      exercises?: PlanExerciseInput[]
    }): Promise<PlanDetail> => {
      if (patch) {
        unwrap(await supabase.from('workout').update(patch).eq('id', id).select().single())
      }
      if (exercises) {
        // Replace strategy keeps writes simple: clear + reinsert with new positions.
        unwrap(
          await supabase
            .from('workout_exercise')
            .delete()
            .eq('workout_id', id)
            .select(),
        )
        if (exercises.length > 0) {
          const rows: WorkoutExerciseInsert[] = exercises.map((e) => ({
            ...e,
            workout_id: id,
          }))
          unwrap(await supabase.from('workout_exercise').insert(rows).select())
        }
      }
      const workout = unwrap(
        await supabase.from('workout').select('*').eq('id', id).single(),
      ) as Workout
      const after = unwrap(
        await supabase
          .from('workout_exercise')
          .select('*')
          .eq('workout_id', id)
          .order('position'),
      ) as WorkoutExercise[]
      return { workout, exercises: after }
    },
    onSuccess: (detail) => {
      qc.invalidateQueries({ queryKey: qk.plans.all })
      qc.setQueryData(qk.plans.detail(detail.workout.id), detail)
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft-delete: keep history links intact (scheduled_workout / workout_session
      // FK is restrict, so a hard delete would fail once sessions exist).
      unwrap(
        await supabase.from('workout').update({ is_archived: true }).eq('id', id).select(),
      )
      return id
    },
    // Optimistically remove the plan from the cached list so the UI snaps
    // instantly. Roll back if the request fails.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qk.plans.list() })
      const prev = qc.getQueryData<PlanSummary[]>(qk.plans.list())
      if (prev) {
        qc.setQueryData<PlanSummary[]>(
          qk.plans.list(),
          prev.filter((p) => p.workout.id !== id),
        )
      }
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.plans.list(), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.plans.all })
    },
  })
}
