import { createServerClient } from '@/lib/supabase/server'
import type { SongVersion, SongStructure, GenerationParams } from '@/types'

export class SongVersionService {
  /**
   * Get all versions for a song (ordered by version_number)
   */
  static async getVersions(songId: string): Promise<SongVersion[]> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('song_versions')
      .select('*')
      .eq('song_id', songId)
      .order('version_number', { ascending: true })

    if (error) throw error
    return (data || []) as SongVersion[]
  }

  /**
   * Get specific version by ID
   */
  static async getVersion(versionId: string): Promise<SongVersion | null> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('song_versions')
      .select('*')
      .eq('id', versionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as SongVersion
  }

  /**
   * Get the next version number for a song
   */
  static async getNextVersionNumber(songId: string): Promise<number> {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('song_versions')
      .select('version_number')
      .eq('song_id', songId)
      .order('version_number', { ascending: false })
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) return 1
    return data[0].version_number + 1
  }

  /**
   * Create new version (auto-increments version_number)
   * Throws error if version limit (10) is reached
   */
  static async createVersion(
    songId: string,
    content: SongStructure,
    params?: GenerationParams
  ): Promise<SongVersion> {
    const supabase = createServerClient()

    // Get next version number
    const nextVersion = await this.getNextVersionNumber(songId)

    // Check version limit
    if (nextVersion > 10) {
      throw new Error('Maximum 10 versions per song. Delete a version to create new ones.')
    }

    const { data, error } = await supabase
      .from('song_versions')
      .insert({
        song_id: songId,
        version_number: nextVersion,
        lyrics: content.lyrics,
        style: content.style,
        title: content.title,
        generation_params: params as any
      })
      .select()
      .single()

    if (error) throw error
    return data as SongVersion
  }

  /**
   * Delete a version (with validation)
   * Cannot delete active version or the only version
   */
  static async deleteVersion(songId: string, versionId: string): Promise<void> {
    const supabase = createServerClient()

    // Check if it's the active version and get version count
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('active_version_id, version_count')
      .eq('id', songId)
      .single()

    if (songError) throw songError

    if (song?.active_version_id === versionId) {
      throw new Error('Cannot delete active version. Switch to another version first.')
    }

    if (song?.version_count === 1) {
      throw new Error('Cannot delete the only version.')
    }

    // Delete the version
    const { error } = await supabase
      .from('song_versions')
      .delete()
      .eq('id', versionId)
      .eq('song_id', songId)

    if (error) throw error

    // Decrement version count
    await supabase
      .from('songs')
      .update({ version_count: (song?.version_count || 1) - 1 })
      .eq('id', songId)
  }

  /**
   * Get version with song ownership verification
   */
  static async getVersionWithOwnership(
    userId: string,
    songId: string,
    versionId: string
  ): Promise<SongVersion | null> {
    const supabase = createServerClient()

    // First verify song ownership
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('id')
      .eq('id', songId)
      .eq('user_id', userId)
      .single()

    if (songError || !song) return null

    // Then get the version
    const { data, error } = await supabase
      .from('song_versions')
      .select('*')
      .eq('id', versionId)
      .eq('song_id', songId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as SongVersion
  }
}
