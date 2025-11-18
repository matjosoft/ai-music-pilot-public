'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import CustomModeOutput from '@/components/CustomModeOutput';
import SunoInstructions from '@/components/SunoInstructions';
import { Song, SongStructure } from '@/types';

export default function SongPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSong();
  }, [params.id]);

  const fetchSong = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/songs/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Song not found');
        }
        throw new Error('Failed to load song');
      }

      const data = await response.json();
      console.log('Fetched song data:', data.song);
      console.log('Song content:', data.song?.songs);
      setSong(data.song);
    } catch (err) {
      console.error('Error fetching song:', err);
      setError(err instanceof Error ? err.message : 'Failed to load song');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateLyrics = async () => {
    if (!song || song.songs.length === 0) return;

    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId: song.id,
          songIndex: 0,
          currentLyrics: song.songs[0].lyrics,
          style: song.songs[0].style,
          instructions: '',
          wordDensity: 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate lyrics');
      }

      const data = await response.json();
      if (data.success && data.song) {
        setSong(data.song);
        // Dispatch event to update usage counter
        window.dispatchEvent(new Event('usageUpdated'));
      }
    } catch (err) {
      console.error('Error regenerating lyrics:', err);
      setError('Failed to regenerate lyrics. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateMetatags = async () => {
    if (!song || song.songs.length === 0) return;

    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/regenerate-metatags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId: song.id,
          songIndex: 0,
          lyrics: song.songs[0].lyrics,
          style: song.songs[0].style,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate metatags');
      }

      const data = await response.json();
      if (data.success && data.song) {
        setSong(data.song);
        // Dispatch event to update usage counter
        window.dispatchEvent(new Event('usageUpdated'));
      }
    } catch (err) {
      console.error('Error regenerating metatags:', err);
      setError('Failed to regenerate metatags. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading song...</p>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-red-600 mb-6">{error || 'Song not found'}</p>
            <Link
              href="/create"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create New Song
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-primary hover:text-blue-600 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Songs
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{song.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                {song.mode}
              </span>
              <span>
                Created {new Date(song.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6">
            <SunoInstructions />
          </div>

          {/* Output */}
          {song.songs && song.songs.length > 0 ? (
            <CustomModeOutput
              lyrics={song.songs[0].lyrics}
              style={song.songs[0].style}
              onRegenerateLyrics={handleRegenerateLyrics}
              onRegenerateMetatags={handleRegenerateMetatags}
              isRegenerating={isRegenerating}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
              <p className="font-semibold mb-2">No content found for this song</p>
              <p className="text-sm">
                This song doesn't contain any generated content. This might be due to an error during generation.
              </p>
              <p className="text-sm mt-2">
                Song data: {JSON.stringify({ songs: song.songs, songsLength: song.songs?.length }, null, 2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
