{
type: "file_update",
fileName: "mishratejash01/pycoder-playground/pycoder-playground-246de1f13327eb5028899b83aed146558b7d731b/src/integrations/supabase/types.ts",
fileContent: `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string
          title: string
          description: string
          instructions: string | null
          deadline: string | null
          max_score: number | null
          category: string | null
          created_at: string | null
          updated_at: string | null
          starter_code: string | null
          expected_time: number | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          instructions?: string | null
          deadline?: string | null
          max_score?: number | null
          category?: string | null
          created_at?: string | null
          updated_at?: string | null
          starter_code?: string | null
          expected_time?: number | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          instructions?: string | null
          deadline?: string | null
          max_score?: number | null
          category?: string | null
          created_at?: string | null
          updated_at?: string | null
          starter_code?: string | null
          expected_time?: number | null
        }
      }
      iitm_exams_questions: {
        Row: {
          id: string
          subject_id: string | null
          title: string
          description: string
          instructions: string | null
          deadline: string | null
          max_score: number | null
          expected_time: number | null
          starter_code: string | null
          created_at: string | null
          exam_type: string | null
          set_name: string | null
          category: string | null
          test_cases: Json | null
        }
        Insert: {
          id?: string
          subject_id?: string | null
          title: string
          description: string
          instructions?: string | null
          deadline?: string | null
          max_score?: number | null
          expected_time?: number | null
          starter_code?: string | null
          created_at?: string | null
          exam_type?: string | null
          set_name?: string | null
          category?: string | null
          test_cases?: Json | null
        }
        Update: {
          id?: string
          subject_id?: string | null
          title?: string
          description?: string
          instructions?: string | null
          deadline?: string | null
          max_score?: number | null
          expected_time?: number | null
          starter_code?: string | null
          created_at?: string | null
          exam_type?: string | null
          set_name?: string | null
          category?: string | null
          test_cases?: Json | null
        }
      }
      iitm_exam_sessions: {
        Row: {
          id: string
          user_id: string
          subject_id: string | null
          exam_type: string | null
          set_name: string | null
          status: string | null
          total_score: number | null
          questions_attempted: number | null
          questions_correct: number | null
          start_time: string | null
          end_time: string | null
          duration_seconds: number | null
          violation_count: number | null
          violation_logs: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subject_id?: string | null
          exam_type?: string | null
          set_name?: string | null
          status?: string | null
          total_score?: number | null
          questions_attempted?: number | null
          questions_correct?: number | null
          start_time?: string | null
          end_time?: string | null
          duration_seconds?: number | null
          violation_count?: number | null
          violation_logs?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string | null
          exam_type?: string | null
          set_name?: string | null
          status?: string | null
          total_score?: number | null
          questions_attempted?: number | null
          questions_correct?: number | null
          start_time?: string | null
          end_time?: string | null
          duration_seconds?: number | null
          violation_count?: number | null
          violation_logs?: Json | null
          created_at?: string | null
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          code: string
          score: number | null
          public_tests_passed: number | null
          public_tests_total: number | null
          private_tests_passed: number | null
          private_tests_total: number | null
          submitted_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          code: string
          score?: number | null
          public_tests_passed?: number | null
          public_tests_total?: number | null
          private_tests_passed?: number | null
          private_tests_total?: number | null
          submitted_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          code?: string
          score?: number | null
          public_tests_passed?: number | null
          public_tests_total?: number | null
          private_tests_passed?: number | null
          private_tests_total?: number | null
          submitted_at?: string | null
        }
      }
      iitm_submissions: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          code: string
          score: number | null
          public_tests_passed: number | null
          public_tests_total: number | null
          private_tests_passed: number | null
          private_tests_total: number | null
          submitted_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          code: string
          score?: number | null
          public_tests_passed?: number | null
          public_tests_total?: number | null
          private_tests_passed?: number | null
          private_tests_total?: number | null
          submitted_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          code?: string
          score?: number | null
          public_tests_passed?: number | null
          public_tests_total?: number | null
          private_tests_passed?: number | null
          private_tests_total?: number | null
          submitted_at?: string | null
        }
      }
    }
  }
}
`
}
