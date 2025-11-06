'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { ProjectFormData } from '@/types';

interface ArtistModeFormProps {
  onGenerate: (formData: ProjectFormData) => void;
  isLoading: boolean;
}

const WORD_DENSITIES = [
  { value: 'extreme-sparse', label: 'Extreme Sparse', description: '2-4 words per line' },
  { value: 'low', label: 'Low', description: '3-6 words per line' },
  { value: 'medium', label: 'Medium', description: '5-10 words per line' },
  { value: 'high', label: 'High', description: '10-15 words per line' },
];

export default function ArtistModeForm({ onGenerate, isLoading }: ArtistModeFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    mode: 'artist',
    artistName: '',
    wordDensity: 'medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Artist Mode:</strong> Simply provide a song title and artist name.
          The AI will automatically generate lyrics and style that match the artist&apos;s signature sound.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
          Song Title <span className="text-red-500">*</span>
        </label>
        <input
          id="projectName"
          type="text"
          value={formData.projectName}
          onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          placeholder="e.g., Lost in the Echo"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="artistName" className="block text-sm font-medium text-gray-700">
          Artist Name <span className="text-red-500">*</span>
        </label>
        <input
          id="artistName"
          type="text"
          value={formData.artistName}
          onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
          placeholder="e.g., Taylor Swift, The Beatles, Ed Sheeran..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500">
          The AI will analyze this artist&apos;s style and create a song that captures their musical essence.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="wordDensity" className="block text-sm font-medium text-gray-700">
          Word Density
        </label>
        <select
          id="wordDensity"
          value={formData.wordDensity}
          onChange={(e) => setFormData({ ...formData, wordDensity: e.target.value as any })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {WORD_DENSITIES.map((density) => (
            <option key={density.value} value={density.value}>
              {density.label} - {density.description}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Controls how many words are used per line. Sparse creates powerful impact, dense creates elaborate lyrics.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
