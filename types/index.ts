// Export Supabase database types
export type { Database } from './supabase'

export type GenerationMode = 'simple' | 'custom' | 'artist';
export type WordDensity = 'extreme-sparse' | 'low' | 'medium' | 'high';

export interface SongFormData {
  songName: string;
  mode: GenerationMode;
  simpleDescription?: string;
  artistReference?: string;
  artistName?: string;
  genre?: string;
  mood?: string;
  theme?: string;
  targetAudience?: string;
  additionalNotes?: string;
  wordDensity?: WordDensity;
  instrumental?: boolean;
}

export interface SongStructure {
  lyrics: string;
  style: string;
  title: string;
}

export interface GenerationResponse {
  songName: string;
  mode: GenerationMode;
  songs: SongStructure[];
  timestamp: string;
}

export interface StoredSong extends GenerationResponse {
  id: string;
}

// Generation parameters stored with each song/version
export interface GenerationParams {
  // Custom mode params
  vision?: string
  genre?: string
  mood?: string
  tempo?: string
  wordDensity?: string
  instrumental?: boolean
  // Artist mode params
  title?: string
  artistName?: string
}

// Song version type (individual version of a song)
export interface SongVersion {
  id: string
  song_id: string
  version_number: number
  lyrics: string
  style: string
  title: string
  generation_params?: GenerationParams
  created_at: string
}

// Database Song type (matches Supabase schema)
export interface Song {
  id: string
  user_id: string
  name: string
  mode: 'custom' | 'artist' | 'simple'
  active_version_id: string | null
  version_count: number
  created_at: string
  updated_at: string

  // Deprecated - kept for backwards compatibility during migration
  songs_deprecated?: SongStructure[]
  generation_params_deprecated?: GenerationParams

  // Relationships (populated by joins)
  active_version?: SongVersion
  versions?: SongVersion[]
}

// Subscription types
export type SubscriptionTier = 'free' | 'pro' | 'test'
export type UsageActionType = 'generate' | 'regenerate_lyrics' | 'regenerate_metatags' | 'regenerate_with_params'

export interface UserSubscription {
  id: string
  user_id: string
  tier: SubscriptionTier
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

export interface UsageLog {
  id: string
  user_id: string
  action_type: UsageActionType
  song_id: string | null
  tokens_used: number | null
  model_used: string | null
  created_at: string
}

export interface UsageCheckResult {
  allowed: boolean
  remaining: number
  limit: number
  reason?: string
  isTestUser?: boolean
  isInTrial?: boolean
}

export interface UsageStats {
  currentPeriodUsage: number
  limit: number
  remaining: number
  periodStart: string | null
  periodEnd: string | null
  tier: SubscriptionTier
  isTestUser: boolean
  isInTrial: boolean
}
