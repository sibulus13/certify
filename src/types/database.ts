export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      quiz_sessions: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          score: number
          question_count: number
          time_seconds: number
          answers: Json
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exam_id: string
          score: number
          question_count: number
          time_seconds: number
          answers?: Json
          completed_at?: string
        }
        Update: Partial<Database['public']['Tables']['quiz_sessions']['Insert']>
        Relationships: []
      }
      question_stats: {
        Row: {
          question_id: string
          exam_id: string
          total_attempts: number
          correct_count: number
          option_distribution: Json
          difficulty_score: number
        }
        Insert: {
          question_id: string
          exam_id: string
          total_attempts?: number
          correct_count?: number
          option_distribution?: Json
        }
        Update: Partial<Database['public']['Tables']['question_stats']['Insert']>
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'free' | 'pro' | 'cancelled'
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'free' | 'pro' | 'cancelled'
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_subscriptions']['Insert']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      upsert_question_stats: {
        Args: { events: Json }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
