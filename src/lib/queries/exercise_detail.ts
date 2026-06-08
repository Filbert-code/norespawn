import { useQuery } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/db'
import { qk } from '@/lib/queries/keys'

// Per-exercise drill-down: history, PRs, current preference/intensity scores.

export interface ExerciseHistoryRow {
  session_id: string
  started_at: string
  best_weight_lbs: number | null
  best_reps: number | null
  set_count: number
  volume_lbs: number
}

export interface ExercisePersonalRecords {
  best_weight_lbs: number | null
  best_weight_reps: number | null
  best_weight_at: string | null
  est_one_rm_lbs: number | null
  one_rm_weight_lbs: number | null
  one_rm_reps: number | null
  best_set_volume_lbs: number | null
  set_volume_weight_lbs: number | null
  set_volume_reps: number | null
  rep_pr_reps: number | null
  rep_pr_weight_lbs: number | null
}

export interface ExerciseScores {
  preference_score: number | null
  intensity_score: number | null
}

export function useExerciseHistory(slug: string | undefined, limit = 10) {
  return useQuery({
    enabled: !!slug,
    queryKey: qk.exercises.history(slug ?? ''),
    queryFn: async (): Promise<ExerciseHistoryRow[]> => {
      // Pull recent completed sets for this exercise, group by session client-side
      // (Postgrest can't aggregate without an RPC, and the row count is small).
      const sx = unwrap(
        await supabase
          .from('session_exercise')
          .select(
            'id, session_id, started_at, exercise_slug, workout_session!inner(started_at, status)',
          )
          .eq('exercise_slug', slug!)
          .order('id', { ascending: false })
          .limit(40),
      ) as Array<{
        id: string
        session_id: string
        workout_session: { started_at: string; status: string }
      }>

      if (sx.length === 0) return []
      const sxIds = sx.map((r) => r.id)
      const sets = unwrap(
        await supabase
          .from('session_set')
          .select('session_exercise_id, actual_reps, actual_weight_lbs, status')
          .in('session_exercise_id', sxIds)
          .eq('status', 'completed'),
      ) as Array<{
        session_exercise_id: string
        actual_reps: number | null
        actual_weight_lbs: number | null
      }>

      // Group by session_exercise_id; emit one row per session.
      const setsBySx = new Map<string, typeof sets>()
      for (const s of sets) {
        if (!setsBySx.has(s.session_exercise_id)) setsBySx.set(s.session_exercise_id, [])
        setsBySx.get(s.session_exercise_id)!.push(s)
      }

      const rows: ExerciseHistoryRow[] = []
      for (const r of sx) {
        const ss = setsBySx.get(r.id) ?? []
        if (ss.length === 0) continue
        let topWeight = 0
        let topReps = 0
        let vol = 0
        for (const s of ss) {
          const w = Number(s.actual_weight_lbs ?? 0)
          const reps = s.actual_reps ?? 0
          if (w > topWeight) {
            topWeight = w
            topReps = reps
          }
          vol += w * reps
        }
        rows.push({
          session_id: r.session_id,
          started_at: r.workout_session.started_at,
          best_weight_lbs: topWeight || null,
          best_reps: topReps || null,
          set_count: ss.length,
          volume_lbs: vol,
        })
      }
      // Newest first, trimmed to the requested limit.
      rows.sort((a, b) => b.started_at.localeCompare(a.started_at))
      return rows.slice(0, limit)
    },
  })
}

export function useExercisePRs(slug: string | undefined) {
  return useQuery({
    enabled: !!slug,
    queryKey: qk.prs.forExercise(slug ?? ''),
    queryFn: async (): Promise<ExercisePersonalRecords | null> => {
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('exercise_slug', slug!)
        .maybeSingle()
      if (error) throw error
      return (data as ExercisePersonalRecords | null) ?? null
    },
  })
}

export function useExerciseScore(slug: string | undefined) {
  return useQuery({
    enabled: !!slug,
    queryKey: [...qk.scores.current(), slug ?? ''] as const,
    queryFn: async (): Promise<ExerciseScores | null> => {
      const { data, error } = await supabase
        .from('current_exercise_score')
        .select('preference_score, intensity_score')
        .eq('exercise_slug', slug!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}
