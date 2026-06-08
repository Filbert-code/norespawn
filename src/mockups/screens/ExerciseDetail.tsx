import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Heart, Plus, Trophy } from 'lucide-react'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import {
  EXERCISES,
  classificationTags,
  getExercise,
  loadLabel,
  EQUIPMENT_LABELS,
  type MockExercise,
} from '@/mockups/data/exercises'

// ============================================================================
// Deep-dive view for a single catalog exercise. All history / PR / score data
// below is INLINE mock data approximating what would derive from `session_set`
// and `user_exercise_score`. Subject: Barbell Bench Press.
// ============================================================================

const SUBJECT_SLUG = 'barbell_bench_press'

/** Mock top-set weight (lb) for the last ~10 sessions, oldest → newest. */
const HISTORY: { date: string; weight: number; reps: number; sets: number }[] = [
  { date: 'Mar 18', weight: 115, reps: 8, sets: 4 },
  { date: 'Mar 25', weight: 120, reps: 8, sets: 4 },
  { date: 'Apr 02', weight: 120, reps: 9, sets: 4 },
  { date: 'Apr 11', weight: 125, reps: 8, sets: 4 },
  { date: 'Apr 19', weight: 125, reps: 9, sets: 5 },
  { date: 'Apr 28', weight: 130, reps: 7, sets: 4 },
  { date: 'May 07', weight: 130, reps: 8, sets: 4 },
  { date: 'May 16', weight: 135, reps: 7, sets: 4 },
  { date: 'May 24', weight: 135, reps: 8, sets: 4 },
  { date: 'Jun 03', weight: 140, reps: 6, sets: 4 },
]

const PRS = {
  bestWeight: { value: '140 lb', detail: '6 reps · Jun 3' },
  oneRepMax: { value: '168 lb', detail: 'Est. (Epley)' },
  bestSetVolume: { value: '1,080 lb', detail: '135 × 8' },
  repPR: { value: '14 reps', detail: 'at 115 lb' },
}

const LAST = { reps: 8, weight: 135, when: '4 days ago' }
const SCORES = { preference: 8, intensity: 6 }

const RECENT = [
  { date: 'Jun 3', sets: 4, top: '6×140' },
  { date: 'May 24', sets: 4, top: '8×135' },
  { date: 'May 16', sets: 4, top: '7×135' },
  { date: 'May 7', sets: 4, top: '8×130' },
]

function alternativesFor(e: MockExercise): MockExercise[] {
  const sameSub = EXERCISES.filter((x) => x.subGroup === e.subGroup && x.slug !== e.slug)
  const sameGroup = EXERCISES.filter((x) => x.bodyGroup === e.bodyGroup && x.subGroup !== e.subGroup)
  return [...sameSub, ...sameGroup].slice(0, 4)
}

const GROUP_LABEL: Record<string, string> = {
  shoulders: 'Shoulders',
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  arms: 'Arms',
  core: 'Core',
}

