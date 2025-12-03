'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface CustomModeOutputProps {
  lyrics: string;
  style: string;
  onRegenerateLyrics: () => void;
  onRegenerateMetatags: () => void;
  onRegenerateWithParams: () => void;
  isRegenerating: boolean;
}

export default function CustomModeOutput({
  lyrics,
  style,
  onRegenerateLyrics,
  onRegenerateMetatags,
  onRegenerateWithParams,
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
      <div className="bg-dark-card p-6 rounded-2xl shadow-xl border border-gray-800">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <span className="mr-2">📋</span>
            Lyrics (for Suno Custom Mode)
          </h2>
          <div className="flex space-x-2 flex-wrap gap-2">
            <button
              onClick={handleCopyLyrics}
              className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white rounded-lg transition-all duration-300 shadow-neon-purple text-sm font-medium"
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
              className="flex items-center space-x-1 px-4 py-2 bg-dark-lighter hover:bg-dark-lighter/80 text-white rounded-lg transition-all duration-300 border border-neon-cyan/30 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center space-x-1 px-4 py-2 bg-dark-lighter hover:bg-dark-lighter/80 text-white rounded-lg transition-all duration-300 border border-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Regenerate Metatags</span>
            </button>
            <button
              onClick={onRegenerateWithParams}
              disabled={isRegenerating}
              className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-neon-purple/20 to-neon-magenta/20 hover:from-neon-purple/30 hover:to-neon-magenta/30 text-white rounded-lg transition-all duration-300 border border-neon-purple/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Regenerate with New Parameters</span>
            </button>
          </div>
        </div>
        <div className="bg-dark-lighter p-4 rounded-lg border border-gray-700 font-mono text-sm whitespace-pre-wrap text-gray-200">
          {lyrics}
        </div>
      </div>

      {/* Style Section */}
      <div className="bg-dark-card p-6 rounded-2xl shadow-xl border border-gray-800">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <span className="mr-2">🎸</span>
            Style of Music (for Suno Custom Mode)
          </h2>
          <button
            onClick={handleCopyStyle}
            className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white rounded-lg transition-all duration-300 shadow-neon-purple text-sm font-medium"
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
        <div className="bg-dark-lighter p-4 rounded-lg border border-gray-700 font-mono text-sm text-gray-200">
          {style}
        </div>
      </div>
    </div>
  );
}
