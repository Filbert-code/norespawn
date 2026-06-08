import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  Dumbbell,
  Eye,
  Flame,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Skull,
  Timer,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/mockups/components/ConfirmDialog'
import { PlanSheet, PlanSheetNumber, PlanSheetRow } from '@/mockups/components/PlanSheet'
import { ScreenError, ScreenSpinner, ScreenSurface } from '@/screens/_shared/screen'
import { useDeletePlan, usePlan, usePlans, type PlanSummary } from '@/lib/queries/plans'
import { useExercises } from '@/lib/queries/exercises'
import { useStartSession } from '@/lib/queries/sessions'
import type { Exercise } from '@/lib/supabase'

// ============================================================================
// Plans tab — list of saved `workout` rows. Each card opens a PlanSheet via
// the eye icon to inspect exercises, and exposes start / edit / schedule /
// delete via a kebab menu. Soft-delete (is_archived) preserves session history.
// ============================================================================

type SortKey = 'recent' | 'used'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'used', label: 'Most Used' },
]

function lastPerformedLabel(iso: string | null): string {
  if (!iso) return 'Never performed'
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400000)
  if (days <= 0) return 'Last: today'
  if (days === 1) return 'Last: yesterday'
  if (days < 7) return `Last: ${days} days ago`
  if (days < 14) return 'Last: 1 week ago'
  if (days < 30) return `Last: ${Math.round(days / 7)} weeks ago`
  return `Last: ${Math.round(days / 30)} month${days >= 60 ? 's' : ''} ago`
}

function sortPlans(plans: PlanSummary[], key: SortKey): PlanSummary[] {
  const copy = [...plans]
  switch (key) {
    case 'recent':
      return copy.sort((a, b) => {
        const at = a.lastPerformedAt
          ? new Date(a.lastPerformedAt).getTime()
          : new Date(a.workout.updated_at).getTime() / 2
        const bt = b.lastPerformedAt
          ? new Date(b.lastPerformedAt).getTime()
          : new Date(b.workout.updated_at).getTime() / 2
        return bt - at
      })
    case 'used':
      return copy.sort((a, b) => b.timesPerformed - a.timesPerformed)
  }
}

