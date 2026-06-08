// Static mock data for UI mockups only — NOT wired to the database.
// Mirrors the shape of the real `exercise` catalog closely enough to design against.

export type MockTracking = 'weight_reps' | 'bodyweight_reps' | 'timed'
export type MovementPattern =
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'hinge'
  | 'squat'
  | 'lunge'
  | 'carry'
  | 'core'
  | 'isolation'
export type Mechanic = 'compound' | 'isolation'
export type ForceType = 'push' | 'pull' | 'static'
export type Laterality = 'bilateral' | 'unilateral' | 'alternating'

export interface MockExercise {
  slug: string
  name: string
  bodyGroup: string
  subGroup: string
  equipment: string
  tracking: MockTracking
  defaultSets: number
  defaultReps: number | null
  defaultDurationSeconds: number | null
  defaultWeightLbs: number | null
  movementPattern: MovementPattern
  mechanic: Mechanic
  forceType: ForceType
  laterality: Laterality
}

export interface MockBodyGroup {
  slug: string
  label: string
}

export const BODY_GROUPS: MockBodyGroup[] = [
  { slug: 'shoulders', label: 'Shoulders' },
  { slug: 'chest', label: 'Chest' },
  { slug: 'back', label: 'Back' },
  { slug: 'legs', label: 'Legs' },
  { slug: 'arms', label: 'Arms' },
  { slug: 'core', label: 'Core' },
]

type Entry = Omit<MockExercise, 'tracking' | 'defaultDurationSeconds'> & {
  tracking?: MockTracking
  defaultDurationSeconds?: number | null
}

const ex = (e: Entry): MockExercise => ({
  tracking: 'weight_reps',
  defaultDurationSeconds: null,
  ...e,
})

