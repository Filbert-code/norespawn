// Live-session audio cues. Plays grimdark WAV samples through WebAudio with a
// per-cue gain trim; falls back to synthesized tones if a sample fails to
// decode (e.g. unsupported codec). All cues are no-ops when audio is off.

import restEndUrl from '@/assets/sfx/restEnd.wav'
import restCountdownUrl from '@/assets/sfx/restCountdown.wav'
import setCompleteUrl from '@/assets/sfx/setComplete.wav'
import sessionDoneUrl from '@/assets/sfx/sessionDone.wav'

type CueName = 'setComplete' | 'restCountdown' | 'restEnd' | 'sessionDone'

// Per-cue volume trims (1 = sample as-recorded). ElevenLabs takes vary in
// loudness, so we balance them here rather than re-rendering the files.
const CUE_GAIN: Record<CueName, number> = {
  setComplete: 0.5, // recorded hot
  restEnd: 0.5, // recorded hot
  restCountdown: 2.0, // recorded quiet — boost
  sessionDone: 1.0,
}

const CUE_URL: Record<CueName, string> = {
  setComplete: setCompleteUrl,
  restCountdown: restCountdownUrl,
  restEnd: restEndUrl,
  sessionDone: sessionDoneUrl,
}

let ctx: AudioContext | null = null
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      // Safari
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// Decoded-buffer cache + in-flight decode promises so each file decodes once.
const buffers = new Map<CueName, AudioBuffer>()
const loading = new Map<CueName, Promise<AudioBuffer | null>>()

async function loadBuffer(name: CueName): Promise<AudioBuffer | null> {
  const c = getCtx()
  if (!c) return null
  if (buffers.has(name)) return buffers.get(name)!
  if (loading.has(name)) return loading.get(name)!
  const p = (async () => {
    try {
      const res = await fetch(CUE_URL[name])
      const arr = await res.arrayBuffer()
      const buf = await c.decodeAudioData(arr)
      buffers.set(name, buf)
      return buf
    } catch {
      return null
    }
  })()
  loading.set(name, p)
  return p
}

/** Warm the decode cache so the first cue of a session isn't delayed. */
export function preloadCues() {
  if (!getCtx()) return
  ;(Object.keys(CUE_URL) as CueName[]).forEach((n) => void loadBuffer(n))
}

function playSample(name: CueName) {
  const c = getCtx()
  if (!c) return false
  const buf = buffers.get(name)
  if (!buf) {
    // Not decoded yet — kick off the load so it's ready next time, and let
    // this trigger fall back to the synth tone.
    void loadBuffer(name)
    return false
  }
  const src = c.createBufferSource()
  src.buffer = buf
  const g = c.createGain()
  g.gain.value = CUE_GAIN[name]
  src.connect(g).connect(c.destination)
  src.start()
  return true
}

// --- Synth fallbacks (used only until the WAV is decoded / if decode fails) -
function tone(freq: number, durationMs: number, gain = 0.08, type: OscillatorType = 'sine') {
  const c = getCtx()
  if (!c) return
  const now = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(gain, now + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000)
  osc.connect(g).connect(c.destination)
  osc.start(now)
  osc.stop(now + durationMs / 1000 + 0.05)
}

const fallback: Record<CueName, () => void> = {
  setComplete() {
    tone(660, 110, 0.07, 'triangle')
    setTimeout(() => tone(880, 160, 0.07, 'triangle'), 90)
  },
  restCountdown() {
    tone(440, 60, 0.05, 'square')
  },
  restEnd() {
    tone(880, 140, 0.08, 'sawtooth')
    setTimeout(() => tone(1320, 180, 0.07, 'sawtooth'), 120)
  },
  sessionDone() {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => tone(f, 200, 0.08, 'triangle'), i * 110),
    )
  },
}

function fire(name: CueName) {
  if (!playSample(name)) fallback[name]()
}

export const cues = {
  setComplete(enabled: boolean) {
    if (enabled) fire('setComplete')
  },
  restCountdown(enabled: boolean) {
    if (enabled) fire('restCountdown')
  },
  restEnd(enabled: boolean) {
    if (enabled) fire('restEnd')
  },
  sessionDone(enabled: boolean) {
    if (enabled) fire('sessionDone')
  },
}
