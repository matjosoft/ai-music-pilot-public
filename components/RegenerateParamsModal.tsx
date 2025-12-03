'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Settings } from 'lucide-react';
import GenreSelector from './GenreSelector';

interface RegenerateParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (params: RegenerateParams) => void;
  isRegenerating: boolean;
  mode: 'custom' | 'artist' | 'simple';
}

export interface RegenerateParams {
  mode: 'custom' | 'artist' | 'simple';
  // Custom mode params
  vision?: string;
  genre?: string;
  mood?: string;
  tempo?: string;
  wordDensity?: string;
  instrumental?: boolean;
  // Artist mode params
  title?: string;
  artistName?: string;
}

const MOODS = [
  'Happy',
  'Sad',
  'Energetic',
  'Melancholic',
  'Uplifting',
  'Dark',
  'Dreamy',
  'Angry',
  'Romantic',
  'Peaceful',
  'Mysterious',
  'Nostalgic',
];

const TEMPOS = [
  'Very Slow',
  'Slow',
  'Medium',
  'Fast',
  'Very Fast',
];

const WORD_DENSITIES = [
  { value: 'extreme-sparse', label: 'Extreme Sparse', description: '2-4 words per line' },
  { value: 'low', label: 'Low', description: '3-6 words per line' },
  { value: 'medium', label: 'Medium', description: '5-10 words per line' },
  { value: 'high', label: 'High', description: '10-15 words per line' },
];

export default function RegenerateParamsModal({
  isOpen,
  onClose,
  onRegenerate,
  isRegenerating,
  mode,
}: RegenerateParamsModalProps) {
  const [params, setParams] = useState<RegenerateParams>({
    mode,
    // Custom mode defaults
    vision: '',
    genre: 'Pop',
    mood: MOODS[0],
    tempo: 'Medium',
    wordDensity: 'medium',
    instrumental: false,
    // Artist mode defaults
    title: '',
    artistName: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setParams({
        mode,
        vision: '',
        genre: 'Pop',
        mood: MOODS[0],
        tempo: 'Medium',
        wordDensity: 'medium',
        instrumental: false,
        title: '',
        artistName: '',
      });
    }
  }, [isOpen, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegenerate(params);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl shadow-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-card border-b border-gray-800 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-neon-purple" />
            <h2 className="text-2xl font-bold text-white">
              Regenerate with New Parameters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isRegenerating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300">
              <strong className="text-neon-cyan">Note:</strong> This will regenerate the song with new parameters.
              Enter the parameters you want to use for regeneration.
            </p>
          </div>

          {mode === 'artist' ? (
            // Artist Mode Form
            <>
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-white">
                  Song Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={params.title}
                  onChange={(e) => setParams({ ...params, title: e.target.value })}
                  placeholder="e.g., Lost in the Echo"
                  maxLength={255}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple placeholder-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="artistName" className="block text-sm font-medium text-white">
                  Artist Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="artistName"
                  type="text"
                  value={params.artistName}
                  onChange={(e) => setParams({ ...params, artistName: e.target.value })}
                  placeholder="e.g., Taylor Swift, The Beatles, Ed Sheeran..."
                  maxLength={100}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple placeholder-gray-500"
                  required
                />
                <p className="text-xs text-gray-400">
                  The AI will analyze this artist&apos;s style and create a song that captures their musical essence.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="wordDensity" className="block text-sm font-medium text-white">
                  Word Density
                </label>
                <select
                  id="wordDensity"
                  value={params.wordDensity}
                  onChange={(e) => setParams({ ...params, wordDensity: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple"
                >
                  {WORD_DENSITIES.map((density) => (
                    <option key={density.value} value={density.value} className="bg-dark-lighter text-white">
                      {density.label} - {density.description}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            // Custom Mode Form
            <>
              <div className="space-y-2">
                <label htmlFor="vision" className="block text-sm font-medium text-white">
                  Music Vision <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="vision"
                  value={params.vision}
                  onChange={(e) => setParams({ ...params, vision: e.target.value })}
                  placeholder="Example: A melancholic indie rock song about lost love and moving on, with acoustic guitars and emotional vocals..."
                  rows={5}
                  maxLength={1800}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple resize-none placeholder-gray-500"
                  required
                />
                <p className="text-xs text-gray-400">
                  Describe the theme, emotions, story, or any specific ideas for the song. ({params.vision?.length || 0}/1800 characters)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="genre" className="block text-sm font-medium text-white">
                    Genre <span className="text-red-400">*</span>
                  </label>
                  <GenreSelector
                    value={params.genre || ''}
                    onChange={(genre) => setParams({ ...params, genre })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="mood" className="block text-sm font-medium text-white">
                    Mood <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="mood"
                    value={params.mood}
                    onChange={(e) => setParams({ ...params, mood: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple"
                  >
                    {MOODS.map((mood) => (
                      <option key={mood} value={mood} className="bg-dark-lighter text-white">
                        {mood}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="tempo" className="block text-sm font-medium text-white">
                  Tempo <span className="text-red-400">*</span>
                </label>
                <select
                  id="tempo"
                  value={params.tempo}
                  onChange={(e) => setParams({ ...params, tempo: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple"
                >
                  {TEMPOS.map((tempo) => (
                    <option key={tempo} value={tempo} className="bg-dark-lighter text-white">
                      {tempo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="wordDensity" className="block text-sm font-medium text-white">
                  Word Density
                </label>
                <select
                  id="wordDensity"
                  value={params.wordDensity}
                  onChange={(e) => setParams({ ...params, wordDensity: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple disabled:opacity-50"
                  disabled={params.instrumental}
                >
                  {WORD_DENSITIES.map((density) => (
                    <option key={density.value} value={density.value} className="bg-dark-lighter text-white">
                      {density.label} - {density.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400">
                  Controls how many words are used per line in the verses.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="instrumental"
                    checked={params.instrumental}
                    onChange={(e) => setParams({ ...params, instrumental: e.target.checked })}
                    className="w-4 h-4 text-neon-purple border-gray-700 bg-dark-lighter rounded focus:ring-2 focus:ring-neon-purple"
                  />
                  <label htmlFor="instrumental" className="text-sm font-medium text-white">
                    Instrumental (No Lyrics)
                  </label>
                </div>
                <p className="text-xs text-gray-400">
                  When selected, only an [Instrumental] tag will be generated with no lyrics.
                </p>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isRegenerating}
              className="flex-1 px-6 py-3 bg-dark-lighter hover:bg-dark-lighter/80 text-white rounded-lg transition-all duration-300 border border-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegenerating}
              className="flex-1 bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-neon-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <Settings className="w-5 h-5" />
                  <span>Regenerate Song</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