export function PlansScreen() {
  const navigate = useNavigate()
  const { data: plans, isLoading, error } = usePlans()
  const deletePlan = useDeletePlan()
  const startSession = useStartSession()
  const [sort, setSort] = useState<SortKey>('recent')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  // Track which plan is mid-launch so we can disable that one card.
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const [launchError, setLaunchError] = useState<string | null>(null)

  async function startPlan(planId: string) {
    setLaunchingId(planId)
    setLaunchError(null)
    try {
      const session = await startSession.mutateAsync({ workoutId: planId })
      navigate(`/live/${session.id}`)
    } catch (e) {
      setLaunchError((e as Error).message)
      setLaunchingId(null)
    }
  }

  const sorted = plans ? sortPlans(plans, sort) : []
  const empty = !isLoading && !error && sorted.length === 0
  const goForge = () => navigate('/builder')

  return (
    <ScreenSurface>
      <header className="relative border-b border-nr-bronze/15 px-5 pb-4 pt-9">
        <p className="font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
          NoRespawn
        </p>
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.12em] text-nr-bone">
            Plans
          </h1>
          <span className="mb-1 flex items-center gap-1 font-heading text-[10px] uppercase tracking-widest text-nr-bone/40">
            <Skull className="size-3.5 text-nr-bronze/70" />
            {sorted.length} Forged
          </span>
        </div>

        <button
          onClick={goForge}
          className="clip-bevel mt-4 flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone transition-colors hover:bg-nr-ember"
        >
          <Plus className="size-4" strokeWidth={3} />
          Forge New Plan
        </button>
      </header>

      {sorted.length > 0 && (
        <div className="relative flex shrink-0 gap-1.5 overflow-x-auto border-b border-nr-bronze/10 px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SORTS.map((s) => {
            const active = s.key === sort
            return (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  'clip-bevel-sm shrink-0 px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-widest transition-all',
                  active
                    ? 'bg-nr-crimson text-nr-bone shadow-[0_0_14px_-2px] shadow-nr-ember/70'
                    : 'border border-nr-bronze/30 text-nr-bone/55 hover:text-nr-bone',
                )}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="relative flex-1 space-y-3 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] pt-4">
        {isLoading && <ScreenSpinner />}
        {error && <ScreenError message={(error as Error).message} />}
        {empty && (
          <div className="clip-bevel mt-6 flex flex-col items-center gap-3 border border-dashed border-nr-bronze/30 bg-nr-gunmetal/20 px-5 py-12 text-center">
            <Skull className="size-10 text-nr-bone/15" />
            <div>
              <p className="font-heading text-base uppercase tracking-widest text-nr-bone/70">
                No plans forged
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-nr-bone/35">
                Build your first plan from the catalog
              </p>
            </div>
            <button
              onClick={goForge}
              className="clip-bevel-sm flex items-center gap-1.5 bg-nr-crimson px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember"
            >
              <Plus className="size-4" strokeWidth={3} /> Forge New Plan
            </button>
          </div>
        )}

        {launchError && (
          <p className="rounded-sm border border-nr-crimson/40 bg-nr-crimson/10 px-3 py-2 text-[11px] uppercase tracking-wider text-nr-ember">
            Could not start workout: {launchError}
          </p>
        )}

        {sorted.map((plan) => (
          <PlanCard
            key={plan.workout.id}
            plan={plan}
            menuOpen={openMenu === plan.workout.id}
            starting={launchingId === plan.workout.id}
            onToggleMenu={() =>
              setOpenMenu((m) => (m === plan.workout.id ? null : plan.workout.id))
            }
            onCloseMenu={() => setOpenMenu(null)}
            onView={() => setViewId(plan.workout.id)}
            onStart={() => startPlan(plan.workout.id)}
            onEdit={() => navigate(`/forge/${plan.workout.id}`)}
            onSchedule={() => navigate('/schedule', { state: { planId: plan.workout.id } })}
            onDelete={() => setDeleteId(plan.workout.id)}
          />
        ))}

        {sorted.length > 0 && (
          <p className="pb-2 pt-1 text-center text-[10px] uppercase tracking-[0.3em] text-nr-bone/25">
            End of the codex
          </p>
        )}
      </div>

      {viewId && (
        <PlanDetailSheet
          planId={viewId}
          starting={launchingId === viewId}
          onClose={() => setViewId(null)}
          onStart={() => startPlan(viewId)}
        />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Destroy Plan"
        message={`"${plans?.find((p) => p.workout.id === deleteId)?.workout.name ?? 'This plan'}" and its history links will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deletePlan.mutate(deleteId)
          setDeleteId(null)
        }}
        onCancel={() => setDeleteId(null)}
      />
    </ScreenSurface>
  )
}

function PlanCard({
  plan,
  menuOpen,
  starting,
  onToggleMenu,
  onCloseMenu,
  onView,
  onStart,
  onEdit,
  onSchedule,
  onDelete,
}: {
  plan: PlanSummary
  menuOpen: boolean
  starting: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onView: () => void
  onStart: () => void
  onEdit: () => void
  onSchedule: () => void
  onDelete: () => void
}) {
  const never = plan.lastPerformedAt === null

  return (
    <article className="clip-bevel relative border border-nr-bronze/25 bg-nr-gunmetal/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-nr-bone">
          {plan.workout.name}
        </h2>
        <button
          onClick={onToggleMenu}
          aria-label="Plan actions"
          aria-expanded={menuOpen}
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-sm border transition-colors',
            menuOpen
              ? 'border-nr-crimson/60 bg-nr-crimson/15 text-nr-ember'
              : 'border-nr-bronze/30 text-nr-bone/55 hover:border-nr-bronze hover:text-nr-bone',
          )}
        >
          <MoreVertical className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-nr-bone/45">
        <span className="flex items-center gap-1">
          <Dumbbell className="size-3.5 text-nr-bronze/70" />
          {plan.exerciseCount} exercises
        </span>
        <span className="flex items-center gap-1">
          <Timer className="size-3.5 text-nr-bronze/70" />
          {plan.timesPerformed} sessions
        </span>
        <span
          className={cn(
            'flex items-center gap-1',
            never ? 'text-nr-ember/70' : 'text-nr-bone/45',
          )}
        >
          <Flame className="size-3.5 text-nr-bronze/70" />
          {lastPerformedLabel(plan.lastPerformedAt)}
        </span>
      </div>

      <div className="mt-3.5 flex gap-2">
        <button
          onClick={onStart}
          disabled={starting}
          className="clip-bevel-sm flex flex-1 items-center justify-center gap-2 bg-nr-crimson py-2.5 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember disabled:opacity-60"
        >
          <Play className="size-4" fill="currentColor" />
          {starting ? 'Starting…' : 'Start'}
        </button>
        <button
          onClick={onView}
          aria-label={`View ${plan.workout.name} workout`}
          className="clip-bevel-sm flex shrink-0 items-center justify-center gap-1.5 border border-nr-bronze/40 px-3.5 py-2.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-crimson hover:text-nr-bone"
        >
          <Eye className="size-4" />
          View
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={onCloseMenu}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="clip-bevel-sm absolute right-3 top-12 z-20 w-40 overflow-hidden border border-nr-bronze/40 bg-nr-gunmetal shadow-xl shadow-black/60">
            <MenuItem icon={<Pencil className="size-4" />} label="Edit" onClick={() => { onCloseMenu(); onEdit() }} />
            <MenuItem icon={<CalendarClock className="size-4" />} label="Schedule" onClick={() => { onCloseMenu(); onSchedule() }} />
            <MenuItem icon={<Trash2 className="size-4" />} label="Delete" danger onClick={() => { onCloseMenu(); onDelete() }} />
          </div>
        </>
      )}
    </article>
  )
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 border-b border-nr-bronze/10 px-3 py-2.5 text-left font-heading text-xs uppercase tracking-widest transition-colors last:border-b-0',
        danger
          ? 'text-nr-ember/80 hover:bg-nr-crimson/15 hover:text-nr-ember'
          : 'text-nr-bone/75 hover:bg-nr-crimson/10 hover:text-nr-bone',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function PlanDetailSheet({
  planId,
  starting,
  onClose,
  onStart,
}: {
  planId: string
  starting: boolean
  onClose: () => void
  onStart: () => void
}) {
  const { data: detail, isLoading } = usePlan(planId)
  const { data: exercises } = useExercises()
  const byslug = new Map<string, Exercise>((exercises ?? []).map((e) => [e.slug, e]))

  const subtitle = detail
    ? `${detail.exercises.length} exercises`
    : isLoading
      ? 'Loading…'
      : ''

  return (
    <PlanSheet
      title={detail?.workout.name ?? 'Plan'}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <button
          onClick={onStart}
          disabled={starting}
          className="clip-bevel-sm mt-3 flex w-full items-center justify-center gap-2 bg-nr-crimson py-2.5 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone hover:bg-nr-ember disabled:opacity-60"
        >
          <Play className="size-4" fill="currentColor" />
          {starting ? 'Starting…' : 'Start'}
        </button>
      }
    >
      {!detail ? (
        <p className="py-6 text-center text-xs uppercase tracking-widest text-nr-bone/40">
          Loading…
        </p>
      ) : (
        <ul className="space-y-2">
          {detail.exercises.map((row, i) => {
            const cat = byslug.get(row.exercise_slug)
            const weight = row.planned_weight_lbs
            const reps = row.planned_reps
            const dur = row.planned_duration_seconds
            const meta = `${cat?.name ?? row.exercise_slug} · ${row.planned_sets}×${
              reps != null ? reps : dur != null ? `${dur}s` : '?'
            }${weight != null ? ` @ ${weight}lb` : ''}`
            return (
              <PlanSheetRow
                key={row.id}
                badge={<PlanSheetNumber n={i + 1} />}
                name={cat?.name ?? row.exercise_slug}
                meta={meta}
              />
            )
          })}
        </ul>
      )}
    </PlanSheet>
  )
}