export const EXERCISES: MockExercise[] = [
  // ---- Shoulders ----
  ex({ slug: 'barbell_overhead_press', name: 'Barbell Overhead Press', bodyGroup: 'shoulders', subGroup: 'Front Delts', equipment: 'barbell', defaultSets: 4, defaultReps: 8, defaultWeightLbs: 95, movementPattern: 'vertical_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'dumbbell_shoulder_press', name: 'Dumbbell Shoulder Press', bodyGroup: 'shoulders', subGroup: 'Front Delts', equipment: 'dumbbell', defaultSets: 4, defaultReps: 10, defaultWeightLbs: 50, movementPattern: 'vertical_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'arnold_press', name: 'Arnold Press', bodyGroup: 'shoulders', subGroup: 'Front Delts', equipment: 'dumbbell', defaultSets: 3, defaultReps: 10, defaultWeightLbs: 40, movementPattern: 'vertical_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'lateral_raise', name: 'Dumbbell Lateral Raise', bodyGroup: 'shoulders', subGroup: 'Side Delts', equipment: 'dumbbell', defaultSets: 3, defaultReps: 15, defaultWeightLbs: 15, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'cable_lateral_raise', name: 'Cable Lateral Raise', bodyGroup: 'shoulders', subGroup: 'Side Delts', equipment: 'cable', defaultSets: 3, defaultReps: 15, defaultWeightLbs: 20, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'pull', laterality: 'unilateral' }),
  ex({ slug: 'reverse_pec_deck', name: 'Reverse Pec Deck', bodyGroup: 'shoulders', subGroup: 'Rear Delts', equipment: 'machine', defaultSets: 3, defaultReps: 15, defaultWeightLbs: 60, movementPattern: 'horizontal_pull', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'face_pull', name: 'Face Pull', bodyGroup: 'shoulders', subGroup: 'Rear Delts', equipment: 'cable', defaultSets: 3, defaultReps: 15, defaultWeightLbs: 40, movementPattern: 'horizontal_pull', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),

  // ---- Chest ----
  ex({ slug: 'barbell_bench_press', name: 'Barbell Bench Press', bodyGroup: 'chest', subGroup: 'Mid Chest', equipment: 'barbell', defaultSets: 4, defaultReps: 8, defaultWeightLbs: 135, movementPattern: 'horizontal_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'incline_dumbbell_press', name: 'Incline Dumbbell Press', bodyGroup: 'chest', subGroup: 'Upper Chest', equipment: 'dumbbell', defaultSets: 4, defaultReps: 10, defaultWeightLbs: 60, movementPattern: 'horizontal_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'dumbbell_bench_press', name: 'Dumbbell Bench Press', bodyGroup: 'chest', subGroup: 'Mid Chest', equipment: 'dumbbell', defaultSets: 4, defaultReps: 10, defaultWeightLbs: 70, movementPattern: 'horizontal_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'machine_chest_press', name: 'Machine Chest Press', bodyGroup: 'chest', subGroup: 'Mid Chest', equipment: 'machine', defaultSets: 4, defaultReps: 10, defaultWeightLbs: 90, movementPattern: 'horizontal_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'cable_fly', name: 'Cable Fly', bodyGroup: 'chest', subGroup: 'Mid Chest', equipment: 'cable', defaultSets: 3, defaultReps: 12, defaultWeightLbs: 30, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'chest_dip', name: 'Chest Dip', bodyGroup: 'chest', subGroup: 'Lower Chest', equipment: 'bodyweight', tracking: 'bodyweight_reps', defaultSets: 3, defaultReps: 12, defaultWeightLbs: null, movementPattern: 'vertical_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'push_up', name: 'Push Up', bodyGroup: 'chest', subGroup: 'Mid Chest', equipment: 'bodyweight', tracking: 'bodyweight_reps', defaultSets: 3, defaultReps: 15, defaultWeightLbs: null, movementPattern: 'horizontal_push', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),

  // ---- Back ----
  ex({ slug: 'deadlift', name: 'Barbell Deadlift', bodyGroup: 'back', subGroup: 'Lower Back', equipment: 'barbell', defaultSets: 4, defaultReps: 5, defaultWeightLbs: 225, movementPattern: 'hinge', mechanic: 'compound', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'barbell_row', name: 'Barbell Row', bodyGroup: 'back', subGroup: 'Lats', equipment: 'barbell', defaultSets: 4, defaultReps: 8, defaultWeightLbs: 135, movementPattern: 'horizontal_pull', mechanic: 'compound', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'lat_pulldown', name: 'Lat Pulldown', bodyGroup: 'back', subGroup: 'Lats', equipment: 'cable', defaultSets: 4, defaultReps: 10, defaultWeightLbs: 120, movementPattern: 'vertical_pull', mechanic: 'compound', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'pull_up', name: 'Pull Up', bodyGroup: 'back', subGroup: 'Lats', equipment: 'bodyweight', tracking: 'bodyweight_reps', defaultSets: 4, defaultReps: 8, defaultWeightLbs: null, movementPattern: 'vertical_pull', mechanic: 'compound', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'seated_cable_row', name: 'Seated Cable Row', bodyGroup: 'back', subGroup: 'Mid Back', equipment: 'cable', defaultSets: 4, defaultReps: 10, defaultWeightLbs: 130, movementPattern: 'horizontal_pull', mechanic: 'compound', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'single_arm_dumbbell_row', name: 'Single-Arm Dumbbell Row', bodyGroup: 'back', subGroup: 'Lats', equipment: 'dumbbell', defaultSets: 3, defaultReps: 10, defaultWeightLbs: 70, movementPattern: 'horizontal_pull', mechanic: 'compound', forceType: 'pull', laterality: 'unilateral' }),
  ex({ slug: 't_bar_row', name: 'T-Bar Row', bodyGroup: 'back', subGroup: 'Mid Back', equipment: 'machine', defaultSets: 4, defaultReps: 10, defaultWeightLbs: 90, movementPattern: 'horizontal_pull', mechanic: 'compound', forceType: 'pull', laterality: 'bilateral' }),

  // ---- Legs ----
  ex({ slug: 'back_squat', name: 'Barbell Back Squat', bodyGroup: 'legs', subGroup: 'Quads', equipment: 'barbell', defaultSets: 4, defaultReps: 6, defaultWeightLbs: 185, movementPattern: 'squat', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'front_squat', name: 'Front Squat', bodyGroup: 'legs', subGroup: 'Quads', equipment: 'barbell', defaultSets: 4, defaultReps: 6, defaultWeightLbs: 135, movementPattern: 'squat', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'leg_press', name: 'Leg Press', bodyGroup: 'legs', subGroup: 'Quads', equipment: 'machine', defaultSets: 4, defaultReps: 12, defaultWeightLbs: 270, movementPattern: 'squat', mechanic: 'compound', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'romanian_deadlift', name: 'Romanian Deadlift', bodyGroup: 'legs', subGroup: 'Hamstrings', equipment: 'barbell', defaultSets: 4, defaultReps: 10, defaultWeightLbs: 135, movementPattern: 'hinge', mechanic: 'compound', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'leg_curl', name: 'Seated Leg Curl', bodyGroup: 'legs', subGroup: 'Hamstrings', equipment: 'machine', defaultSets: 3, defaultReps: 12, defaultWeightLbs: 90, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'leg_extension', name: 'Leg Extension', bodyGroup: 'legs', subGroup: 'Quads', equipment: 'machine', defaultSets: 3, defaultReps: 12, defaultWeightLbs: 90, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'walking_lunge', name: 'Walking Lunge', bodyGroup: 'legs', subGroup: 'Glutes', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultWeightLbs: 40, movementPattern: 'lunge', mechanic: 'compound', forceType: 'push', laterality: 'alternating' }),
  ex({ slug: 'standing_calf_raise', name: 'Standing Calf Raise', bodyGroup: 'legs', subGroup: 'Calves', equipment: 'machine', defaultSets: 4, defaultReps: 15, defaultWeightLbs: 150, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'push', laterality: 'bilateral' }),

  // ---- Arms ----
  ex({ slug: 'barbell_curl', name: 'Barbell Curl', bodyGroup: 'arms', subGroup: 'Biceps', equipment: 'barbell', defaultSets: 3, defaultReps: 10, defaultWeightLbs: 60, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'dumbbell_curl', name: 'Dumbbell Curl', bodyGroup: 'arms', subGroup: 'Biceps', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultWeightLbs: 30, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'hammer_curl', name: 'Hammer Curl', bodyGroup: 'arms', subGroup: 'Biceps', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultWeightLbs: 30, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'tricep_pushdown', name: 'Tricep Pushdown', bodyGroup: 'arms', subGroup: 'Triceps', equipment: 'cable', defaultSets: 3, defaultReps: 12, defaultWeightLbs: 60, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'overhead_tricep_extension', name: 'Overhead Tricep Extension', bodyGroup: 'arms', subGroup: 'Triceps', equipment: 'dumbbell', defaultSets: 3, defaultReps: 12, defaultWeightLbs: 40, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'skull_crusher', name: 'Skull Crusher', bodyGroup: 'arms', subGroup: 'Triceps', equipment: 'barbell', defaultSets: 3, defaultReps: 10, defaultWeightLbs: 55, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'push', laterality: 'bilateral' }),
  ex({ slug: 'bench_dip', name: 'Bench Dip', bodyGroup: 'arms', subGroup: 'Triceps', equipment: 'bodyweight', tracking: 'bodyweight_reps', defaultSets: 3, defaultReps: 15, defaultWeightLbs: null, movementPattern: 'isolation', mechanic: 'isolation', forceType: 'push', laterality: 'bilateral' }),

  // ---- Core ----
  ex({ slug: 'plank', name: 'Plank', bodyGroup: 'core', subGroup: 'Abs', equipment: 'bodyweight', tracking: 'timed', defaultSets: 3, defaultReps: null, defaultDurationSeconds: 45, defaultWeightLbs: null, movementPattern: 'core', mechanic: 'isolation', forceType: 'static', laterality: 'bilateral' }),
  ex({ slug: 'side_plank', name: 'Side Plank', bodyGroup: 'core', subGroup: 'Obliques', equipment: 'bodyweight', tracking: 'timed', defaultSets: 3, defaultReps: null, defaultDurationSeconds: 30, defaultWeightLbs: null, movementPattern: 'core', mechanic: 'isolation', forceType: 'static', laterality: 'unilateral' }),
  ex({ slug: 'hanging_leg_raise', name: 'Hanging Leg Raise', bodyGroup: 'core', subGroup: 'Abs', equipment: 'bodyweight', tracking: 'bodyweight_reps', defaultSets: 3, defaultReps: 12, defaultWeightLbs: null, movementPattern: 'core', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'crunch', name: 'Crunch', bodyGroup: 'core', subGroup: 'Abs', equipment: 'bodyweight', tracking: 'bodyweight_reps', defaultSets: 3, defaultReps: 20, defaultWeightLbs: null, movementPattern: 'core', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),
  ex({ slug: 'cable_woodchopper', name: 'Cable Woodchopper', bodyGroup: 'core', subGroup: 'Obliques', equipment: 'cable', defaultSets: 3, defaultReps: 15, defaultWeightLbs: 30, movementPattern: 'core', mechanic: 'isolation', forceType: 'pull', laterality: 'unilateral' }),
  ex({ slug: 'russian_twist', name: 'Russian Twist', bodyGroup: 'core', subGroup: 'Obliques', equipment: 'bodyweight', tracking: 'bodyweight_reps', defaultSets: 3, defaultReps: 20, defaultWeightLbs: null, movementPattern: 'core', mechanic: 'isolation', forceType: 'pull', laterality: 'bilateral' }),
]

export const EXERCISES_BY_GROUP: Record<string, MockExercise[]> = BODY_GROUPS.reduce(
  (acc, g) => {
    acc[g.slug] = EXERCISES.filter((e) => e.bodyGroup === g.slug)
    return acc
  },
  {} as Record<string, MockExercise[]>,
)

/** Ordered, unique subgroups present for a given body group. */
export function subGroupsForGroup(group: string): string[] {
  const seen: string[] = []
  for (const e of EXERCISES_BY_GROUP[group] ?? []) {
    if (!seen.includes(e.subGroup)) seen.push(e.subGroup)
  }
  return seen
}

export function getExercise(slug: string): MockExercise | undefined {
  return EXERCISES.find((e) => e.slug === slug)
}

// ---- Abbreviations for compact card display ----
export const MOVEMENT_ABBR: Record<MovementPattern, string> = {
  horizontal_push: 'H-PUSH',
  vertical_push: 'V-PUSH',
  horizontal_pull: 'H-PULL',
  vertical_pull: 'V-PULL',
  hinge: 'HINGE',
  squat: 'SQUAT',
  lunge: 'LUNGE',
  carry: 'CARRY',
  core: 'CORE',
  isolation: 'ISO',
}
export const MECHANIC_ABBR: Record<Mechanic, string> = {
  compound: 'COMP',
  isolation: 'ISO',
}
export const FORCE_ABBR: Record<ForceType, string> = {
  push: 'PUSH',
  pull: 'PULL',
  static: 'STATIC',
}
export const LATERALITY_ABBR: Record<Laterality, string> = {
  bilateral: 'BI',
  unilateral: 'UNI',
  alternating: 'ALT',
}

/**
 * Distinct, space-optimized classification tags for a card.
 * - Mechanic is omitted when it would duplicate the movement abbr (e.g. ISO/ISO).
 * - Laterality is shown only when notable (unilateral / alternating).
 */
export function classificationTags(e: MockExercise): string[] {
  const tags: string[] = [MOVEMENT_ABBR[e.movementPattern]]
  const mech = MECHANIC_ABBR[e.mechanic]
  if (mech !== tags[0]) tags.push(mech)
  tags.push(FORCE_ABBR[e.forceType])
  if (e.laterality !== 'bilateral') tags.push(LATERALITY_ABBR[e.laterality])
  return tags
}

/** Primary weight/load stat for the card badge. */
export function loadLabel(e: MockExercise): string {
  if (e.tracking === 'weight_reps' && e.defaultWeightLbs != null) {
    return `${e.defaultWeightLbs} LB`
  }
  return 'BW'
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
}
