'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { SongFormData } from '@/types';
import GenreSelector from './GenreSelector';

interface SongFormProps {
  onGenerate: (formData: SongFormData) => void;
  isLoading: boolean;
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
  'Very Slow (40-60 BPM)',
  'Slow (60-80 BPM)',
  'Medium (80-120 BPM)',
  'Fast (120-140 BPM)',
  'Very Fast (140+ BPM)',
];

const WORD_DENSITIES = [
  { value: 'extreme-sparse', label: 'Extreme Sparse', description: '2-4 words per line' },
  { value: 'low', label: 'Low', description: '3-6 words per line' },
  { value: 'medium', label: 'Medium', description: '5-10 words per line' },
  { value: 'high', label: 'High', description: '10-15 words per line' },
];

export default function SongForm({ onGenerate, isLoading }: SongFormProps) {
  const [formData, setFormData] = useState<SongFormData>({
    songName: '',
    mode: 'simple',
    simpleDescription: '',
    genre: 'Pop',
    mood: MOODS[0],
    theme: '',
    targetAudience: '',
    additionalNotes: '',
    wordDensity: 'medium',
    instrumental: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-dark-card p-8 rounded-2xl shadow-xl border border-gray-800">
      <div className="space-y-2">
        <label htmlFor="songName" className="block text-sm font-medium text-white">
          Song Name
        </label>
        <input
          id="songName"
          type="text"
          value={formData.songName}
          onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
          placeholder="My Awesome Song"
          maxLength={255}
          className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple placeholder-gray-500"
          required
        />
        <p className="text-xs text-gray-400">
          {formData.songName.length}/255 characters
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-white">
          Describe Your Music Vision
        </label>
        <textarea
          id="description"
          value={formData.simpleDescription}
          onChange={(e) => setFormData({ ...formData, simpleDescription: e.target.value })}
          placeholder="Example: A melancholic indie rock song about lost love and moving on, with acoustic guitars and emotional vocals..."
          rows={6}
          maxLength={1800}
          className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple resize-none placeholder-gray-500"
          required
        />
        <p className="text-xs text-gray-400">
          Describe the theme, emotions, story, or any specific ideas you have for your song. ({formData.simpleDescription?.length || 0}/1800 characters)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="genre" className="block text-sm font-medium text-white">
            Genre
          </label>
          <GenreSelector
            value={formData.genre || ''}
            onChange={(genre) => setFormData({ ...formData, genre })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="mood" className="block text-sm font-medium text-white">
            Mood
          </label>
          <select
            id="mood"
            value={formData.mood}
            onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
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
        <label htmlFor="wordDensity" className="block text-sm font-medium text-white">
          Word Density
        </label>
        <select
          id="wordDensity"
          value={formData.wordDensity}
          onChange={(e) => setFormData({ ...formData, wordDensity: e.target.value as any })}
          className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple disabled:opacity-50"
          disabled={formData.instrumental}
        >
          {WORD_DENSITIES.map((density) => (
            <option key={density.value} value={density.value} className="bg-dark-lighter text-white">
              {density.label} - {density.description}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400">
          Controls how many words are used per line in the verses. Extreme sparse uses very few words for powerful impact, while high density creates detailed, elaborate lyrics.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="instrumental"
            checked={formData.instrumental}
            onChange={(e) => setFormData({ ...formData, instrumental: e.target.checked })}
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

      <div className="space-y-2">
        <label htmlFor="theme" className="block text-sm font-medium text-white">
          Theme (Optional)
        </label>
        <input
          id="theme"
          type="text"
          value={formData.theme}
          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
          placeholder="e.g., Love, Loss, Adventure, Social issues..."
          maxLength={200}
          className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple placeholder-gray-500"
        />
        <p className="text-xs text-gray-400">
          {formData.theme?.length || 0}/200 characters
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="additionalNotes" className="block text-sm font-medium text-white">
          Additional Notes (Optional)
        </label>
        <textarea
          id="additionalNotes"
          value={formData.additionalNotes}
          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          placeholder="Any specific instruments, vocal styles, or other details you'd like to include..."
          rows={3}
          maxLength={500}
          className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple resize-none placeholder-gray-500"
        />
        <p className="text-xs text-gray-400">
          {formData.additionalNotes?.length || 0}/500 characters
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
            <span>Generating Song...</span>
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
