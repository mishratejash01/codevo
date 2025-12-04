export type Json =
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
      iitm_assignments: {
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
          test_cases: Json | null // <--- NEW COLUMN
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
          test_cases?: Json | null // <--- NEW COLUMN
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
          test_cases?: Json | null // <--- NEW COLUMN
        }
      }
      // ... keep your other tables (submissions, exam_sessions, etc.) as they were ...
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
      // ... Add iitm_submissions and other tables here as needed
    }
  }
}
