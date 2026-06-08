// Thin helpers around `supabase-js` so query/mutation hooks stay readable.
// PostgREST already throws on the network layer; we additionally unwrap
// { data, error } and throw `error` so TanStack Query treats errors uniformly.
import { supabase } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

export class DbError extends Error {
  cause: PostgrestError
  code?: string
  details?: string
  hint?: string
  constructor(error: PostgrestError) {
    super(error.message)
    this.name = 'DbError'
    this.cause = error
    this.code = error.code
    this.details = error.details ?? undefined
    this.hint = error.hint ?? undefined
  }
}

export function unwrap<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw new DbError(res.error)
  if (res.data == null) throw new Error('Empty response')
  return res.data
}

export function unwrapMaybe<T>(res: {
  data: T | null
  error: PostgrestError | null
}): T | null {
  if (res.error) throw new DbError(res.error)
  return res.data
}

export { supabase }

/** Format a local `Date` as a Postgres `date` literal (YYYY-MM-DD, no TZ). */
export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
