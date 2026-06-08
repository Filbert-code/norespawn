import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap, isoDate } from '@/lib/db'
import { qk } from '@/lib/queries/keys'
import { useAuth } from '@/lib/auth'
import type { ScheduledWorkout } from '@/lib/supabase'

// ----------------------------------------------------------------------------
// scheduled_workout = (user, date, workout) row. The DB has a one-per-day
// unique index so the upsert below is safe — we either insert a new row or
// flip the existing row to the new plan.
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
          .order('scheduled_date'),
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
      const row = unwrap(
        await supabase
          .from('scheduled_workout')
          .upsert(
            {
              user_id: user.id,
              workout_id: workoutId,
              scheduled_date: isoDate(date),
              status: 'scheduled',
              notes: notes ?? null,
            },
            { onConflict: 'user_id,scheduled_date' },
          )
          .select()
          .single(),
      ) as ScheduledWorkout
      return row
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
