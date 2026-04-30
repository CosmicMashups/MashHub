import type { Song } from '../types';
import { Music, TrendingUp, Edit3, Trash2, Plus } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { Pagination } from './Pagination';
import { useCoverImagesForSongs } from '../hooks/useCoverImagesForSongs';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { AlbumArtwork } from './AlbumArtwork';
import { SongCard } from './SongCard';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useDarkMode } from '../hooks/useTheme';
import { getKeyRowStyle } from '../utils/keyColors';

interface SearchResult extends Song {
  score?: number;
  matches?: ReadonlyArray<unknown>;
}

interface SearchResultsProps {
  results: SearchResult[];
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
  onAddToProject?: (song: Song) => void;
  onSongClick?: (song: Song) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 25;

export const SearchResults = memo(function SearchResults({ 
  results, 
  onEditSong, 
  onDeleteSong, 
  onAddToProject,
  onSongClick
}: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [deleteSongId, setDeleteSongId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();
  const isDark = useDarkMode();

  // Reset to page 1 when results change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [results.length, itemsPerPage]);

  // Limit results based on items per page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = results.slice(startIndex, endIndex);
  
  // Fetch cover images for visible (paginated) songs
  const { getCoverImage } = useCoverImagesForSongs(paginatedResults);

  if (results.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center justify-center">
        <Music size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">No songs found</p>
        <p className="text-sm text-gray-400 text-center">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Search Results ({results.length})
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <TrendingUp size={16} />
          <span>Sorted by relevance</span>
        </div>
      </div>

      {isDesktop ? (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead>
              <tr className="bg-gradient-to-r from-music-electric/10 via-music-cosmic/10 to-music-neon/10 dark:from-music-electric/20 dark:via-music-cosmic/20 dark:to-music-neon/20 text-gray-700 dark:text-gray-300 font-bold">
                <th className="px-3 py-3 text-center align-middle w-16 hidden sm:table-cell">
                  <span>Artwork</span>
                </th>
                <th className="px-3 py-3 text-center align-middle w-28 sm:w-32 md:w-40 lg:w-48">
                  <span>Artist</span>
                </th>
                <th className="px-3 py-3 text-center align-middle w-40 sm:w-52 md:w-60 lg:w-64">
                  <span>Song</span>
                </th>
                <th className="px-4 py-3 text-center align-middle hidden md:table-cell w-36">
                  <span>Key</span>
                </th>
                <th className="px-4 py-3 text-center align-middle hidden sm:table-cell w-24">
                  <span>BPM</span>
                </th>
                <th className="px-4 py-3 text-center align-middle hidden lg:table-cell w-24">
                  <span>Year</span>
                </th>
                <th className="px-4 py-3 text-center align-middle hidden xl:table-cell w-28">
                  <div className="flex items-center justify-center space-x-2">
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((song, index) => {
                const primaryKey = song.primaryKey || song.keys[0] || '';
                const getKeyTextColor = () => 'text-theme-text-primary';
                const keyStyle = getKeyRowStyle(primaryKey, isDark);
                const textColor = getKeyTextColor();
                const coverImageUrl = getCoverImage(song.id);
                
                // Calculate search match percentage and color
                const getSearchMatchInfo = () => {
                  if (song.score === undefined) return null;
                  const percentage = Math.round((1 - song.score) * 100);
                  let colorClass = 'text-theme-text-secondary bg-theme-background-secondary';
                  if (percentage >= 80) colorClass = 'text-theme-state-success bg-theme-accent-soft';
                  else if (percentage >= 60) colorClass = 'text-theme-state-warning bg-theme-background-secondary';
                  return { percentage, colorClass };
                };
                const matchInfo = getSearchMatchInfo();
                
                return (
                  <tr 
                    key={song.id} 
                    className={`table-row group ${textColor} hover:opacity-90 transition-opacity cursor-pointer`}
                    style={{ animationDelay: `${index * 0.05}s`, ...keyStyle }}
                    onClick={() => onSongClick?.(song)}
                  >
                    {/* Artwork Column */}
                    <td className="px-3 py-3 align-middle w-16 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <AlbumArtwork
                          imageUrl={coverImageUrl ?? undefined}
                          alt={`${song.title} by ${song.artist || 'Unknown Artist'}`}
                          size="small"
                          aspectRatio="square"
                        />
                      </div>
                    </td>
                    
                    {/* Artist Column */}
                    <td className="px-3 py-3 text-center align-middle w-28 sm:w-32 md:w-40 lg:w-48">
                      <div className={`text-base font-semibold break-words whitespace-normal ${textColor}`} title={song.artist || 'Unknown Artist'}>
                        {song.artist || 'Unknown Artist'}
                      </div>
                    </td>
                    
                    {/* Song Column */}
                    <td className="px-3 py-3 text-center align-middle w-40 sm:w-52 md:w-60 lg:w-64">
                      <div className={`text-base font-bold break-words whitespace-normal ${textColor}`} title={song.title}>
                        {song.title}
                      </div>
                      {song.part && (
                        <div className={`text-sm break-words whitespace-normal ${textColor} opacity-70`} title={song.part}>
                          {song.part}
                        </div>
                      )}
                      {matchInfo && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${matchInfo.colorClass}`}>
                            {matchInfo.percentage}% match
                          </span>
                        </div>
                      )}
                    </td>
                    
                    {/* Key Column */}
                    <td className="px-4 py-3 text-center hidden md:table-cell align-middle w-36">
                      <div className="flex flex-col items-center space-y-1">
                        {song.keys.length >= 2 ? (
                          <div 
                            className="cursor-help"
                            title={`All keys: ${song.keys.join(', ')}`}
                          >
                            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-theme-surface-base ${textColor}`}>
                              {song.primaryKey || song.keys[0] || 'N/A'}
                            </span>
                            <span className={`text-xs ${textColor} opacity-60 block mt-1`} title={`All keys: ${song.keys.join(', ')}`}>
                              +{song.keys.length - 1}
                            </span>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-theme-surface-base ${textColor}`}>
                            {song.primaryKey || song.keys[0] || 'N/A'}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* BPM Column */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell align-middle w-24">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold font-mono bg-music-wave/10 text-music-wave`}>
                          {song.primaryBpm || song.bpms[0] || 'N/A'}
                        </span>
                        {song.bpms.length > 1 && (
                          <span className={`text-xs ${textColor} opacity-60`} title={`${song.bpms.length} total BPMs`}>
                            +{song.bpms.length - 1}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Year Column */}
                    <td className="px-4 py-3 text-center hidden lg:table-cell align-middle w-24">
                      <div className={`text-sm font-bold ${textColor}`}>
                        {song.year}
                      </div>
                    </td>
                    
                    {/* Actions Column */}
                    <td className="px-4 py-3 text-center hidden xl:table-cell align-middle w-28">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToProject?.(song);
                          }}
                          className="group p-2 text-gray-400 hover:text-music-electric hover:bg-music-electric/10 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Add to project"
                        >
                          <Plus size={14} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSong?.(song);
                          }}
                          className="group p-2 text-gray-400 hover:text-music-electric hover:bg-music-electric/10 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Edit song"
                        >
                          <Edit3 size={14} className="group-hover:rotate-12 transition-transform" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteSongId(song.id);
                          }}
                          className="group p-2 text-gray-400 hover:text-music-pulse hover:bg-music-pulse/10 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Delete song"
                        >
                          <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Mobile/Tablet: Card view
        <div className="p-4 space-y-3 md:space-y-2">
          {paginatedResults.map((song) => {
            const coverImageUrl = getCoverImage(song.id);
            return (
              <SongCard
                key={song.id}
                song={song}
                compact={!isDesktop}
                coverImageUrl={coverImageUrl ?? undefined}
                onEditSong={onEditSong}
                onDeleteSong={onDeleteSong}
                onAddToProject={onAddToProject}
                onSongClick={onSongClick}
                searchScore={song.score}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {results.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={results.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
      <ConfirmDialog
        isOpen={deleteSongId != null}
        title="Delete song?"
        message="Are you sure you want to delete this song?"
        confirmText="Delete"
        destructive
        onCancel={() => setDeleteSongId(null)}
        onConfirm={() => {
          if (deleteSongId) onDeleteSong?.(deleteSongId);
          setDeleteSongId(null);
        }}
      />
    </div>
  );
});