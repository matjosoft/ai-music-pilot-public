import { createClient } from '@/lib/supabase/client'
import { getProjects } from '@/lib/storage'

export async function migrateLocalStorageProjects() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get projects from localStorage
  const localProjects = getProjects()

  if (localProjects.length === 0) {
    return { migrated: 0, message: 'No projects to migrate' }
  }

  let migrated = 0
  const errors: Array<{ project: string; error: any }> = []

  for (const project of localProjects) {
    try {
      await supabase.from('songs').insert({
        user_id: user.id,
        name: project.songName,
        mode: project.mode,
        songs: project.songs,
        created_at: project.timestamp
      })
      migrated++
    } catch (error) {
      errors.push({ project: project.songName, error })
    }
  }

  // Clear localStorage after successful migration
  if (migrated > 0 && errors.length === 0) {
    localStorage.removeItem('suno-projects')
  }

  return { migrated, errors }
}
