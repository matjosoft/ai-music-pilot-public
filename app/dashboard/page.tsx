import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import DeleteSongButton from '@/components/DeleteSongButton'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: songs } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-dark-bg py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">My Songs</h1>
              <p className="text-gray-400 text-lg">
                Manage and organize your songs
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-neon-purple hover:shadow-neon-magenta font-medium"
            >
              <Plus className="w-5 h-5" />
              Create New Song
            </Link>
          </div>

          {/* Songs Grid */}
          {!songs || songs.length === 0 ? (
            <div className="text-center py-20 bg-dark-card rounded-2xl shadow-2xl border border-gray-800">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🎵</div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  No songs yet
                </h2>
                <p className="text-gray-400 mb-6">
                  Create your first song and start generating amazing lyrics and styles for Suno!
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-neon-purple font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Song
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="bg-dark-card rounded-2xl shadow-xl hover:shadow-neon-purple/30 transition-all duration-300 overflow-hidden border border-gray-800 hover:border-neon-purple/50"
                >
                  <div className="p-6">
                    {/* Song Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-semibold text-white line-clamp-2 flex-1">
                        {song.name}
                      </h2>
                      <span className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-1 rounded-full font-medium ml-2 whitespace-nowrap border border-neon-purple/30">
                        {song.mode}
                      </span>
                    </div>

                    {/* Song Info */}
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="text-lg">🎵</span>
                        {song.songs.length} version{song.songs.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
                      </p>
                      {song.updated_at !== song.created_at && (
                        <p className="text-xs text-gray-500">
                          Updated {formatDistanceToNow(new Date(song.updated_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>

                    {/* Content Preview */}
                    {song.songs[0] && (
                      <div className="mb-4 p-3 bg-dark-lighter rounded-lg border border-gray-700">
                        <p className="text-sm font-medium text-gray-200 mb-1">
                          {song.songs[0].title}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {song.songs[0].style}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/song/${song.id}`}
                        className="flex-1 text-center bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium"
                      >
                        View
                      </Link>
                      <DeleteSongButton songId={song.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
