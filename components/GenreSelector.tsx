'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { GENRE_CATEGORIES } from '@/lib/genres';

interface GenreSelectorProps {
  value: string;
  onChange: (genre: string) => void;
  className?: string;
}

export default function GenreSelector({ value, onChange, className = '' }: GenreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter genres based on search query
  const filteredCategories = GENRE_CATEGORIES.map((category) => ({
    ...category,
    genres: category.genres.filter((genre) =>
      genre.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.genres.length > 0);

  const handleGenreSelect = (genre: string) => {
    onChange(genre);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected value display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-dark-lighter border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-neon-purple focus:border-neon-purple text-left flex items-center justify-between hover:border-neon-purple/50 transition-colors"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {value || 'Select a genre...'}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-dark-card border border-gray-700 rounded-lg shadow-2xl max-h-96 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-3 border-b border-gray-700 bg-dark-lighter">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search genres..."
                className="w-full pl-10 pr-10 py-2 bg-dark-bg border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-neon-purple focus:border-neon-purple text-sm placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-neon-purple"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Genre list */}
          <div className="overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.name} className="border-b border-gray-800 last:border-b-0">
                  {/* Category header */}
                  <div className="px-4 py-2 bg-dark-lighter font-semibold text-sm text-neon-purple sticky top-0">
                    {category.name}
                  </div>
                  {/* Genre items */}
                  <div className="py-1">
                    {category.genres.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleGenreSelect(genre)}
                        className={`w-full text-left px-6 py-2 text-sm hover:bg-neon-purple/10 transition-colors ${
                          value === genre
                            ? 'bg-neon-purple/20 text-neon-purple font-medium'
                            : 'text-gray-300'
                        }`}
                      >
                        {highlightMatch(genre, searchQuery)}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No genres found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string) {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-neon-cyan/30 text-neon-cyan font-semibold">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
