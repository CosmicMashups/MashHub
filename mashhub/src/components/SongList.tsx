import type { Song } from '../types';
import { Edit3, Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown, Music2, BarChart3, Layers, MoreVertical, Music } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { useCoverImagesForSongs } from '../hooks/useCoverImagesForSongs';
import { AlbumArtwork } from './AlbumArtwork';
import { Pagination } from './Pagination';

interface SongListProps {
  songs: Song[];
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
  onAddToProject?: (song: Song) => void;
  onSongClick?: (song: Song) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 25;

export const SongList = memo(function SongList({ songs, onEditSong, onDeleteSong, onAddToProject, onSongClick }: SongListProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  
  // Get sorted songs for pagination calculation
  const getSortedSongs = () => {
    if (!sortField) return songs;

    return [...songs].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'artist':
          aValue = a.artist.toLowerCase();
          bValue = b.artist.toLowerCase();
          break;
        case 'bpm':
          aValue = a.primaryBpm || a.bpms[0] || 0;
          bValue = b.primaryBpm || b.bpms[0] || 0;
          break;
        case 'key':
          aValue = a.primaryKey || a.keys[0] || '';
          bValue = b.primaryKey || b.keys[0] || '';
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'origin':
          aValue = a.origin.toLowerCase();
          bValue = b.origin.toLowerCase();
          break;
        case 'season':
          aValue = a.season.toLowerCase();
          bValue = b.season.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedSongs = getSortedSongs();
  const totalPages = Math.ceil(sortedSongs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSongs = sortedSongs.slice(startIndex, endIndex);
  
  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);
  
  // Only fetch cover images for visible (paginated) songs to improve performance
  const { getCoverImage } = useCoverImagesForSongs(paginatedSongs);

  // Key color mapping - with proper dark mode support
  const getKeyColor = (key: string) => {
    const keyColors: { [key: string]: string } = {
      'C Major': 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500', // Dark Red
      'C# Major': 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400', // Red
      'D Major': 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 dark:border-orange-500', // Orange
      'D# Major': 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500', // Yellow
      'E Major': 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500', // Green
      'F Major': 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-600 dark:border-green-400', // Dark Green
      'F# Major': 'bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-300 dark:border-sky-400', // Light Blue
      'G Major': 'bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-400 dark:border-sky-300', // Light Blue
      'G# Major': 'bg-violet-50 dark:bg-violet-900/20 border-l-4 border-violet-500 dark:border-violet-400', // Blue Violet
      'A Major': 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 dark:border-purple-500', // Light Purple
      'A# Major': 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-400', // Bright Orange
      'B Major': 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400', // Moderate Blue
      // Minor keys - using slightly different shades
      'C Minor': 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 dark:border-red-500', // Dark Red variant
      'C# Minor': 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400', // Red variant
      'D Minor': 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-400', // Orange variant
      'D# Minor': 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400', // Yellow variant
      'E Minor': 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 dark:border-green-400', // Green variant
      'F Minor': 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-700 dark:border-green-500', // Dark Green variant
      'F# Minor': 'bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-400 dark:border-sky-300', // Light Blue variant
      'G Minor': 'bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500 dark:border-sky-400', // Light Blue variant
      'G# Minor': 'bg-violet-100 dark:bg-violet-900/30 border-l-4 border-violet-600 dark:border-violet-500', // Blue Violet variant
      'A Minor': 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500 dark:border-purple-400', // Light Purple variant
      'A# Minor': 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600 dark:border-orange-500', // Bright Orange variant
      'B Minor': 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600 dark:border-blue-500', // Moderate Blue variant
    };
    
    return keyColors[key] || 'bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-300 dark:border-gray-600';
  };

  const getKeyTextColor = () => {
    // With the new subtle colors, we can use consistent dark text
    return 'text-gray-900 dark:text-gray-100';
  };

  const handleDelete = (songId: string) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      onDeleteSong?.(songId);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset to page 1 when songs change
  useEffect(() => {
    setCurrentPage(1);
  }, [songs.length]);

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortDirection === 'asc' ? <ArrowUp size={14} className="text-music-electric" /> : <ArrowDown size={14} className="text-music-electric" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-music-electric to-music-cosmic rounded-lg flex items-center justify-center">
              <Music2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Music Library
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Sort">
              <BarChart3 size={16} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Filter">
              <Layers size={16} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="View Options">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {songs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music size={40} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No songs found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Start building your music library by adding some songs</p>
          <div className="animate-float">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto">
              <Music size={16} className="text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead>
              <tr className="bg-gradient-to-r from-music-electric/10 via-music-cosmic/10 to-music-neon/10 dark:from-music-electric/20 dark:via-music-cosmic/20 dark:to-music-neon/20 text-gray-700 dark:text-gray-300 font-bold">
                <th className="px-3 py-3 text-center align-middle w-16 hidden sm:table-cell">
                  <span>Artwork</span>
                </th>
                <th className="px-3 py-3 text-center align-middle w-28 sm:w-32 md:w-40 lg:w-48">
                  <button 
                    onClick={() => handleSort('artist')}
                    className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"
                  >
                    <span>Artist</span>
                    {getSortIcon('artist')}
                  </button>
                </th>
                <th className="px-3 py-3 text-center align-middle w-40 sm:w-52 md:w-60 lg:w-64">
                  <button 
                    onClick={() => handleSort('title')}
                    className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"
                  >
                    <span>Song</span>
                    {getSortIcon('title')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center align-middle hidden md:table-cell w-36">
                  <button 
                    onClick={() => handleSort('key')}
                    className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"
                  >
                    <span>Key</span>
                    {getSortIcon('key')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center align-middle hidden sm:table-cell w-24">
                  <button 
                    onClick={() => handleSort('bpm')}
                    className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"
                  >
                    <span>BPM</span>
                    {getSortIcon('bpm')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center align-middle hidden lg:table-cell w-24">
                  <button 
                    onClick={() => handleSort('year')}
                    className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"
                  >
                    <span>Year</span>
                    {getSortIcon('year')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center align-middle hidden xl:table-cell w-28">
                  <div className="flex items-center justify-center space-x-2">
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedSongs.map((song, index) => {
                const primaryKey = song.primaryKey || song.keys[0] || '';
                const keyColor = getKeyColor(primaryKey);
                const textColor = getKeyTextColor();
                const coverImageUrl = getCoverImage(song.id);
                
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
                          handleDelete(song.id);
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
      )}
      
      {/* Pagination */}
      {sortedSongs.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={sortedSongs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  );
});