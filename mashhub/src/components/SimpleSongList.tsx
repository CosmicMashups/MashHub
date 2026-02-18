import type { Song } from '../types';
import { Edit3, Trash2, Music, Play, Heart } from 'lucide-react';

interface SongListProps {
  songs: Song[];
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
}

export function SongList({ songs, onEditSong, onDeleteSong }: SongListProps) {

  const handleDelete = (songId: string) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      onDeleteSong?.(songId);
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-music-electric to-music-cosmic rounded-lg flex items-center justify-center">
              <Music size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Music Library
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {songs.length} songs in your library
              </p>
            </div>
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
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Song
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  BPM
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Artist
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {songs.map((song) => (
                <tr 
                  key={song.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-music-electric to-music-cosmic rounded-lg flex items-center justify-center">
                        <Music size={16} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {song.title}
                        </div>
                        {song.part && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {song.part}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {song.primaryBpm || song.bpms[0] || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">BPM</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {song.primaryKey || song.keys[0] || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">KEY</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white truncate">
                      {song.artist}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {song.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onEditSong?.(song)}
                        className="p-1.5 text-gray-400 hover:text-music-electric hover:bg-music-electric/10 rounded transition-colors"
                        title="Edit Song"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-music-wave hover:bg-music-wave/10 rounded transition-colors"
                        title="Play Song"
                      >
                        <Play size={14} />
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-music-pulse hover:bg-music-pulse/10 rounded transition-colors"
                        title="Add to Favorites"
                      >
                        <Heart size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(song.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Song"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
