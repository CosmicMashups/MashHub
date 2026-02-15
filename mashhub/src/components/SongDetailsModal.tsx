import { useEffect, useRef } from 'react';
import { X, Calendar, Globe, Sun, Tag, Award, Layers } from 'lucide-react';
import type { Song } from '../types';
import { SectionStructure } from './SectionStructure';
import { useCoverImage } from '../hooks/useCoverImage';
import { useImageColors } from '../hooks/useImageColors';
import { AlbumArtwork } from './AlbumArtwork';

interface SongDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onEditSong?: (song: Song) => void;
  onAddToProject?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
}

export function SongDetailsModal({
  isOpen,
  onClose,
  song,
  onEditSong,
  onAddToProject,
  onDeleteSong
}: SongDetailsModalProps) {
  // Unified cover image fetching - routes to Jikan API for anime songs, Spotify for others
  // Always call hook (Rules of Hooks) but pass null when dialog is closed
  const { coverImageUrl, coverLoading } = useCoverImage(isOpen && song ? song : null, isOpen);
  
  // Extract colors from cover image for dynamic gradient background
  const { gradient, loading: colorsLoading } = useImageColors(
    coverImageUrl,
    isOpen && !!coverImageUrl
  );
  
  // Focus trap ref - must be declared before early return (Rules of Hooks)
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation - must be called before early return (Rules of Hooks)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap - focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  // Early return after all hooks are called
  if (!isOpen || !song) return null;

  // reserved for future status badge mapping

  const handleDelete = (songId: string) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      onDeleteSong?.(songId);
      onClose();
    }
  };
  
  // Cover image URL is provided by useCoverImage hook
  // It automatically routes to Jikan API for anime songs or Spotify API for non-anime songs

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="song-details-title"
    >
      <div 
        ref={modalRef}
        className={`rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative ${
          gradient ? '' : 'bg-white dark:bg-gray-800'
        }`}
        style={gradient ? { 
          background: gradient
        } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Subtle overlay for text readability - lighter overlay to show gradient */}
        {gradient && (
          <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/50 rounded-lg pointer-events-none" />
        )}
        
        {/* Content wrapper with relative positioning */}
        <div className="relative z-10">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 id="song-details-title" className="text-xl font-semibold text-gray-900 dark:text-white">Song Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close song details"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Two-Column Layout */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Album Cover */}
            <div className="flex-shrink-0">
              <div className="w-full md:w-64 space-y-4">
                {/* Cover Image */}
                {/* Use taller aspect ratio (2:3) for anime posters from Jikan, square for Spotify album art */}
                <div className="w-full">
                  <AlbumArtwork
                    imageUrl={coverImageUrl}
                    alt={`${song.title} by ${song.artist}`}
                    size="large"
                    lazy={false}
                    className="w-full h-full"
                    aspectRatio={song.type?.toLowerCase() === 'anime' ? 'portrait' : 'square'}
                  />
                </div>
                {/* Origin Field */}
                <div className="flex items-center space-x-3">
                  <Globe size={16} className="text-music-sonic" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Origin</label>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">{song.origin}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="flex-1 min-w-0">
              {/* Song Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {song.title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                  by {song.artist}
                </p>
                {song.part && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {song.part}
                </p>
                )}
              </div>

              {/* Metadata Section */}
              <div className="space-y-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Award size={18} className="mr-2 text-music-pulse" />
                  Metadata
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Tag size={16} className="text-music-beat" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{song.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar size={16} className="text-music-pulse" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Year</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{song.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Sun size={16} className="text-music-wave" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Season</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{song.season}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Song Structure Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <Layers size={18} className="mr-2 text-music-electric" />
                  Song Structure
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <SectionStructure songId={song.id} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => onAddToProject?.(song)}
                  className="px-4 py-2 bg-music-electric text-white rounded-lg hover:bg-music-electric/90 transition-colors"
                >
                  Add to Project
                </button>
                <button
                  onClick={() => onEditSong?.(song)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit Song
                </button>
                <button
                  onClick={() => handleDelete(song.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Song
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
