import type { Song } from '../types';
import { Edit3, Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown, Music2, Music } from 'lucide-react';
import { useState, useEffect, memo, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useCoverImagesForSongs } from '../hooks/useCoverImagesForSongs';
import { AlbumArtwork } from './AlbumArtwork';
import { Pagination } from './Pagination';
import { SongCard } from './SongCard';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useDarkMode } from '../hooks/useTheme';
import { getKeyRowStyle, getKeyChipStyle } from '../utils/keyColors';

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

  const handleDelete = (songId: string) => setDeleteSongId(songId);
  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };
  const getSortIcon = (field: string) => sortField !== field ? <ArrowUpDown size={14} className="text-gray-400" /> : (sortDirection === 'asc' ? <ArrowUp size={14} className="text-music-electric" /> : <ArrowDown size={14} className="text-music-electric" />);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableTheadRef = useRef<HTMLTableSectionElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const stickyScrollRef = useRef<HTMLDivElement>(null);
  const isStickyVisibleRef = useRef<boolean>(false);
  const [isSticky, setIsSticky] = useState(false);
  const [stickyMetrics, setStickyMetrics] = useState<{ left: number; width: number; top: number }>({ left: 0, width: 0, top: 0 });

  useEffect(() => {
    if (!isDesktop) {
      if (isStickyVisibleRef.current) {
        setIsSticky(false);
        isStickyVisibleRef.current = false;
      }
      return;
    }

    const checkSticky = () => {
      if (!tableContainerRef.current || !tableTheadRef.current) return;

      const appHeader = document.getElementById('app-header');
      const topNavBottom = appHeader ? appHeader.getBoundingClientRect().bottom : 58;
      const theadRect = tableTheadRef.current.getBoundingClientRect();
      const tableRect = tableContainerRef.current.getBoundingClientRect();

      // Header row should stick when original thead reaches the bottom of the sticky top nav
      // and should unstick once the user has scrolled past the table rows (before pagination)
      const shouldBeSticky = theadRect.top <= topNavBottom && tableRect.bottom > (topNavBottom + 70);

      if (shouldBeSticky) {
        setStickyMetrics({
          left: tableRect.left,
          width: tableRect.width,
          top: topNavBottom,
        });

        if (!isStickyVisibleRef.current) {
          isStickyVisibleRef.current = true;
          setIsSticky(true);
          requestAnimationFrame(() => {
            if (stickyHeaderRef.current) {
              gsap.fromTo(
                stickyHeaderRef.current,
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out', overwrite: 'auto' }
              );
            }
          });
        }
      } else {
        if (isStickyVisibleRef.current) {
          isStickyVisibleRef.current = false;
          if (stickyHeaderRef.current) {
            gsap.to(stickyHeaderRef.current, {
              y: -16,
              opacity: 0,
              duration: 0.2,
              ease: 'power2.in',
              overwrite: 'auto',
              onComplete: () => {
                setIsSticky(false);
              },
            });
          } else {
            setIsSticky(false);
          }
        }
      }
    };

    let ticking = false;
    const onScrollOrResize = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkSticky();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    checkSticky();

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isDesktop]);

  const handleTableScroll = () => {
    if (tableContainerRef.current && stickyScrollRef.current) {
      stickyScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  };

  const handleStickyScroll = () => {
    if (tableContainerRef.current && stickyScrollRef.current) {
      tableContainerRef.current.scrollLeft = stickyScrollRef.current.scrollLeft;
    }
  };

  return (
    <div className="bg-theme-surface-base rounded-xl border border-theme-border-default overflow-hidden shadow-sm relative">
      <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 via-purple-500 to-amber-500" />
      <div className="px-5 py-3.5 border-b border-theme-border-default bg-gradient-to-r from-theme-surface-elevated via-theme-surface-elevated to-sky-50/40 dark:to-sky-950/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-theme-accent-primary rounded-lg flex items-center justify-center border border-sky-500/30 shadow-2xs">
            <Music2 size={17} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-theme-text-primary">Track Library</h2>
            <span className="text-[11px] text-theme-text-muted font-mono">{songs.length.toLocaleString()} indexed records</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-theme-text-muted">
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 text-theme-accent-primary font-mono text-[10px] font-bold">
            TABULAR DECK
          </span>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 bg-theme-surface-elevated rounded-xl flex items-center justify-center mx-auto mb-4 border border-theme-border-default text-theme-text-disabled">
            <Music size={32} />
          </div>
          <h3 className="text-base font-semibold text-theme-text-primary mb-1">No songs found</h3>
          <p className="text-xs text-theme-text-muted max-w-sm mx-auto mb-5">Try relaxing your search terms or filter parameters to reveal compatible tracks.</p>
        </div>
      ) : isDesktop ? (
        <>
          {/* Animated Sticky Header Row (Appears docked below top nav with GSAP when scrolled) */}
          {isSticky && (
            <div
              ref={stickyHeaderRef}
              style={{
                position: 'fixed',
                top: `${stickyMetrics.top}px`,
                left: `${stickyMetrics.left}px`,
                width: `${stickyMetrics.width}px`,
                zIndex: 35,
              }}
              className="border-b border-theme-border-default bg-theme-surface-elevated/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md select-none overflow-hidden"
            >
              {/* Top soundstage chromatic hairline */}
              <div className="h-[2px] w-full bg-gradient-to-r from-sky-500 via-indigo-500 via-purple-500 to-amber-500" />
              <div
                ref={stickyScrollRef}
                onScroll={handleStickyScroll}
                className="overflow-x-auto scrollbar-none"
              >
                <table className="min-w-full table-fixed divide-y divide-theme-border-subtle">
                  <thead>
                    <tr className="text-theme-text-secondary text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-3.5 text-center w-14">Art</th>
                      <th className="px-4 py-3.5 text-left w-36 sm:w-44 md:w-48">
                        <button onClick={() => handleSort('artist')} className="inline-flex items-center space-x-1 hover:text-theme-text-primary transition-colors cursor-pointer">
                          <span>Artist</span>
                          {getSortIcon('artist')}
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-left w-48 sm:w-60 md:w-64">
                        <button onClick={() => handleSort('title')} className="inline-flex items-center space-x-1 hover:text-theme-text-primary transition-colors cursor-pointer">
                          <span>Title</span>
                          {getSortIcon('title')}
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-center w-28 md:w-32">
                        <button onClick={() => handleSort('key')} className="inline-flex items-center justify-center space-x-1 hover:text-theme-text-primary transition-colors cursor-pointer">
                          <span>Key / Camelot</span>
                          {getSortIcon('key')}
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-center w-24">
                        <button onClick={() => handleSort('bpm')} className="inline-flex items-center justify-center space-x-1 hover:text-theme-text-primary transition-colors cursor-pointer">
                          <span>BPM</span>
                          {getSortIcon('bpm')}
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-center hidden lg:table-cell w-20">
                        <button onClick={() => handleSort('year')} className="inline-flex items-center justify-center space-x-1 hover:text-theme-text-primary transition-colors cursor-pointer">
                          <span>Year</span>
                          {getSortIcon('year')}
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
          )}

          <div
            ref={tableContainerRef}
            onScroll={handleTableScroll}
            className="overflow-x-auto"
          >
            <table className="min-w-full table-fixed divide-y divide-theme-border-subtle">
              <thead ref={tableTheadRef}>
                <tr className="bg-theme-surface-elevated text-theme-text-secondary text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-center w-14">Art</th>
                  <th className="px-4 py-3.5 text-left w-36 sm:w-44 md:w-48">
                    <button onClick={() => handleSort('artist')} className="inline-flex items-center space-x-1 hover:text-theme-text-primary transition-colors">
                      <span>Artist</span>
                      {getSortIcon('artist')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-left w-48 sm:w-60 md:w-64">
                    <button onClick={() => handleSort('title')} className="inline-flex items-center space-x-1 hover:text-theme-text-primary transition-colors">
                      <span>Title</span>
                      {getSortIcon('title')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-center w-28 md:w-32">
                    <button onClick={() => handleSort('key')} className="inline-flex items-center justify-center space-x-1 hover:text-theme-text-primary transition-colors">
                      <span>Key / Camelot</span>
                      {getSortIcon('key')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-center w-24">
                    <button onClick={() => handleSort('bpm')} className="inline-flex items-center justify-center space-x-1 hover:text-theme-text-primary transition-colors">
                      <span>BPM</span>
                      {getSortIcon('bpm')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-center hidden lg:table-cell w-20">
                    <button onClick={() => handleSort('year')} className="inline-flex items-center justify-center space-x-1 hover:text-theme-text-primary transition-colors">
                      <span>Year</span>
                      {getSortIcon('year')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-center w-28">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-theme-border-subtle bg-theme-surface-base">
              {paginatedSongs.map((song) => {
                const keyStyle = getKeyRowStyle(song.primaryKey || song.keys[0] || '', isDark);
                const chipStyle = getKeyChipStyle(song.primaryKey || song.keys[0] || '', isDark);
                const coverImageUrl = getCoverImage(song.id);
                const displayKey = song.primaryKey || song.keys[0] || '—';
                const displayBpm = song.primaryBpm || song.bpms[0] || '—';

                return (
                  <tr
                    key={song.id}
                    className="group hover:bg-theme-surface-hover/80 transition-colors cursor-pointer border-b border-theme-border-subtle"
                    style={keyStyle}
                    onClick={() => onSongClick?.(song)}
                  >
                    <td className="px-4 py-3.5 text-center align-middle w-16">
                      <div className="flex justify-center">
                        <AlbumArtwork imageUrl={coverImageUrl ?? undefined} alt={`${song.title} by ${song.artist || 'Unknown Artist'}`} size="small" aspectRatio="square" className="shadow-xs" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-left">
                      <div className="text-sm font-semibold text-theme-text-primary truncate max-w-[200px]" title={song.artist || 'Unknown Artist'}>
                        {song.artist || 'Unknown Artist'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-left">
                      <div className="text-sm sm:text-base font-bold text-theme-text-primary truncate max-w-[260px]" title={song.title}>
                        {song.title}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <span
                        className="inline-flex items-center justify-center px-3 py-1 rounded-md font-mono text-xs font-bold border shadow-xs tabular-nums"
                        style={chipStyle}
                      >
                        {displayKey}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md font-mono text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 shadow-2xs tabular-nums">
                        {displayBpm}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell align-middle">
                      <span className="text-sm font-mono text-theme-text-secondary tabular-nums">
                        {song.year || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <div className="flex items-center justify-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddToProject?.(song); }}
                          className="p-2 text-theme-text-muted hover:text-theme-accent-primary hover:bg-theme-accent-soft active:scale-[0.98] rounded-md transition-all shadow-2xs"
                          title="Add to project"
                          aria-label="Add to project"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditSong?.(song); }}
                          className="p-2 text-theme-text-muted hover:text-theme-accent-primary hover:bg-theme-accent-soft active:scale-[0.98] rounded-md transition-all shadow-2xs"
                          title="Edit track"
                          aria-label="Edit track"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(song.id); }}
                          className="p-2 text-theme-text-muted hover:text-theme-accent-danger hover:bg-theme-accent-danger/15 active:scale-[0.98] rounded-md transition-all shadow-2xs"
                          title="Delete track"
                          aria-label="Delete track"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <div className="p-3 space-y-2">
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