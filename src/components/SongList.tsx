import type { Song } from '../types';
import { Edit3, Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown, Music2, BarChart3, Layers, MoreVertical, Music } from 'lucide-react';
import { useState, useEffect, memo, useMemo } from 'react';
import { useCoverImagesForSongs } from '../hooks/useCoverImagesForSongs';
import { AlbumArtwork } from './AlbumArtwork';
import { Pagination } from './Pagination';
import { SongCard } from './SongCard';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useDarkMode } from '../hooks/useTheme';
import { getKeyRowStyle } from '../utils/keyColors';

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
  const [deleteSongId, setDeleteSongId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();
  const isDark = useDarkMode();

  const sortedSongs = useMemo(() => {
    if (!sortField) return songs;
    return [...songs].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      switch (sortField) {
        case 'title': aValue = a.title.toLowerCase(); bValue = b.title.toLowerCase(); break;
        case 'artist': aValue = (a.artist || 'Unknown Artist').toLowerCase(); bValue = (b.artist || 'Unknown Artist').toLowerCase(); break;
        case 'bpm': aValue = a.primaryBpm || a.bpms[0] || 0; bValue = b.primaryBpm || b.bpms[0] || 0; break;
        case 'key': aValue = a.primaryKey || a.keys[0] || ''; bValue = b.primaryKey || b.keys[0] || ''; break;
        case 'year': aValue = a.year; bValue = b.year; break;
        case 'origin': aValue = a.origin.toLowerCase(); bValue = b.origin.toLowerCase(); break;
        case 'season': aValue = a.season.toLowerCase(); bValue = b.season.toLowerCase(); break;
        case 'type': aValue = a.type.toLowerCase(); bValue = b.type.toLowerCase(); break;
        default: return 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [songs, sortField, sortDirection]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSongs = sortedSongs.slice(startIndex, endIndex);
  const { getCoverImage } = useCoverImagesForSongs(paginatedSongs);

  useEffect(() => { setCurrentPage(1); }, [itemsPerPage, songs.length]);

  const getKeyTextColor = () => 'text-theme-text-primary';
  const handleDelete = (songId: string) => setDeleteSongId(songId);
  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };
  const getSortIcon = (field: string) => sortField !== field ? <ArrowUpDown size={14} className="text-gray-400" /> : (sortDirection === 'asc' ? <ArrowUp size={14} className="text-music-electric" /> : <ArrowDown size={14} className="text-music-electric" />);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-music-electric to-music-cosmic rounded-lg flex items-center justify-center"><Music2 size={18} className="text-white" /></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Music Library</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Sort"><BarChart3 size={16} /></button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Filter"><Layers size={16} /></button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="View Options"><MoreVertical size={16} /></button>
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6"><Music size={40} className="text-gray-300 dark:text-gray-600" /></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No songs found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Start building your music library by adding some songs</p>
        </div>
      ) : isDesktop ? (
        <table className="min-w-full table-fixed">
          <thead>
            <tr className="bg-gradient-to-r from-music-electric/10 via-music-cosmic/10 to-music-neon/10 dark:from-music-electric/20 dark:via-music-cosmic/20 dark:to-music-neon/20 text-gray-700 dark:text-gray-300 font-bold">
              <th className="px-3 py-3 text-center align-middle w-16 hidden sm:table-cell">Artwork</th>
              <th className="px-3 py-3 text-center align-middle w-28 sm:w-32 md:w-40 lg:w-48"><button onClick={() => handleSort('artist')} className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"><span>Artist</span>{getSortIcon('artist')}</button></th>
              <th className="px-3 py-3 text-center align-middle w-40 sm:w-52 md:w-60 lg:w-64"><button onClick={() => handleSort('title')} className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"><span>Song</span>{getSortIcon('title')}</button></th>
              <th className="px-4 py-3 text-center align-middle hidden md:table-cell w-36"><button onClick={() => handleSort('key')} className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"><span>Key</span>{getSortIcon('key')}</button></th>
              <th className="px-4 py-3 text-center align-middle hidden sm:table-cell w-24"><button onClick={() => handleSort('bpm')} className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"><span>BPM</span>{getSortIcon('bpm')}</button></th>
              <th className="px-4 py-3 text-center align-middle hidden lg:table-cell w-24"><button onClick={() => handleSort('year')} className="w-full flex items-center justify-center space-x-2 hover:text-music-electric transition-colors"><span>Year</span>{getSortIcon('year')}</button></th>
              <th className="px-4 py-3 text-center align-middle hidden xl:table-cell w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSongs.map((song, index) => {
              const keyStyle = getKeyRowStyle(song.primaryKey || song.keys[0] || '', isDark);
              const textColor = getKeyTextColor();
              const coverImageUrl = getCoverImage(song.id);
              return (
                <tr key={song.id} className={`table-row group ${textColor} hover:opacity-90 transition-opacity cursor-pointer`} style={{ animationDelay: `${index * 0.05}s`, ...keyStyle }} onClick={() => onSongClick?.(song)}>
                  <td className="px-3 py-3 align-middle w-16 hidden sm:table-cell"><div className="flex justify-center"><AlbumArtwork imageUrl={coverImageUrl ?? undefined} alt={`${song.title} by ${song.artist || 'Unknown Artist'}`} size="small" aspectRatio="square" /></div></td>
                  <td className="px-3 py-3 text-center align-middle w-28 sm:w-32 md:w-40 lg:w-48"><div className={`text-base font-semibold break-words whitespace-normal ${textColor}`}>{song.artist || 'Unknown Artist'}</div></td>
                  <td className="px-3 py-3 text-center align-middle w-40 sm:w-52 md:w-60 lg:w-64"><div className={`text-base font-bold break-words whitespace-normal ${textColor}`}>{song.title}</div></td>
                  <td className="px-4 py-3 text-center hidden md:table-cell align-middle w-36"><span className={`px-3 py-1 rounded-full text-sm font-medium ${textColor}`}>{song.primaryKey || song.keys[0] || 'N/A'}</span></td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell align-middle w-24"><span className="px-3 py-1 rounded-full text-sm font-bold font-mono bg-music-wave/10 text-music-wave">{song.primaryBpm || song.bpms[0] || 'N/A'}</span></td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell align-middle w-24"><div className={`text-sm font-bold ${textColor}`}>{song.year}</div></td>
                  <td className="px-4 py-3 text-center hidden xl:table-cell align-middle w-28">
                    <div className="flex items-center justify-center space-x-1">
                      <button onClick={(e) => { e.stopPropagation(); onAddToProject?.(song); }} className="group p-2 text-gray-400 hover:text-music-electric hover:bg-music-electric/10 rounded-lg transition-all duration-200 hover:scale-110" title="Add to project"><Plus size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); onEditSong?.(song); }} className="group p-2 text-gray-400 hover:text-music-electric hover:bg-music-electric/10 rounded-lg transition-all duration-200 hover:scale-110" title="Edit song"><Edit3 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(song.id); }} className="group p-2 text-gray-400 hover:text-music-pulse hover:bg-music-pulse/10 rounded-lg transition-all duration-200 hover:scale-110" title="Delete song"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="p-4 space-y-3 md:space-y-2">
          {paginatedSongs.map((song) => (
            <SongCard key={song.id} song={song} compact coverImageUrl={getCoverImage(song.id) ?? undefined} onEditSong={onEditSong} onDeleteSong={onDeleteSong} onAddToProject={onAddToProject} onSongClick={onSongClick} />
          ))}
        </div>
      )}

      <Pagination currentPage={currentPage} totalItems={sortedSongs.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
      <ConfirmDialog isOpen={deleteSongId != null} title="Delete song?" message="Are you sure you want to delete this song?" confirmText="Delete" destructive onCancel={() => setDeleteSongId(null)} onConfirm={() => { if (deleteSongId) onDeleteSong?.(deleteSongId); setDeleteSongId(null); }} />
    </div>
  );
});