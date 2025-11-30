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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          category: string | null
          created_at: string | null
          deadline: string | null
          description: string
          expected_time: number | null
          id: string
          instructions: string | null
          max_score: number | null
          starter_code: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          expected_time?: number | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          starter_code?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          expected_time?: number | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          starter_code?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_sessions: {
        Row: {
          avg_attempts_per_correct: number | null
          created_at: string | null
          duration_seconds: number | null
          end_time: string | null
          full_name: string | null
          id: string
          questions_attempted: number | null
          questions_correct: number | null
          start_time: string | null
          status: string | null
          total_attempts: number | null
          total_questions: number | null
          total_score: number | null
          user_email: string | null
          user_id: string
          violation_count: number | null
          violation_logs: Json | null
        }
        Insert: {
          avg_attempts_per_correct?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          full_name?: string | null
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          start_time?: string | null
          status?: string | null
          total_attempts?: number | null
          total_questions?: number | null
          total_score?: number | null
          user_email?: string | null
          user_id: string
          violation_count?: number | null
          violation_logs?: Json | null
        }
        Update: {
          avg_attempts_per_correct?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          full_name?: string | null
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          start_time?: string | null
          status?: string | null
          total_attempts?: number | null
          total_questions?: number | null
          total_score?: number | null
          user_email?: string | null
          user_id?: string
          violation_count?: number | null
          violation_logs?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch: string | null
          contact_no: string | null
          created_at: string | null
          experience_level: string | null
          full_name: string | null
          github_handle: string | null
          id: string
          last_seen_at: string | null
          linkedin_url: string | null
          university: string | null
          updated_at: string | null
          username: string | null
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          branch?: string | null
          contact_no?: string | null
          created_at?: string | null
          experience_level?: string | null
          full_name?: string | null
          github_handle?: string | null
          id: string
          last_seen_at?: string | null
          linkedin_url?: string | null
          university?: string | null
          updated_at?: string | null
          username?: string | null
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          branch?: string | null
          contact_no?: string | null
          created_at?: string | null
          experience_level?: string | null
          full_name?: string | null
          github_handle?: string | null
          id?: string
          last_seen_at?: string | null
          linkedin_url?: string | null
          university?: string | null
          updated_at?: string | null
          username?: string | null
          year_of_study?: number | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          code: string
          contact_no: string | null
          id: string
          private_tests_passed: number | null
          private_tests_total: number | null
          public_tests_passed: number | null
          public_tests_total: number | null
          score: number | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          code: string
          contact_no?: string | null
          id?: string
          private_tests_passed?: number | null
          private_tests_total?: number | null
          public_tests_passed?: number | null
          public_tests_total?: number | null
          score?: number | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          code?: string
          contact_no?: string | null
          id?: string
          private_tests_passed?: number | null
          private_tests_total?: number | null
          public_tests_passed?: number | null
          public_tests_total?: number | null
          score?: number | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          assignment_id: string
          created_at: string | null
          expected_output: string
          id: string
          input: string
          is_public: boolean | null
          weight: number | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          expected_output: string
          id?: string
          input: string
          is_public?: boolean | null
          weight?: number | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          expected_output?: string
          id?: string
          input?: string
          is_public?: boolean | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
