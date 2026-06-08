import { useQuery } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/db'
import { qk } from '@/lib/queries/keys'
import type {
  BodyGroup,
  BodySubGroup,
  Exercise,
  UserExerciseLastPerformed,
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
