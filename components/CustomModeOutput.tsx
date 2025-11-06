'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface CustomModeOutputProps {
  lyrics: string;
  style: string;
  onRegenerateLyrics: () => void;
  onRegenerateMetatags: () => void;
  isRegenerating: boolean;
}

export default function CustomModeOutput({
  lyrics,
  style,
  onRegenerateLyrics,
  onRegenerateMetatags,
  isRegenerating,
}: CustomModeOutputProps) {
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState(false);

  const handleCopyLyrics = async () => {
    const success = await copyToClipboard(lyrics);
    if (success) {
      setCopiedLyrics(true);
      setTimeout(() => setCopiedLyrics(false), 2000);
    }
  };

  const handleCopyStyle = async () => {
    const success = await copyToClipboard(style);
    if (success) {
      setCopiedStyle(true);
      setTimeout(() => setCopiedStyle(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lyrics Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📋</span>
            Lyrics (for Suno Custom Mode)
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleCopyLyrics}
              className="flex items-center space-x-1 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              disabled={copiedLyrics}
            >
              {copiedLyrics ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Lyrics</span>
                </>
              )}
            </button>
            <button
              onClick={onRegenerateLyrics}
              disabled={isRegenerating}
              className="flex items-center space-x-1 px-4 py-2 bg-secondary hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Regenerate</span>
            </button>
            <button
              onClick={onRegenerateMetatags}
              disabled={isRegenerating}
              className="flex items-center space-x-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Regenerate Metatags</span>
            </button>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-sm whitespace-pre-wrap">
          {lyrics}
        </div>
      </div>

      {/* Style Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="mr-2">🎸</span>
            Style of Music (for Suno Custom Mode)
          </h2>
          <button
            onClick={handleCopyStyle}
            className="flex items-center space-x-1 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            disabled={copiedStyle}
          >
            {copiedStyle ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Style</span>
              </>
            )}
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-sm">
          {style}
        </div>
      </div>
    </div>
  );
}
