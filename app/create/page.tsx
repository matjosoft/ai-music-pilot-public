'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProjectForm from '@/components/ProjectForm';
import CustomModeOutput from '@/components/CustomModeOutput';
import SunoInstructions from '@/components/SunoInstructions';
import { ProjectFormData, GenerationResponse } from '@/types';
import { generateId } from '@/lib/utils';
import { saveProject } from '@/lib/storage';

export default function CreatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentWordDensity, setCurrentWordDensity] = useState<string>('medium');

  const handleGenerate = async (formData: ProjectFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vision: formData.simpleDescription,
          genre: formData.genre,
          mood: formData.mood,
          tempo: formData.theme || 'Medium',
          wordDensity: formData.wordDensity || 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate project');
      }

      const data = await response.json();
      const generationResponse: GenerationResponse = {
        projectName: formData.projectName,
        mode: formData.mode,
        songs: [
          {
            lyrics: data.lyrics,
            style: data.style,
            title: formData.projectName,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      setResult(generationResponse);
      setCurrentWordDensity(formData.wordDensity || 'medium');

      // Save to localStorage
      const projectId = generateId();
      saveProject({
        id: projectId,
        ...generationResponse,
      });
    } catch (err) {
      console.error('Error generating project:', err);
      setError('Failed to generate project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateLyrics = async () => {
    if (!result) return;

    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentLyrics: result.songs[0].lyrics,
          style: result.songs[0].style,
          instructions: '',
          wordDensity: currentWordDensity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate lyrics');
      }

      const data = await response.json();
      setResult({
        ...result,
        songs: [
          {
            ...result.songs[0],
            lyrics: data.lyrics,
          },
        ],
      });
    } catch (err) {
      console.error('Error regenerating lyrics:', err);
      setError('Failed to regenerate lyrics. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateMetatags = async () => {
    if (!result) return;

    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/regenerate-metatags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lyrics: result.songs[0].lyrics,
          style: result.songs[0].style,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate metatags');
      }

      const data = await response.json();
      setResult({
        ...result,
        songs: [
          {
            ...result.songs[0],
            lyrics: data.lyrics,
          },
        ],
      });
    } catch (err) {
      console.error('Error regenerating metatags:', err);
      setError('Failed to regenerate metatags. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:text-blue-600 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your Music Project</h1>
            <p className="text-gray-600">
              Describe your music vision and let AI generate structured lyrics and style for Suno
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="mb-8">
            <ProjectForm onGenerate={handleGenerate} isLoading={isLoading} />
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              <div className="border-t-4 border-primary pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Generated Project</h2>

                {/* Instructions */}
                <div className="mb-6">
                  <SunoInstructions />
                </div>

                {/* Output */}
                <CustomModeOutput
                  lyrics={result.songs[0].lyrics}
                  style={result.songs[0].style}
                  onRegenerateLyrics={handleRegenerateLyrics}
                  onRegenerateMetatags={handleRegenerateMetatags}
                  isRegenerating={isRegenerating}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
