import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Heart, Plus, Trophy } from 'lucide-react'
import { ScreenError, ScreenSpinner, ScreenSurface } from '@/screens/_shared/screen'
import { useExerciseBySlug, useExercises, useLastPerformed } from '@/lib/queries/exercises'
import {
  useExerciseHistory,
  useExercisePRs,
  useExerciseScore,
  type ExerciseHistoryRow,
} from '@/lib/queries/exercise_detail'
import type { Exercise } from '@/lib/supabase'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtShort(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}
function howLongAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.round(days / 7)} weeks ago`
  return `${Math.round(days / 30)} mo ago`
}

export function ExerciseDetailScreen() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { data: exercise, isLoading: exLoading, error: exError } = useExerciseBySlug(slug)
  const { data: history } = useExerciseHistory(slug)
  const { data: prs } = useExercisePRs(slug)
  const { data: score } = useExerciseScore(slug)
  const { data: last } = useLastPerformed()
  const { data: catalog } = useExercises()

  const lastRow = useMemo(
    () => last?.find((r) => r.exercise_slug === slug) ?? null,
    [last, slug],
  )
  const alts = useMemo(() => {
    if (!exercise || !catalog) return [] as Exercise[]
    const sameSub = catalog.filter(
      (e) =>
        e.body_sub_group_slug === exercise.body_sub_group_slug && e.slug !== exercise.slug,
    )
    const sameGroup = catalog.filter(
      (e) =>
        e.body_group_slug === exercise.body_group_slug &&
        e.body_sub_group_slug !== exercise.body_sub_group_slug,
    )
    return [...sameSub, ...sameGroup].slice(0, 4)
  }, [exercise, catalog])

  const hasHistory = (history?.length ?? 0) > 0

  return (
    <ScreenSurface>
      <header className="relative border-b border-nr-bronze/15 px-4 pb-4 pt-9">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bone/70 hover:border-nr-crimson hover:text-nr-ember"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="flex-1 font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
            Exercise
          </p>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 bg-nr-gunmetal/60 text-nr-bronze">
            <Dumbbell className="size-4" />
          </span>
        </div>

        <h1 className="mt-3 font-heading text-2xl font-bold uppercase leading-tight tracking-[0.08em] text-nr-bone">
          {exercise?.name ?? '…'}
        </h1>
        {exercise && (
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.25em] text-nr-bone/45">
            {exercise.body_group_slug}{exercise.body_sub_group_slug && ` · ${exercise.body_sub_group_slug}`}
          </p>
        )}
      </header>

      <div className="relative flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {exLoading && <ScreenSpinner />}
        {exError && <ScreenError message={(exError as Error).message} />}

        {exercise && !hasHistory && (
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
            <button
              onClick={() => navigate('/builder')}
              className="clip-bevel-sm flex items-center gap-1.5 bg-nr-crimson px-4 py-2 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
            >
              <Plus className="size-4" strokeWidth={3} /> Add to a Plan
            </button>
          </div>
        )}

        {exercise && hasHistory && (
          <>
            {lastRow && (
              <div className="clip-bevel-sm flex items-center gap-2 border border-nr-bronze/20 bg-nr-gunmetal/40 px-3 py-2.5">
                <Flame className="size-4 shrink-0 text-nr-ember" />
                <p className="text-[11px] uppercase tracking-wider text-nr-bone/70">
                  Last:{' '}
                  <span className="text-nr-bone">
                    {lastRow.actual_reps ?? '?'} × {lastRow.actual_weight_lbs ?? '?'} lb
                  </span>{' '}
                  {lastRow.performed_at && (
                    <span className="text-nr-bronze/70">· {howLongAgo(lastRow.performed_at)}</span>
                  )}
                </p>
              </div>
            )}

            {prs && (
              <section>
                <SectionTitle icon={<Trophy className="size-3.5" />}>Personal Records</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <PrTile
                    label="Best Weight"
                    value={prs.best_weight_lbs ? `${prs.best_weight_lbs} lb` : '—'}
                    detail={
                      prs.best_weight_reps && prs.best_weight_at
                        ? `${prs.best_weight_reps} reps · ${fmtShort(prs.best_weight_at)}`
                        : '—'
                    }
                  />
                  <PrTile
                    label="Est. 1RM"
                    value={prs.est_one_rm_lbs ? `${Math.round(prs.est_one_rm_lbs)} lb` : '—'}
                    detail="Epley"
                  />
                  <PrTile
                    label="Best Set Volume"
                    value={
                      prs.best_set_volume_lbs ? `${Number(prs.best_set_volume_lbs).toLocaleString()} lb` : '—'
                    }
                    detail={
                      prs.set_volume_weight_lbs && prs.set_volume_reps
                        ? `${prs.set_volume_weight_lbs} × ${prs.set_volume_reps}`
                        : '—'
                    }
                  />
                  <PrTile
                    label="Rep PR"
                    value={prs.rep_pr_reps ? `${prs.rep_pr_reps} reps` : '—'}
                    detail={prs.rep_pr_weight_lbs ? `at ${prs.rep_pr_weight_lbs} lb` : '—'}
                  />
                </div>
              </section>
            )}

            <section>
              <SectionTitle>History</SectionTitle>
              <div className="clip-bevel-sm border border-nr-bronze/20 bg-nr-gunmetal/30 px-3 py-3">
                <TrendChart data={history!} />
                <p className="mt-2 text-center text-[9px] uppercase tracking-[0.25em] text-nr-bone/35">
                  Top set · last {history!.length} sessions
                </p>
              </div>
            </section>

            <section>
              <SectionTitle>Preference &amp; Intensity</SectionTitle>
              <div className="clip-bevel-sm space-y-3 border border-nr-bronze/20 bg-nr-gunmetal/30 px-4 py-3.5">
                <Meter
                  icon={<Heart className="size-3.5 text-nr-ember" />}
                  label="Preference"
                  value={score?.preference_score ?? null}
                />
                <Meter
                  icon={<Flame className="size-3.5 text-nr-bronze" />}
                  label="Intensity"
                  value={score?.intensity_score ?? null}
                />
              </div>
            </section>
          </>
        )}

        {exercise && (
          <section>
            <SectionTitle>Swap Candidates</SectionTitle>
            <ul className="space-y-1.5">
              {alts.map((a) => (
                <li key={a.slug}>
                  <button
                    onClick={() => navigate(`/exercise/${a.slug}`)}
                    className="clip-bevel-sm flex w-full items-center gap-3 border border-nr-bronze/20 bg-nr-black/30 px-3 py-2.5 text-left hover:border-nr-crimson hover:bg-nr-crimson/10"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-nr-bronze/30 text-nr-bronze">
                      <Dumbbell className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm uppercase tracking-wide text-nr-bone">
                        {a.name}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-nr-bone/40">
                        {a.body_sub_group_slug ?? ''}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-nr-bronze/60" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </ScreenSurface>
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

function Meter({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) {
  const pct = value != null ? Math.max(0, Math.min(10, value)) * 10 : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-heading text-[11px] uppercase tracking-wide text-nr-bone/70">
          {icon}
          {label}
        </span>
        <span className="font-heading text-sm tabular-nums text-nr-bone">
          {value ?? '—'}
          <span className="text-[11px] text-nr-bone/40">{value != null ? '/10' : ''}</span>
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

function TrendChart({ data }: { data: ExerciseHistoryRow[] }) {
  // Oldest -> newest for a left-to-right time axis.
  const ordered = [...data].reverse()
  const W = 318
  const H = 132
  const padL = 30
  const padR = 8
  const padT = 10
  const padB = 18
  const weights = ordered.map((d) => d.best_weight_lbs ?? 0)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const lo = min - 10
  const hi = Math.max(lo + 20, max + 10)
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const x = (i: number) =>
    padL + (ordered.length === 1 ? innerW / 2 : (i / (ordered.length - 1)) * innerW)
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * innerH
  const points = ordered.map((d, i) => `${x(i)},${y(d.best_weight_lbs ?? 0)}`)
  const linePath = `M ${points.join(' L ')}`
  const areaPath = `M ${x(0)},${y(lo)} L ${points.join(' L ')} L ${x(ordered.length - 1)},${y(lo)} Z`
  const ticks = [lo, (lo + hi) / 2, hi]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Top-set weight trend">
      <defs>
        <linearGradient id="nr-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
        </linearGradient>
      </defs>
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
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="rgba(176,141,87,0.45)" />
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="rgba(176,141,87,0.45)" />
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
      {ordered.map((d, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(d.best_weight_lbs ?? 0)}
          r={i === ordered.length - 1 ? 3.2 : 2}
          fill={i === ordered.length - 1 ? '#ef4444' : '#0c0c0e'}
          stroke={i === ordered.length - 1 ? '#ef4444' : '#b91c1c'}
          strokeWidth={1.5}
        />
      ))}
      {ordered.length > 0 && (
        <>
          <text x={padL} y={H - 5} textAnchor="start" fill="rgba(236,229,216,0.4)" fontSize="8">
            {fmtShort(ordered[0].started_at)}
          </text>
          <text x={W - padR} y={H - 5} textAnchor="end" fill="rgba(236,229,216,0.4)" fontSize="8">
            {fmtShort(ordered[ordered.length - 1].started_at)}
          </text>
        </>
      )}
    </svg>
  )
}
