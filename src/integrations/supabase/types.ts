export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      iitm_exam_question_bank: {
        Row: {
          id: string
          subject_id: string | null
          title: string
          description: string | null
          instructions: string | null
          exam_type: string
          set_name: string | null
          category: string | null
          max_score: number
          expected_time: number | null
          deadline: string | null
          starter_code: string | null
          test_cases: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          subject_id?: string | null
          title: string
          description?: string | null
          instructions?: string | null
          exam_type: string
          set_name?: string | null
          category?: string | null
          max_score?: number
          expected_time?: number | null
          deadline?: string | null
          starter_code?: string | null
          test_cases?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string | null
          title?: string
          description?: string | null
          instructions?: string | null
          exam_type?: string
          set_name?: string | null
          category?: string | null
          max_score?: number
          expected_time?: number | null
          deadline?: string | null
          starter_code?: string | null
          test_cases?: Json | null
          created_at?: string
        }
      }
      iitm_exam_sessions: {
        Row: {
          id: string
          user_id: string | null
          subject_id: string | null
          exam_type: string
          set_name: string | null
          status: string
          total_score: number
          questions_attempted: number
          questions_correct: number
          start_time: string | null
          end_time: string | null
          duration_seconds: number | null
          violation_count: number
          violation_logs: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          subject_id?: string | null
          exam_type: string
          set_name?: string | null
          status?: string
          total_score?: number
          questions_attempted?: number
          questions_correct?: number
          start_time?: string | null
          end_time?: string | null
          duration_seconds?: number | null
          violation_count?: number
          violation_logs?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          subject_id?: string | null
          exam_type?: string
          set_name?: string | null
          status?: string
          total_score?: number
          questions_attempted?: number
          questions_correct?: number
          start_time?: string | null
          end_time?: string | null
          duration_seconds?: number | null
          violation_count?: number
          violation_logs?: Json | null
          created_at?: string
        }
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
