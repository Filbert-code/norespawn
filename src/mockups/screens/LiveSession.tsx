import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsRight,
  Hand,
  Heart,
  Hourglass,
  Lock,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat2,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkullGlyph } from '@/components/SkullGlyph'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { AshField } from '@/mockups/components/AshField'
import { PlanSheet, PlanSheetRow } from '@/mockups/components/PlanSheet'
import {
  BODY_GROUPS,
  EXERCISES,
  EXERCISES_BY_GROUP,
  subGroupsForGroup,
  type MockExercise,
} from '@/mockups/data/exercises'
import bgArt from '@/mockups/assets/live-session-bg.png'
import ctrlPauseArt from '@/mockups/assets/ctrl_pause.webp'
import ctrlAddsetArt from '@/mockups/assets/ctrl_addset.webp'
import stepRepsArt from '@/mockups/assets/step_reps.webp'
import cardWeightArt from '@/mockups/assets/card_weight.webp'
import exerciseBanner from '@/assets/ui/exercise_banner.webp'
import planPlate from '@/assets/ui/plan_plate.webp'
import planPlatePressed from '@/assets/ui/plan_plate_pressed.webp'

// Decorative generated frame applied via CSS border-image: the ornate corners
// stay crisp while the rails stretch to any element size (no warping). `fill`
// also paints the art's dark center slice (used by the stat cards); buttons
// leave it off so their own tint/hover background shows through the middle.
function ArtFrame({ src, width, fill = false }: { src: string; width: string; fill?: boolean }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        borderStyle: 'solid',
        borderWidth: width,
        borderImageSource: `url(${src})`,
        borderImageSlice: fill ? '20% fill' : '20%',
        borderImageRepeat: 'stretch',
      }}
    />
  )
}

// ============================================================================
// The live workout = editable list of session_exercise rows (stable ids),
// each a plan snapshot + a `last` (user_exercise_last_performed) for hints.
// ============================================================================
interface PlanItem {
  id: string
  slug: string
  name: string
  bodyGroup: string
  subGroup: string
  sets: number
  reps: number
  weight: number
  rest: number
  last?: { reps: number; weight: number }
}

let idSeq = 0
const newId = () => `ex_${++idSeq}`

function fromCatalog(e: MockExercise, last?: { reps: number; weight: number }): PlanItem {
  return {
    id: newId(),
    slug: e.slug,
    name: e.name,
    bodyGroup: e.bodyGroup,
    subGroup: e.subGroup,
    sets: e.defaultSets,
    reps: e.defaultReps ?? 12,
    weight: e.defaultWeightLbs ?? 0,
    rest: 60,
    last,
  }
}

const bySlug = (slug: string) => EXERCISES.find((e) => e.slug === slug)!

const INITIAL_PLAN: PlanItem[] = [
  { ...fromCatalog(bySlug('incline_dumbbell_press'), { reps: 8, weight: 65 }), sets: 4, reps: 10, weight: 65, rest: 45 },
  { ...fromCatalog(bySlug('barbell_bench_press'), { reps: 8, weight: 130 }), sets: 4, reps: 8, weight: 135, rest: 60 },
  { ...fromCatalog(bySlug('cable_fly'), { reps: 12, weight: 22.5 }), sets: 3, reps: 12, weight: 25, rest: 45 },
  { ...fromCatalog(bySlug('barbell_overhead_press'), { reps: 8, weight: 75 }), name: 'Overhead Press', sets: 3, reps: 8, weight: 75, rest: 60 },
  { ...fromCatalog(bySlug('tricep_pushdown'), { reps: 14, weight: 50 }), name: 'Triceps Pushdown', sets: 3, reps: 12, weight: 50, rest: 30 },
]

/** Alternatives via the (mock) relationship graph: same sub-group, else same body group. */
function alternativesFor(item: PlanItem): MockExercise[] {
  const sub = EXERCISES.filter((e) => e.subGroup === item.subGroup && e.slug !== item.slug)
  const grp = EXERCISES.filter((e) => e.bodyGroup === item.bodyGroup && e.subGroup !== item.subGroup)
  return [...sub, ...grp]
}

type Phase = 'work' | 'rest' | 'transition' | 'done'
type SetState = 'completed' | 'skipped' | 'active' | 'upcoming'
interface SetRecord {
  ex: number
  set: number
  reps: number
  weight: number
  skipped: boolean
  rpe?: number
}

type PickerMode = { kind: 'add' } | { kind: 'swap'; index: number }

