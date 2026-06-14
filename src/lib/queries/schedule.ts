import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap, isoDate } from '@/lib/db'
import { qk } from '@/lib/queries/keys'
import { useAuth } from '@/lib/auth'
import type { ScheduledWorkout } from '@/lib/supabase'

// ----------------------------------------------------------------------------
// scheduled_workout = (user, date, workout) row. Multiple workouts per day are
// supported (D10 revised): each day holds an ordered list of rows keyed by
// `position`. Scheduling appends a new row via the `schedule_workout` RPC,
// which assigns the next position atomically server-side.
// ----------------------------------------------------------------------------

export function useScheduledWorkouts(fromDate: Date, toDate: Date) {
  const fromISO = isoDate(fromDate)
  const toISO = isoDate(toDate)
  return useQuery({
    queryKey: qk.schedule.range(fromISO, toISO),
    queryFn: async (): Promise<ScheduledWorkout[]> => {
      const rows = unwrap(
        await supabase
          .from('scheduled_workout')
          .select('*')
          .gte('scheduled_date', fromISO)
          .lte('scheduled_date', toISO)
          .order('scheduled_date')
          .order('position'),
      ) as ScheduledWorkout[]
      return rows
    },
  })
}

export function useScheduleWorkout() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({
      date,
      workoutId,
      notes,
    }: {
      date: Date
      workoutId: string
      notes?: string | null
    }): Promise<ScheduledWorkout> => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase.rpc('schedule_workout', {
        p_workout_id: workoutId,
        p_date: isoDate(date),
        p_notes: notes ?? undefined,
      })
      if (error) throw error
      return data as unknown as ScheduledWorkout
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.schedule.all })
    },
  })
}

export function useUnscheduleWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (scheduledId: string) => {
      unwrap(
        await supabase.from('scheduled_workout').delete().eq('id', scheduledId).select(),
      )
      return scheduledId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.schedule.all })
    },
  })
}
