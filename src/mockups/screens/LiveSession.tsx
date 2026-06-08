import { useEffect, useState } from 'react'
import {
  ChevronsRight,
  Hourglass,
  Minus,
  Pause,
  Play,
  Plus,
  Skull,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { AshField } from '@/mockups/components/AshField'
import bgArt from '@/mockups/assets/live-session-bg.png'

// ----- geometry helpers for the segmented ring -----
const C = 110 // center
const R = 92 // ring radius

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

type SetState = 'completed' | 'active' | 'upcoming'

function QuadrantRing({
  sets,
  progress,
  children,
}: {
  sets: SetState[]
  progress: number // 0..1 fill of the active arc
  children: React.ReactNode
}) {
  const n = Math.max(sets.length, 1)
  const span = 360 / n
  // gap shrinks as set count grows so segments stay distinct but readable
  const halfGap = Math.min(13, 52 / n)
  const arcs = sets.map((_, i) => ({
    start: i * span + halfGap,
    end: (i + 1) * span - halfGap,
  }))
  // bosses sit at each segment boundary
  const bossAngles = sets.map((_, i) => i * span)

  return (
    <div className="relative aspect-square w-full max-w-[300px]">
      <svg viewBox="0 0 220 220" className="size-full">
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(176,141,87,0.10)" strokeWidth={16} />
        {arcs.map((arc, i) => {
          const state = sets[i]
          const arcSpan = arc.end - arc.start
          return (
            <g key={i}>
              <path
                d={arcPath(arc.start, arc.end)}
                fill="none"
                strokeLinecap="round"
                strokeWidth={14}
                stroke={state === 'completed' ? '#b91c1c' : 'rgba(176,141,87,0.18)'}
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

      {/* skull bosses at segment boundaries */}
      {bossAngles.map((ang) => {
        const p = polar(ang)
        const left = (p.x / 220) * 100
        const top = (p.y / 220) * 100
        return (
          <span
            key={ang}
            className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-nr-bronze/50 bg-nr-black shadow-[0_0_8px_rgba(0,0,0,0.8)]"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <Skull className="size-4 text-nr-bronze" strokeWidth={1.5} />
          </span>
        )
      })}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
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

const REST_DEFAULT = 45

export function LiveSession() {
  const [running, setRunning] = useState(true)
  const [sessionSeconds, setSessionSeconds] = useState(24 * 60 + 18)

  const [totalSets, setTotalSets] = useState(4)
  const [currentSet, setCurrentSet] = useState(2) // 0-based -> "SET 3"
  const [restTarget, setRestTarget] = useState(REST_DEFAULT)
  const [restRemaining, setRestRemaining] = useState(38)

  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState(65)
  const rpe = 7
  const plannedReps = 10
  const plannedWeight = 65

  const [lastEvent, setLastEvent] = useState<string | null>(null)

  // tick
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSessionSeconds((s) => s + 1)
      setRestRemaining((r) => (r > 0 ? r - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  function logEvent(msg: string) {
    setLastEvent(msg)
  }

  const sets: SetState[] = Array.from({ length: totalSets }, (_, i) =>
    i < currentSet ? 'completed' : i === currentSet ? 'active' : 'upcoming',
  )
  const progress = restTarget > 0 ? (restTarget - restRemaining) / restTarget : 0

  function skip() {
    setCurrentSet((c) => Math.min(c + 1, totalSets - 1))
    setRestRemaining(restTarget)
    logEvent('Skipped to next set')
  }
  function addSet() {
    setTotalSets((t) => t + 1)
    logEvent('Added a set')
  }
  function bumpRest(delta: number) {
    setRestTarget((t) => Math.max(15, t + delta))
    setRestRemaining((r) => Math.max(0, r + delta))
    logEvent(`Rest ${delta > 0 ? '+' : ''}${delta}s`)
  }

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col overflow-hidden bg-nr-black">
        {/* artwork backdrop (hybrid: real concept art behind interactive layer) */}
        <img
          src={bgArt}
          alt=""
          className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-[0.16] blur-[2px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(127,29,29,0.30),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-nr-black/70 via-nr-black/40 to-nr-black/90" />
        <AshField count={32} emberChance={0.3} />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.8)]" />

        {/* ---- header ---- */}
        <header className="relative px-4 pt-9 text-center">
          <div className="flex items-center justify-center gap-2 text-nr-bronze/70">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-nr-bronze/50" />
            <Skull className="size-3.5" />
            <span className="text-[9px] uppercase tracking-[0.3em]">Live Session</span>
            <Skull className="size-3.5" />
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-nr-bronze/50" />
          </div>
          <h1 className="mt-1.5 font-heading text-2xl font-bold uppercase tracking-wide text-nr-bone">
            Incline Dumbbell Press
          </h1>
          <p className="mt-0.5 font-heading text-xs tracking-[0.25em] text-nr-bronze">
            {fmtLong(sessionSeconds)}
          </p>
        </header>

        {/* ---- ring centerpiece ---- */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-6">
          <QuadrantRing sets={sets} progress={progress}>
            <span className="font-heading text-xs uppercase tracking-[0.3em] text-nr-bone/55">
              Set {currentSet + 1} / {totalSets}
            </span>
            <span className="font-heading text-6xl font-bold leading-none text-nr-bone tabular-nums">
              {fmt(restRemaining)}
            </span>
            <span className="font-heading text-xs uppercase tracking-[0.35em] text-nr-crimson">
              {restRemaining > 0 ? 'Rest' : 'Go'}
            </span>
          </QuadrantRing>

          {/* stat tiles */}
          <div className="mt-4 grid w-full max-w-[320px] grid-cols-3 gap-2">
            <StatTile label="Reps" value={reps} planned={plannedReps} />
            <StatTile label="Weight" value={weight} unit="lb" planned={plannedWeight} />
            <StatTile label="RPE" value={rpe} sub="of 10" />
          </div>
        </div>

        {/* ---- last logged event ---- */}
        <div className="relative flex h-6 items-center justify-center">
          {lastEvent && (
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-nr-bronze/80">
              <Zap className="size-3 text-nr-ember" />
              Logged · {lastEvent}
            </p>
          )}
        </div>

        {/* ---- control panel ---- */}
        <div className="relative border-t border-nr-bronze/25 bg-nr-black/60 px-3 pb-7 pt-3 backdrop-blur-sm">
          {/* primary row */}
          <div className="mb-2 grid grid-cols-3 gap-2">
            <CtrlButton
              onClick={() => {
                setRunning((r) => !r)
                logEvent(running ? 'Paused' : 'Resumed')
              }}
              icon={running ? <Pause className="size-5" /> : <Play className="size-5" />}
              label={running ? 'Pause' : 'Resume'}
              tone={running ? 'primary' : 'go'}
            />
            <CtrlButton onClick={addSet} icon={<Plus className="size-5" />} label="Add Set" />
            <CtrlButton onClick={skip} icon={<ChevronsRight className="size-5" />} label="Skip" />
          </div>

          {/* steppers */}
          <div className="grid grid-cols-3 gap-2">
            <Stepper
              label="Reps"
              onDec={() => {
                setReps((r) => Math.max(0, r - 1))
                logEvent('Reps −1')
              }}
              onInc={() => {
                setReps((r) => r + 1)
                logEvent('Reps +1')
              }}
            />
            <Stepper
              label="Weight"
              onDec={() => {
                setWeight((w) => Math.max(0, w - 5))
                logEvent('Weight −5 lb')
              }}
              onInc={() => {
                setWeight((w) => w + 5)
                logEvent('Weight +5 lb')
              }}
            />
            <Stepper
              label="Rest"
              icon={<Hourglass className="size-4" />}
              onDec={() => bumpRest(-15)}
              onInc={() => bumpRest(15)}
            />
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

function StatTile({
  label,
  value,
  unit,
  planned,
  sub,
}: {
  label: string
  value: number
  unit?: string
  planned?: number
  sub?: string
}) {
  const changed = planned !== undefined && planned !== value
  return (
    <div className="clip-bevel-sm border border-nr-bronze/25 bg-nr-gunmetal/50 px-2 py-2 text-center">
      <p className="text-[9px] uppercase tracking-widest text-nr-bone/45">{label}</p>
      <p className="font-heading text-2xl font-bold leading-none text-nr-bone">
        {value}
        {unit && <span className="ml-0.5 text-xs text-nr-bone/50">{unit}</span>}
      </p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-nr-bone/35">
        {sub ?? (changed ? `was ${planned}` : `plan ${planned}`)}
      </p>
    </div>
  )
}

function CtrlButton({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'default' | 'primary' | 'go'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'clip-bevel-sm flex flex-col items-center gap-1 border py-2.5 transition-colors',
        tone === 'primary'
          ? 'border-nr-crimson/60 bg-nr-crimson/15 text-nr-ember hover:bg-nr-crimson/25'
          : tone === 'go'
            ? 'border-nr-bronze/50 bg-nr-bronze/15 text-nr-bronze hover:bg-nr-bronze/25'
            : 'border-nr-bronze/30 text-nr-bone/80 hover:border-nr-bronze/60 hover:text-nr-bone',
      )}
    >
      {icon}
      <span className="font-heading text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  )
}

function Stepper({
  label,
  icon,
  onDec,
  onInc,
}: {
  label: string
  icon?: React.ReactNode
  onDec: () => void
  onInc: () => void
}) {
  return (
    <div className="clip-bevel-sm flex items-center justify-between border border-nr-bronze/30 bg-nr-gunmetal/40">
      <button
        onClick={onDec}
        className="flex h-10 flex-1 items-center justify-center text-nr-bone/70 hover:bg-nr-crimson/20 hover:text-nr-ember"
      >
        <Minus className="size-4" />
      </button>
      <span className="flex items-center gap-1 px-1 font-heading text-[10px] uppercase tracking-widest text-nr-bone/50">
        {icon}
        {label}
      </span>
      <button
        onClick={onInc}
        className="flex h-10 flex-1 items-center justify-center text-nr-bone/70 hover:bg-nr-crimson/20 hover:text-nr-ember"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
