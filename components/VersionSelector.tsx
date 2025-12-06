'use client';

import { format } from 'date-fns';
import { RefreshCw, Loader2 } from 'lucide-react';
import { SongVersion } from '@/types';

interface VersionSelectorProps {
  versions: SongVersion[];
  selectedVersionId: string | null;
  activeVersionId: string | null;
  onVersionChange: (versionId: string) => void;
  onRegenerate?: () => void;
  onRegenerateWithParams?: () => void;
  isRegenerating?: boolean;
  maxVersionsReached?: boolean;
}

export default function VersionSelector({
  versions,
  selectedVersionId,
  activeVersionId,
  onVersionChange,
  onRegenerate,
  onRegenerateWithParams,
  isRegenerating = false,
  maxVersionsReached = false
}: VersionSelectorProps) {
  // Sort versions by version_number
  const sortedVersions = [...versions].sort((a, b) => a.version_number - b.version_number);

  return (
    <div className="mb-6 bg-dark-card p-4 rounded-xl border border-gray-800">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-300">Version:</label>
          <select
            value={selectedVersionId || ''}
            onChange={(e) => onVersionChange(e.target.value)}
            disabled={isRegenerating}
            className="bg-dark-lighter border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-purple disabled:opacity-50"
          >
            {sortedVersions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version_number} - {format(new Date(v.created_at), 'MMM d, yyyy HH:mm')}
                {v.id === activeVersionId ? ' (Active)' : ''}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Regenerate buttons */}
        {(onRegenerate || onRegenerateWithParams) && (
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating || maxVersionsReached}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-lighter hover:bg-dark-lighter/80 text-white rounded-lg transition-all duration-300 border border-neon-cyan/30 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={maxVersionsReached ? 'Maximum versions reached' : 'Regenerate lyrics'}
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Regenerate</span>
              </button>
            )}
            {onRegenerateWithParams && (
              <button
                onClick={onRegenerateWithParams}
                disabled={isRegenerating || maxVersionsReached}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-neon-purple/20 to-neon-magenta/20 hover:from-neon-purple/30 hover:to-neon-magenta/30 text-white rounded-lg transition-all duration-300 border border-neon-purple/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={maxVersionsReached ? 'Maximum versions reached' : 'Regenerate with new parameters'}
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Regenerate with New Parameters</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Version limit warning */}
      {maxVersionsReached && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <span className="text-xs text-yellow-500">
            Maximum of 10 versions reached. Delete a version to create new ones.
          </span>
        </div>
      )}
    </div>
  );
}
