import { useQuery } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/db'
import { qk } from '@/lib/queries/keys'
import type {
  BodyGroup,
  BodySubGroup,
  Exercise,
  UserExerciseDefault,
  UserExerciseLastPerformed,
  UserLastPlanRest,
} from '@/lib/supabase'

// ----------------------------------------------------------------------------
// Catalog reads — body groups, sub-groups, and exercises.
// All of these are public read (RLS allows authenticated reads on lookup tables
// and the unscoped `exercise` catalog).
// ----------------------------------------------------------------------------

export function useBodyGroups() {
  return useQuery({
    queryKey: qk.exercises.bodyGroups(),
    queryFn: async () => {
      const groups = unwrap(
        await supabase.from('body_group').select('*').order('sort_order'),
      ) as BodyGroup[]
      const subs = unwrap(
        await supabase.from('body_sub_group').select('*').order('sort_order'),
      ) as BodySubGroup[]
      return { groups, subs }
    },
    staleTime: 30 * 60 * 1000, // taxonomies barely change
  })
}

export function useExercises() {
  return useQuery({
    queryKey: qk.exercises.list(),
    queryFn: async () => {
      const rows = unwrap(
        await supabase
          .from('exercise')
          .select('*')
          .eq('is_archived', false)
          .order('name'),
      ) as Exercise[]
      return rows
    },
    staleTime: 15 * 60 * 1000,
  })
}

export function useExerciseBySlug(slug: string | undefined) {
  return useQuery({
    enabled: !!slug,
    queryKey: qk.exercises.detail(slug ?? ''),
    queryFn: async () => {
      const row = unwrap(
        await supabase.from('exercise').select('*').eq('slug', slug!).single(),
      ) as Exercise
      return row
    },
  })
}

/** Last-performed read (per signed-in user, via RLS-aware view). */
export function useLastPerformed() {
  return useQuery({
    queryKey: qk.exercises.lastPerformed(),
    queryFn: async () => {
      const rows = unwrap(
        await supabase.from('user_exercise_last_performed').select('*'),
      ) as UserExerciseLastPerformed[]
      return rows
    },
  })
}

export interface ExerciseDefault {
  sets: number | null
  reps: number | null
  weight_lbs: number | null
  duration_seconds: number | null
  /** 'plan' | 'session' — where the most-recent value came from. */
  source: string | null
}

/**
 * Per-exercise "smart defaults" for the planning phase: the user's own most
 * recent sets/reps/weight/duration for each exercise, taking whichever is
 * newer between the last plan they built and the top set of their last live
 * session. Returned as a slug -> values map for O(1) seeding lookups.
 */
export function useExerciseDefaults() {
  return useQuery({
    queryKey: qk.exercises.defaults(),
    queryFn: async () => {
      const rows = unwrap(
        await supabase.from('user_exercise_default').select('*'),
      ) as UserExerciseDefault[]
      const map = new Map<string, ExerciseDefault>()
      for (const r of rows) {
        if (!r.exercise_slug) continue
        map.set(r.exercise_slug, {
          sets: r.sets,
          reps: r.reps,
          weight_lbs: r.weight_lbs != null ? Number(r.weight_lbs) : null,
          duration_seconds: r.duration_seconds,
          source: r.source,
        })
      }
      return map
    },
  })
}

/** Rest timers from the user's most recently touched plan (plan-level seed). */
export function useLastPlanRest() {
  return useQuery({
    queryKey: qk.exercises.lastPlanRest(),
    queryFn: async (): Promise<UserLastPlanRest | null> => {
      const { data, error } = await supabase
        .from('user_last_plan_rest')
        .select('*')
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

// ----------------------------------------------------------------------------
// Helpers for grouping exercises in the builder. Operate on the rows returned
// by useExercises so consumers don't need to re-query.
// ----------------------------------------------------------------------------
export function exercisesByGroup(
  rows: Exercise[],
  groupSlug: string,
): Exercise[] {
  return rows.filter((e) => e.body_group_slug === groupSlug)
}

export function subGroupSlugsForGroup(
  rows: Exercise[],
  groupSlug: string,
): string[] {
  const seen: string[] = []
  for (const e of exercisesByGroup(rows, groupSlug)) {
    const sub = e.body_sub_group_slug
    if (sub && !seen.includes(sub)) seen.push(sub)
  }
  return seen
}
