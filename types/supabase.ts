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
      songs: {
        Row: {
          id: string
          user_id: string
          name: string
          mode: 'custom' | 'artist' | 'simple'
          songs: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          mode: 'custom' | 'artist' | 'simple'
          songs?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          mode?: 'custom' | 'artist' | 'simple'
          songs?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'free' | 'pro' | 'test'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          generation_limit: number
          trial_ends_at: string | null
          is_test_user: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier?: 'free' | 'pro' | 'test'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          generation_limit?: number
          trial_ends_at?: string | null
          is_test_user?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'free' | 'pro' | 'test'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          generation_limit?: number
          trial_ends_at?: string | null
          is_test_user?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          action_type: 'generate' | 'regenerate_lyrics' | 'regenerate_metatags'
          song_id: string | null
          tokens_used: number | null
          model_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: 'generate' | 'regenerate_lyrics' | 'regenerate_metatags'
          song_id?: string | null
          tokens_used?: number | null
          model_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: 'generate' | 'regenerate_lyrics' | 'regenerate_metatags'
          song_id?: string | null
          tokens_used?: number | null
          model_used?: string | null
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
  }
}
