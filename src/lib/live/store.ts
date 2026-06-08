// Local-first persistence for the active workout session.
// The DB is the source of truth for *what happened* (session_set rows,
// session_event log). localStorage is the source of truth for *what's
// happening right now* — exercise/set cursor, timers, transient editor
// state — so reload/lock-screen never lose progress (D5/D13).

const ACTIVE_KEY = 'nr:live:active'
const STATE_PREFIX = 'nr:live:state:'

export interface LiveCursor {
  exIndex: number
  currentSet: number
  // 'work' | 'rest' | 'transition' | 'done'
  phase: 'work' | 'rest' | 'transition' | 'done'
  running: boolean
  sessionStartedAt: number
  // Wall-clock pause bookkeeping so timers survive reload.
  pausedMs: number
  lastTickAt: number
  workStartedAt: number | null
  restTarget: number
  restStartedAt: number | null
  // Latest stepper values for the active set.
  reps: number
  weight: number
  // Anything the user edited mid-session that should bubble to "Save to plan?".
  planEdited: boolean
  // Plan-row reorderings/swaps applied to upcoming exercises (positions only).
  // We persist these so the cursor survives a reload before the next set.
  // The real plan_exercise -> session_exercise mapping lives in the DB.
  // We keep a per-exercise edit log of {id, sets, reps, weight, rest} overrides
  // applied on top of the DB snapshot for upcoming exercises.
  overrides: Record<string, ExerciseOverride>
}

export interface ExerciseOverride {
  reps?: number
  weight?: number
  rest?: number
  sets?: number
}

export interface LiveSessionState extends LiveCursor {
  sessionId: string
  schemaVersion: 1
}

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function setActiveSessionId(id: string | null) {
  try {
    if (id === null) localStorage.removeItem(ACTIVE_KEY)
    else localStorage.setItem(ACTIVE_KEY, id)
  } catch {
    /* storage disabled */
  }
}

export function loadLiveState(sessionId: string): LiveSessionState | null {
  try {
    const raw = localStorage.getItem(STATE_PREFIX + sessionId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LiveSessionState
    if (parsed.schemaVersion !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function saveLiveState(state: LiveSessionState) {
  try {
    localStorage.setItem(STATE_PREFIX + state.sessionId, JSON.stringify(state))
  } catch {
    /* storage disabled */
  }
}

export function clearLiveState(sessionId: string) {
  try {
    localStorage.removeItem(STATE_PREFIX + sessionId)
  } catch {
    /* */
  }
}

export function initialCursor(): Omit<LiveCursor, 'reps' | 'weight' | 'restTarget'> {
  const now = Date.now()
  return {
    exIndex: 0,
    currentSet: 0,
    phase: 'work',
    running: true,
    sessionStartedAt: now,
    pausedMs: 0,
    lastTickAt: now,
    workStartedAt: now,
    restStartedAt: null,
    planEdited: false,
    overrides: {},
  }
}
