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
      // ... (Keep existing tables: assignments, exam_sessions, etc.) ...

      // --- PRACTICE ARENA TABLES ---
      practice_problems: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
          tags: string[] | null
          starter_templates: Json
          likes: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert'
          tags?: string[] | null
          starter_templates?: Json
          likes?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string
          difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert'
          tags?: string[] | null
          starter_templates?: Json
          likes?: number
          created_at?: string
        }
      }
      // NEW TOPICS TABLE
      practice_topics: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
        }
      }
      practice_test_cases: {
        Row: {
          id: string
          problem_id: string
          input: string
          expected_output: string
          is_public: boolean
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          input: string
          expected_output: string
          is_public?: boolean
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          input?: string
          expected_output?: string
          is_public?: boolean
          explanation?: string | null
          created_at?: string
        }
      }
      practice_submissions: {
        Row: {
          id: string
          problem_id: string
          user_id: string
          language: string
          code: string
          status: string
          runtime_ms: number | null
          passed_cases: number
          total_cases: number
          submitted_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          user_id: string
          language: string
          code: string
          status: string
          runtime_ms?: number | null
          passed_cases?: number
          total_cases?: number
          submitted_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          user_id?: string
          language?: string
          code?: string
          status?: string
          runtime_ms?: number | null
          passed_cases?: number
          total_cases?: number
          submitted_at?: string
        }
      }
    }
    // ... (Keep Views/Functions/Enums as is)
    Enums: {
      difficulty_level: 'Easy' | 'Medium' | 'Hard' | 'Expert'
    }
  }
}
