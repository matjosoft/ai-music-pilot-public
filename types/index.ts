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

// Database Song type (matches Supabase schema)
export interface Song {
  id: string
  user_id: string
  name: string
  mode: 'custom' | 'artist' | 'simple'
  songs: SongStructure[]
  created_at: string
  updated_at: string
}
