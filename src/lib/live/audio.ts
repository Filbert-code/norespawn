// Tiny WebAudio cues for set/rest events. Synthesized so we don't ship audio
// assets. All cues are no-ops if Settings says audio is off.

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

export const cues = {
  setComplete(enabled: boolean) {
    if (!enabled) return
    tone(660, 110, 0.07, 'triangle')
    setTimeout(() => tone(880, 160, 0.07, 'triangle'), 90)
  },
  restCountdown(enabled: boolean) {
    if (!enabled) return
    tone(440, 60, 0.05, 'square')
  },
  restEnd(enabled: boolean) {
    if (!enabled) return
    tone(880, 140, 0.08, 'sawtooth')
    setTimeout(() => tone(1320, 180, 0.07, 'sawtooth'), 120)
  },
  sessionDone(enabled: boolean) {
    if (!enabled) return
    // Triumphant cadence.
    ;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 200, 0.08, 'triangle'), i * 110))
  },
}
