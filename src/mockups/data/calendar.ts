// Mock calendar data for the landing-page mockup. Entries are keyed by an
// offset (in days) from "today" so the current-day highlight always lines up.

export type DayStatus = 'completed' | 'scheduled' | 'in_progress' | 'skipped'

export interface DayWorkout {
  status: DayStatus
  workoutName: string
  /** completed-only stats */
  durationMin?: number
  totalSets?: number
  effort?: number // 1-10
  bodyGroups?: string[]
}

// offset 0 = today, negative = past, positive = future
const RELATIVE: Record<number, DayWorkout> = {
  [-13]: { status: 'completed', workoutName: 'Pull Day', durationMin: 52, totalSets: 18, effort: 7, bodyGroups: ['Back', 'Arms'] },
  [-11]: { status: 'completed', workoutName: 'Leg Day', durationMin: 64, totalSets: 20, effort: 9, bodyGroups: ['Legs'] },
  [-9]: { status: 'completed', workoutName: 'Push Day', durationMin: 48, totalSets: 17, effort: 7, bodyGroups: ['Chest', 'Shoulders'] },
  [-4]: { status: 'completed', workoutName: 'Pull Day', durationMin: 55, totalSets: 19, effort: 8, bodyGroups: ['Back', 'Arms'] },
  [-3]: { status: 'completed', workoutName: 'Leg Day', durationMin: 61, totalSets: 21, effort: 9, bodyGroups: ['Legs'] },
  [-2]: { status: 'completed', workoutName: 'Push Day', durationMin: 49, totalSets: 18, effort: 7, bodyGroups: ['Chest', 'Shoulders'] },
  [-1]: { status: 'completed', workoutName: 'Arms & Core', durationMin: 38, totalSets: 14, effort: 6, bodyGroups: ['Arms', 'Core'] },
  [0]: { status: 'scheduled', workoutName: 'Chest & Shoulders' },
  [2]: { status: 'scheduled', workoutName: 'Leg Day' },
  [4]: { status: 'scheduled', workoutName: 'Pull Day' },
  [6]: { status: 'scheduled', workoutName: 'Push Day' },
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

/** Build the offset->workout map into an absolute iso-date map. */
const WORKOUTS_BY_DATE: Record<string, DayWorkout> = Object.fromEntries(
  Object.entries(RELATIVE).map(([offset, w]) => [isoDate(addDays(today, Number(offset))), w]),
)

export function workoutForDate(date: Date): DayWorkout | undefined {
  return WORKOUTS_BY_DATE[isoDate(date)]
}

/** Current discipline streak: consecutive days ending today/yesterday with a completed workout. */
export function disciplineStreak(): number {
  let streak = 0
  // allow the streak to "hold" through today even if today isn't done yet
  let cursor = workoutForDate(today)?.status === 'completed' ? today : addDays(today, -1)
  while (workoutForDate(cursor)?.status === 'completed') {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
