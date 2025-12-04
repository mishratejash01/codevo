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
      // ... existing tables ...
      
      practice_problems: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
          tags: string[] | null
          starter_templates: Json
          test_cases: Json // <--- The new column
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
          test_cases?: Json
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
          test_cases?: Json
          likes?: number
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
    // ... Enums etc
  }
}
