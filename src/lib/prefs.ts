// Local-only user preferences (audio cues, wake-lock, rest auto-advance).
// Stored in localStorage so the live session can read them synchronously.
// A future migration can promote a subset to a `user_settings` table.

import { useEffect, useState } from 'react'

export interface AppPrefs {
  audioEnabled: boolean
  restCountdownCue: boolean
  setCompleteCue: boolean
  wakeLockEnabled: boolean
  autoStartWorkAfterRest: boolean
  weightStep: number
  restStep: number
}

const KEY = 'nr:prefs:v1'

export const DEFAULT_PREFS: AppPrefs = {
  audioEnabled: true,
  restCountdownCue: true,
  setCompleteCue: true,
  wakeLockEnabled: true,
  autoStartWorkAfterRest: true,
  weightStep: 5,
  restStep: 15,
}

export function loadPrefs(): AppPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: AppPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    /* storage disabled */
  }
}

type Listener = (p: AppPrefs) => void
const listeners = new Set<Listener>()

export function usePrefs(): [AppPrefs, (next: Partial<AppPrefs>) => void] {
  const [prefs, setPrefs] = useState<AppPrefs>(() => loadPrefs())
  useEffect(() => {
    const l: Listener = (p) => setPrefs(p)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  const update = (next: Partial<AppPrefs>) => {
    const merged = { ...prefs, ...next }
    savePrefs(merged)
    setPrefs(merged)
    for (const l of listeners) l(merged)
  }
  return [prefs, update]
}
