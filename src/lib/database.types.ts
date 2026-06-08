export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_group: {
        Row: {
          created_at: string
          icon: string | null
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      body_sub_group: {
        Row: {
          body_group_slug: string
          created_at: string
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          body_group_slug: string
          created_at?: string
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          body_group_slug?: string
          created_at?: string
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "body_sub_group_body_group_slug_fkey"
            columns: ["body_group_slug"]
            isOneToOne: false
            referencedRelation: "body_group"
            referencedColumns: ["slug"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      exercise: {
        Row: {
          ai_model: string | null
          body_group_slug: string
          body_sub_group_slug: string | null
          created_at: string
          default_duration_seconds: number | null
          default_end_rest_seconds: number
          default_reps: number | null
          default_set_rest_seconds: number
          default_sets: number
          default_weight_lbs: number | null
          embedding: string | null
          equipment_slug: string | null
          force_type: Database["public"]["Enums"]["force_type"] | null
          image_url: string | null
          instructions: string | null
          is_archived: boolean
          is_verified: boolean
          laterality: Database["public"]["Enums"]["laterality"]
          mechanic: Database["public"]["Enums"]["mechanic"] | null
          movement_pattern:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          name: string
          name_normalized: string
          slug: string
          source: string
          tracking_type: Database["public"]["Enums"]["tracking_type"]
          updated_at: string
          weight_increment_lbs: number | null
        }
        Insert: {
          ai_model?: string | null
          body_group_slug: string
          body_sub_group_slug?: string | null
          created_at?: string
          default_duration_seconds?: number | null
          default_end_rest_seconds?: number
          default_reps?: number | null
          default_set_rest_seconds?: number
          default_sets?: number
          default_weight_lbs?: number | null
          embedding?: string | null
          equipment_slug?: string | null
          force_type?: Database["public"]["Enums"]["force_type"] | null
          image_url?: string | null
          instructions?: string | null
          is_archived?: boolean
          is_verified?: boolean
          laterality?: Database["public"]["Enums"]["laterality"]
          mechanic?: Database["public"]["Enums"]["mechanic"] | null
          movement_pattern?:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          name: string
          name_normalized: string
          slug: string
          source?: string
          tracking_type?: Database["public"]["Enums"]["tracking_type"]
          updated_at?: string
          weight_increment_lbs?: number | null
        }
        Update: {
          ai_model?: string | null
          body_group_slug?: string
          body_sub_group_slug?: string | null
          created_at?: string
          default_duration_seconds?: number | null
          default_end_rest_seconds?: number
          default_reps?: number | null
          default_set_rest_seconds?: number
          default_sets?: number
          default_weight_lbs?: number | null
          embedding?: string | null
          equipment_slug?: string | null
          force_type?: Database["public"]["Enums"]["force_type"] | null
          image_url?: string | null
          instructions?: string | null
          is_archived?: boolean
          is_verified?: boolean
          laterality?: Database["public"]["Enums"]["laterality"]
          mechanic?: Database["public"]["Enums"]["mechanic"] | null
          movement_pattern?:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          name?: string
          name_normalized?: string
          slug?: string
          source?: string
          tracking_type?: Database["public"]["Enums"]["tracking_type"]
          updated_at?: string
          weight_increment_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_body_group_slug_fkey"
            columns: ["body_group_slug"]
            isOneToOne: false
            referencedRelation: "body_group"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "exercise_body_sub_group_slug_fkey"
            columns: ["body_sub_group_slug"]
            isOneToOne: false
            referencedRelation: "body_sub_group"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "exercise_equipment_slug_fkey"
            columns: ["equipment_slug"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["slug"]
          },
        ]
      }
      exercise_candidate: {
        Row: {
          ai_model: string | null
          created_at: string
          embedding: string | null
          id: string
          matched_exercise_slug: string | null
          name: string
          name_normalized: string
          prompt: string | null
          proposed: Json
          similarity: number | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          matched_exercise_slug?: string | null
          name: string
          name_normalized: string
          prompt?: string | null
          proposed: Json
          similarity?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          matched_exercise_slug?: string | null
          name?: string
          name_normalized?: string
          prompt?: string | null
          proposed?: Json
          similarity?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_candidate_matched_exercise_slug_fkey"
            columns: ["matched_exercise_slug"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["slug"]
          },
        ]
      }
      exercise_relationship: {
        Row: {
          created_at: string
          from_slug: string
          note: string | null
          to_slug: string
          type: Database["public"]["Enums"]["relationship_type"]
        }
        Insert: {
          created_at?: string
          from_slug: string
          note?: string | null
          to_slug: string
          type: Database["public"]["Enums"]["relationship_type"]
        }
        Update: {
          created_at?: string
          from_slug?: string
          note?: string | null
          to_slug?: string
          type?: Database["public"]["Enums"]["relationship_type"]
        }
        Relationships: [
          {
            foreignKeyName: "exercise_relationship_from_slug_fkey"
            columns: ["from_slug"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "exercise_relationship_to_slug_fkey"
            columns: ["to_slug"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["slug"]
          },
        ]
      }
      scheduled_workout: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          scheduled_date: string
          session_id: string | null
          status: string
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date: string
          session_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          session_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_workout_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_workout_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout"
            referencedColumns: ["id"]
          },
        ]
      }
      session_event: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          occurred_at: string
          payload: Json
          session_exercise_id: string | null
          session_id: string
          session_set_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          occurred_at?: string
          payload?: Json
          session_exercise_id?: string | null
          session_id: string
          session_set_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          occurred_at?: string
          payload?: Json
          session_exercise_id?: string | null
          session_id?: string
          session_set_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_event_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_event_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_event_session_set_id_fkey"
            columns: ["session_set_id"]
            isOneToOne: false
            referencedRelation: "session_set"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercise: {
        Row: {
          created_at: string
          ended_at: string | null
          exercise_name_snapshot: string
          exercise_slug: string
          group_id: string | null
          id: string
          laterality: Database["public"]["Enums"]["laterality"]
          planned_end_rest_seconds: number
          planned_set_rest_seconds: number
          position: number
          session_id: string
          source_workout_exercise_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["set_status"]
          tracking_type: Database["public"]["Enums"]["tracking_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          exercise_name_snapshot: string
          exercise_slug: string
          group_id?: string | null
          id?: string
          laterality: Database["public"]["Enums"]["laterality"]
          planned_end_rest_seconds: number
          planned_set_rest_seconds: number
          position: number
          session_id: string
          source_workout_exercise_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["set_status"]
          tracking_type: Database["public"]["Enums"]["tracking_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          exercise_name_snapshot?: string
          exercise_slug?: string
          group_id?: string | null
          id?: string
          laterality?: Database["public"]["Enums"]["laterality"]
          planned_end_rest_seconds?: number
          planned_set_rest_seconds?: number
          position?: number
          session_id?: string
          source_workout_exercise_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["set_status"]
          tracking_type?: Database["public"]["Enums"]["tracking_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercise_exercise_slug_fkey"
            columns: ["exercise_slug"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "session_exercise_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercise_source_workout_exercise_id_fkey"
            columns: ["source_workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercise"
            referencedColumns: ["id"]
          },
        ]
      }
      session_set: {
        Row: {
          actual_duration_seconds: number | null
          actual_reps: number | null
          actual_rest_seconds: number | null
          actual_rpe: number | null
          actual_weight_lbs: number | null
          completed_at: string | null
          created_at: string
          id: string
          planned_duration_seconds: number | null
          planned_reps: number | null
          planned_rest_seconds: number
          planned_weight_lbs: number | null
          session_exercise_id: string
          set_number: number
          set_role: Database["public"]["Enums"]["set_role"]
          started_at: string | null
          status: Database["public"]["Enums"]["set_status"]
          updated_at: string
        }
        Insert: {
          actual_duration_seconds?: number | null
          actual_reps?: number | null
          actual_rest_seconds?: number | null
          actual_rpe?: number | null
          actual_weight_lbs?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          planned_duration_seconds?: number | null
          planned_reps?: number | null
          planned_rest_seconds: number
          planned_weight_lbs?: number | null
          session_exercise_id: string
          set_number: number
          set_role?: Database["public"]["Enums"]["set_role"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["set_status"]
          updated_at?: string
        }
        Update: {
          actual_duration_seconds?: number | null
          actual_reps?: number | null
          actual_rest_seconds?: number | null
          actual_rpe?: number | null
          actual_weight_lbs?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          planned_duration_seconds?: number | null
          planned_reps?: number | null
          planned_rest_seconds?: number
          planned_weight_lbs?: number | null
          session_exercise_id?: string
          set_number?: number
          set_role?: Database["public"]["Enums"]["set_role"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["set_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_set_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercise"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercise_score: {
        Row: {
          created_at: string
          effective_at: string
          exercise_slug: string
          id: string
          intensity_score: number | null
          note: string | null
          preference_score: number | null
          session_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effective_at?: string
          exercise_slug: string
          id?: string
          intensity_score?: number | null
          note?: string | null
          preference_score?: number | null
          session_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effective_at?: string
          exercise_slug?: string
          id?: string
          intensity_score?: number | null
          note?: string | null
          preference_score?: number | null
          session_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_score_exercise_slug_fkey"
            columns: ["exercise_slug"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "user_exercise_score_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_session"
            referencedColumns: ["id"]
          },
        ]
      }
      workout: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_exercise: {
        Row: {
          created_at: string
          exercise_slug: string
          group_id: string | null
          id: string
          notes: string | null
          planned_duration_seconds: number | null
          planned_end_rest_seconds: number
          planned_reps: number | null
          planned_set_rest_seconds: number
          planned_sets: number
          planned_weight_lbs: number | null
          position: number
          tracking_type: Database["public"]["Enums"]["tracking_type"]
          updated_at: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_slug: string
          group_id?: string | null
          id?: string
          notes?: string | null
          planned_duration_seconds?: number | null
          planned_end_rest_seconds: number
          planned_reps?: number | null
          planned_set_rest_seconds: number
          planned_sets: number
          planned_weight_lbs?: number | null
          position: number
          tracking_type: Database["public"]["Enums"]["tracking_type"]
          updated_at?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_slug?: string
          group_id?: string | null
          id?: string
          notes?: string | null
          planned_duration_seconds?: number | null
          planned_end_rest_seconds?: number
          planned_reps?: number | null
          planned_set_rest_seconds?: number
          planned_sets?: number
          planned_weight_lbs?: number | null
          position?: number
          tracking_type?: Database["public"]["Enums"]["tracking_type"]
          updated_at?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_exercise_slug_fkey"
            columns: ["exercise_slug"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "workout_exercise_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          perceived_effort: number | null
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          total_active_seconds: number | null
          total_rest_seconds: number | null
          updated_at: string
          user_id: string
          workout_id: string
          workout_name_snapshot: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          total_active_seconds?: number | null
          total_rest_seconds?: number | null
          updated_at?: string
          user_id: string
          workout_id: string
          workout_name_snapshot: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          total_active_seconds?: number | null
          total_rest_seconds?: number | null
          updated_at?: string
          user_id?: string
          workout_id?: string
          workout_name_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workout"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_set: {
        Row: {
          created_at: string
          id: string
          set_number: number
          set_rest_seconds: number | null
          set_role: Database["public"]["Enums"]["set_role"]
          target_duration_seconds: number | null
          target_reps: number | null
          target_weight_lbs: number | null
          updated_at: string
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          set_number: number
          set_rest_seconds?: number | null
          set_role?: Database["public"]["Enums"]["set_role"]
          target_duration_seconds?: number | null
          target_reps?: number | null
          target_weight_lbs?: number | null
          updated_at?: string
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          id?: string
          set_number?: number
          set_rest_seconds?: number | null
          set_role?: Database["public"]["Enums"]["set_role"]
          target_duration_seconds?: number | null
          target_reps?: number | null
          target_weight_lbs?: number | null
          updated_at?: string
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_set_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercise"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      current_exercise_score: {
        Row: {
          effective_at: string | null
          exercise_slug: string | null
          intensity_score: number | null
          preference_score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_score_exercise_slug_fkey"
            columns: ["exercise_slug"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_exercise_last_performed: {
        Row: {
          actual_duration_seconds: number | null
          actual_reps: number | null
          actual_weight_lbs: number | null
          exercise_slug: string | null
          performed_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercise_exercise_slug_fkey"
            columns: ["exercise_slug"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_type:
        | "weight_changed"
        | "reps_changed"
        | "rest_changed"
        | "set_added"
        | "set_removed"
        | "exercise_skipped"
        | "set_completed"
        | "paused"
        | "resumed"
      force_type: "push" | "pull" | "static"
      laterality: "bilateral" | "unilateral" | "alternating"
      mechanic: "compound" | "isolation"
      movement_pattern:
        | "horizontal_push"
        | "vertical_push"
        | "horizontal_pull"
        | "vertical_pull"
        | "hinge"
        | "squat"
        | "lunge"
        | "carry"
        | "core"
        | "isolation"
      relationship_type:
        | "progression"
        | "regression"
        | "substitute"
        | "variation_of"
        | "antagonist"
      session_status: "in_progress" | "completed" | "abandoned"
      set_role: "working" | "warmup" | "cooldown"
      set_status: "pending" | "completed" | "skipped"
      tracking_type:
        | "weight_reps"
        | "bodyweight_reps"
        | "timed"
        | "distance_time"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_type: [
        "weight_changed",
        "reps_changed",
        "rest_changed",
        "set_added",
        "set_removed",
        "exercise_skipped",
        "set_completed",
        "paused",
        "resumed",
      ],
      force_type: ["push", "pull", "static"],
      laterality: ["bilateral", "unilateral", "alternating"],
      mechanic: ["compound", "isolation"],
      movement_pattern: [
        "horizontal_push",
        "vertical_push",
        "horizontal_pull",
        "vertical_pull",
        "hinge",
        "squat",
        "lunge",
        "carry",
        "core",
        "isolation",
      ],
      relationship_type: [
        "progression",
        "regression",
        "substitute",
        "variation_of",
        "antagonist",
      ],
      session_status: ["in_progress", "completed", "abandoned"],
      set_role: ["working", "warmup", "cooldown"],
      set_status: ["pending", "completed", "skipped"],
      tracking_type: [
        "weight_reps",
        "bodyweight_reps",
        "timed",
        "distance_time",
      ],
    },
  },
} as const
