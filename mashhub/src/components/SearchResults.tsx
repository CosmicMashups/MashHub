import type { Song } from '../types';
import { Plus, Music, TrendingUp, Trash2, Edit3 } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { Pagination } from './Pagination';

interface SearchResult extends Song {
  score?: number;
  matches?: any[];
}

interface SearchResultsProps {
  results: SearchResult[];
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
  onAddToProject?: (song: Song) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 25;

export const SearchResults = memo(function SearchResults({ 
  results, 
  onEditSong, 
  onDeleteSong, 
  onAddToProject 
}: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  // Reset to page 1 when results change or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [results.length, itemsPerPage]);

  // Limit results based on items per page
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = results.slice(startIndex, endIndex);

  const getMatchScore = (score?: number): string => {
    if (!score) return 'N/A';
    const percentage = Math.round((1 - score) * 100);
    return `${percentage}%`;
  };

  const getMatchColor = (score?: number): string => {
    if (!score) return 'text-gray-500';
    const percentage = (1 - score) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const highlightMatches = (text: string, matches: any[]): React.ReactNode => {
    if (!matches || matches.length === 0) return text;
    
    let highlightedText = text;
    matches.forEach(match => {
      if (match.indices) {
        // Sort indices in descending order to avoid index shifting
        const sortedIndices = match.indices.sort((a: number[], b: number[]) => b[0] - a[0]);
        sortedIndices.forEach(([start, end]: number[]) => {
          const before = highlightedText.substring(0, start);
          const match = highlightedText.substring(start, end + 1);
          const after = highlightedText.substring(end + 1);
          highlightedText = `${before}<mark class="bg-yellow-200 px-1 rounded">${match}</mark>${after}`;
        });
      }
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

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

      <div className="space-y-3">
        {paginatedResults.map((song, index) => (
          <div
            key={song.id}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                    <Music size={16} className="text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {song.matches ? 
                        highlightMatches(song.title, song.matches.filter(m => m.key === 'title')) :
                        song.title
                      }
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {song.matches ? 
                        highlightMatches(song.artist, song.matches.filter(m => m.key === 'artist')) :
                        song.artist
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                  <span>BPM: {song.primaryBpm || song.bpms[0] || 'N/A'}</span>
                  <span>Key: {song.primaryKey || song.keys[0] || 'N/A'}</span>
                  <span>Type: {song.type}</span>
                  <span>Year: {song.year}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {song.part && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {song.part}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 ml-4">
                {/* Match Score */}
                <div className="text-right">
                  <div className={`text-sm font-medium ${getMatchColor(song.score)}`}>
                    {getMatchScore(song.score)}
                  </div>
                  <div className="text-xs text-gray-500">match</div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  {onEditSong && (
                    <button
                      onClick={() => onEditSong(song)}
                      className="text-gray-400 hover:text-primary-600 p-1"
                      title="Edit song"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                  
                  {onAddToProject && (
                    <button
                      onClick={() => onAddToProject(song)}
                      className="text-gray-400 hover:text-green-600 p-1"
                      title="Add to project"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                  
                  {onDeleteSong && (
                    <button
                      onClick={() => onDeleteSong(song.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete song"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Match Details */}
            {song.matches && song.matches.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2">Matched fields:</div>
                <div className="flex flex-wrap gap-2">
                  {song.matches.map((match, matchIndex) => (
                    <span
                      key={matchIndex}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700"
                    >
                      {match.key}: {match.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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