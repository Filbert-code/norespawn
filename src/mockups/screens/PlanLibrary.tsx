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
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { PlanSheet, PlanSheetRow, PlanSheetNumber } from '@/mockups/components/PlanSheet'
import { TabBar } from '@/mockups/components/TabBar'
import { ConfirmDialog } from '@/mockups/components/ConfirmDialog'

// ============================================================================
// "My Plans" hub — a list of saved `workout` rows (plan templates).
// Each plan = name + notes + ordered workout_exercise rows. "Last performed"
// derives from the most recent linked workout_session. All data is mock-inline.
// ============================================================================
interface PlanExercise {
  name: string
  /** Scheme line in the live-session style: "SubGroup · sets×reps @ weightlb". */
  meta: string
}
interface MockPlan {
  id: string
  name: string
  focus: string[]
  minutes: number
  /** Days since last performed; null = never performed. */
  lastDays: number | null
  /** Total completed sessions — drives the "Most Used" sort. */
  timesPerformed: number
  exercises: PlanExercise[]
}

const PLANS: MockPlan[] = [
  {
    id: 'wk_iron_crusade',
    name: 'Iron Crusade — Push',
    focus: ['Chest', 'Shoulders', 'Triceps'],
    minutes: 52,
    lastDays: 4,
    timesPerformed: 18,
    exercises: [
      { name: 'Barbell Bench Press', meta: 'Mid Chest · 4×8 @ 135lb' },
      { name: 'Incline Dumbbell Press', meta: 'Upper Chest · 4×10 @ 65lb' },
      { name: 'Overhead Press', meta: 'Front Delts · 3×8 @ 75lb' },
      { name: 'Cable Fly', meta: 'Mid Chest · 3×12 @ 25lb' },
      { name: 'Lateral Raise', meta: 'Side Delts · 3×15 @ 15lb' },
      { name: 'Triceps Pushdown', meta: 'Triceps · 3×12 @ 50lb' },
    ],
  },
  {
    id: 'wk_relentless_pull',
    name: 'Relentless Pull',
    focus: ['Back', 'Biceps', 'Rear Delts'],
    minutes: 58,
    lastDays: 2,
    timesPerformed: 22,
    exercises: [
      { name: 'Barbell Deadlift', meta: 'Lower Back · 4×5 @ 225lb' },
      { name: 'Pull Up', meta: 'Lats · 4×8 @ BW' },
      { name: 'Barbell Row', meta: 'Mid Back · 4×8 @ 135lb' },
      { name: 'Lat Pulldown', meta: 'Lats · 3×10 @ 120lb' },
      { name: 'Face Pull', meta: 'Rear Delts · 3×15 @ 35lb' },
      { name: 'Barbell Curl', meta: 'Biceps · 3×10 @ 60lb' },
      { name: 'Hammer Curl', meta: 'Biceps · 3×12 @ 30lb' },
    ],
  },
  {
    id: 'wk_bastion_legs',
    name: 'Bastion Legs',
    focus: ['Quads', 'Hamstrings', 'Calves'],
    minutes: 64,
    lastDays: 9,
    timesPerformed: 11,
    exercises: [
      { name: 'Barbell Back Squat', meta: 'Quads · 4×6 @ 185lb' },
      { name: 'Leg Press', meta: 'Quads · 4×12 @ 270lb' },
      { name: 'Romanian Deadlift', meta: 'Hamstrings · 4×10 @ 135lb' },
      { name: 'Leg Extension', meta: 'Quads · 3×12 @ 90lb' },
      { name: 'Seated Leg Curl', meta: 'Hamstrings · 3×12 @ 90lb' },
      { name: 'Standing Calf Raise', meta: 'Calves · 4×15 @ 150lb' },
    ],
  },
  {
    id: 'wk_wrath_anvil',
    name: 'Wrath of the Anvil — Chest',
    focus: ['Chest', 'Triceps'],
    minutes: 47,
    lastDays: 16,
    timesPerformed: 6,
    exercises: [
      { name: 'Barbell Bench Press', meta: 'Mid Chest · 5×5 @ 155lb' },
      { name: 'Incline Dumbbell Press', meta: 'Upper Chest · 4×10 @ 65lb' },
      { name: 'Weighted Dip', meta: 'Lower Chest · 3×10 @ 25lb' },
      { name: 'Cable Fly', meta: 'Mid Chest · 3×12 @ 25lb' },
      { name: 'Overhead Tricep Extension', meta: 'Triceps · 3×12 @ 40lb' },
    ],
  },
  {
    id: 'wk_sentinel_core',
    name: 'Sentinel Core',
    focus: ['Abs', 'Obliques', 'Lower Back'],
    minutes: 31,
    lastDays: null,
    timesPerformed: 0,
    exercises: [
      { name: 'Plank', meta: 'Abs · 3×45s' },
      { name: 'Hanging Leg Raise', meta: 'Abs · 3×12 @ BW' },
      { name: 'Cable Woodchopper', meta: 'Obliques · 3×15 @ 30lb' },
      { name: 'Russian Twist', meta: 'Obliques · 3×20 @ BW' },
      { name: 'Back Extension', meta: 'Lower Back · 3×15 @ BW' },
    ],
  },
  {
    id: 'wk_full_onslaught',
    name: 'Full Onslaught',
    focus: ['Full Body'],
    minutes: 78,
    lastDays: 27,
    timesPerformed: 3,
    exercises: [
      { name: 'Barbell Back Squat', meta: 'Quads · 4×6 @ 185lb' },
      { name: 'Barbell Bench Press', meta: 'Mid Chest · 4×8 @ 135lb' },
      { name: 'Barbell Row', meta: 'Mid Back · 4×8 @ 135lb' },
      { name: 'Overhead Press', meta: 'Front Delts · 3×8 @ 75lb' },
      { name: 'Romanian Deadlift', meta: 'Hamstrings · 3×10 @ 135lb' },
      { name: 'Pull Up', meta: 'Lats · 3×8 @ BW' },
      { name: 'Leg Press', meta: 'Quads · 3×12 @ 270lb' },
      { name: 'Lateral Raise', meta: 'Side Delts · 3×15 @ 15lb' },
      { name: 'Barbell Curl', meta: 'Biceps · 3×10 @ 60lb' },
    ],
  },
]

