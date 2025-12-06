'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import { SongVersion } from '@/types';

interface VersionDropdownProps {
  songId: string;
  versions: SongVersion[];
  activeVersionId: string | null;
}

export default function VersionDropdown({
  songId,
  versions,
  activeVersionId
}: VersionDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sort versions by version_number
  const sortedVersions = [...versions].sort((a, b) => a.version_number - b.version_number);
  const activeVersion = sortedVersions.find(v => v.id === activeVersionId);

  const handleVersionSelect = async (versionId: string) => {
    if (versionId === activeVersionId) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/songs/${songId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error switching version:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  if (versions.length <= 1) {
    return (
      <span className="px-2 py-1 bg-dark-lighter border border-gray-700 rounded text-xs text-gray-400">
        v{activeVersion?.version_number || 1}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isLoading}
        className="flex items-center gap-1 px-2 py-1 bg-dark-lighter border border-gray-700 rounded text-xs text-gray-300 hover:border-neon-purple/50 hover:text-white transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          <>
            v{activeVersion?.version_number || 1}
            <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div className="absolute right-0 mt-1 w-28 bg-dark-card border border-gray-700 rounded-lg shadow-xl z-20 py-1">
            {sortedVersions.map((version) => (
              <button
                key={version.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVersionSelect(version.id);
                }}
                disabled={isLoading}
                className="w-full px-3 py-2 text-left text-xs hover:bg-dark-lighter flex items-center justify-between text-gray-300 hover:text-white transition-colors"
              >
                <span>Version {version.version_number}</span>
                {version.id === activeVersionId && (
                  <Check className="w-3 h-3 text-neon-purple" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