// ----- ring geometry -----
const C = 110
const R = 92
function polar(angleDeg: number, r = R) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
}
function arcPath(start: number, end: number) {
  const s = polar(start)
  const e = polar(end)
  const large = end - start <= 180 ? 0 : 1
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`
}

function QuadrantRing({
  sets,
  progress,
  children,
  onTap,
  ariaLabel,
}: {
  sets: SetState[]
  progress: number
  children: React.ReactNode
  onTap: () => void
  ariaLabel: string
}) {
  const n = Math.max(sets.length, 1)
  const span = 360 / n
  const halfGap = Math.min(13, 52 / n)
  const arcs = sets.map((_, i) => ({ start: i * span + halfGap, end: (i + 1) * span - halfGap }))
  const bossAngles = sets.map((_, i) => i * span)

  return (
    <button
      onClick={onTap}
      aria-label={ariaLabel}
      className="group relative aspect-square w-full max-w-[270px] cursor-pointer rounded-full transition-transform active:scale-[0.97]"
    >
      <span className="absolute inset-2 rounded-full bg-nr-crimson/5 opacity-0 transition-opacity group-hover:opacity-100" />

      <svg viewBox="0 0 220 220" className="size-full">
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(176,141,87,0.10)" strokeWidth={16} />
        {arcs.map((arc, i) => {
          const state = sets[i]
          const arcSpan = arc.end - arc.start
          const baseStroke =
            state === 'completed'
              ? '#b91c1c'
              : state === 'skipped'
                ? 'rgba(176,141,87,0.35)'
                : 'rgba(176,141,87,0.18)'
          return (
            <g key={i}>
              <path
                d={arcPath(arc.start, arc.end)}
                fill="none"
                strokeLinecap="round"
                strokeWidth={14}
                stroke={baseStroke}
                strokeDasharray={state === 'skipped' ? '2 6' : undefined}
                style={
                  state === 'completed'
                    ? { filter: 'drop-shadow(0 0 5px rgba(185,28,28,0.65))' }
                    : undefined
                }
              />
              {state === 'active' && progress > 0.01 && (
                <path
                  d={arcPath(arc.start, arc.start + arcSpan * Math.min(progress, 1))}
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth={14}
                  stroke="#ef4444"
                  style={{ filter: 'drop-shadow(0 0 7px rgba(239,68,68,0.9))' }}
                />
              )}
            </g>
          )
        })}
      </svg>

      {bossAngles.map((ang) => {
        const p = polar(ang)
        return (
          <span
            key={ang}
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(p.x / 220) * 100}%`, top: `${(p.y / 220) * 100}%` }}
          >
            <SkullGlyph className="size-full" />
          </span>
        )
      })}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </button>
  )
}

