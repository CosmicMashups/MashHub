import { useState } from 'react';
import { Search, Filter, X, Music, Target } from 'lucide-react';
import { MatchingService, type MatchCriteria } from '../services/matchingService';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: MatchCriteria) => void;
  songs: any[]; // Add songs prop for quick match
}

export function FilterPanel({ isOpen, onClose, onApplyFilters, songs }: FilterPanelProps) {
  const [filters, setFilters] = useState<MatchCriteria>({
    searchText: '',
    targetBpm: undefined,
    bpmTolerance: 10,
    targetKey: '',
    keyTolerance: 2,
    keyRangeStart: '',
    keyRangeEnd: '',
    bpmRange: undefined,
    type: '',
    yearRange: [1900, 2030]
  });

  const [quickMatchSong, setQuickMatchSong] = useState<any>(null);
  const [quickMatches, setQuickMatches] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleQuickMatch = async () => {
    if (quickMatchSong) {
      const matches = await MatchingService.getQuickMatches(songs, quickMatchSong);
      setQuickMatches(matches.slice(0, 5)); // Show top 5 matches
    }
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      searchText: '',
      targetBpm: undefined,
      bpmTolerance: 10,
      targetKey: '',
      keyTolerance: 2,
      keyRangeStart: '',
      keyRangeEnd: '',
      bpmRange: undefined,
      type: '',
      yearRange: [1900, 2030]
    });
    setQuickMatchSong(null);
    setQuickMatches([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Advanced Filters & Matching</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Quick Match Section */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center">
              <Target size={20} className="mr-2" />
              Quick Match
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a song to find matches
                </label>
                <select
                  value={quickMatchSong?.id || ''}
                  onChange={(e) => {
                    const song = songs.find(s => s.id === e.target.value);
                    setQuickMatchSong(song);
                    setQuickMatches([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a song...</option>
                  {songs.map(song => (
                    <option key={song.id} value={song.id}>
                      {song.title} - {song.artist} ({song.primaryBpm || song.bpms[0]} BPM, {song.primaryKey || song.keys[0]})
                    </option>
                  ))}
                </select>
              </div>
              
              {quickMatchSong && (
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-900">Selected Song:</h4>
                  <p className="text-sm text-gray-600">
                    {quickMatchSong.title} - {quickMatchSong.artist}
                  </p>
                  <p className="text-sm text-gray-500">
                    BPM: {quickMatchSong.bpms.join(', ')} | Key: {quickMatchSong.keys.join(', ')}
                  </p>
                </div>
              )}
              
              <div className="flex justify-center">
                <button
                  onClick={handleQuickMatch}
                  disabled={!quickMatchSong}
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <Music size={16} />
                  <span>Find Matches</span>
                </button>
              </div>
              
              {quickMatches.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 text-center">Top Matches:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {quickMatches.map((match) => {
                      const matchScore = match.matchScore || 0;
                      const getAffinityColor = (score: number) => {
                        if (score >= 0.85) return 'text-green-600 bg-green-50 border-green-200';
                        if (score >= 0.65) return 'text-amber-600 bg-amber-50 border-amber-200';
                        return 'text-gray-600 bg-gray-50 border-gray-200';
                      };
                      const getAffinityLabelColor = (score: number) => {
                        if (score >= 0.85) return 'text-green-700';
                        if (score >= 0.65) return 'text-amber-700';
                        return 'text-gray-600';
                      };
                      const affinityColor = getAffinityColor(matchScore);
                      const labelColor = getAffinityLabelColor(matchScore);
                      
                      // Compact explanation format: "BPM + Key + Section Match"
                      const compactReasons = match.reasons?.map((reason: string) => {
                        if (reason.includes('BPM')) return 'BPM';
                        if (reason.includes('Key') || reason.includes('key')) return 'Key';
                        if (reason.includes('Part') || reason.includes('Section')) return 'Section';
                        return reason.split(':')[0] || reason;
                      }).filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i) || [];
                      
                      return (
                        <div key={match.id} className={`bg-white p-4 rounded-lg border-2 ${affinityColor} transition-shadow hover:shadow-md`}>
                          <div className="flex flex-col space-y-2">
                            <div>
                              <p className="font-medium text-gray-900 text-sm truncate" title={match.title}>{match.title}</p>
                              <p className="text-xs text-gray-600 truncate" title={match.artist}>{match.artist}</p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <span className={`text-xs font-semibold ${labelColor}`}>
                                {Math.round(matchScore * 100)}%
                              </span>
                              <span className={`text-xs ${labelColor}`}>
                                {matchScore >= 0.85 ? 'High' : matchScore >= 0.65 ? 'Medium' : 'Low'}
                              </span>
                            </div>
                            {compactReasons.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-2">
                                {compactReasons.slice(0, 3).map((reason: string, i: number) => (
                                  <span key={i} className={`inline-block text-xs px-2 py-0.5 rounded ${affinityColor}`}>
                                    {reason}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center">
              <Filter size={20} className="mr-2" />
              Advanced Filters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Text Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Text
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={filters.searchText || ''}
                    onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Search by title, artist, or type..."
                  />
                </div>
              </div>

              {/* BPM Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target BPM: {filters.targetBpm || 'Any'}
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={filters.targetBpm || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      targetBpm: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter target BPM"
                    min="60"
                    max="300"
                  />
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      BPM Tolerance: ±{filters.bpmTolerance}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={filters.bpmTolerance || 10}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        bpmTolerance: parseInt(e.target.value) 
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* BPM Min-Max Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BPM Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={filters.bpmRange?.[0] ?? ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      bpmRange: [e.target.value ? parseInt(e.target.value) : 0, filters.bpmRange?.[1] ?? 999]
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Min BPM"
                    min="40"
                    max="400"
                  />
                  <input
                    type="number"
                    value={filters.bpmRange?.[1] ?? ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      bpmRange: [filters.bpmRange?.[0] ?? 0, e.target.value ? parseInt(e.target.value) : 999]
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Max BPM"
                    min="40"
                    max="400"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Use either Target BPM ± tolerance or a Min–Max range.</p>
              </div>

              {/* Key Matching */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Key
                </label>
                <div className="space-y-3">
                  <select
                    value={filters.targetKey || ''}
                    onChange={(e) => setFilters({ ...filters, targetKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Any key</option>
                    <option value="C Major">C Major</option>
                    <option value="C# Major">C# Major</option>
                    <option value="D Major">D Major</option>
                    <option value="D# Major">D# Major</option>
                    <option value="E Major">E Major</option>
                    <option value="F Major">F Major</option>
                    <option value="F# Major">F# Major</option>
                    <option value="G Major">G Major</option>
                    <option value="G# Major">G# Major</option>
                    <option value="A Major">A Major</option>
                    <option value="A# Major">A# Major</option>
                    <option value="B Major">B Major</option>
                    <option value="C Minor">C Minor</option>
                    <option value="C# Minor">C# Minor</option>
                    <option value="D Minor">D Minor</option>
                    <option value="D# Minor">D# Minor</option>
                    <option value="E Minor">E Minor</option>
                    <option value="F Minor">F Minor</option>
                    <option value="F# Minor">F# Minor</option>
                    <option value="G Minor">G Minor</option>
                    <option value="G# Minor">G# Minor</option>
                    <option value="A Minor">A Minor</option>
                    <option value="A# Minor">A# Minor</option>
                    <option value="B Minor">B Minor</option>
                  </select>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Key Tolerance: {filters.keyTolerance} semitones
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={filters.keyTolerance || 2}
                      onChange={(e) => setFilters({ ...filters, keyTolerance: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Key Linked Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Linked Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={filters.keyRangeStart || ''}
                    onChange={(e) => setFilters({ ...filters, keyRangeStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Start key</option>
                    <option value="C Major">C Major</option>
                    <option value="C# Major">C# Major</option>
                    <option value="D Major">D Major</option>
                    <option value="D# Major">D# Major</option>
                    <option value="E Major">E Major</option>
                    <option value="F Major">F Major</option>
                    <option value="F# Major">F# Major</option>
                    <option value="G Major">G Major</option>
                    <option value="G# Major">G# Major</option>
                    <option value="A Major">A Major</option>
                    <option value="A# Major">A# Major</option>
                    <option value="B Major">B Major</option>
                  </select>
                  <select
                    value={filters.keyRangeEnd || ''}
                    onChange={(e) => setFilters({ ...filters, keyRangeEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">End key</option>
                    <option value="C Major">C Major</option>
                    <option value="C# Major">C# Major</option>
                    <option value="D Major">D Major</option>
                    <option value="D# Major">D# Major</option>
                    <option value="E Major">E Major</option>
                    <option value="F Major">F Major</option>
                    <option value="F# Major">F# Major</option>
                    <option value="G Major">G Major</option>
                    <option value="G# Major">G# Major</option>
                    <option value="A Major">A Major</option>
                    <option value="A# Major">A# Major</option>
                    <option value="B Major">B Major</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Circular range across enharmonics, inclusive.</p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="Anime">Anime</option>
                  <option value="Game">Game</option>
                  <option value="J-Pop">J-Pop</option>
                  <option value="K-Pop">K-Pop</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Rock">Rock</option>
                  <option value="Pop">Pop</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Year Range */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year Range: {filters.yearRange?.[0]} - {filters.yearRange?.[1]}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={filters.yearRange?.[0] || 1900}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      yearRange: [parseInt(e.target.value), filters.yearRange?.[1] || 2030] 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1900"
                    max="2030"
                  />
                  <input
                    type="number"
                    value={filters.yearRange?.[1] || 2030}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      yearRange: [filters.yearRange?.[0] || 1900, parseInt(e.target.value)] 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1900"
                    max="2030"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleClearFilters}
            className="btn-secondary"
          >
            Clear All
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}