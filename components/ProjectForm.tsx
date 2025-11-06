'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { ProjectFormData } from '@/types';

interface ProjectFormProps {
  onGenerate: (formData: ProjectFormData) => void;
  isLoading: boolean;
}

const GENRES = [
  'Pop',
  'Rock',
  'Hip Hop',
  'Electronic',
  'Indie',
  'Folk',
  'Jazz',
  'Classical',
  'R&B',
  'Country',
  'Metal',
  'Reggae',
  'Blues',
  'Alternative',
];

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

export default function ProjectForm({ onGenerate, isLoading }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    mode: 'simple',
    simpleDescription: '',
    genre: GENRES[0],
    mood: MOODS[0],
    theme: '',
    targetAudience: '',
    additionalNotes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <div className="space-y-2">
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
          Project Name
        </label>
        <input
          id="projectName"
          type="text"
          value={formData.projectName}
          onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          placeholder="My Awesome Song"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Describe Your Music Vision
        </label>
        <textarea
          id="description"
          value={formData.simpleDescription}
          onChange={(e) => setFormData({ ...formData, simpleDescription: e.target.value })}
          placeholder="Example: A melancholic indie rock song about lost love and moving on, with acoustic guitars and emotional vocals..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          required
        />
        <p className="text-xs text-gray-500">
          Describe the theme, emotions, story, or any specific ideas you have for your song.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
            Genre
          </label>
          <select
            id="genre"
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="mood" className="block text-sm font-medium text-gray-700">
            Mood
          </label>
          <select
            id="mood"
            value={formData.mood}
            onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {MOODS.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
          Theme (Optional)
        </label>
        <input
          id="theme"
          type="text"
          value={formData.theme}
          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
          placeholder="e.g., Love, Loss, Adventure, Social issues..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
          Additional Notes (Optional)
        </label>
        <textarea
          id="additionalNotes"
          value={formData.additionalNotes}
          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          placeholder="Any specific instruments, vocal styles, or other details you'd like to include..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating Project...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Project</span>
          </>
        )}
      </button>
    </form>
  );
}