function fmt(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
function fmtLong(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function LiveSession() {
  const navigate = useNavigate()
  const [running, setRunning] = useState(true)
  const [sessionSeconds, setSessionSeconds] = useState(0)

  const [exIndex, setExIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(0)
  const [phase, setPhase] = useState<Phase>('work')
  const [workElapsed, setWorkElapsed] = useState(0)
  const [restTarget, setRestTarget] = useState(INITIAL_PLAN[0].rest)
  const [restRemaining, setRestRemaining] = useState(INITIAL_PLAN[0].rest)

  const [plan, setPlan] = useState<PlanItem[]>(INITIAL_PLAN)
  const [reps, setReps] = useState(INITIAL_PLAN[0].reps)
  const [weight, setWeight] = useState(INITIAL_PLAN[0].weight)

  const [history, setHistory] = useState<SetRecord[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [showQueue, setShowQueue] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [picker, setPicker] = useState<PickerMode | null>(null)
  const [planEdited, setPlanEdited] = useState(false)

  const toastTimer = useRef<number | null>(null)

  const ex = plan[exIndex]
  const next = plan[exIndex + 1]
  const setsCount = ex.sets

  // master tick
  useEffect(() => {
    if (!running || phase === 'done') return
    const id = window.setInterval(() => {
      setSessionSeconds((s) => s + 1)
      if (phase === 'work') setWorkElapsed((e) => e + 1)
      if (phase === 'rest') setRestRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [running, phase])

  // rest finished -> auto-start the work timer for the next set
  useEffect(() => {
    if (phase === 'rest' && restRemaining === 0) {
      setPhase('work')
      setWorkElapsed(0)
    }
  }, [phase, restRemaining])

  function flash(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }

  function recordSet(skipped: boolean) {
    setHistory((h) => [...h, { ex: exIndex, set: currentSet, reps, weight, skipped }])
  }

  // D2: optional 1-tap RPE on the set we just finished (last history row).
  function rateLastSet(v: number) {
    setHistory((h) => {
      if (h.length === 0) return h
      const copy = [...h]
      const i = copy.length - 1
      copy[i] = { ...copy[i], rpe: copy[i].rpe === v ? undefined : v }
      return copy
    })
  }

  function advanceAfterSet(skipped: boolean) {
    recordSet(skipped)
    const wasLast = currentSet + 1 >= setsCount
    if (wasLast) {
      // exercise finished
      if (exIndex + 1 >= plan.length) setPhase('done')
      else setPhase('transition')
      return
    }
    // more sets -> rest, charge toward the next set
    const remaining = setsCount - (currentSet + 1)
    if (!skipped && (weight !== ex.weight || reps !== ex.reps)) {
      const what = weight !== ex.weight ? `${weight} lb` : `${reps} reps`
      setSuggestion(`Carry ${what} to your ${remaining} remaining set${remaining > 1 ? 's' : ''}?`)
    }
    setCurrentSet((c) => c + 1)
    setRestTarget(ex.rest)
    setRestRemaining(ex.rest)
    setPhase('rest')
  }

  function beginNextExercise() {
    const ni = exIndex + 1
    if (ni >= plan.length) {
      setPhase('done')
      return
    }
    const nx = plan[ni]
    setExIndex(ni)
    setCurrentSet(0)
    setReps(nx.reps)
    setWeight(nx.weight)
    setRestTarget(nx.rest)
    setRestRemaining(nx.rest)
    setWorkElapsed(0)
    setSuggestion(null)
    setPhase('work')
  }

  // ----- structural edits (only allowed on UPCOMING exercises) -----
  function removeExercise(i: number) {
    setPlan((p) => p.filter((_, idx) => idx !== i))
    setPlanEdited(true)
    flash('Exercise removed')
  }
  function moveExercise(i: number, dir: -1 | 1) {
    const j = i + dir
    setPlan((p) => {
      if (j <= exIndex || j >= p.length) return p
      const copy = [...p]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
    setPlanEdited(true)
  }
  function addExercise(e: MockExercise) {
    setPlan((p) => [...p, fromCatalog(e)])
    setPlanEdited(true)
    setPicker(null)
    flash(`Added ${e.name}`)
  }
  function swapExercise(i: number, e: MockExercise) {
    setPlan((p) => p.map((it, idx) => (idx === i ? { ...fromCatalog(e), id: it.id } : it)))
    setPlanEdited(true)
    setPicker(null)
    flash(`Swapped to ${e.name}`)
  }

  function tapRing() {
    if (phase === 'work') advanceAfterSet(false)
    else if (phase === 'rest') {
      setPhase('work')
      setWorkElapsed(0)
    } else if (phase === 'transition') beginNextExercise()
  }

  function skipSet() {
    if (phase === 'transition' || phase === 'done') return
    setSuggestion(null)
    advanceAfterSet(true)
    flash('Set skipped')
  }

  // segment states for current exercise's ring
  const sets: SetState[] = Array.from({ length: setsCount }, (_, i) => {
    const rec = history.find((h) => h.ex === exIndex && h.set === i)
    if (rec) return rec.skipped ? 'skipped' : 'completed'
    if (phase === 'transition') return 'completed'
    return i === currentSet ? 'active' : 'upcoming'
  })
  const progress = phase === 'rest' ? (restTarget - restRemaining) / restTarget : phase === 'work' ? 1 : 1

  const currentExerciseSets = history.filter((h) => h.ex === exIndex)
  const totalSetsDone = history.filter((h) => !h.skipped).length
  const lastRecord = history[history.length - 1]

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col overflow-hidden bg-nr-black">
        <img
          src={bgArt}
          alt=""
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(127,29,29,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-nr-black/40 via-nr-black/25 to-nr-black/85" />
        <AshField count={28} emberChance={0.3} />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.8)]" />

        {phase === 'done' ? (
          <Summary
            seconds={sessionSeconds}
            plan={plan}
            totalSetsDone={totalSetsDone}
            skipped={history.filter((h) => h.skipped).length}
            history={history}
            planEdited={planEdited}
          />
        ) : (
          <>
            {/* ---- header ---- */}
            <header className="relative px-4 pt-9">
              <div className="flex items-center justify-between text-nr-bronze/70">
                <span className="font-heading text-[10px] uppercase tracking-[0.25em]">
                  Exercise {exIndex + 1} / {plan.length}
                </span>
                <span className="font-heading text-[10px] tracking-[0.2em]">{fmtLong(sessionSeconds)}</span>
                <button
                  onClick={() => setShowQueue(true)}
                  className="group relative flex items-center justify-center px-7 py-3.5 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                >
                  <span
                    aria-hidden
                    style={{ backgroundImage: `url(${planPlate})` }}
                    className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat group-active:opacity-0"
                  />
                  <span
                    aria-hidden
                    style={{ backgroundImage: `url(${planPlatePressed})` }}
                    className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat opacity-0 group-active:opacity-100"
                  />
                  <span className="relative transition-transform group-active:translate-y-px">Plan</span>
                </button>
              </div>
              {/* overall progress */}
              <div className="mt-2 flex gap-1">
                {plan.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full',
                      i < exIndex ? 'bg-nr-crimson' : i === exIndex ? 'bg-nr-ember' : 'bg-nr-bone/15',
                    )}
                  />
                ))}
              </div>
              {/* D13: local-first persistence — every set is saved on-device instantly */}
              <div className="mt-1.5 flex items-center justify-center gap-1 text-[8px] uppercase tracking-[0.25em] text-nr-bronze/55">
                <Check className="size-2.5" /> Saved locally
              </div>
              <div className="relative mx-auto mt-1 aspect-[1000/318] w-full">
                <img
                  src={exerciseBanner}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 size-full select-none object-contain"
                />
                <div className="absolute inset-0 flex -translate-y-1 flex-col items-center justify-center px-[18%] pt-[9%] text-center">
                  <button
                    onClick={() => navigate('/mockups/exercise')}
                    className="line-clamp-2 font-heading text-base font-bold uppercase leading-none tracking-wide text-[#241910] transition-colors hover:text-nr-crimson"
                  >
                    {ex.name}
                  </button>
                </div>
              </div>
            </header>

            {/* ---- ring ---- */}
            <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-16">
              <QuadrantRing
                sets={sets}
                progress={progress}
                onTap={tapRing}
                ariaLabel={
                  phase === 'work' ? 'Tap when set done' : phase === 'rest' ? 'Tap to start now' : 'Tap to begin'
                }
              >
                {phase === 'transition' ? (
                  <>
                    <Check className="mb-1 size-9 text-nr-crimson" strokeWidth={2.5} />
                    <span className="font-heading text-xs uppercase tracking-[0.3em] text-nr-bone/55">
                      Exercise Done
                    </span>
                    <span className="mt-1 px-6 text-[11px] uppercase leading-tight tracking-wider text-nr-bone/70">
                      Next · {next?.name}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-heading text-xs uppercase tracking-[0.3em] text-nr-bone/55">
                      {phase === 'work' ? `Set ${currentSet + 1} / ${setsCount}` : 'Rest'}
                    </span>
                    <span className="font-heading text-6xl font-bold leading-none tabular-nums text-nr-bone">
                      {phase === 'work' ? fmt(workElapsed) : fmt(restRemaining)}
                    </span>
                  </>
                )}
                <span
                  className={cn(
                    'mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.2em]',
                    phase === 'work' ? 'text-nr-ember' : 'text-nr-bronze',
                  )}
                >
                  <Hand className="size-3" />
                  {phase === 'work' ? 'Tap when done' : phase === 'rest' ? 'Tap to start now' : 'Tap to begin'}
                </span>
              </QuadrantRing>

              {/* completed-set recap for this exercise */}
              {currentExerciseSets.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  {currentExerciseSets.map((s, i) => (
                    <span
                      key={i}
                      className={cn(
                        'rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-wider',
                        s.skipped
                          ? 'border-nr-bronze/30 text-nr-bone/40'
                          : 'border-nr-crimson/40 text-nr-bone/70',
                      )}
                    >
                      {s.skipped
                        ? `S${s.set + 1} skip`
                        : `${s.reps}×${s.weight}${s.rpe ? ` · @${s.rpe}` : ''}`}
                    </span>
                  ))}
                </div>
              )}

              {/* stat tiles (work/rest only) */}
              {phase !== 'transition' && (
                <div className="mt-7 grid w-full max-w-[300px] grid-cols-2 gap-2">
                  <StatTile label="Reps" value={reps} planned={ex.reps} art={cardWeightArt} />
                  <StatTile label="Weight" value={weight} unit="lb" planned={ex.weight} art={cardWeightArt} />
                </div>
              )}
            </div>

            {/* ---- smart suggestion (during rest) ---- */}
            {phase === 'rest' && suggestion && (
              <div className="relative mx-4 mb-2 flex items-center gap-2 border border-nr-ember/40 bg-nr-crimson/10 px-3 py-2 clip-bevel-sm">
                <SkullGlyph className="size-4 shrink-0" />
                <p className="flex-1 text-[11px] leading-tight text-nr-bone/85">{suggestion}</p>
                <button
                  onClick={() => {
                    flash('Applied to remaining sets')
                    setSuggestion(null)
                  }}
                  className="rounded-sm bg-nr-crimson px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
                >
                  Apply
                </button>
                <button
                  onClick={() => setSuggestion(null)}
                  className="text-nr-bone/40 hover:text-nr-bone"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* D2: optional 1-tap RPE for the set just finished */}
            {phase === 'rest' && lastRecord && !lastRecord.skipped && (
              <div className="clip-bevel-sm relative mx-4 mb-2 border border-nr-bronze/30 bg-nr-black/40 px-3 py-2">
                <p className="mb-1.5 text-center text-[9px] uppercase tracking-[0.25em] text-nr-bone/45">
                  Rate that set · effort
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                    <button
                      key={v}
                      onClick={() => rateLastSet(v)}
                      className={cn(
                        'h-7 flex-1 rounded-sm border font-heading text-[11px] tabular-nums transition-colors',
                        lastRecord.rpe === v
                          ? 'border-nr-ember bg-nr-crimson text-nr-bone'
                          : 'border-nr-bronze/30 text-nr-bone/55 hover:border-nr-bronze hover:text-nr-bone',
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* transient toast (no "logged" word) */}
            <div className="relative flex h-5 items-center justify-center">
              {toast && (
                <p className="text-[10px] uppercase tracking-widest text-nr-bronze/80">{toast}</p>
              )}
            </div>

            {/* ---- controls ---- */}
            <div className="relative border-t border-nr-bronze/25 bg-nr-black/60 px-3 pb-7 pt-3 backdrop-blur-sm">
              <div className="mb-2 grid grid-cols-3 gap-2">
                <CtrlButton
                  onClick={() => {
                    setRunning((r) => !r)
                    flash(running ? 'Paused' : 'Resumed')
                  }}
                  icon={running ? <Pause className="size-5" /> : <Play className="size-5" />}
                  label={running ? 'Pause' : 'Resume'}
                  art={ctrlPauseArt}
                  tone="primary"
                />
                <CtrlButton
                  onClick={() => {
                    setPlan((p) => p.map((it, i) => (i === exIndex ? { ...it, sets: it.sets + 1 } : it)))
                    flash('Set added')
                  }}
                  icon={<Plus className="size-5" />}
                  label="Add Set"
                  art={ctrlAddsetArt}
                />
                <CtrlButton onClick={skipSet} icon={<ChevronsRight className="size-5" />} label="Skip Set" art={ctrlAddsetArt} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stepper label="Reps" art={stepRepsArt} onDec={() => { setReps((r) => Math.max(0, r - 1)); flash(`Reps → ${Math.max(0, reps - 1)}`) }} onInc={() => { setReps((r) => r + 1); flash(`Reps → ${reps + 1}`) }} />
                <Stepper label="Weight" art={stepRepsArt} onDec={() => { setWeight((w) => Math.max(0, w - 5)); flash(`Weight → ${Math.max(0, weight - 5)} lb`) }} onInc={() => { setWeight((w) => w + 5); flash(`Weight → ${weight + 5} lb`) }} />
                <Stepper
                  label="Rest"
                  art={stepRepsArt}
                  icon={<Hourglass className="size-4" />}
                  onDec={() => { setRestTarget((t) => Math.max(15, t - 15)); setRestRemaining((r) => Math.max(0, r - 15)); flash('Rest −15s') }}
                  onInc={() => { setRestTarget((t) => t + 15); setRestRemaining((r) => r + 15); flash('Rest +15s') }}
                />
              </div>
            </div>
          </>
        )}

        {/* pause overlay */}
        {!running && phase !== 'done' && (
          <button
            onClick={() => setRunning(true)}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-nr-black/80 backdrop-blur-sm"
          >
            <Pause className="size-12 text-nr-bronze" />
            <span className="font-heading text-2xl uppercase tracking-[0.3em] text-nr-bone">Paused</span>
            <span className="text-[10px] uppercase tracking-widest text-nr-bone/50">Tap to resume</span>
          </button>
        )}

        {/* full workout queue sheet */}
        {showQueue && (
          <PlanSheet
            title="The Plan"
            subtitle="Completed & current locked · edit upcoming"
            onClose={() => setShowQueue(false)}
            footer={
              <button
                onClick={() => setPicker({ kind: 'add' })}
                className="clip-bevel-sm mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-nr-bronze/40 py-2.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-crimson"
              >
                <Plus className="size-4" /> Add Exercise
              </button>
            }
          >
            <ul className="space-y-2">
              {plan.map((w, i) => {
                const done = i < exIndex
                const cur = i === exIndex
                const upcoming = i > exIndex
                const doneSets = history.filter((h) => h.ex === i && !h.skipped).length
                return (
                  <PlanSheetRow
                    key={w.id}
                    highlight={cur}
                    name={w.name}
                    meta={`${w.subGroup} · ${w.sets}×${w.reps} @ ${w.weight}lb`}
                    badge={
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                          done
                            ? 'border-nr-crimson bg-nr-crimson text-nr-bone'
                            : cur
                              ? 'border-nr-ember text-nr-ember'
                              : 'border-nr-bronze/40 text-nr-bone/50',
                        )}
                      >
                        {done ? <Check className="size-4" /> : i + 1}
                      </span>
                    }
                    trailing={
                      upcoming ? (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <IconBtn onClick={() => moveExercise(i, -1)} disabled={i <= exIndex + 1}>
                            <ArrowUp className="size-3.5" />
                          </IconBtn>
                          <IconBtn onClick={() => moveExercise(i, 1)} disabled={i >= plan.length - 1}>
                            <ArrowDown className="size-3.5" />
                          </IconBtn>
                          <IconBtn onClick={() => setPicker({ kind: 'swap', index: i })}>
                            <Repeat2 className="size-3.5" />
                          </IconBtn>
                          <IconBtn onClick={() => removeExercise(i)} danger>
                            <Trash2 className="size-3.5" />
                          </IconBtn>
                        </div>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-widest text-nr-bone/40">
                          {done ? 'done' : `${doneSets}/${w.sets}`}
                          <Lock className="size-3 text-nr-bone/25" />
                        </span>
                      )
                    }
                  />
                )
              })}
            </ul>
          </PlanSheet>
        )}

        {/* exercise picker (add / swap) */}
        {picker && (
          <ExercisePicker
            mode={picker}
            current={picker.kind === 'swap' ? plan[picker.index] : undefined}
            onPick={(e) => (picker.kind === 'add' ? addExercise(e) : swapExercise(picker.index, e))}
            onClose={() => setPicker(null)}
          />
        )}
      </div>
    </PhoneFrame>
  )
}

function Summary({
  seconds,
  plan,
  totalSetsDone,
  skipped,
  history,
  planEdited,
}: {
  seconds: number
  plan: PlanItem[]
  totalSetsDone: number
  skipped: number
  history: SetRecord[]
  planEdited: boolean
}) {
  const navigate = useNavigate()
  const volume = history.filter((h) => !h.skipped).reduce((sum, h) => sum + h.reps * h.weight, 0)
  const [planChoice, setPlanChoice] = useState<'plan' | 'today' | null>(null)
  const [effort, setEffort] = useState<number | null>(null)
  // D3: post-session preference nudge per exercise actually performed.
  const [ratings, setRatings] = useState<Record<number, 1 | 0 | -1>>({})

  const performed = Array.from(new Set(history.filter((h) => !h.skipped).map((h) => h.ex))).map(
    (i) => ({ i, name: plan[i]?.name ?? `Exercise ${i + 1}` }),
  )

  return (
    <div className="relative flex h-full flex-col items-center overflow-y-auto px-6 py-9 text-center">
      <Trophy className="size-14 text-nr-bronze" strokeWidth={1.5} />
      <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.15em] text-nr-bone">
        Victory
      </h1>
      <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-nr-bronze">Session complete</p>

      <div className="mt-5 grid w-full max-w-[320px] grid-cols-2 gap-2">
        <SumTile label="Time" value={fmtLong(seconds)} />
        <SumTile label="Exercises" value={String(plan.length)} />
        <SumTile label="Sets Done" value={String(totalSetsDone)} />
        <SumTile label="Volume" value={`${volume.toLocaleString()} lb`} />
      </div>
      {skipped > 0 && (
        <p className="mt-2.5 text-[10px] uppercase tracking-widest text-nr-bone/40">{skipped} set(s) skipped</p>
      )}

      {/* D2: overall perceived effort for the whole session */}
      <div className="clip-bevel-sm mt-5 w-full max-w-[320px] border border-nr-bronze/30 bg-nr-gunmetal/40 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-nr-bone/55">
          How hard was today?
        </p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <button
              key={v}
              onClick={() => setEffort((e) => (e === v ? null : v))}
              className={cn(
                'h-7 flex-1 rounded-sm border font-heading text-[11px] tabular-nums transition-colors',
                effort === v
                  ? 'border-nr-ember bg-nr-crimson text-nr-bone'
                  : 'border-nr-bronze/30 text-nr-bone/55 hover:border-nr-bronze hover:text-nr-bone',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* D3: rate today's lifts — quick preference nudge feeds user_exercise_score */}
      {performed.length > 0 && (
        <div className="clip-bevel-sm mt-3 w-full max-w-[320px] border border-nr-bronze/30 bg-nr-gunmetal/40 p-3 text-left">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-nr-bone/55">
            <Heart className="size-3.5 text-nr-ember" /> Rate today's lifts
          </p>
          <ul className="space-y-1.5">
            {performed.map(({ i, name }) => (
              <li key={i} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-heading text-[12px] uppercase tracking-wide text-nr-bone/85">
                  {name}
                </span>
                <div className="flex shrink-0 gap-1">
                  <RateBtn
                    active={ratings[i] === -1}
                    onClick={() => setRatings((r) => ({ ...r, [i]: r[i] === -1 ? 0 : -1 }))}
                  >
                    <ThumbsDown className="size-3.5" />
                  </RateBtn>
                  <RateBtn
                    active={ratings[i] === 1}
                    onClick={() => setRatings((r) => ({ ...r, [i]: r[i] === 1 ? 0 : 1 }))}
                    up
                  >
                    <ThumbsUp className="size-3.5" />
                  </RateBtn>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* opt-in: propagate this session's structural edits back to the plan */}
      {planEdited && (
        <div className="mt-3 w-full max-w-[320px] border border-nr-bronze/30 bg-nr-gunmetal/50 p-3 clip-bevel-sm">
          {planChoice === null ? (
            <>
              <p className="text-[11px] leading-tight text-nr-bone/75">
                You changed today's workout. Save these changes to your saved plan?
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={() => setPlanChoice('plan')}
                  className="clip-bevel-sm flex-1 bg-nr-crimson py-2 font-heading text-[11px] font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
                >
                  Save to Plan
                </button>
                <button
                  onClick={() => setPlanChoice('today')}
                  className="clip-bevel-sm flex-1 border border-nr-bronze/40 py-2 font-heading text-[11px] font-semibold uppercase tracking-widest text-nr-bronze hover:text-nr-bone"
                >
                  Just Today
                </button>
              </div>
            </>
          ) : (
            <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest text-nr-bone/70">
              <Check className="size-3.5 text-nr-crimson" />
              {planChoice === 'plan' ? 'Plan updated' : 'Kept for today only'}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => navigate('/mockups/calendar')}
        className="clip-bevel mt-5 w-full max-w-[320px] shrink-0 bg-nr-crimson py-3 font-heading text-base font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
      >
        Finish &amp; Save
      </button>
    </div>
  )
}

function RateBtn({
  children,
  active,
  up,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  up?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-sm border transition-colors',
        active
          ? up
            ? 'border-nr-ember bg-nr-crimson text-nr-bone'
            : 'border-nr-bronze/60 bg-nr-bronze/20 text-nr-bone'
          : 'border-nr-bronze/30 text-nr-bone/50 hover:text-nr-bone',
      )}
    >
      {children}
    </button>
  )
}

function SumTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="clip-bevel-sm border border-nr-bronze/25 bg-nr-gunmetal/50 px-2 py-3">
      <p className="font-heading text-xl font-bold text-nr-bone">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-widest text-nr-bone/40">{label}</p>
    </div>
  )
}

function StatTile({
  label,
  value,
  unit,
  planned,
  art,
}: {
  label: string
  value: number
  unit?: string
  planned: number
  art: string
}) {
  const changed = planned !== value
  return (
    <div className="relative isolate px-3 py-3 text-center">
      <ArtFrame src={art} width="16px" fill />
      <span
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: 'rgba(12,12,14,0.35)' }}
      />
      <p className="text-[9px] uppercase tracking-widest text-nr-bone/45">{label}</p>
      <p className="font-heading text-2xl font-bold leading-none text-nr-bone">
        {value}
        {unit && <span className="ml-0.5 text-xs text-nr-bone/50">{unit}</span>}
      </p>
      <p className={cn('mt-0.5 text-[9px] uppercase tracking-wider', changed ? 'text-nr-ember/80' : 'text-nr-bone/35')}>
        {changed ? `plan ${planned}` : 'on plan'}
      </p>
    </div>
  )
}

function CtrlButton({
  icon,
  label,
  onClick,
  art,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  art: string
  tone?: 'default' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative isolate flex flex-col items-center gap-1 py-3 transition-colors',
        tone === 'primary'
          ? 'text-nr-ember'
          : 'text-nr-bone/80 hover:text-nr-bone',
      )}
    >
      <ArtFrame src={art} width="14px" />
      {tone === 'primary' && (
        <span
          aria-hidden
          className="absolute inset-[14px] -z-10"
          style={{ backgroundColor: 'rgba(185,28,28,0.14)' }}
        />
      )}
      {icon}
      <span className="font-heading text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  )
}

function Stepper({
  label,
  icon,
  art,
  onDec,
  onInc,
}: {
  label: string
  icon?: React.ReactNode
  art: string
  onDec: () => void
  onInc: () => void
}) {
  return (
    <div className="relative isolate flex items-center justify-between">
      <ArtFrame src={art} width="12px" />
      <button
        onClick={onDec}
        className="flex h-11 flex-1 items-center justify-center text-nr-bone/70 hover:text-nr-ember"
      >
        <Minus className="size-4" />
      </button>
      <span className="flex items-center gap-1 px-1 font-heading text-[10px] uppercase tracking-widest text-nr-bone/55">
        {icon}
        {label}
      </span>
      <button
        onClick={onInc}
        className="flex h-11 flex-1 items-center justify-center text-nr-bone/70 hover:text-nr-ember"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-7 items-center justify-center rounded-sm border transition-colors',
        disabled
          ? 'border-nr-bronze/10 text-nr-bone/15'
          : danger
            ? 'border-nr-bronze/30 text-nr-bone/60 hover:border-nr-crimson hover:text-nr-ember'
            : 'border-nr-bronze/30 text-nr-bone/60 hover:border-nr-bronze hover:text-nr-bone',
      )}
    >
      {children}
    </button>
  )
}

function ExercisePicker({
  mode,
  current,
  onPick,
  onClose,
}: {
  mode: PickerMode
  current?: PlanItem
  onPick: (e: MockExercise) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [sub, setSub] = useState<string | null>(null)
  const isSwap = mode.kind === 'swap'

  const query = q.trim().toLowerCase()
  const groupLabel = group ? BODY_GROUPS.find((g) => g.slug === group)?.label : null

  // View precedence: search > sub list > sub-group buttons > root (alternatives/hint)
  let list: MockExercise[] | null = null
  if (query) {
    list = EXERCISES.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.subGroup.toLowerCase().includes(query) ||
        e.bodyGroup.toLowerCase().includes(query),
    )
  } else if (group && sub) {
    list = (EXERCISES_BY_GROUP[group] ?? []).filter((e) => e.subGroup === sub)
  } else if (!group && isSwap && current) {
    list = alternativesFor(current)
  }

  const subGroups = group && !sub && !query ? subGroupsForGroup(group) : null

  const selectGroup = (slug: string) => {
    setQ('')
    setSub(null)
    setGroup((g) => (g === slug ? null : slug))
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-nr-black/85 backdrop-blur-sm" />
      <div className="relative mt-auto flex max-h-[88%] flex-col border-t border-nr-bronze/40 bg-nr-gunmetal px-4 pb-6 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold uppercase tracking-widest text-nr-bone">
            {isSwap ? 'Swap Exercise' : 'Add Exercise'}
          </h3>
          <button onClick={onClose} className="text-nr-bone/50 hover:text-nr-bone">
            <X className="size-5" />
          </button>
        </div>

        {/* search (case-insensitive) */}
        <div className="mb-3 flex items-center gap-2 border border-nr-bronze/30 bg-nr-black/40 px-2 clip-bevel-sm">
          <Search className="size-4 text-nr-bone/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all exercises…"
            className="h-9 flex-1 bg-transparent text-sm text-nr-bone placeholder:text-nr-bone/30 focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-nr-bone/40 hover:text-nr-bone">
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* body-group chips */}
        {!query && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BODY_GROUPS.map((g) => {
              const active = g.slug === group
              return (
                <button
                  key={g.slug}
                  onClick={() => selectGroup(g.slug)}
                  className={cn(
                    'clip-bevel-sm shrink-0 px-3.5 py-1.5 font-heading text-xs font-semibold uppercase tracking-widest transition-all',
                    active
                      ? 'bg-nr-crimson text-nr-bone shadow-[0_0_14px_-2px] shadow-nr-ember/70'
                      : 'border border-nr-bronze/30 text-nr-bone/55 hover:text-nr-bone',
                  )}
                >
                  {g.label}
                </button>
              )
            })}
          </div>
        )}

        {/* breadcrumb / back */}
        {!query && group && (
          <button
            onClick={() => (sub ? setSub(null) : setGroup(null))}
            className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-nr-bronze hover:text-nr-ember"
          >
            <ArrowUp className="size-3 -rotate-90" />
            {sub ? `${groupLabel} · all` : isSwap ? 'Back to alternatives' : 'Muscle groups'}
            {sub && <span className="text-nr-bone/45">› {sub}</span>}
          </button>
        )}

        <div className="overflow-y-auto">
          {/* sub-group buttons */}
          {subGroups && (
            <ul className="space-y-1.5">
              {subGroups.map((s) => {
                const count = (EXERCISES_BY_GROUP[group!] ?? []).filter((e) => e.subGroup === s).length
                return (
                  <li key={s}>
                    <button
                      onClick={() => setSub(s)}
                      className="clip-bevel-sm flex w-full items-center justify-between border border-nr-bronze/25 bg-nr-black/30 px-3 py-2.5 text-left hover:border-nr-crimson hover:bg-nr-crimson/10"
                    >
                      <span className="font-heading text-sm uppercase tracking-wide text-nr-bone">{s}</span>
                      <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-nr-bone/40">
                        {count}
                        <ChevronsRight className="size-3.5 text-nr-bronze" />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* alternatives label at root for swap */}
          {!query && !group && isSwap && current && (
            <p className="mb-2 text-[10px] uppercase tracking-wider text-nr-bone/40">
              Alternatives for {current.name}
            </p>
          )}

          {/* exercise list (search / sub / alternatives) */}
          {list && (
            <ul className="space-y-1.5">
              {list.map((e) => (
                <li key={e.slug}>
                  <button
                    onClick={() => onPick(e)}
                    className="clip-bevel-sm flex w-full items-center gap-3 border border-nr-bronze/25 bg-nr-black/30 px-3 py-2 text-left hover:border-nr-crimson hover:bg-nr-crimson/10"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bronze">
                      <Plus className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">
                        {e.name}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-nr-bone/40">
                        {e.subGroup} · {e.defaultSets}×{e.defaultReps ?? e.defaultDurationSeconds + 's'}
                        {e.defaultWeightLbs ? ` @ ${e.defaultWeightLbs}lb` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
              {list.length === 0 && (
                <li className="py-6 text-center text-xs uppercase tracking-widest text-nr-bone/30">
                  No matches
                </li>
              )}
            </ul>
          )}

          {/* root hint for add mode */}
          {!query && !group && !isSwap && (
            <p className="py-8 text-center text-[11px] uppercase tracking-widest text-nr-bone/35">
              Choose a muscle group above
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
