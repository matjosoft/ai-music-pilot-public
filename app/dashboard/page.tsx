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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Songs</h1>
              <p className="text-gray-600">
                Manage and organize your songs
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create New Song
            </Link>
          </div>

          {/* Songs Grid */}
          {!songs || songs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow-lg">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🎵</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  No songs yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Create your first song and start generating amazing lyrics and styles for Suno!
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
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
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    {/* Song Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
                        {song.name}
                      </h2>
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium ml-2 whitespace-nowrap">
                        {song.mode}
                      </span>
                    </div>

                    {/* Song Info */}
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
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
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {song.songs[0].title}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {song.songs[0].style}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/song/${song.id}`}
                        className="flex-1 text-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
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
