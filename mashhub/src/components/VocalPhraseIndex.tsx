import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { vocalPhraseService } from '../services/vocalPhraseService';
import type { Song } from '../types';

export interface VocalPhraseIndexProps {
  isOpen: boolean;
  onClose: () => void;
  allSongs: Song[];
}

export function VocalPhraseIndex({ isOpen, onClose, allSongs }: VocalPhraseIndexProps) {
  const [phrases, setPhrases] = useState<Array<{ id?: number; phrase: string; songId: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [newPhraseSongId, setNewPhraseSongId] = useState('');
  const [songSearch, setSongSearch] = useState('');

  const loadPhrases = () => {
    vocalPhraseService.getAll().then(setPhrases);
  };

  useEffect(() => {
    if (isOpen) loadPhrases();
  }, [isOpen]);

  const filteredPhrases = useMemo(() => {
    if (!searchQuery.trim()) return phrases;
    return phrases.filter((p) => p.phrase.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  }, [phrases, searchQuery]);

  const songOptions = useMemo(() => {
    if (!songSearch.trim()) return allSongs.slice(0, 50);
    const fuse = new Fuse(allSongs, { keys: ['title', 'artist'], threshold: 0.4 });
    return fuse.search(songSearch).map((r) => r.item).slice(0, 30);
  }, [allSongs, songSearch]);

  const getSong = (songId: string) => allSongs.find((s) => s.id === songId);

  const handleAddPhrase = async () => {
    if (!newPhrase.trim() || !newPhraseSongId) return;
    await vocalPhraseService.add(newPhrase.trim(), newPhraseSongId);
    setNewPhrase('');
    setNewPhraseSongId('');
    setShowAddModal(false);
    loadPhrases();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vocal Phrase Index</h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phrases..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus size={16} /> Add Phrase
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredPhrases.map((p) => {
              const song = getSong(p.songId);
              const sourceLabel = song ? `${song.artist} - ${song.title}` : p.songId;
              return (
                <li
                  key={p.id ?? p.phrase + p.songId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"
                  title={sourceLabel}
                >
                  <span className="text-gray-900 dark:text-white">"{p.phrase}"</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={sourceLabel}>
                    {sourceLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Phrase</h4>
            <input
              type="text"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              placeholder="Phrase text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
            />
            <input
              type="text"
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder="Search song..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2"
            />
            <select
              value={newPhraseSongId}
              onChange={(e) => setNewPhraseSongId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
            >
              <option value="">Select song</option>
              {songOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.title} — {s.artist}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleAddPhrase} disabled={!newPhrase.trim() || !newPhraseSongId} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
