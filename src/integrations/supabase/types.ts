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
      event_discussions: {
        Row: {
          content: string
          created_at: string | null
          event_id: string
          id: string
          parent_id: string | null
          updated_at: string | null
          upvotes: number | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_discussions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "event_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_faqs: {
        Row: {
          answer: string
          created_at: string | null
          event_id: string
          id: string
          is_pinned: boolean | null
          order_index: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          event_id: string
          id?: string
          is_pinned?: boolean | null
          order_index?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_pinned?: boolean | null
          order_index?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_faqs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          event_id: string
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gateway_signature: string | null
          id: string
          metadata: Json | null
          payment_gateway: string | null
          payment_method: string | null
          payment_status: string | null
          registration_id: string | null
          transaction_id: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          event_id: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_status?: string | null
          registration_id?: string | null
          transaction_id?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_status?: string | null
          registration_id?: string | null
          transaction_id?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_prizes: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          icon_url: string | null
          id: string
          position: number
          prize_value: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          icon_url?: string | null
          id?: string
          position: number
          prize_value?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          icon_url?: string | null
          id?: string
          position?: number
          prize_value?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_prizes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          agreed_to_privacy: boolean
          agreed_to_rules: boolean
          college_org_name: string
          country_city: string
          created_at: string | null
          current_status: string
          custom_answers: Json | null
          email: string
          event_id: string
          experience_level: string | null
          full_name: string
          github_link: string | null
          id: string
          invitation_token: string | null
          invited_by_registration_id: string | null
          linkedin_link: string | null
          mobile_number: string
          motivation_answer: string | null
          participation_type: string | null
          payment_status: string | null
          pending_leader_updates: Json | null
          preferred_track: string | null
          primary_languages: Json | null
          prior_experience: boolean | null
          resume_url: string | null
          status: string | null
          team_members_data: Json | null
          team_name: string | null
          team_role: string | null
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
          custom_answers?: Json | null
          email: string
          event_id: string
          experience_level?: string | null
          full_name: string
          github_link?: string | null
          id?: string
          invitation_token?: string | null
          invited_by_registration_id?: string | null
          linkedin_link?: string | null
          mobile_number: string
          motivation_answer?: string | null
          participation_type?: string | null
          payment_status?: string | null
          pending_leader_updates?: Json | null
          preferred_track?: string | null
          primary_languages?: Json | null
          prior_experience?: boolean | null
          resume_url?: string | null
          status?: string | null
          team_members_data?: Json | null
          team_name?: string | null
          team_role?: string | null
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
          custom_answers?: Json | null
          email?: string
          event_id?: string
          experience_level?: string | null
          full_name?: string
          github_link?: string | null
          id?: string
          invitation_token?: string | null
          invited_by_registration_id?: string | null
          linkedin_link?: string | null
          mobile_number?: string
          motivation_answer?: string | null
          participation_type?: string | null
          payment_status?: string | null
          pending_leader_updates?: Json | null
          preferred_track?: string | null
          primary_languages?: Json | null
          prior_experience?: boolean | null
          resume_url?: string | null
          status?: string | null
          team_members_data?: Json | null
          team_name?: string | null
          team_role?: string | null
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
      event_reviews: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          is_verified: boolean | null
          rating: number
          review_text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          is_verified?: boolean | null
          rating: number
          review_text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          is_verified?: boolean | null
          rating?: number
          review_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsors: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          logo_url: string | null
          name: string
          tier: string | null
          type: string
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          logo_url?: string | null
          name: string
          tier?: string | null
          type?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          logo_url?: string | null
          name?: string
          tier?: string | null
          type?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_stages: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          event_id: string
          id: string
          is_active: boolean | null
          order_index: number
          stage_type: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          order_index?: number
          stage_type?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          order_index?: number
          stage_type?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_stages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_solo: boolean | null
          category: string
          contact_email: string | null
          contact_phone: string | null
          content: string | null
          created_at: string | null
          currency: string | null
          current_participants: number | null
          custom_questions: Json | null
          eligibility_criteria: Json | null
          end_date: string
          event_type: string | null
          form_type: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_paid: boolean | null
          location: string | null
          max_participants: number | null
          max_team_size: number | null
          min_team_size: number | null
          mode: string
          organizer_logo: string | null
          organizer_name: string | null
          prize_pool: string | null
          registration_deadline: string | null
          registration_fee: number | null
          registration_link: string | null
          rules: string | null
          rules_document_url: string | null
          short_description: string
          slug: string
          start_date: string
          status: string | null
          title: string
          tracks: Json | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          allow_solo?: boolean | null
          category: string
          contact_email?: string | null
          contact_phone?: string | null
          content?: string | null
          created_at?: string | null
          currency?: string | null
          current_participants?: number | null
          custom_questions?: Json | null
          eligibility_criteria?: Json | null
          end_date: string
          event_type?: string | null
          form_type?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_paid?: boolean | null
          location?: string | null
          max_participants?: number | null
          max_team_size?: number | null
          min_team_size?: number | null
          mode: string
          organizer_logo?: string | null
          organizer_name?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_link?: string | null
          rules?: string | null
          rules_document_url?: string | null
          short_description: string
          slug: string
          start_date: string
          status?: string | null
          title: string
          tracks?: Json | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          allow_solo?: boolean | null
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          content?: string | null
          created_at?: string | null
          currency?: string | null
          current_participants?: number | null
          custom_questions?: Json | null
          eligibility_criteria?: Json | null
          end_date?: string
          event_type?: string | null
          form_type?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_paid?: boolean | null
          location?: string | null
          max_participants?: number | null
          max_team_size?: number | null
          min_team_size?: number | null
          mode?: string
          organizer_logo?: string | null
          organizer_name?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_link?: string | null
          rules?: string | null
          rules_document_url?: string | null
          short_description?: string
          slug?: string
          start_date?: string
          status?: string | null
          title?: string
          tracks?: Json | null
          updated_at?: string | null
          venue?: string | null
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
          avg_time_per_question: number | null
          browser_info: Json | null
          candidate_id: string | null
          correct_questions_count: number | null
          created_at: string | null
          environment_flags: Json | null
          exam_end_time: string | null
          exam_id: string
          exam_start_time: string | null
          exam_type: string | null
          first_question_time: string | null
          id: string
          incorrect_questions_count: number | null
          ip_address: string | null
          last_activity_time: string | null
          marks_obtained: number | null
          proctoring_events: Json | null
          questions_data: Json | null
          session_id: string | null
          set_name: string | null
          skipped_questions_count: number | null
          status: string | null
          subject_name: string | null
          submission_data: Json | null
          termination_reason: string | null
          total_attempts: number | null
          total_duration_seconds: number | null
          total_marks: number | null
          updated_at: string | null
          user_email: string | null
          user_full_name: string | null
          user_id: string
        }
        Insert: {
          avg_time_per_question?: number | null
          browser_info?: Json | null
          candidate_id?: string | null
          correct_questions_count?: number | null
          created_at?: string | null
          environment_flags?: Json | null
          exam_end_time?: string | null
          exam_id: string
          exam_start_time?: string | null
          exam_type?: string | null
          first_question_time?: string | null
          id?: string
          incorrect_questions_count?: number | null
          ip_address?: string | null
          last_activity_time?: string | null
          marks_obtained?: number | null
          proctoring_events?: Json | null
          questions_data?: Json | null
          session_id?: string | null
          set_name?: string | null
          skipped_questions_count?: number | null
          status?: string | null
          subject_name?: string | null
          submission_data?: Json | null
          termination_reason?: string | null
          total_attempts?: number | null
          total_duration_seconds?: number | null
          total_marks?: number | null
          updated_at?: string | null
          user_email?: string | null
          user_full_name?: string | null
          user_id: string
        }
        Update: {
          avg_time_per_question?: number | null
          browser_info?: Json | null
          candidate_id?: string | null
          correct_questions_count?: number | null
          created_at?: string | null
          environment_flags?: Json | null
          exam_end_time?: string | null
          exam_id?: string
          exam_start_time?: string | null
          exam_type?: string | null
          first_question_time?: string | null
          id?: string
          incorrect_questions_count?: number | null
          ip_address?: string | null
          last_activity_time?: string | null
          marks_obtained?: number | null
          proctoring_events?: Json | null
          questions_data?: Json | null
          session_id?: string | null
          set_name?: string | null
          skipped_questions_count?: number | null
          status?: string | null
          subject_name?: string | null
          submission_data?: Json | null
          termination_reason?: string | null
          total_attempts?: number | null
          total_duration_seconds?: number | null
          total_marks?: number | null
          updated_at?: string | null
          user_email?: string | null
          user_full_name?: string | null
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
      practice_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          problem_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          problem_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_bookmarks_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_discussions: {
        Row: {
          code: string | null
          content: string
          created_at: string | null
          id: string
          language: string | null
          parent_id: string | null
          problem_id: string
          title: string | null
          updated_at: string | null
          upvotes: number | null
          user_id: string
        }
        Insert: {
          code?: string | null
          content: string
          created_at?: string | null
          id?: string
          language?: string | null
          parent_id?: string | null
          problem_id: string
          title?: string | null
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
        }
        Update: {
          code?: string | null
          content?: string
          created_at?: string | null
          id?: string
          language?: string | null
          parent_id?: string | null
          problem_id?: string
          title?: string | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "practice_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_discussions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_execution_benchmarks: {
        Row: {
          id: string
          language: string
          memory_kb_p50: number | null
          memory_kb_p90: number | null
          memory_kb_p99: number | null
          problem_id: string | null
          runtime_ms_p50: number | null
          runtime_ms_p90: number | null
          runtime_ms_p99: number | null
          total_submissions: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          language: string
          memory_kb_p50?: number | null
          memory_kb_p90?: number | null
          memory_kb_p99?: number | null
          problem_id?: string | null
          runtime_ms_p50?: number | null
          runtime_ms_p90?: number | null
          runtime_ms_p99?: number | null
          total_submissions?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          language?: string
          memory_kb_p50?: number | null
          memory_kb_p90?: number | null
          memory_kb_p99?: number | null
          problem_id?: string | null
          runtime_ms_p50?: number | null
          runtime_ms_p90?: number | null
          runtime_ms_p99?: number | null
          total_submissions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_execution_benchmarks_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          problem_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          problem_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          problem_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_notes_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_problems: {
        Row: {
          acceptance_rate: number | null
          companies: string[] | null
          created_at: string | null
          description: string
          difficulty: string | null
          dislikes: number | null
          editorial: string | null
          hints: Json | null
          id: string
          is_daily: boolean | null
          likes: number | null
          method_signature: Json | null
          order_index: number | null
          similar_problems: string[] | null
          slug: string
          space_complexity: string | null
          starter_templates: Json | null
          tags: string[] | null
          test_cases: Json | null
          time_complexity: string | null
          title: string
          total_accepted: number | null
          total_submissions: number | null
        }
        Insert: {
          acceptance_rate?: number | null
          companies?: string[] | null
          created_at?: string | null
          description: string
          difficulty?: string | null
          dislikes?: number | null
          editorial?: string | null
          hints?: Json | null
          id?: string
          is_daily?: boolean | null
          likes?: number | null
          method_signature?: Json | null
          order_index?: number | null
          similar_problems?: string[] | null
          slug: string
          space_complexity?: string | null
          starter_templates?: Json | null
          tags?: string[] | null
          test_cases?: Json | null
          time_complexity?: string | null
          title: string
          total_accepted?: number | null
          total_submissions?: number | null
        }
        Update: {
          acceptance_rate?: number | null
          companies?: string[] | null
          created_at?: string | null
          description?: string
          difficulty?: string | null
          dislikes?: number | null
          editorial?: string | null
          hints?: Json | null
          id?: string
          is_daily?: boolean | null
          likes?: number | null
          method_signature?: Json | null
          order_index?: number | null
          similar_problems?: string[] | null
          slug?: string
          space_complexity?: string | null
          starter_templates?: Json | null
          tags?: string[] | null
          test_cases?: Json | null
          time_complexity?: string | null
          title?: string
          total_accepted?: number | null
          total_submissions?: number | null
        }
        Relationships: []
      }
      practice_reactions: {
        Row: {
          created_at: string | null
          id: string
          problem_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          problem_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          problem_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_reactions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_streaks: {
        Row: {
          current_streak: number | null
          id: string
          last_solved_at: string | null
          longest_streak: number | null
          streak_dates: string[] | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_solved_at?: string | null
          longest_streak?: number | null
          streak_dates?: string[] | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_solved_at?: string | null
          longest_streak?: number | null
          streak_dates?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      practice_submissions: {
        Row: {
          code: string | null
          error_message: string | null
          error_type: string | null
          execution_time_ms: number | null
          failed_test_index: number | null
          feedback_message: string | null
          id: string
          language: string | null
          memory_kb: number | null
          memory_percentile: number | null
          problem_id: string | null
          runtime_ms: number | null
          runtime_percentile: number | null
          score: number | null
          status: string | null
          submitted_at: string | null
          test_cases_passed: number | null
          test_cases_total: number | null
          user_id: string | null
          verdict: string | null
        }
        Insert: {
          code?: string | null
          error_message?: string | null
          error_type?: string | null
          execution_time_ms?: number | null
          failed_test_index?: number | null
          feedback_message?: string | null
          id?: string
          language?: string | null
          memory_kb?: number | null
          memory_percentile?: number | null
          problem_id?: string | null
          runtime_ms?: number | null
          runtime_percentile?: number | null
          score?: number | null
          status?: string | null
          submitted_at?: string | null
          test_cases_passed?: number | null
          test_cases_total?: number | null
          user_id?: string | null
          verdict?: string | null
        }
        Update: {
          code?: string | null
          error_message?: string | null
          error_type?: string | null
          execution_time_ms?: number | null
          failed_test_index?: number | null
          feedback_message?: string | null
          id?: string
          language?: string | null
          memory_kb?: number | null
          memory_percentile?: number | null
          problem_id?: string | null
          runtime_ms?: number | null
          runtime_percentile?: number | null
          score?: number | null
          status?: string | null
          submitted_at?: string | null
          test_cases_passed?: number | null
          test_cases_total?: number | null
          user_id?: string | null
          verdict?: string | null
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
          total_time_spent_minutes: number | null
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
          total_time_spent_minutes?: number | null
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
          total_time_spent_minutes?: number | null
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
      team_invitations: {
        Row: {
          created_at: string | null
          event_id: string
          expires_at: string | null
          id: string
          invitee_email: string
          invitee_mobile: string | null
          invitee_name: string | null
          inviter_email: string
          inviter_name: string
          inviter_user_id: string | null
          message: string | null
          registration_id: string | null
          responded_at: string | null
          role: string | null
          status: string | null
          team_name: string
          token: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          expires_at?: string | null
          id?: string
          invitee_email: string
          invitee_mobile?: string | null
          invitee_name?: string | null
          inviter_email: string
          inviter_name: string
          inviter_user_id?: string | null
          message?: string | null
          registration_id?: string | null
          responded_at?: string | null
          role?: string | null
          status?: string | null
          team_name: string
          token: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          expires_at?: string | null
          id?: string
          invitee_email?: string
          invitee_mobile?: string | null
          invitee_name?: string | null
          inviter_email?: string
          inviter_name?: string
          inviter_user_id?: string | null
          message?: string | null
          registration_id?: string | null
          responded_at?: string | null
          role?: string | null
          status?: string | null
          team_name?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_availability: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean
          message: string | null
          section_key: string
          section_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean
          message?: string | null
          section_key: string
          section_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean
          message?: string | null
          section_key?: string
          section_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
    }
    Functions: {
      calculate_memory_percentile: {
        Args: { p_language: string; p_memory_kb: number; p_problem_id: string }
        Returns: number
      }
      calculate_runtime_percentile: {
        Args: { p_language: string; p_problem_id: string; p_runtime_ms: number }
        Returns: number
      }
      check_user_registration: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: {
          is_registered: boolean
          participation_type: string
          payment_status: string
          registration_id: string
          team_name: string
          team_role: string
        }[]
      }
      generate_invitation_token: { Args: never; Returns: string }
      get_my_event_access_status: {
        Args: { p_event_id: string }
        Returns: Json
      }
      get_practice_leaderboard: {
        Args: { p_limit?: number; p_timeframe?: string }
        Returns: {
          avatar_url: string
          current_streak: number
          full_name: string
          last_active: string
          longest_streak: number
          problems_solved: number
          time_spent_minutes: number
          total_score: number
          total_submissions: number
          user_id: string
          username: string
        }[]
      }
      update_time_spent: { Args: { p_minutes?: number }; Returns: undefined }
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
