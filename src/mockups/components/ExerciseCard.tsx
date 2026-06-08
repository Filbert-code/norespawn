import { Check, Dumbbell, Plus, Skull } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type MockExercise } from '@/mockups/data/exercises'

interface ExerciseCardProps {
  exercise: MockExercise
  selected: boolean
  onToggle: (slug: string) => void
}

export function ExerciseCard({ exercise, selected, onToggle }: ExerciseCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(exercise.slug)}
      className={cn(
        'clip-bevel group relative flex flex-col overflow-hidden border bg-nr-gunmetal/80 p-px text-left transition-all duration-150',
        selected
          ? 'border-nr-ember shadow-[0_0_18px_-2px] shadow-nr-ember/60'
          : 'border-nr-bronze/40 hover:border-nr-bronze/80',
      )}
    >
      <div className="clip-bevel relative flex flex-col bg-nr-gunmetal/90">
        {/* placeholder image */}
        <div className="relative flex h-28 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.18),transparent_60%)]">
          <Skull className="absolute size-20 text-nr-bone/[0.04]" strokeWidth={1} />
          <Dumbbell className="size-10 text-nr-bronze/70" strokeWidth={1.5} />

          {/* add / selected button */}
          <span
            className={cn(
              'absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border transition-colors',
              selected
                ? 'border-nr-ember bg-nr-crimson text-nr-bone shadow-[0_0_12px] shadow-nr-ember/70'
                : 'border-nr-bronze/40 bg-nr-black/70 text-nr-bronze group-hover:border-nr-crimson group-hover:text-nr-crimson',
            )}
          >
            {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
          </span>
        </div>

        <h3 className="px-3 pb-3 pt-2 font-heading text-sm font-semibold uppercase leading-tight tracking-wide text-nr-bone">
          {exercise.name}
        </h3>
      </div>
    </button>
  )
}
