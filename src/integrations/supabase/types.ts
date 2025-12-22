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
      announcements: {
        Row: {
          button_text: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          link: string | null
          message: string
          page_route: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          link?: string | null
          message: string
          page_route?: string
        }
        Update: {
          button_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          link?: string | null
          message?: string
          page_route?: string
        }
        Relationships: []
      }
      app_routes: {
        Row: {
          last_seen_at: string | null
          name: string | null
          path: string
        }
        Insert: {
          last_seen_at?: string | null
          name?: string | null
          path: string
        }
        Update: {
          last_seen_at?: string | null
          name?: string | null
          path?: string
        }
        Relationships: []
      }
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
      event_registrations: {
        Row: {
          agreed_to_privacy: boolean
          agreed_to_rules: boolean
          college_org_name: string
          country_city: string
          created_at: string | null
          current_status: string
          email: string
          event_id: string
          experience_level: string | null
          full_name: string
          github_link: string | null
          id: string
          linkedin_link: string | null
          mobile_number: string
          motivation_answer: string | null
          participation_type: string | null
          preferred_track: string | null
          primary_languages: Json | null
          prior_experience: boolean | null
          resume_url: string | null
          status: string | null
          team_members_data: Json | null
          team_name: string | null
          tech_stack_skills: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agreed_to_privacy?: boolean
          agreed_to_rules?: boolean
          college_org_name: string
          country_city: string
          created_at?: string | null
          current_status: string
          email: string
          event_id: string
          experience_level?: string | null
          full_name: string
          github_link?: string | null
          id?: string
          linkedin_link?: string | null
          mobile_number: string
          motivation_answer?: string | null
          participation_type?: string | null
          preferred_track?: string | null
          primary_languages?: Json | null
          prior_experience?: boolean | null
          resume_url?: string | null
          status?: string | null
          team_members_data?: Json | null
          team_name?: string | null
          tech_stack_skills?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agreed_to_privacy?: boolean
          agreed_to_rules?: boolean
          college_org_name?: string
          country_city?: string
          created_at?: string | null
          current_status?: string
          email?: string
          event_id?: string
          experience_level?: string | null
          full_name?: string
          github_link?: string | null
          id?: string
          linkedin_link?: string | null
          mobile_number?: string
          motivation_answer?: string | null
          participation_type?: string | null
          preferred_track?: string | null
          primary_languages?: Json | null
          prior_experience?: boolean | null
          resume_url?: string | null
          status?: string | null
          team_members_data?: Json | null
          team_name?: string | null
          tech_stack_skills?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          content: string | null
          created_at: string | null
          current_participants: number | null
          end_date: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          location: string | null
          max_participants: number | null
          mode: string
          prize_pool: string | null
          registration_deadline: string | null
          registration_link: string | null
          short_description: string
          slug: string
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string | null
          current_participants?: number | null
          end_date: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          max_participants?: number | null
          mode: string
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_link?: string | null
          short_description: string
          slug: string
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string | null
          current_participants?: number | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          max_participants?: number | null
          mode?: string
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_link?: string | null
          short_description?: string
          slug?: string
          start_date?: string
          status?: string | null
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
      iitm_assignments: {
        Row: {
          category: string | null
          created_at: string | null
          deadline: string | null
          description: string
          exam_type: string | null
          expected_time: number | null
          id: string
          instructions: string | null
          is_unlocked: boolean | null
          max_score: number | null
          private_testcases: Json | null
          set_name: string | null
          starter_code: string | null
          subject_id: string | null
          test_cases: Json | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          exam_type?: string | null
          expected_time?: number | null
          id?: string
          instructions?: string | null
          is_unlocked?: boolean | null
          max_score?: number | null
          private_testcases?: Json | null
          set_name?: string | null
          starter_code?: string | null
          subject_id?: string | null
          test_cases?: Json | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          exam_type?: string | null
          expected_time?: number | null
          id?: string
          instructions?: string | null
          is_unlocked?: boolean | null
          max_score?: number | null
          private_testcases?: Json | null
          set_name?: string | null
          starter_code?: string | null
          subject_id?: string | null
          test_cases?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "iitm_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "iitm_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      iitm_degrees: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      iitm_exam_question_bank: {
        Row: {
          category: string | null
          created_at: string | null
          deadline: string | null
          description: string
          exam_type: string | null
          expected_time: number | null
          id: string
          instructions: string | null
          max_score: number | null
          private_testcases: Json | null
          sequence_number: number | null
          set_name: string | null
          starter_code: string | null
          subject_id: string | null
          test_cases: Json | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          exam_type?: string | null
          expected_time?: number | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          private_testcases?: Json | null
          sequence_number?: number | null
          set_name?: string | null
          starter_code?: string | null
          subject_id?: string | null
          test_cases?: Json | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          exam_type?: string | null
          expected_time?: number | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          private_testcases?: Json | null
          sequence_number?: number | null
          set_name?: string | null
          starter_code?: string | null
          subject_id?: string | null
          test_cases?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "iitm_exam_question_bank_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "iitm_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      iitm_exam_sessions: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          end_time: string | null
          exam_type: string
          id: string
          questions_attempted: number | null
          questions_correct: number | null
          set_name: string
          start_time: string | null
          status: string | null
          subject_id: string | null
          total_score: number | null
          user_id: string | null
          violation_count: number | null
          violation_logs: Json | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          exam_type: string
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          set_name: string
          start_time?: string | null
          status?: string | null
          subject_id?: string | null
          total_score?: number | null
          user_id?: string | null
          violation_count?: number | null
          violation_logs?: Json | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          exam_type?: string
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          set_name?: string
          start_time?: string | null
          status?: string | null
          subject_id?: string | null
          total_score?: number | null
          user_id?: string | null
          violation_count?: number | null
          violation_logs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "iitm_exam_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "iitm_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      iitm_exam_submission: {
        Row: {
          correct_questions_count: number | null
          created_at: string | null
          exam_id: string
          id: string
          incorrect_questions_count: number | null
          marks_obtained: number | null
          skipped_questions_count: number | null
          status: string | null
          submission_data: Json | null
          termination_reason: string | null
          total_marks: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correct_questions_count?: number | null
          created_at?: string | null
          exam_id: string
          id?: string
          incorrect_questions_count?: number | null
          marks_obtained?: number | null
          skipped_questions_count?: number | null
          status?: string | null
          submission_data?: Json | null
          termination_reason?: string | null
          total_marks?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correct_questions_count?: number | null
          created_at?: string | null
          exam_id?: string
          id?: string
          incorrect_questions_count?: number | null
          marks_obtained?: number | null
          skipped_questions_count?: number | null
          status?: string | null
          submission_data?: Json | null
          termination_reason?: string | null
          total_marks?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      iitm_levels: {
        Row: {
          created_at: string | null
          degree_id: string
          id: string
          name: string
          sequence: number | null
        }
        Insert: {
          created_at?: string | null
          degree_id: string
          id?: string
          name: string
          sequence?: number | null
        }
        Update: {
          created_at?: string | null
          degree_id?: string
          id?: string
          name?: string
          sequence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "iitm_levels_degree_id_fkey"
            columns: ["degree_id"]
            isOneToOne: false
            referencedRelation: "iitm_degrees"
            referencedColumns: ["id"]
          },
        ]
      }
      iitm_subjects: {
        Row: {
          created_at: string | null
          id: string
          is_unlocked: boolean | null
          level_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          level_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          level_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "iitm_subjects_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "iitm_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      iitm_submissions: {
        Row: {
          assignment_id: string | null
          code: string
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
          assignment_id?: string | null
          code: string
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
          assignment_id?: string | null
          code?: string
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
            foreignKeyName: "iitm_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "iitm_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          id: string
          is_locked: boolean | null
          name: string
        }
        Insert: {
          id: string
          is_locked?: boolean | null
          name: string
        }
        Update: {
          id?: string
          is_locked?: boolean | null
          name?: string
        }
        Relationships: []
      }
      master_data: {
        Row: {
          category: string
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category: string
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      practice_problems: {
        Row: {
          created_at: string | null
          description: string
          difficulty: string | null
          id: string
          slug: string
          starter_templates: Json | null
          tags: string[] | null
          test_cases: Json | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          difficulty?: string | null
          id?: string
          slug: string
          starter_templates?: Json | null
          tags?: string[] | null
          test_cases?: Json | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          difficulty?: string | null
          id?: string
          slug?: string
          starter_templates?: Json | null
          tags?: string[] | null
          test_cases?: Json | null
          title?: string
        }
        Relationships: []
      }
      practice_submissions: {
        Row: {
          code: string | null
          id: string
          language: string | null
          problem_id: string | null
          score: number | null
          status: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          code?: string | null
          id?: string
          language?: string | null
          problem_id?: string | null
          score?: number | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string | null
          id?: string
          language?: string | null
          problem_id?: string | null
          score?: number | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_topics: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch: string | null
          contact_no: string | null
          country: string | null
          country_code: string | null
          cover_url: string | null
          created_at: string | null
          degree: string | null
          end_year: number | null
          experience_level: string | null
          full_name: string | null
          github_handle: string | null
          id: string
          institute_name: string | null
          institute_type: string | null
          last_seen_at: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          start_year: number | null
          university: string | null
          updated_at: string | null
          username: string | null
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          contact_no?: string | null
          country?: string | null
          country_code?: string | null
          cover_url?: string | null
          created_at?: string | null
          degree?: string | null
          end_year?: number | null
          experience_level?: string | null
          full_name?: string | null
          github_handle?: string | null
          id: string
          institute_name?: string | null
          institute_type?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          start_year?: number | null
          university?: string | null
          updated_at?: string | null
          username?: string | null
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          contact_no?: string | null
          country?: string | null
          country_code?: string | null
          cover_url?: string | null
          created_at?: string | null
          degree?: string | null
          end_year?: number | null
          experience_level?: string | null
          full_name?: string | null
          github_handle?: string | null
          id?: string
          institute_name?: string | null
          institute_type?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          start_year?: number | null
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
    }
    Views: {
      iitm_leaderboard: {
        Row: {
          duration_seconds: number | null
          end_time: string | null
          exam_type: string | null
          rank: number | null
          session_id: string | null
          set_name: string | null
          subject_id: string | null
          total_score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iitm_exam_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "iitm_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_leaderboard: {
        Row: {
          full_name: string | null
          month: string | null
          questions_correct: number | null
          total_score: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
