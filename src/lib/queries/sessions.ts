import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap, isoDate } from '@/lib/db'
import { qk } from '@/lib/queries/keys'
import { useAuth } from '@/lib/auth'
import type {
  SessionExercise,
  SessionSet,
  WorkoutSession,
} from '@/lib/supabase'

// ============================================================================
// Sessions = `workout_session` row + ordered `session_exercise` + `session_set`
// rows. A live session is the only place we write to these tables; reads here
// drive the calendar / recap surfaces.
//
// `useStartSession` runs the snapshot client-side in M2-M4. In M5 we'll swap
// it for a `start_session` Postgres RPC so the snapshot is atomic on the
// server. The function signature stays the same so callers don't need to
// change when we cut over.
// ============================================================================

export interface SessionDetail {
  session: WorkoutSession
  exercises: SessionExercise[]
  sets: SessionSet[]
}

/** Sessions overlapping a date range (used by the calendar view). */
export function useSessions(fromDate: Date, toDate: Date) {
  const fromISO = fromDate.toISOString()
  const toISO = toDate.toISOString()
  return useQuery({
    queryKey: qk.sessions.range(fromISO, toISO),
    queryFn: async (): Promise<WorkoutSession[]> => {
      const rows = unwrap(
        await supabase
          .from('workout_session')
          .select('*')
          .gte('started_at', fromISO)
          .lte('started_at', toISO)
          .order('started_at', { ascending: true }),
      ) as WorkoutSession[]
      return rows
    },
  })
}

/** The single in-progress session (if any) — drives the Resume affordance. */
export function useInProgressSession() {
  return useQuery({
    queryKey: qk.sessions.inProgress(),
    queryFn: async (): Promise<WorkoutSession | null> => {
      const row = unwrap(
        await supabase
          .from('workout_session')
          .select('*')
          .eq('status', 'in_progress')
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ) as WorkoutSession | null
      return row
    },
  })
}

export function useSession(id: string | undefined) {
  return useQuery<SessionDetail>({
    enabled: !!id,
    queryKey: qk.sessions.detail(id ?? ''),
    queryFn: async () => {
      const session = unwrap(
        await supabase.from('workout_session').select('*').eq('id', id!).single(),
      ) as WorkoutSession
      const exercises = unwrap(
        await supabase
          .from('session_exercise')
          .select('*')
          .eq('session_id', session.id)
          .order('position'),
      ) as SessionExercise[]
      const sets =
        exercises.length === 0
          ? []
          : (unwrap(
              await supabase
                .from('session_set')
                .select('*')
                .in(
                  'session_exercise_id',
                  exercises.map((e) => e.id),
                )
                .order('set_number'),
            ) as SessionSet[])
      return { session, exercises, sets }
    },
  })
}

/**
 * Create a fresh in-progress `workout_session` snapshotted from a plan via
 * the `start_session` Postgres RPC (atomic on the server). If
 * `scheduledWorkoutId` is provided the RPC also links the schedule row.
 */
export function useStartSession() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({
      workoutId,
      scheduledWorkoutId,
    }: {
      workoutId: string
      scheduledWorkoutId?: string
    }): Promise<WorkoutSession> => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase.rpc('start_session', {
        p_workout_id: workoutId,
        p_scheduled_workout_id: scheduledWorkoutId,
      })
      if (error) throw error
      return data as unknown as WorkoutSession
    },
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: qk.sessions.all })
      qc.invalidateQueries({ queryKey: qk.schedule.all })
      qc.invalidateQueries({ queryKey: qk.sessions.detail(session.id) })
    },
  })
}

/** Mark an in-progress session as `abandoned`. */
export function useAbandonSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      unwrap(
        await supabase
          .from('workout_session')
          .update({ status: 'abandoned', ended_at: new Date().toISOString() })
          .eq('id', sessionId)
          .select(),
      )
      return sessionId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sessions.all })
      qc.invalidateQueries({ queryKey: qk.schedule.all })
    },
  })
}

// Helper for callers that need to express ranges; used by the calendar grid.
export function dayBoundsISO(d: Date): { from: string; to: string } {
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const end = new Date(d)
  end.setHours(23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

export function dateLabel(d: Date): string {
  return isoDate(d)
}
