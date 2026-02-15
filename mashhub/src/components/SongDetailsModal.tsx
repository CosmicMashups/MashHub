import { useEffect, useRef } from 'react';
import { X, Music, Calendar, Globe, Sun, Tag, Volume2, Award, Heart, Star, Layers } from 'lucide-react';
import type { Song } from '../types';
import { SectionStructure } from './SectionStructure';

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
  if (!isOpen || !song) return null;

  // reserved for future status badge mapping

  const handleDelete = (songId: string) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      onDeleteSong?.(songId);
      onClose();
    }
  };

  // Handle keyboard navigation
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
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
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
          {/* Song Header */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-music-electric via-music-cosmic to-music-neon rounded-xl flex items-center justify-center shadow-glow-purple">
              <Music size={24} className="text-white" />
            </div>
            <div className="flex-1">
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
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-music-electric transition-colors">
                <Heart size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-music-sonic transition-colors">
                <Star size={20} />
              </button>
            </div>
          </div>

          {/* Main Details Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Primary Musical Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Music size={18} className="mr-2 text-music-cosmic" />
                Primary Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Key</label>
                  <div className="mt-1">
                    <span className="px-3 py-1 bg-music-cosmic/10 text-music-cosmic rounded-full text-sm font-medium">
                      {song.primaryKey || song.keys[0] || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary BPM</label>
                  <div className="mt-1">
                    <span className="px-3 py-1 bg-music-wave/10 text-music-wave rounded-full text-sm font-bold font-mono">
                      {song.primaryBpm || song.bpms[0] || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Award size={18} className="mr-2 text-music-pulse" />
                Metadata
              </h4>
              <div className="space-y-3">
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
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex items-center space-x-3">
              <Globe size={16} className="text-music-sonic" />
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Origin</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{song.origin}</p>
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
  );
}
