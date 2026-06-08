import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced early so a misconfigured deploy fails loudly instead of silently.
  console.warn(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local (and in Vercel project settings).',
  )
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseAnonKey ?? '')

// --- Convenience aliases (Row / Insert / Update / Enums) ------------------
import type { Tables, TablesInsert, TablesUpdate, Enums } from './database.types'

// Catalog layer
export type Exercise = Tables<'exercise'>
export type ExerciseRelationship = Tables<'exercise_relationship'>
export type ExerciseCandidate = Tables<'exercise_candidate'>
export type BodyGroup = Tables<'body_group'>
export type BodySubGroup = Tables<'body_sub_group'>
export type Equipment = Tables<'equipment'>

// Plan layer
export type Workout = Tables<'workout'>
export type WorkoutExercise = Tables<'workout_exercise'>
export type WorkoutSet = Tables<'workout_set'>

// Log layer
export type WorkoutSession = Tables<'workout_session'>
export type SessionExercise = Tables<'session_exercise'>
export type SessionSet = Tables<'session_set'>
export type SessionEvent = Tables<'session_event'>

// Tracker (calendar scheduling)
export type ScheduledWorkout = Tables<'scheduled_workout'>
export type ScheduledWorkoutInsert = TablesInsert<'scheduled_workout'>

// Scores + derived views
export type UserExerciseScore = Tables<'user_exercise_score'>
export type CurrentExerciseScore = Tables<'current_exercise_score'>
export type UserExerciseLastPerformed = Tables<'user_exercise_last_performed'>

// Insert / Update payloads for the tables app code writes most
export type WorkoutInsert = TablesInsert<'workout'>
export type WorkoutExerciseInsert = TablesInsert<'workout_exercise'>
export type WorkoutSetInsert = TablesInsert<'workout_set'>
export type WorkoutSessionInsert = TablesInsert<'workout_session'>
export type SessionExerciseInsert = TablesInsert<'session_exercise'>
export type SessionSetInsert = TablesInsert<'session_set'>
export type SessionSetUpdate = TablesUpdate<'session_set'>
export type SessionEventInsert = TablesInsert<'session_event'>
export type UserExerciseScoreInsert = TablesInsert<'user_exercise_score'>

// Enums
export type TrackingType = Enums<'tracking_type'>
export type MovementPattern = Enums<'movement_pattern'>
export type Mechanic = Enums<'mechanic'>
export type ForceType = Enums<'force_type'>
export type Laterality = Enums<'laterality'>
export type RelationshipType = Enums<'relationship_type'>
export type SessionStatus = Enums<'session_status'>
export type SetStatus = Enums<'set_status'>
export type SetRole = Enums<'set_role'>
export type EventType = Enums<'event_type'>
