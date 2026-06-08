// Screen Wake Lock helper. The browser auto-releases the lock on tab hide;
// we re-acquire on visibility change so the screen stays awake during rests.

interface SentinelLike {
  released: boolean
  release: () => Promise<void>
  addEventListener: (
    event: 'release',
    cb: () => void,
  ) => void
}

interface WakeLockApi {
  request: (type: 'screen') => Promise<SentinelLike>
}

let sentinel: SentinelLike | null = null
let onVis: (() => void) | null = null

export async function acquireWakeLock() {
  const api = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock
  if (!api) return
  try {
    sentinel = await api.request('screen')
    sentinel.addEventListener('release', () => {
      sentinel = null
    })
    if (!onVis) {
      onVis = () => {
        if (document.visibilityState === 'visible' && sentinel === null) {
          acquireWakeLock()
        }
      }
      document.addEventListener('visibilitychange', onVis)
    }
  } catch {
    /* permission denied or unsupported */
  }
}

export async function releaseWakeLock() {
  try {
    if (sentinel && !sentinel.released) {
      await sentinel.release()
    }
  } catch {
    /* */
  }
  sentinel = null
  if (onVis) {
    document.removeEventListener('visibilitychange', onVis)
    onVis = null
  }
}
