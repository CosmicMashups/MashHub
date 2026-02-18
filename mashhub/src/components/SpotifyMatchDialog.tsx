import { useState, useEffect, useCallback } from 'react';
import { X, Search, Music } from 'lucide-react';
import { spotifyService } from '../services/spotifyService';
import { spotifyMappingService } from '../services/spotifyMappingService';
import type { Song, SpotifyTrack } from '../types';
import { AlbumArtwork } from './AlbumArtwork';

interface SpotifyMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onMatchSelected: (trackId: string) => void;
}

export function SpotifyMatchDialog({ 
  isOpen, 
  onClose, 
  song,
  onMatchSelected 
}: SpotifyMatchDialogProps) {
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(async () => {
    if (!song) return;

    setLoading(true);
    setError(null);

    try {
      const results = await spotifyService.searchTrack(
        searchQuery || song.title,
        searchQuery ? undefined : song.artist || undefined,
        searchQuery ? undefined : song.year
      );
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, song]);

  useEffect(() => {
    if (isOpen && song) {
      // Auto-search when dialog opens
      handleSearch();
    } else {
      setSearchResults([]);
      setSearchQuery('');
      setError(null);
    }
  }, [handleSearch, isOpen, song]);

  const handleSelectTrack = async (track: SpotifyTrack) => {
    if (!song) return;

    try {
      await spotifyMappingService.updateMapping(song.id, track.id, true);
      onMatchSelected(track.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mapping');
    }
  };

  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Find Spotify Match for "{song.title}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Search Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Search for "${song.title}" by ${song.artist || 'artist'}`}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search size={16} />
                Search
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Searching...</p>
            </div>
          )}

          {/* Search Results */}
          {!loading && searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select the correct track:
              </h3>
              {searchResults.slice(0, 5).map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left flex items-center gap-3"
                >
                  <AlbumArtwork
                    imageUrl={track.album.images[0]?.url}
                    alt={track.album.name}
                    size="small"
                    lazy={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {track.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {track.artists.map(a => a.name).join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {track.album.name}
                    </div>
                  </div>
                  {track.preview_url && (
                    <Music size={16} className="text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && searchResults.length === 0 && !error && (
            <div className="text-center py-8">
              <Music size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No results found. Try adjusting your search query.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Powered by Spotify
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
