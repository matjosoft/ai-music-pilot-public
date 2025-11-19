'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { SongFormData } from '@/types';

interface ArtistModeFormProps {
  onGenerate: (formData: SongFormData) => void;
  isLoading: boolean;
}

const WORD_DENSITIES = [
  { value: 'extreme-sparse', label: 'Extreme Sparse', description: '2-4 words per line' },
  { value: 'low', label: 'Low', description: '3-6 words per line' },
  { value: 'medium', label: 'Medium', description: '5-10 words per line' },
  { value: 'high', label: 'High', description: '10-15 words per line' },
];

export default function ArtistModeForm({ onGenerate, isLoading }: ArtistModeFormProps) {
  const [formData, setFormData] = useState<SongFormData>({
    songName: '',
    mode: 'artist',
    artistName: '',
    wordDensity: 'medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-dark-card p-8 rounded-2xl shadow-xl border border-gray-800">
      <div className="mb-4 p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
        <p className="text-sm text-gray-300">
          <strong className="text-neon-cyan">Artist Mode:</strong> Simply provide a song title and artist name.
          The AI will automatically generate lyrics and style that match the artist&apos;s signature sound.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="songName" className="block text-sm font-medium text-white">
          Song Title <span className="text-red-400">*</span>
        </label>
        <input
          id="songName"
          type="text"
          value={formData.songName}
          onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
          placeholder="e.g., Lost in the Echo"
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
          value={formData.artistName}
          onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
          placeholder="e.g., Taylor Swift, The Beatles, Ed Sheeran..."
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
          value={formData.wordDensity}
          onChange={(e) => setFormData({ ...formData, wordDensity: e.target.value as any })}
          className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple"
        >
          {WORD_DENSITIES.map((density) => (
            <option key={density.value} value={density.value} className="bg-dark-lighter text-white">
              {density.label} - {density.description}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400">
          Controls how many words are used per line. Sparse creates powerful impact, dense creates elaborate lyrics.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-neon-purple disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating in Artist Style...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Song</span>
          </>
        )}
      </button>
    </form>
  );
}
