'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/debug/songs')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Debug: Song Data</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(data?.user, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Songs ({data?.count || 0})
          </h2>

          {data?.songs?.map((song: any, idx: number) => (
            <div key={song.id} className="mb-6 p-4 border border-gray-200 rounded">
              <h3 className="font-semibold text-lg mb-2">
                Song {idx + 1}: {song.name}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <strong>ID:</strong> {song.id}
                </div>
                <div>
                  <strong>Mode:</strong> {song.mode}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(song.created_at).toLocaleString()}
                </div>
                <div>
                  <strong>Content Count:</strong> {song.songs?.length || 0}
                </div>
              </div>

              <div className="mb-2">
                <strong>Content Array Type:</strong> {Array.isArray(song.songs) ? 'Array' : typeof song.songs}
              </div>

              <details className="mb-4">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                  Show Full Song Data
                </summary>
                <pre className="bg-gray-100 p-4 rounded overflow-auto mt-2 text-xs">
                  {JSON.stringify(song, null, 2)}
                </pre>
              </details>

              {song.songs && song.songs.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Content:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div className="mb-2">
                      <strong>Title:</strong> {song.songs[0].title || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Style:</strong> {song.songs[0].style || 'N/A'}
                    </div>
                    <div>
                      <strong>Lyrics Preview:</strong>
                      <pre className="mt-1 text-xs whitespace-pre-wrap">
                        {song.songs[0].lyrics?.substring(0, 200) || 'N/A'}...
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Link
                  href={`/song/${song.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Song Page →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
