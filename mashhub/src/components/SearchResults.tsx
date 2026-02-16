import type { Song } from '../types';
import { Music, TrendingUp, Edit3, Trash2, Plus } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { Pagination } from './Pagination';
import { useCoverImagesForSongs } from '../hooks/useCoverImagesForSongs';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { AlbumArtwork } from './AlbumArtwork';
import { SongCard } from './SongCard';

interface SearchResult extends Song {
  score?: number;
  matches?: any[];
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
  const isDesktop = useIsDesktop();

  // Reset to page 1 when results change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [results.length, itemsPerPage]);

  // Limit results based on items per page
  const totalPages = Math.ceil(results.length / itemsPerPage);
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
                const getKeyColor = (key: string) => {
                  const keyColors: { [key: string]: string } = {
                    'C Major': 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500',
                    'C# Major': 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400',
                    'D Major': 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 dark:border-orange-500',
                    'D# Major': 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500',
                    'E Major': 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500',
                    'F Major': 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-600 dark:border-green-400',
                    'F# Major': 'bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-300 dark:border-sky-400',
                    'G Major': 'bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-400 dark:border-sky-300',
                    'G# Major': 'bg-violet-50 dark:bg-violet-900/20 border-l-4 border-violet-500 dark:border-violet-400',
                    'A Major': 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 dark:border-purple-500',
                    'A# Major': 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-400',
                    'B Major': 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400',
                    'C Minor': 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 dark:border-red-500',
                    'C# Minor': 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400',
                    'D Minor': 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-400',
                    'D# Minor': 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400',
                    'E Minor': 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 dark:border-green-400',
                    'F Minor': 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-700 dark:border-green-500',
                    'F# Minor': 'bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-400 dark:border-sky-300',
                    'G Minor': 'bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500 dark:border-sky-400',
                    'G# Minor': 'bg-violet-100 dark:bg-violet-900/30 border-l-4 border-violet-600 dark:border-violet-500',
                    'A Minor': 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500 dark:border-purple-400',
                    'A# Minor': 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600 dark:border-orange-500',
                    'B Minor': 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600 dark:border-blue-500',
                  };
                  return keyColors[key] || 'bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-300 dark:border-gray-600';
                };
                const getKeyTextColor = () => 'text-gray-900 dark:text-gray-100';
                const keyColor = getKeyColor(primaryKey);
                const textColor = getKeyTextColor();
                const coverImageUrl = getCoverImage(song.id);
                
                // Calculate search match percentage and color
                const getSearchMatchInfo = () => {
                  if (song.score === undefined) return null;
                  const percentage = Math.round((1 - song.score) * 100);
                  let colorClass = 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
                  if (percentage >= 80) colorClass = 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30';
                  else if (percentage >= 60) colorClass = 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30';
                  return { percentage, colorClass };
                };
                const matchInfo = getSearchMatchInfo();
                
                return (
                  <tr 
                    key={song.id} 
                    className={`table-row group ${keyColor} ${textColor} hover:opacity-90 transition-opacity cursor-pointer`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => onSongClick?.(song)}
                  >
                    {/* Artwork Column */}
                    <td className="px-3 py-3 align-middle w-16 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <AlbumArtwork
                          imageUrl={coverImageUrl}
                          alt={`${song.title} by ${song.artist}`}
                          size="small"
                          aspectRatio="square"
                        />
                      </div>
                    </td>
                    
                    {/* Artist Column */}
                    <td className="px-3 py-3 text-center align-middle w-28 sm:w-32 md:w-40 lg:w-48">
                      <div className={`text-base font-semibold break-words whitespace-normal ${textColor}`} title={song.artist}>
                        {song.artist}
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
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${keyColor || 'bg-gray-100 dark:bg-gray-700'} ${textColor}`}>
                              {song.primaryKey || song.keys[0] || 'N/A'}
                            </span>
                            <span className={`text-xs ${textColor} opacity-60 block mt-1`} title={`All keys: ${song.keys.join(', ')}`}>
                              +{song.keys.length - 1}
                            </span>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${keyColor || 'bg-gray-100 dark:bg-gray-700'} ${textColor}`}>
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
                            onDeleteSong?.(song.id);
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
                coverImageUrl={coverImageUrl}
                onEditSong={onEditSong}
                onDeleteSong={onDeleteSong}
                onAddToProject={onAddToProject}
                onSongClick={onSongClick}
                searchScore={song.score}
                searchMatches={song.matches}
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
    </div>
  );
});