type SortKey = 'recent' | 'used'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'used', label: 'Most Used' },
]

function lastPerformedLabel(days: number | null): string {
  if (days === null) return 'Never performed'
  if (days === 0) return 'Last: today'
  if (days === 1) return 'Last: yesterday'
  if (days < 7) return `Last: ${days} days ago`
  if (days < 14) return 'Last: 1 week ago'
  if (days < 30) return `Last: ${Math.round(days / 7)} weeks ago`
  return 'Last: 1 month ago'
}

function sortPlans(plans: MockPlan[], key: SortKey): MockPlan[] {
  const copy = [...plans]
  switch (key) {
    case 'recent':
      return copy.sort(
        (a, b) => (a.lastDays ?? Number.POSITIVE_INFINITY) - (b.lastDays ?? Number.POSITIVE_INFINITY),
      )
    case 'used':
      return copy.sort((a, b) => b.timesPerformed - a.timesPerformed)
  }
}

export function PlanLibrary() {
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortKey>('recent')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [firstRun, setFirstRun] = useState(false)

  const plans = firstRun ? [] : sortPlans(PLANS, sort)
  const viewPlan = PLANS.find((p) => p.id === viewId) ?? null
  const deletePlan = PLANS.find((p) => p.id === deleteId) ?? null

  const goForge = () => navigate('/mockups/workout-builder')
  const goLive = () => navigate('/mockups/live')
  const goSchedule = () => navigate('/mockups/schedule')
  const goEdit = () => navigate('/mockups/forge-plan')

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col bg-nr-black text-nr-bone">
        {/* faint atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(122,30,30,0.20),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.75)]" />

        {/* ---- header ---- */}
        <header className="relative border-b border-nr-bronze/15 px-5 pb-4 pt-9">
          <p className="font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
            NoRespawn
          </p>
          <div className="flex items-end justify-between gap-3">
            <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.12em] text-nr-bone">
              Plans
            </h1>
            <div className="mb-1 flex items-center gap-2">
              <button
                onClick={() => setFirstRun((f) => !f)}
                className="clip-bevel-sm border border-nr-bronze/30 px-2 py-1 font-heading text-[9px] uppercase tracking-widest text-nr-bone/45 hover:text-nr-bone"
              >
                {firstRun ? 'Demo: Empty' : 'Demo: Populated'}
              </button>
              <span className="flex items-center gap-1 font-heading text-[10px] uppercase tracking-widest text-nr-bone/40">
                <Skull className="size-3.5 text-nr-bronze/70" />
                {plans.length} Forged
              </span>
            </div>
          </div>

          {/* forge new plan — prominent primary action */}
          <button
            onClick={goForge}
            className="clip-bevel mt-4 flex w-full items-center justify-center gap-2 bg-nr-crimson py-3 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone transition-colors hover:bg-nr-ember"
          >
            <Plus className="size-4" strokeWidth={3} />
            Forge New Plan
          </button>
        </header>

        {/* ---- sort / filter row ---- */}
        {!firstRun && (
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

        {/* ---- plan list ---- */}
        <div className="relative flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {firstRun ? (
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
          ) : (
            <>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  menuOpen={openMenu === plan.id}
                  onToggleMenu={() => setOpenMenu((m) => (m === plan.id ? null : plan.id))}
                  onCloseMenu={() => setOpenMenu(null)}
                  onView={() => setViewId(plan.id)}
                  onStart={goLive}
                  onEdit={goEdit}
                  onSchedule={goSchedule}
                  onDelete={() => setDeleteId(plan.id)}
                />
              ))}
              <p className="pb-2 pt-1 text-center text-[10px] uppercase tracking-[0.3em] text-nr-bone/25">
                End of the codex
              </p>
            </>
          )}
        </div>

        {/* ---- workout detail sheet (eye icon) ---- */}
        {viewPlan && (
          <PlanSheet
            title={viewPlan.name}
            subtitle={`${viewPlan.exercises.length} exercises · ~${viewPlan.minutes} min · ${lastPerformedLabel(
              viewPlan.lastDays,
            )}`}
            onClose={() => setViewId(null)}
            footer={
              <button
                onClick={() => {
                  setViewId(null)
                  goLive()
                }}
                className="clip-bevel-sm mt-3 flex w-full items-center justify-center gap-2 bg-nr-crimson py-2.5 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone transition-colors hover:bg-nr-ember"
              >
                <Play className="size-4" fill="currentColor" />
                Start
              </button>
            }
          >
            <ul className="space-y-2">
              {viewPlan.exercises.map((ex, i) => (
                <PlanSheetRow
                  key={`${ex.name}-${i}`}
                  badge={<PlanSheetNumber n={i + 1} />}
                  name={ex.name}
                  meta={ex.meta}
                />
              ))}
            </ul>
          </PlanSheet>
        )}

        <TabBar />

        <ConfirmDialog
          open={deletePlan !== null}
          title="Destroy Plan"
          message={`"${deletePlan?.name}" and its history links will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => setDeleteId(null)}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </PhoneFrame>
  )
}

function PlanCard({
  plan,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onView,
  onStart,
  onEdit,
  onSchedule,
  onDelete,
}: {
  plan: MockPlan
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onView: () => void
  onStart: () => void
  onEdit: () => void
  onSchedule: () => void
  onDelete: () => void
}) {
  const never = plan.lastDays === null

  return (
    <article className="clip-bevel relative border border-nr-bronze/25 bg-nr-gunmetal/40 p-4">
      {/* title + kebab */}
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-nr-bone">
          {plan.name}
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

      {/* focus chips */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {plan.focus.map((f) => (
          <span
            key={f}
            className="rounded-sm border border-nr-bronze/30 bg-nr-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-nr-bronze"
          >
            {f}
          </span>
        ))}
      </div>

      {/* meta line */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-nr-bone/45">
        <span className="flex items-center gap-1">
          <Dumbbell className="size-3.5 text-nr-bronze/70" />
          {plan.exercises.length} exercises
        </span>
        <span className="flex items-center gap-1">
          <Timer className="size-3.5 text-nr-bronze/70" />~{plan.minutes} min
        </span>
        <span
          className={cn(
            'flex items-center gap-1',
            never ? 'text-nr-ember/70' : 'text-nr-bone/45',
          )}
        >
          <Flame className="size-3.5 text-nr-bronze/70" />
          {lastPerformedLabel(plan.lastDays)}
        </span>
      </div>

      {/* actions: start + view */}
      <div className="mt-3.5 flex gap-2">
        <button
          onClick={onStart}
          className="clip-bevel-sm flex flex-1 items-center justify-center gap-2 bg-nr-crimson py-2.5 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone transition-colors hover:bg-nr-ember"
        >
          <Play className="size-4" fill="currentColor" />
          Start
        </button>
        <button
          onClick={onView}
          aria-label={`View ${plan.name} workout`}
          className="clip-bevel-sm flex shrink-0 items-center justify-center gap-1.5 border border-nr-bronze/40 px-3.5 py-2.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bronze transition-colors hover:border-nr-crimson hover:text-nr-bone"
        >
          <Eye className="size-4" />
          View
        </button>
      </div>

      {/* action menu (kebab) */}
      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={onCloseMenu}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="clip-bevel-sm absolute right-3 top-12 z-20 w-40 overflow-hidden border border-nr-bronze/40 bg-nr-gunmetal shadow-xl shadow-black/60">
            <MenuItem
              icon={<Pencil className="size-4" />}
              label="Edit"
              onClick={() => {
                onCloseMenu()
                onEdit()
              }}
            />
            <MenuItem
              icon={<CalendarClock className="size-4" />}
              label="Schedule"
              onClick={() => {
                onCloseMenu()
                onSchedule()
              }}
            />
            <MenuItem
              icon={<Trash2 className="size-4" />}
              label="Delete"
              danger
              onClick={() => {
                onCloseMenu()
                onDelete()
              }}
            />
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
