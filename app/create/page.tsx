'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SongForm from '@/components/SongForm';
import ArtistModeForm from '@/components/ArtistModeForm';
import UpgradePrompt from '@/components/UpgradePrompt';
import { SongFormData, GenerationMode } from '@/types';

export default function CreatePage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<GenerationMode>('custom');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ remaining: number; limit: number } | null>(null);

  const handleGenerate = async (formData: SongFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      let requestBody;

      if (formData.mode === 'artist') {
        // Artist mode: send title and artistName
        requestBody = {
          songName: formData.songName,
          mode: 'artist',
          title: formData.songName,
          artistName: formData.artistName,
          wordDensity: formData.wordDensity || 'medium',
        };
      } else {
        // Custom mode: send vision, genre, mood, tempo
        // Include theme in vision if provided, use default tempo
        const visionWithTheme = formData.theme
          ? `${formData.simpleDescription}\n\nTheme: ${formData.theme}`
          : formData.simpleDescription;

        requestBody = {
          songName: formData.songName,
          mode: 'custom',
          vision: visionWithTheme,
          genre: formData.genre,
          mood: formData.mood,
          tempo: 'Medium',
          wordDensity: formData.wordDensity || 'medium',
          instrumental: formData.instrumental || false,
        };
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle usage limit (429 error)
        if (response.status === 429) {
          setUsageInfo({
            remaining: errorData.usage?.remaining || 0,
            limit: errorData.usage?.limit || 5
          });
          setShowUpgradePrompt(true);
          setIsLoading(false);
          return;
        }

        throw new Error(errorData.error || 'Failed to generate song');
      }

      const data = await response.json();

      if (!data.success || !data.song) {
        throw new Error('Invalid response from server');
      }

      // Dispatch event to update usage counter
      window.dispatchEvent(new Event('usageUpdated'));

      // Redirect to song view page
      router.push(`/song/${data.song.id}`);
    } catch (err) {
      console.error('Error generating song:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate song. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        remaining={usageInfo?.remaining || 0}
        limit={usageInfo?.limit || 5}
      />
      <div className="min-h-screen bg-dark-bg py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-neon-purple hover:text-neon-cyan mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Create Your Song</h1>
            <p className="text-gray-400 text-lg">
              Describe your music vision and let AI generate structured lyrics and style for Suno
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Mode Selector */}
          <div className="mb-6 bg-dark-card p-6 rounded-2xl shadow-xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Choose Your Creation Mode</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedMode('custom')}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                  selectedMode === 'custom'
                    ? 'bg-gradient-to-r from-neon-purple to-neon-magenta text-white shadow-neon-purple'
                    : 'bg-dark-lighter text-gray-300 hover:bg-dark-lighter/80 border border-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="font-bold">Custom Mode</div>
                  <div className="text-sm mt-1 opacity-90">
                    Full control over genre, mood, and vision
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSelectedMode('artist')}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                  selectedMode === 'artist'
                    ? 'bg-gradient-to-r from-neon-purple to-neon-magenta text-white shadow-neon-purple'
                    : 'bg-dark-lighter text-gray-300 hover:bg-dark-lighter/80 border border-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="font-bold">Artist Mode</div>
                  <div className="text-sm mt-1 opacity-90">
                    Just title & artist - AI does the rest
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="mb-8">
            {selectedMode === 'custom' ? (
              <SongForm onGenerate={handleGenerate} isLoading={isLoading} />
            ) : (
              <ArtistModeForm onGenerate={handleGenerate} isLoading={isLoading} />
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