export function ExerciseDetail() {
  const navigate = useNavigate()
  const [firstRun, setFirstRun] = useState(false)
  const exercise = getExercise(SUBJECT_SLUG) ?? EXERCISES[0]
  const tags = classificationTags(exercise)
  const alts = alternativesFor(exercise)
  const groupLabel = GROUP_LABEL[exercise.bodyGroup] ?? exercise.bodyGroup

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col bg-nr-black text-nr-bone">
        {/* faint atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-10%,rgba(122,30,30,0.20),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.75)]" />

        {/* ---- header ---- */}
        <header className="relative border-b border-nr-bronze/15 px-4 pb-4 pt-9">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 transition-colors hover:border-nr-crimson hover:text-nr-ember"
            >
              <ChevronLeft className="size-5" />
            </button>
            <p className="flex-1 font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
              Exercise
            </p>
            <button
              onClick={() => setFirstRun((f) => !f)}
              className="clip-bevel-sm border border-nr-bronze/30 px-2 py-1 font-heading text-[9px] uppercase tracking-widest text-nr-bone/45 hover:text-nr-bone"
            >
              {firstRun ? 'Demo: New' : 'Demo: History'}
            </button>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 bg-nr-gunmetal/60 text-nr-bronze">
              <Dumbbell className="size-4" />
            </span>
          </div>

          <h1 className="mt-3 font-heading text-2xl font-bold uppercase leading-tight tracking-[0.08em] text-nr-bone">
            {exercise.name}
          </h1>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.25em] text-nr-bone/45">
            {groupLabel} · {exercise.subGroup}
          </p>

          {/* classification tags */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="clip-bevel-sm bg-nr-crimson/15 px-2 py-1 font-heading text-[9px] font-bold uppercase tracking-widest text-nr-ember">
              {loadLabel(exercise)}
            </span>
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-sm border border-nr-bronze/30 px-2 py-1 font-heading text-[9px] uppercase tracking-widest text-nr-bone/55"
              >
                {t}
              </span>
            ))}
            <span className="rounded-sm border border-nr-bronze/30 px-2 py-1 font-heading text-[9px] uppercase tracking-widest text-nr-bone/55">
              {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
            </span>
          </div>
        </header>

        {/* ---- scroll body ---- */}
        <div className="relative flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {firstRun && (
            <div className="clip-bevel-sm flex flex-col items-center gap-3 border border-dashed border-nr-bronze/30 bg-nr-gunmetal/20 px-4 py-8 text-center">
              <Flame className="size-8 text-nr-bone/15" />
              <div>
                <p className="font-heading text-sm uppercase tracking-widest text-nr-bone/70">
                  Never performed
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-nr-bone/35">
                  Records, trends &amp; scores appear after your first session
                </p>
              </div>
              <button className="clip-bevel-sm flex items-center gap-1.5 bg-nr-crimson px-4 py-2 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember">
                <Plus className="size-4" strokeWidth={3} /> Add to a Plan
              </button>
            </div>
          )}

          {!firstRun && (
            <>
          {/* last performed */}
          <div className="clip-bevel-sm flex items-center gap-2 border border-nr-bronze/20 bg-nr-gunmetal/40 px-3 py-2.5">
            <Flame className="size-4 shrink-0 text-nr-ember" />
            <p className="text-[11px] uppercase tracking-wider text-nr-bone/70">
              Last:{' '}
              <span className="text-nr-bone">
                {LAST.reps} × {LAST.weight} lb
              </span>{' '}
              <span className="text-nr-bronze/70">· {LAST.when}</span>
            </p>
          </div>

          {/* ---- personal records ---- */}
          <section>
            <SectionTitle icon={<Trophy className="size-3.5" />}>Personal Records</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <PrTile label="Best Weight" value={PRS.bestWeight.value} detail={PRS.bestWeight.detail} />
              <PrTile label="Est. 1RM" value={PRS.oneRepMax.value} detail={PRS.oneRepMax.detail} />
              <PrTile label="Best Set Volume" value={PRS.bestSetVolume.value} detail={PRS.bestSetVolume.detail} />
              <PrTile label="Rep PR" value={PRS.repPR.value} detail={PRS.repPR.detail} />
            </div>
          </section>

          {/* ---- history trend ---- */}
          <section>
            <SectionTitle>History</SectionTitle>
            <div className="clip-bevel-sm border border-nr-bronze/20 bg-nr-gunmetal/30 px-3 py-3">
              <TrendChart data={HISTORY} />
              <p className="mt-2 text-center text-[9px] uppercase tracking-[0.25em] text-nr-bone/35">
                Top set · last {HISTORY.length} sessions
              </p>
            </div>
          </section>

          {/* ---- preference & intensity ---- */}
          <section>
            <SectionTitle>Preference &amp; Intensity</SectionTitle>
            <div className="clip-bevel-sm space-y-3 border border-nr-bronze/20 bg-nr-gunmetal/30 px-4 py-3.5">
              <Meter
                icon={<Heart className="size-3.5 text-nr-ember" />}
                label="Preference"
                value={SCORES.preference}
              />
              <Meter
                icon={<Flame className="size-3.5 text-nr-bronze" />}
                label="Intensity"
                value={SCORES.intensity}
              />
            </div>
          </section>
            </>
          )}

          {/* ---- swap candidates ---- */}
          <section>
            <SectionTitle>Swap Candidates</SectionTitle>
            <ul className="space-y-1.5">
              {alts.map((a) => (
                <li key={a.slug}>
                  <button className="clip-bevel-sm flex w-full items-center gap-3 border border-nr-bronze/20 bg-nr-black/30 px-3 py-2.5 text-left transition-colors hover:border-nr-crimson hover:bg-nr-crimson/10">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bronze">
                      <Dumbbell className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">
                        {a.name}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-nr-bone/40">{a.subGroup}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-nr-bronze/60" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* ---- recent sessions ---- */}
          {!firstRun && (
            <section>
              <SectionTitle>Recent Sessions</SectionTitle>
              <div className="clip-bevel-sm divide-y divide-nr-bronze/10 border border-nr-bronze/20 bg-nr-gunmetal/30 px-3">
                {RECENT.map((r) => (
                  <div key={r.date} className="flex items-center justify-between py-2.5">
                    <span className="font-heading text-sm uppercase tracking-wide text-nr-bone/85">{r.date}</span>
                    <span className="text-[11px] uppercase tracking-wider text-nr-bone/45">{r.sets} sets</span>
                    <span className="font-heading text-sm tabular-nums text-nr-bone">{r.top}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="h-2" />
        </div>
      </div>
    </PhoneFrame>
  )
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="mb-2 flex items-center gap-1.5 font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
      {icon}
      {children}
    </h2>
  )
}

function PrTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="clip-bevel-sm border border-nr-bronze/25 bg-nr-gunmetal/50 px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-widest text-nr-bone/45">{label}</p>
      <p className="mt-0.5 font-heading text-xl font-bold leading-none text-nr-bone">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-wider text-nr-bronze/70">{detail}</p>
    </div>
  )
}

function Meter({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  const pct = Math.max(0, Math.min(10, value)) * 10
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-heading text-[11px] uppercase tracking-wide text-nr-bone/70">
          {icon}
          {label}
        </span>
        <span className="font-heading text-sm tabular-nums text-nr-bone">
          {value}
          <span className="text-[11px] text-nr-bone/40">/10</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-nr-bronze/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-nr-crimson to-nr-ember"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function TrendChart({ data }: { data: { date: string; weight: number }[] }) {
  // ---- fixed viewBox sized to fit the ~330px content column ----
  const W = 318
  const H = 132
  const padL = 30
  const padR = 8
  const padT = 10
  const padB = 18

  const weights = data.map((d) => d.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  // pad the domain a touch so the line never hugs the edges
  const lo = min - 10
  const hi = max + 10
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const x = (i: number) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * innerH

  const points = data.map((d, i) => `${x(i)},${y(d.weight)}`)
  const linePath = `M ${points.join(' L ')}`
  const areaPath = `M ${x(0)},${y(lo)} L ${points.join(' L ')} L ${x(data.length - 1)},${y(lo)} Z`

  // 3 horizontal gridlines (bronze), labelled with weights
  const ticks = [lo, (lo + hi) / 2, hi]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Top-set weight trend">
      <defs>
        <linearGradient id="nr-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines + y labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={y(t)}
            x2={W - padR}
            y2={y(t)}
            stroke="rgba(176,141,87,0.18)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <text x={padL - 5} y={y(t) + 3} textAnchor="end" fill="rgba(176,141,87,0.7)" fontSize="8">
            {Math.round(t)}
          </text>
        </g>
      ))}

      {/* axes */}
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="rgba(176,141,87,0.45)" strokeWidth={1} />
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="rgba(176,141,87,0.45)" strokeWidth={1} />

      {/* area + line */}
      <path d={areaPath} fill="url(#nr-trend-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#b91c1c"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 3px rgba(185,28,28,0.6))' }}
      />

      {/* dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(d.weight)}
          r={i === data.length - 1 ? 3.2 : 2}
          fill={i === data.length - 1 ? '#ef4444' : '#0c0c0e'}
          stroke={i === data.length - 1 ? '#ef4444' : '#b91c1c'}
          strokeWidth={1.5}
        />
      ))}

      {/* first / last x labels */}
      <text x={padL} y={H - 5} textAnchor="start" fill="rgba(236,229,216,0.4)" fontSize="8">
        {data[0]?.date}
      </text>
      <text x={W - padR} y={H - 5} textAnchor="end" fill="rgba(236,229,216,0.4)" fontSize="8">
        {data[data.length - 1]?.date}
      </text>
    </svg>
  )
}
