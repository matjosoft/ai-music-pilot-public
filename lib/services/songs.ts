import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'
import type { Song, SongStructure, Database, GenerationParams, SongVersion } from '@/types'
import { SongVersionService } from './song-versions'

export class SongService {
  // Client-side methods
  static async getAllSongs(): Promise<Song[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*),
        versions:song_versions!song_versions_song_id_fkey(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Song[]
  }

  static async getSong(id: string): Promise<Song | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Song
  }

  static async getSongWithVersions(id: string): Promise<Song | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*),
        versions:song_versions!song_versions_song_id_fkey(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Song
  }

  static async updateSong(
    id: string,
    updates: Partial<Pick<Song, 'name' | 'active_version_id' | 'version_count'>>
  ): Promise<Song> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*)
      `)
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

  /**
   * Create a new song with its first version
   */
  static async createSongServer(
    userId: string,
    name: string,
    mode: 'custom' | 'artist' | 'simple',
    songContent: SongStructure,
    generationParams?: GenerationParams
  ): Promise<Song> {
    const supabase = createServerClient()

    // 1. Create the song record (without active_version_id yet)
    const insertData: Database['public']['Tables']['songs']['Insert'] = {
      user_id: userId,
      name,
      mode,
      version_count: 0 // Will be updated after version is created
    }

    const { data: song, error: songError } = await supabase
      .from('songs')
      .insert(insertData)
      .select()
      .single()

    if (songError) throw songError

    // 2. Create the first version
    const version = await SongVersionService.createVersion(
      song.id,
      songContent,
      generationParams
    )

    // 3. Update song with active version and count
    const { data: updatedSong, error: updateError } = await supabase
      .from('songs')
      .update({
        active_version_id: version.id,
        version_count: 1
      })
      .eq('id', song.id)
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*)
      `)
      .single()

    if (updateError) throw updateError
    return updatedSong as Song
  }

  /**
   * Update song metadata (name, active_version_id, version_count)
   */
  static async updateSongServer(
    userId: string,
    id: string,
    updates: Partial<Pick<Song, 'name' | 'active_version_id' | 'version_count'>>
  ): Promise<Song> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('songs')
      .update(updates as any)
      .eq('id', id)
      .eq('user_id', userId) // Ensure ownership
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*)
      `)
      .single()

    if (error) throw error
    return data as Song
  }

  /**
   * Set the active version for a song
   */
  static async setActiveVersion(
    userId: string,
    songId: string,
    versionId: string
  ): Promise<Song> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('songs')
      .update({ active_version_id: versionId })
      .eq('id', songId)
      .eq('user_id', userId)
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*)
      `)
      .single()

    if (error) throw error
    return data as Song
  }

  /**
   * Get song with active version (server-side)
   */
  static async getSongServer(userId: string, id: string): Promise<Song | null> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Song
  }

  /**
   * Get song with all versions (server-side)
   */
  static async getSongWithVersionsServer(userId: string, id: string): Promise<Song | null> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        active_version:song_versions!fk_songs_active_version(*),
        versions:song_versions!song_versions_song_id_fkey(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as Song
  }

  /**
   * Increment version count after creating a new version
   */
  static async incrementVersionCount(userId: string, songId: string): Promise<void> {
    const supabase = createServerClient()

    // Get current count
    const { data: song, error: getError } = await supabase
      .from('songs')
      .select('version_count')
      .eq('id', songId)
      .eq('user_id', userId)
      .single()

    if (getError) throw getError

    // Increment
    const { error: updateError } = await supabase
      .from('songs')
      .update({ version_count: (song?.version_count || 0) + 1 })
      .eq('id', songId)
      .eq('user_id', userId)

    if (updateError) throw updateError
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
