// Mock calendar data for the landing-page mockup. Entries are keyed by an
// offset (in days) from "today" so the current-day highlight always lines up.
//
// Mirrors the real CalendarHome data shape: each day holds an ordered *list* of
// entries (multiple workouts per day are first-class). Within a day, status
// precedence for glyphs/streaks is completed > in_progress > scheduled > missed.

export type DayStatus = 'completed' | 'scheduled' | 'in_progress' | 'skipped' | 'abandoned'

export interface DayEntry {
  key: string
  date: Date
  workoutName: string
  status: DayStatus
  /** Intra-day order. */
  position: number
  /** completed-only stats */
  durationMin?: number
  effort?: number | null
}

// offset 0 = today, negative = past, positive = future. A couple of days carry
// two entries to exercise the multi-workout-per-day UI (count badge, stacked
// detail cards, "add another workout").
type RelEntry = Omit<DayEntry, 'key' | 'date'>
const RELATIVE: Record<number, RelEntry[]> = {
  [-13]: [{ workoutName: 'Pull Day', status: 'completed', position: 0, durationMin: 52, effort: 7 }],
  [-11]: [{ workoutName: 'Leg Day', status: 'completed', position: 0, durationMin: 64, effort: 9 }],
  [-9]: [{ workoutName: 'Push Day', status: 'completed', position: 0, durationMin: 48, effort: 7 }],
  [-4]: [{ workoutName: 'Pull Day', status: 'completed', position: 0, durationMin: 55, effort: 8 }],
  [-3]: [
    { workoutName: 'Leg Day', status: 'completed', position: 0, durationMin: 61, effort: 9 },
    { workoutName: 'Core Finisher', status: 'completed', position: 1, durationMin: 16, effort: 6 },
  ],
  [-2]: [{ workoutName: 'Push Day', status: 'completed', position: 0, durationMin: 49, effort: 7 }],
  [-1]: [{ workoutName: 'Arms & Core', status: 'completed', position: 0, durationMin: 38, effort: 6 }],
  [0]: [{ workoutName: 'Chest & Shoulders', status: 'in_progress', position: 0 }],
  [2]: [
    { workoutName: 'Leg Day', status: 'scheduled', position: 0 },
    { workoutName: 'Mobility', status: 'scheduled', position: 1 },
  ],
  [4]: [{ workoutName: 'Pull Day', status: 'scheduled', position: 0 }],
  [6]: [{ workoutName: 'Push Day', status: 'scheduled', position: 0 }],
}

// ---- date helpers (local-time, date-only) ----
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Monday as the first day of the week. */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7 // Mon=0 ... Sun=6
  return addDays(d, -day)
}

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function sameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b)
}

const today = startOfToday()

/** Build the offset->entries map into an absolute iso-date map. */
const ENTRIES_BY_DATE: Record<string, DayEntry[]> = Object.fromEntries(
  Object.entries(RELATIVE).map(([offset, list]) => {
    const date = addDays(today, Number(offset))
    const key = isoDate(date)
    return [key, list.map((e, i) => ({ ...e, key: `${key}-${i}`, date }))]
  }),
)

export function entriesForDate(date: Date): DayEntry[] {
  return ENTRIES_BY_DATE[isoDate(date)] ?? []
}

/** A day counts toward the streak if *any* workout that day was completed. */
export function dayIsComplete(entries: DayEntry[]): boolean {
  return entries.some((e) => e.status === 'completed')
}

/** Current discipline streak: consecutive days ending today/yesterday with a completed workout. */
export function disciplineStreak(): number {
  let streak = 0
  // allow the streak to "hold" through today even if today isn't done yet
  let cursor = dayIsComplete(entriesForDate(today)) ? today : addDays(today, -1)
  while (dayIsComplete(entriesForDate(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

// ---- Quick Start plans (for the "Start a Workout" sheet) ----
export interface MockPlan {
  id: string
  name: string
  exerciseCount: number
  timesPerformed: number
}

export const MOCK_PLANS: MockPlan[] = [
  { id: 'push', name: 'Push Day', exerciseCount: 6, timesPerformed: 12 },
  { id: 'pull', name: 'Pull Day', exerciseCount: 6, timesPerformed: 11 },
  { id: 'legs', name: 'Leg Day', exerciseCount: 5, timesPerformed: 9 },
  { id: 'arms', name: 'Arms & Core', exerciseCount: 5, timesPerformed: 4 },
]

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
