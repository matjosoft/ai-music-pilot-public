import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'
import type { Song, SongStructure, Database, GenerationParams } from '@/types'

export class SongService {
  // Client-side methods
  static async getAllSongs(): Promise<Song[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Song[]
  }

  static async getSong(id: string): Promise<Song | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Song
  }

  static async createSong(
    name: string,
    mode: 'custom' | 'artist' | 'simple',
    songs: SongStructure[]
  ): Promise<Song> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // Explicitly type the insert payload to fix TypeScript inference issues
    const insertData: Database['public']['Tables']['songs']['Insert'] = {
      user_id: user.id,
      name,
      mode,
      songs: songs as any // Cast to Json type for database storage
    }

    const { data, error } = await supabase
      .from('songs')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as Song
  }

  static async updateSong(
    id: string,
    updates: Partial<Pick<Song, 'name' | 'songs'>>
  ): Promise<Song> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Song
  }

  static async deleteSong(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Server-side methods (for API routes)
  static async createSongServer(
    userId: string,
    name: string,
    mode: 'custom' | 'artist' | 'simple',
    songs: SongStructure[],
    generationParams?: GenerationParams
  ): Promise<Song> {
    const supabase = createServerClient()

    // Explicitly type the insert payload to fix TypeScript inference issues
    const insertData: Database['public']['Tables']['songs']['Insert'] = {
      user_id: userId,
      name,
      mode,
      songs: songs as any, // Cast to Json type for database storage
      generation_params: generationParams as any // Cast to Json type for database storage
    }

    const { data, error } = await supabase
      .from('songs')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as Song
  }

  static async updateSongServer(
    userId: string,
    id: string,
    updates: Partial<Pick<Song, 'name' | 'songs' | 'generation_params'>>
  ): Promise<Song> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('songs')
      .update(updates as any)
      .eq('id', id)
      .eq('user_id', userId) // Ensure ownership
      .select()
      .single()

    if (error) throw error
    return data as Song
  }

  static async getSongServer(userId: string, id: string): Promise<Song | null> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Song
  }

  static async deleteSongServer(userId: string, id: string): Promise<void> {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // Ensure ownership

    if (error) throw error
  }
}
